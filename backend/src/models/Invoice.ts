import { query, transaction } from '../database/config.js';
import { IInvoice, IInvoiceCreate, IInvoiceUpdate, IInvoiceItem } from '../types/invoice.js';

class Invoice {
  // Create a new invoice with line items
  static async create(userId: string, invoiceData: IInvoiceCreate): Promise<IInvoice> {
    return await transaction(async (client) => {
      const {
        clientId,
        projectId,
        invoiceNumber,
        issueDate,
        dueDate,
        status = 'draft',
        subtotal,
        vatPercentage = 21.00,
        vatAmount,
        irpfPercentage = 15.00,
        irpfAmount,
        total,
        currency = 'EUR',
        notes,
        items = []
      } = invoiceData;

      // Insert invoice
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
        userId,
        clientId,
        projectId,
        invoiceNumber,
        issueDate,
        dueDate,
        status,
        subtotal,
        vatPercentage,
        vatAmount,
        irpfPercentage,
        irpfAmount,
        total,
        currency,
        notes
      ]);

      const invoice = invoiceResult.rows[0];

      // Insert invoice items
      if (items.length > 0) {
        const itemsSql = `
          INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const itemPromises = items.map(item =>
          client.query(itemsSql, [
            invoice.id,
            item.description,
            item.quantity || 1,
            item.unitType || 'hours',
            item.unitPrice,
            item.vatPercentage || 21.00,
            item.amount
          ])
        );

        const itemResults = await Promise.all(itemPromises);
        invoice.items = itemResults.map(r => r.rows[0]);
      }

      // Log activity
      await client.query(
        `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'invoice_created', 'invoice', invoice.id, `Factura ${invoiceNumber} creada`]
      );

      return invoice;
    });
  }

  // Find invoice by ID with items
  static async findById(id: string, userId: string): Promise<IInvoice | null> {
    const invoiceSql = 'SELECT * FROM invoices WHERE id = $1 AND user_id = $2';
    const invoiceResult = await query(invoiceSql, [id, userId]);

    if (invoiceResult.rows.length === 0) {
      return null;
    }

    const invoice = invoiceResult.rows[0] as IInvoice;

    // Get invoice items
    const itemsSql = 'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at';
    const itemsResult = await query(itemsSql, [id]);
    invoice.items = itemsResult.rows;

    // Get client info
    if (invoice.clientId) {
      const clientSql = 'SELECT * FROM clients WHERE id = $1';
      const clientResult = await query(clientSql, [invoice.clientId]);
      (invoice as any).client = clientResult.rows[0];
    }

    return invoice;
  }

  // Get all invoices for a user with filters
  static async findAllByUser(userId: string, filters: any = {}): Promise<IInvoice[]> {
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

    // Apply filters
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

    const result = await query(sql, params);
    return result.rows;
  }

  // Update invoice
  static async update(id: string, userId: string, updates: IInvoiceUpdate): Promise<IInvoice> {
    return await transaction(async (client) => {
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

      if (fields.length === 0 && !updates.items) {
        throw new Error('No valid fields to update');
      }

      let resultRow: any = null;
      if (fields.length > 0) {
        values.push(id, userId);
        const sql = `
          UPDATE invoices
          SET ${fields.join(', ')}
          WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
          RETURNING *
        `;
        const result = await client.query(sql, values);
        resultRow = result.rows[0];
      }

      // Update items if provided
      if (updates.items) {
        // Delete existing items
        await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);

        // Insert new items
        if (updates.items.length > 0) {
          const itemsSql = `
            INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;

          for (const item of updates.items) {
            await client.query(itemsSql, [
              id,
              item.description,
              item.quantity || 1,
              item.unitType || 'hours',
              item.unitPrice,
              item.vatPercentage || 21.00,
              item.amount
            ]);
          }
        }
        
        if (!resultRow) {
           const res = await client.query('SELECT * FROM invoices WHERE id = $1 AND user_id = $2', [id, userId]);
           resultRow = res.rows[0];
        }
      }

      return resultRow;
    });
  }

  // Delete invoice
  static async delete(id: string, userId: string): Promise<{ id: string } | null> {
    const sql = 'DELETE FROM invoices WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await query(sql, [id, userId]);
    return result.rows[0];
  }

  // Mark invoice as paid
  static async markAsPaid(id: string, userId: string, paymentData: any = {}): Promise<IInvoice> {
    return await transaction(async (client) => {
      const { paymentDate = new Date(), paymentMethod, amount } = paymentData;

      // Get invoice
      const invoiceResult = await client.query(
        'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = invoiceResult.rows[0];

      // Update invoice status
      const updateResult = await client.query(
        `UPDATE invoices
         SET status = 'paid', payment_date = $1, payment_method = $2
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [paymentDate, paymentMethod, id, userId]
      );

      // Record payment
      await client.query(
        `INSERT INTO payments (user_id, invoice_id, amount, payment_date, payment_method)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, id, amount || invoice.total, paymentDate, paymentMethod]
      );

      // Log activity
      await client.query(
        `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'payment_received', 'invoice', id, `Pago recibido para factura ${invoice.invoice_number}`]
      );

      return updateResult.rows[0];
    });
  }

  // Get invoice statistics
  static async getStatistics(userId: string, filters: any = {}): Promise<any> {
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

    const result = await query(sql, params);
    return result.rows[0];
  }

  // Get monthly income data
  static async getMonthlyIncome(userId: string, months: number = 12): Promise<any[]> {
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

    const result = await query(sql, [userId, months]);
    return result.rows;
  }

  // Check for overdue invoices and update status
  static async updateOverdueStatus(userId: string): Promise<any[]> {
    const sql = `
      UPDATE invoices
      SET status = 'overdue'
      WHERE user_id = $1
        AND status IN ('pending', 'sent')
        AND due_date < CURRENT_DATE
      RETURNING id, invoice_number
    `;

    const result = await query(sql, [userId]);
    return result.rows;
  }

  // Get invoice with Verifactu data
  static async findByIdWithVerifactu(id: string, userId: string): Promise<IInvoice | null> {
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

    const invoiceResult = await query(sql, [id, userId]);

    if (invoiceResult.rows.length === 0) {
      return null;
    }

    const invoice = invoiceResult.rows[0] as IInvoice;

    // Get invoice items
    const itemsSql = 'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at';
    const itemsResult = await query(itemsSql, [id]);
    invoice.items = itemsResult.rows;

    return invoice;
  }

  // Get Verifactu status
  static async getVerifactuStatus(id: string, userId: string): Promise<any> {
    const sql = `
      SELECT
        verifactu_enabled,
        verifactu_status,
        verifactu_id,
        verifactu_csv,
        verifactu_qr_code,
        verifactu_hash,
        verifactu_chain_index,
        verifactu_registered_at,
        verifactu_error_message,
        verifactu_url
      FROM invoices
      WHERE id = $1 AND user_id = $2
    `;

    const result = await query(sql, [id, userId]);
    return result.rows[0];
  }

  // Update Verifactu status
  static async updateVerifactuStatus(id: string, userId: string, status: string, errorMessage: string | null = null): Promise<IInvoice> {
    const sql = `
      UPDATE invoices
      SET verifactu_status = $1,
          verifactu_error_message = $2
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `;

    const result = await query(sql, [status, errorMessage, id, userId]);
    return result.rows[0];
  }

  // Get invoices pending Verifactu registration
  static async findPendingVerifactu(userId: string): Promise<IInvoice[]> {
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

    const result = await query(sql, [userId]);
    return result.rows;
  }

  // Get invoices registered in Verifactu
  static async findRegisteredVerifactu(userId: string, limit: number = 100): Promise<any[]> {
    const sql = `
      SELECT
        i.id,
        i.invoice_number,
        i.issue_date,
        i.total,
        i.verifactu_status,
        i.verifactu_id,
        i.verifactu_csv,
        i.verifactu_chain_index,
        i.verifactu_registered_at,
        c.name as client_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = $1
        AND i.verifactu_status = 'registered'
      ORDER BY i.verifactu_chain_index DESC
      LIMIT $2
    `;

    const result = await query(sql, [userId, limit]);
    return result.rows;
  }

  // Get Verifactu statistics
  static async getVerifactuStatistics(userId: string): Promise<any> {
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

    const result = await query(sql, [userId]);
    return result.rows[0];
  }
}

export default Invoice;
