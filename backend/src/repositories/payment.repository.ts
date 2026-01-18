import { BaseRepository } from './base.repository.js';
import { IPayment, IPaymentCreate, IPaymentUpdate } from '../types/payment.js';

export class PaymentRepository extends BaseRepository<IPayment> {
  protected tableName = 'payments';

  async create(userId: string, paymentData: IPaymentCreate): Promise<IPayment> {
    return this.withTransaction(async (client) => {
      const { invoiceId, amount, paymentDate, paymentMethod, transactionId, bankAccountId, notes } = paymentData;

      const sql = `
        INSERT INTO payments (
          user_id, invoice_id, amount, payment_date, payment_method,
          transaction_id, bank_account_id, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await client.query(sql, [
        userId, invoiceId, amount, paymentDate, paymentMethod,
        transactionId, bankAccountId, notes
      ]);

      const payment = this.mapToCamel(result.rows[0]);

      // Update invoice total_paid and check if fully paid
      await this.updateInvoicePaymentStatus(client, invoiceId, userId);

      // Log activity
      await client.query(
        `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'payment_created', 'payment', payment.id, `Pago de ${amount}€ registrado`]
      );

      return payment;
    });
  }

  async findById(id: string, userId: string): Promise<IPayment | null> {
    const sql = `
      SELECT p.*, i.invoice_number, c.name as client_name, b.bank_name, b.iban as bank_iban
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN bank_accounts b ON p.bank_account_id = b.id
      WHERE p.id = $1 AND p.user_id = $2
    `;

    const result = await this.executeQuery(sql, [id, userId]);
    return result.rows[0] ? this.mapToCamel(result.rows[0]) : null;
  }

  async findByInvoiceId(invoiceId: string, userId: string): Promise<IPayment[]> {
    const sql = `
      SELECT p.*, b.bank_name, b.iban as bank_iban
      FROM payments p
      LEFT JOIN bank_accounts b ON p.bank_account_id = b.id
      WHERE p.invoice_id = $1 AND p.user_id = $2
      ORDER BY p.payment_date DESC, p.created_at DESC
    `;

    const result = await this.executeQuery(sql, [invoiceId, userId]);
    return this.mapRows(result.rows);
  }

  async findAllByUser(userId: string, filters: any = {}): Promise<IPayment[]> {
    let sql = `
      SELECT p.*, i.invoice_number, c.name as client_name
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE p.user_id = $1
    `;

    const params: any[] = [userId];
    let paramCount = 2;

    if (filters.status) {
      sql += ` AND p.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.paymentMethod) {
      sql += ` AND p.payment_method = $${paramCount}`;
      params.push(filters.paymentMethod);
      paramCount++;
    }

    if (filters.dateFrom) {
      sql += ` AND p.payment_date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND p.payment_date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    sql += ' ORDER BY p.payment_date DESC, p.created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await this.executeQuery(sql, params);
    return this.mapRows(result.rows);
  }

  async update(id: string, userId: string, updates: IPaymentUpdate): Promise<IPayment | null> {
    const allowedFields: Record<string, string> = {
      status: 'status',
      reconciliationDate: 'reconciliation_date',
      notes: 'notes'
    };

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      const column = allowedFields[key];
      if (column) {
        fields.push(`${column} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return this.findById(id, userId);

    values.push(id, userId);
    const sql = `
      UPDATE payments
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await this.executeQuery(sql, values);
    return result.rows[0] ? this.mapToCamel(result.rows[0]) : null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    return this.withTransaction(async (client) => {
      // Get payment info before deleting
      const paymentRes = await client.query(
        'SELECT invoice_id FROM payments WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (paymentRes.rows.length === 0) return false;
      const { invoice_id } = paymentRes.rows[0];

      // Delete payment
      const deleteRes = await client.query(
        'DELETE FROM payments WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (deleteRes.rowCount > 0) {
        // Update invoice status
        await this.updateInvoicePaymentStatus(client, invoice_id, userId);

        // Log activity
        await client.query(
          `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, 'payment_deleted', 'payment', id, `Pago eliminado`]
        );

        return true;
      }

      return false;
    });
  }

  async getTotalPaidByInvoice(invoiceId: string, userId: string): Promise<number> {
    const sql = `
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM payments
      WHERE invoice_id = $1 AND user_id = $2 AND status != 'rejected'
    `;

    const result = await this.executeQuery(sql, [invoiceId, userId]);
    return parseFloat(result.rows[0].total_paid) || 0;
  }

  async getStatistics(userId: string, filters: any = {}): Promise<any> {
    let sql = `
      SELECT
        COUNT(*) as total_payments,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as average_payment,
        COUNT(CASE WHEN status = 'reconciled' THEN 1 END) as reconciled_count
      FROM payments
      WHERE user_id = $1
    `;

    const params: any[] = [userId];
    let paramCount = 2;

    if (filters.dateFrom) {
      sql += ` AND payment_date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND payment_date <= $${paramCount}`;
      params.push(filters.dateTo);
    }

    const result = await this.executeQuery(sql, params);
    return this.mapToCamel(result.rows[0]);
  }

  private async updateInvoicePaymentStatus(client: any, invoiceId: string, userId: string): Promise<void> {
    // Calculate total paid
    const totalRes = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total_paid
       FROM payments
       WHERE invoice_id = $1 AND user_id = $2 AND status != 'rejected'`,
      [invoiceId, userId]
    );

    const totalPaid = parseFloat(totalRes.rows[0].total_paid) || 0;

    // Get invoice total
    const invoiceRes = await client.query(
      'SELECT total FROM invoices WHERE id = $1 AND user_id = $2',
      [invoiceId, userId]
    );

    if (invoiceRes.rows.length > 0) {
      const invoiceTotal = parseFloat(invoiceRes.rows[0].total);

      // Update invoice status if fully paid
      if (totalPaid >= invoiceTotal) {
        await client.query(
          `UPDATE invoices SET status = 'paid' WHERE id = $1 AND user_id = $2 AND status != 'paid'`,
          [invoiceId, userId]
        );
      } else if (invoiceRes.rows[0].status === 'paid') {
        // If was paid but now not fully paid, revert to sent
        await client.query(
          `UPDATE invoices SET status = 'sent' WHERE id = $1 AND user_id = $2`,
          [invoiceId, userId]
        );
      }
    }
  }
}

export const paymentRepository = new PaymentRepository();
