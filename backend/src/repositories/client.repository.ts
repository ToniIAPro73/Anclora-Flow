import { BaseRepository } from './base.repository.js';
import { IClient, IClientCreate, IClientUpdate } from '../types/client.js';

export class ClientRepository extends BaseRepository<IClient> {
  protected tableName = 'clients';

  async findById(id: string, userId: string): Promise<IClient | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1 AND user_id = $2`;
    const result = await this.executeQuery(sql, [id, userId]);
    return this.mapToCamel(result.rows[0]);
  }

  async findAllByUser(userId: string, filters: any = {}): Promise<any[]> {
    let sql = `
      SELECT
        c.*,
        COALESCE(p.project_count, 0) AS projects_count,
        COALESCE(s.subscription_count, 0) AS subscriptions_count,
        COALESCE(inv.invoice_count, 0) AS invoice_count,
        COALESCE(inv.total_invoiced, 0) AS total_invoiced,
        COALESCE(inv.total_pending, 0) AS total_pending
      FROM clients c
      LEFT JOIN (
        SELECT client_id, COUNT(*) AS project_count
        FROM projects
        GROUP BY client_id
      ) p ON p.client_id = c.id
      LEFT JOIN (
        SELECT client_id, COUNT(*) AS subscription_count
        FROM customer_subscriptions
        GROUP BY client_id
      ) s ON s.client_id = c.id
      LEFT JOIN (
        SELECT
          client_id,
          COUNT(*) AS invoice_count,
          COALESCE(SUM(total), 0) AS total_invoiced,
          COALESCE(SUM(CASE WHEN status != 'paid' THEN total ELSE 0 END), 0) AS total_pending
        FROM invoices
        WHERE user_id = $1
        GROUP BY client_id
      ) inv ON inv.client_id = c.id
      WHERE c.user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters.isActive !== undefined) {
      sql += ` AND c.is_active = $${paramIndex}`;
      params.push(filters.isActive);
      paramIndex += 1;
    }

    if (filters.search) {
      sql += ` AND (c.name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex} OR c.nif_cif ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex += 1;
    }

    sql += ` ORDER BY c.name ASC`;

    const result = await this.executeQuery(sql, params);
    return result.rows.map((row: any) => this.mapToCamel(row));
  }

  async update(id: string, userId: string, updates: IClientUpdate): Promise<IClient | null> {
    const allowed: Record<string, string> = {
      name: 'name',
      email: 'email',
      phone: 'phone',
      nifCif: 'nif_cif',
      address: 'address',
      city: 'city',
      postalCode: 'postal_code',
      country: 'country',
      notes: 'notes',
      isActive: 'is_active'
    };

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      const column = allowed[key];
      if (column) {
        fields.push(`${column} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id, userId);
    const sql = `
      UPDATE clients
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await this.executeQuery(sql, values);
    return this.mapToCamel(result.rows[0]);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = $1 AND user_id = $2 RETURNING id`;
    const result = await this.executeQuery(sql, [id, userId]);
    return result.rowCount > 0;
  }

  async getStatistics(userId: string, clientId: string): Promise<any> {
    const sql = `
      SELECT
        COUNT(i.id) as total_invoices,
        COALESCE(SUM(i.total), 0) as total_billed,
        COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN i.status != 'paid' THEN i.total ELSE 0 END), 0) as total_pending
      FROM invoices i
      WHERE i.user_id = $1 AND i.client_id = $2
    `;

    const result = await this.executeQuery(sql, [userId, clientId]);
    return this.mapToCamel(result.rows[0]);
  }
}

export const clientRepository = new ClientRepository();
