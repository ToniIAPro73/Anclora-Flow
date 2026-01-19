import { BaseRepository } from './base.repository.js';
import { IInvoice, IInvoiceCreate, IInvoiceUpdate, IInvoiceItem } from '../types/invoice.js';

export class InvoiceRepository extends BaseRepository<IInvoice> {
  protected tableName = 'invoices';

  async findById(id: string, userId: string): Promise<IInvoice | null> {
    const invoiceSql = `SELECT * FROM ${this.tableName} WHERE id = $1 AND user_id = $2`;
    const invoiceResult = await this.executeQuery(invoiceSql, [id, userId]);

    if (invoiceResult.rows.length === 0) return null;

    const row = invoiceResult.rows[0];
    const invoice = this.mapToCamel(row);

    // Get invoice items
    const itemsSql = 'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at';
    const itemsResult = await this.executeQuery(itemsSql, [id]);
    invoice.items = this.mapRows(itemsResult.rows);

    // Get client info (minimal mapping as it's a join-like scenario)
    if (invoice.clientId) {
      const clientSql = 'SELECT * FROM clients WHERE id = $1';
      const clientResult = await this.executeQuery(clientSql, [invoice.clientId]);
      invoice.client = this.mapToCamel(clientResult.rows[0]);
    }

    return invoice;
  }

  async findAllByUser(userId: string, filters: any = {}): Promise<IInvoice[]> {
    let sql = `
      SELECT
        i.*,
        c.name as client_name,
        c.email as client_email,
        CASE
          WHEN i.status = 'paid' THEN 0
          WHEN i.due_date < CURRENT_DATE THEN CURRENT_DATE - i.due_date
          ELSE 0
        END as days_late
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = $1
    `;

    const params: any[] = [userId];
    let paramCount = 2;

    if (filters.status) {
      sql += ` AND i.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.clientId) {
      sql += ` AND i.client_id = $${paramCount}`;
      params.push(filters.clientId);
      paramCount++;
    }

    if (filters.search) {
      sql += ` AND (i.invoice_number ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    if (filters.dateFrom) {
      sql += ` AND i.issue_date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND i.issue_date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    sql += ' ORDER BY i.issue_date DESC, i.created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await this.executeQuery(sql, params);
    return this.mapRows(result.rows);
  }

  async create(userId: string, invoiceData: IInvoiceCreate): Promise<IInvoice> {
    return this.withTransaction(async (client) => {
      const {
        clientId, projectId, invoiceNumber, issueDate, dueDate,
        status = 'draft', subtotal, vatPercentage = 21.00, vatAmount,
        irpfPercentage = 15.00, irpfAmount, total, currency = 'EUR',
        notes, items = []
      } = invoiceData;

      const invoiceSql = `
        INSERT INTO invoices (
          user_id, client_id, project_id, invoice_number, issue_date, due_date,
          status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount,
          total, currency, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const invoiceResult = await client.query(invoiceSql, [
        userId, clientId, projectId, invoiceNumber, issueDate, dueDate,
        status, subtotal, vatPercentage, vatAmount, irpfPercentage, irpfAmount,
        total, currency, notes
      ]);

      const invoiceRow = invoiceResult.rows[0];
      const invoice = this.mapToCamel(invoiceRow);

      if (items.length > 0) {
        const itemsSql = `
          INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const itemResults = await Promise.all(items.map(item =>
          client.query(itemsSql, [
            invoice.id, item.description, item.quantity || 1,
            item.unitType || 'hours', item.unitPrice,
            item.vatPercentage || 21.00, item.amount
          ])
        ));

        invoice.items = this.mapRows(itemResults.map(r => r.rows[0]));
      }

      await client.query(
        `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'invoice_created', 'invoice', invoice.id, `Factura ${invoiceNumber} creada`]
      );

      // Add to audit log
      await client.query(
        `INSERT INTO invoice_audit_log (invoice_id, user_id, action, new_value)
         VALUES ($1, $2, $3, $4)`,
        [invoice.id, userId, 'created', JSON.stringify(invoice)]
      );

      return invoice;
    });
  }

  async update(id: string, userId: string, updates: IInvoiceUpdate): Promise<IInvoice | null> {
    return this.withTransaction(async (client) => {
      const allowedFields: Record<string, string> = {
        clientId: 'client_id',
        projectId: 'project_id',
        invoiceNumber: 'invoice_number',
        issueDate: 'issue_date',
        dueDate: 'due_date',
        status: 'status',
        subtotal: 'subtotal',
        vatPercentage: 'vat_percentage',
        vatAmount: 'vat_amount',
        irpfPercentage: 'irpf_percentage',
        irpfAmount: 'irpf_amount',
        total: 'total',
        notes: 'notes',
        paymentMethod: 'payment_method',
        paymentDate: 'payment_date'
      };

      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(updates).forEach(([key, value]) => {
        const column = allowedFields[key];
        if (column && key !== 'items') {
          fields.push(`${column} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      // Get current invoice state for audit log
      const oldInvoiceSql = `SELECT * FROM invoices WHERE id = $1 AND user_id = $2`;
      const oldInvoiceResult = await client.query(oldInvoiceSql, [id, userId]);
      if (oldInvoiceResult.rows.length === 0) return null;
      const oldInvoice = oldInvoiceResult.rows[0];

      let updatedInvoiceRow: any = null;

      if (fields.length > 0) {
        values.push(id, userId);
        const sql = `
          UPDATE invoices
          SET ${fields.join(', ')}
          WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
          RETURNING *
        `;
        const result = await client.query(sql, values);
        updatedInvoiceRow = result.rows[0];
      }

      if (updates.items) {
        await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
        
        if (updates.items.length > 0) {
          const itemsSql = `
            INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;
          for (const item of updates.items) {
            await client.query(itemsSql, [
              id, item.description, item.quantity || 1,
              item.unitType || 'hours', item.unitPrice,
              item.vatPercentage || 21.00, item.amount
            ]);
          }
        }

        if (!updatedInvoiceRow) {
          const res = await client.query('SELECT * FROM invoices WHERE id = $1 AND user_id = $2', [id, userId]);
          updatedInvoiceRow = res.rows[0];
        }
      }

      if (!updatedInvoiceRow) return null;

      const invoice = this.mapToCamel(updatedInvoiceRow);
      // Re-fetch items if they were updated or just to be complete
      const itemsRes = await client.query('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at', [id]);
      invoice.items = this.mapRows(itemsRes.rows);

      // Add to audit log
      await client.query(
        `INSERT INTO invoice_audit_log (invoice_id, user_id, action, old_value, new_value, change_reason)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, userId, 'updated', JSON.stringify(oldInvoice), JSON.stringify(updatedInvoiceRow), (updates as any).changeReason || 'Actualización de factura']
      );

      return invoice;
    });
  }

  async markAsPaid(id: string, userId: string, paymentData: any = {}): Promise<IInvoice> {
    return this.withTransaction(async (client) => {
      const { paymentDate = new Date(), paymentMethod, amount } = paymentData;

      const invoiceRes = await client.query('SELECT * FROM invoices WHERE id = $1 AND user_id = $2', [id, userId]);
      if (invoiceRes.rows.length === 0) throw new Error('Invoice not found');
      const invoiceData = invoiceRes.rows[0];

      const updateRes = await client.query(
        `UPDATE invoices SET status = 'paid', payment_date = $1, payment_method = $2 WHERE id = $3 AND user_id = $4 RETURNING *`,
        [paymentDate, paymentMethod, id, userId]
      );

      await client.query(
        `INSERT INTO payments (user_id, invoice_id, amount, payment_date, payment_method) VALUES ($1, $2, $3, $4, $5)`,
        [userId, id, amount || invoiceData.total, paymentDate, paymentMethod]
      );

      await client.query(
        `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description) VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'payment_received', 'invoice', id, `Pago recibido para factura ${invoiceData.invoice_number}`]
      );

      return this.mapToCamel(updateRes.rows[0]);
    });
  }

  async getStatistics(userId: string, filters: any = {}): Promise<any> {
    let sql = `
      SELECT
        COUNT(*) as total_invoices,
        COALESCE(SUM(total), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN status != 'paid' AND status != 'cancelled' THEN total ELSE 0 END), 0) as pending_amount,
        COALESCE(AVG(CASE WHEN status = 'paid' THEN total END), 0) as average_invoice,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
      FROM invoices
      WHERE user_id = $1
    `;

    const params: any[] = [userId];
    let paramCount = 2;

    if (filters.dateFrom) {
      sql += ` AND issue_date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND issue_date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    const result = await this.executeQuery(sql, params);
    return this.mapToCamel(result.rows[0]);
  }

  async getMonthlyIncome(userId: string, months: number = 12): Promise<any[]> {
    const sql = `
      SELECT
        TO_CHAR(issue_date, 'YYYY-MM') as month,
        COUNT(*) as invoice_count,
        COALESCE(SUM(total), 0) as total_income
      FROM invoices
      WHERE user_id = $1
        AND issue_date >= CURRENT_DATE - INTERVAL '1 month' * $2
        AND status = 'paid'
      GROUP BY TO_CHAR(issue_date, 'YYYY-MM')
      ORDER BY month
    `;

    const result = await this.executeQuery(sql, [userId, months]);
    return this.mapRows(result.rows);
  }

  async updateOverdueStatus(userId: string): Promise<any[]> {
    const sql = `
      UPDATE invoices
      SET status = 'overdue'
      WHERE user_id = $1
        AND status IN ('pending', 'sent')
        AND due_date < CURRENT_DATE
      RETURNING id, invoice_number
    `;

    const result = await this.executeQuery(sql, [userId]);
    return this.mapRows(result.rows);
  }

  async findByIdWithVerifactu(id: string, userId: string): Promise<IInvoice | null> {
    const sql = `
      SELECT
        i.*,
        c.name as client_name,
        c.email as client_email,
        c.nif_cif as client_nif
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = $1 AND i.user_id = $2
    `;

    const result = await this.executeQuery(sql, [id, userId]);
    if (result.rows.length === 0) return null;

    const invoice = this.mapToCamel(result.rows[0]);
    const itemsSql = 'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at';
    const itemsRes = await this.executeQuery(itemsSql, [id]);
    invoice.items = this.mapRows(itemsRes.rows);

    return invoice;
  }


  async findByNumber(userId: string, invoiceNumber: string): Promise<IInvoice | null> {
    const result = await this.executeQuery(
      'SELECT * FROM invoices WHERE user_id = $1 AND invoice_number = $2',
      [userId, invoiceNumber]
    );

    if (result.rows.length === 0) return null;
    return this.mapToCamel(result.rows[0]);
  }

  async getVerifactuStatus(id: string, userId: string): Promise<any> {
    const sql = `
      SELECT
        verifactu_enabled, verifactu_status, verifactu_id, verifactu_csv,
        verifactu_qr_code, verifactu_hash, verifactu_chain_index,
        verifactu_registered_at, verifactu_error_message, verifactu_url
      FROM invoices
      WHERE id = $1 AND user_id = $2
    `;

    const result = await this.executeQuery(sql, [id, userId]);
    return this.mapToCamel(result.rows[0]);
  }

  async updateVerifactuStatus(id: string, userId: string, status: string, errorMessage: string | null = null): Promise<IInvoice | null> {
    const sql = `
      UPDATE invoices
      SET verifactu_status = $1, verifactu_error_message = $2
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `;

    const result = await this.executeQuery(sql, [status, errorMessage, id, userId]);
    return this.mapToCamel(result.rows[0]);
  }

  async findPendingVerifactu(userId: string): Promise<IInvoice[]> {
    const sql = `
      SELECT i.*, c.name as client_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = $1
        AND i.verifactu_enabled = true
        AND i.verifactu_status = 'pending'
        AND i.status NOT IN ('draft', 'cancelled')
      ORDER BY i.issue_date ASC
    `;

    const result = await this.executeQuery(sql, [userId]);
    return this.mapRows(result.rows);
  }

  async findRegisteredVerifactu(userId: string, limit: number = 100): Promise<any[]> {
    const sql = `
      SELECT
        i.id, i.invoice_number, i.issue_date, i.total,
        i.verifactu_status, i.verifactu_id, i.verifactu_csv,
        i.verifactu_chain_index, i.verifactu_registered_at,
        c.name as client_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = $1
        AND i.verifactu_status = 'registered'
      ORDER BY i.verifactu_chain_index DESC
      LIMIT $2
    `;

    const result = await this.executeQuery(sql, [userId, limit]);
    return this.mapRows(result.rows);
  }

  async getVerifactuStatistics(userId: string): Promise<any> {
    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE verifactu_enabled = true) as total_enabled,
        COUNT(*) FILTER (WHERE verifactu_status = 'registered') as total_registered,
        COUNT(*) FILTER (WHERE verifactu_status = 'pending') as total_pending,
        COUNT(*) FILTER (WHERE verifactu_status = 'error') as total_errors,
        MAX(verifactu_chain_index) as last_chain_index,
        MAX(verifactu_registered_at) as last_registration
      FROM invoices
      WHERE user_id = $1
    `;

    const result = await this.executeQuery(sql, [userId]);
    return this.mapToCamel(result.rows[0]);
  }

  async getPayments(invoiceId: string, userId: string): Promise<any[]> {
    const sql = `
      SELECT p.*, u.name as created_by_name
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.invoice_id = $1 AND p.user_id = $2
      ORDER BY p.payment_date DESC, p.created_at DESC
    `;
    const result = await this.executeQuery(sql, [invoiceId, userId]);
    return this.mapRows(result.rows);
  }

  async createPayment(userId: string, invoiceId: string, paymentData: any): Promise<any> {
    const { amount, paymentDate, paymentMethod, transactionId, notes } = paymentData;
    
    return this.withTransaction(async (client) => {
      const sql = `
        INSERT INTO payments (user_id, invoice_id, amount, payment_date, payment_method, transaction_id, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const result = await client.query(sql, [userId, invoiceId, amount, paymentDate, paymentMethod, transactionId, notes]);
      const payment = this.mapToCamel(result.rows[0]);

      // Trigger already updates invoice status and paid_amount
      
      // Add to audit log
      await client.query(
        `INSERT INTO invoice_audit_log (invoice_id, user_id, action, new_value, change_reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [invoiceId, userId, 'payment_received', JSON.stringify(payment), `Pago registrado: ${amount} €`]
      );

      return payment;
    });
  }

  async getAuditLog(invoiceId: string, userId: string): Promise<any[]> {
    const sql = `
      SELECT l.*, u.name as user_name
      FROM invoice_audit_log l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.invoice_id = $1 AND (l.user_id = $2 OR EXISTS(SELECT 1 FROM users WHERE id = $2)) -- Simplified access check
      ORDER BY l.created_at DESC
    `;
    const result = await this.executeQuery(sql, [invoiceId, userId]);
    return this.mapRows(result.rows);
  }
}

export const invoiceRepository = new InvoiceRepository();
