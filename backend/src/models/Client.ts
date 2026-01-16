import { query } from '../database/config.js';
import { IClient, IClientCreate, IClientUpdate, IClientSummary } from '../types/client.js';
import { clientRepository } from '../repositories/client.repository.js';

class Client {
  // Create a new client
  static async create(userId: string, clientData: IClientCreate): Promise<IClient> {
    const {
      name, email, phone, nifCif, address, city, postalCode,
      country = 'España', notes, isActive = true
    } = clientData;

    const sql = `
      INSERT INTO clients (user_id, name, email, phone, nif_cif, address, city, postal_code, country, notes, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await query(sql, [
      userId, name, email, phone, nifCif, address, city, postalCode, country, notes, isActive
    ]);

    const row = result.rows[0];
    return {
      ...row,
      userId: row.user_id,
      nifCif: row.nif_cif,
      postalCode: row.postal_code,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    } as IClient;
  }

  // Find client by ID
  static async findById(id: string, userId: string): Promise<IClient | null> {
    const row = await clientRepository.findById(id, userId);
    return row as IClient | null;
  }

  // Get all clients for a user
  static async findAllByUser(userId: string, filters: any = {}): Promise<IClient[]> {
    const rows = await clientRepository.findAllByUser(userId, filters);
    return rows as IClient[];
  }

  // Update client
  static async update(id: string, userId: string, updates: IClientUpdate): Promise<IClient | null> {
    const row = await clientRepository.update(id, userId, updates);
    return row as IClient | null;
  }

  // Delete client
  static async delete(id: string, userId: string): Promise<{ id: string } | null> {
    const success = await clientRepository.delete(id, userId);
    return success ? { id } : null;
  }

  // Get client statistics
  static async getStatistics(userId: string, clientId: string): Promise<any> {
    const row = await clientRepository.getStatistics(userId, clientId);
    if (!row) return null;
    return {
      totalInvoices: parseInt(row.totalInvoices || 0),
      totalBilled: parseFloat(row.totalBilled || 0),
      totalPaid: parseFloat(row.totalPaid || 0),
      totalPending: parseFloat(row.totalPending || 0)
    };
  }

  // Get top clients by billing
  static async getTopClients(userId: string, limit: number = 5): Promise<any[]> {
    const sql = `
      SELECT
        c.id, c.name, c.email,
        COUNT(i.id) as invoice_count,
        COALESCE(SUM(i.total), 0) as total_billed
      FROM clients c
      LEFT JOIN invoices i ON c.id = i.client_id AND i.user_id = $1
      WHERE c.user_id = $1
      GROUP BY c.id, c.name, c.email
      ORDER BY total_billed DESC
      LIMIT $2
    `;

    const result = await query(sql, [userId, limit]);
    return result.rows.map(row => ({
      ...row,
      invoiceCount: parseInt(row.invoice_count),
      totalBilled: parseFloat(row.total_billed)
    }));
  }

  static async getSummary(userId: string): Promise<IClientSummary | null> {
    const sql = `
      WITH base AS (
        SELECT * FROM clients WHERE user_id = $1
      )
      SELECT
        COUNT(*) AS total_clients,
        COUNT(*) FILTER (WHERE is_active) AS active_clients,
        COUNT(*) FILTER (WHERE NOT is_active) AS inactive_clients,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS new_this_month,
        COALESCE(SUM(i.total), 0) AS total_billed,
        COALESCE(SUM(i.total) FILTER (WHERE i.status = 'paid'), 0) AS total_paid,
        COALESCE(SUM(i.total) FILTER (WHERE i.status != 'paid'), 0) AS total_pending
      FROM base c
      LEFT JOIN invoices i ON c.id = i.client_id AND i.user_id = $1
    `;

    const result = await query(sql, [userId]);
    const row = result.rows[0];
    if (!row) return null;
    
    return {
      totalClients: parseInt(row.total_clients),
      activeClients: parseInt(row.active_clients),
      inactiveClients: parseInt(row.inactive_clients),
      newThisMonth: parseInt(row.new_this_month),
      totalBilled: parseFloat(row.total_billed),
      totalPaid: parseFloat(row.total_paid),
      totalPending: parseFloat(row.total_pending)
    };
  }

  static async getRecent(userId: string, limit: number = 6): Promise<any[]> {
    const sql = `
      SELECT
        c.*,
        COALESCE(SUM(i.total), 0) AS total_billed,
        COUNT(DISTINCT p.id) AS projects_count
      FROM clients c
      LEFT JOIN invoices i ON c.id = i.client_id AND i.user_id = $1
      LEFT JOIN projects p ON c.id = p.client_id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT $2
    `;

    const result = await query(sql, [userId, limit]);
    return result.rows.map(row => ({
      ...row,
      userId: row.user_id,
      nifCif: row.nif_cif,
      isActive: row.is_active,
      totalBilled: parseFloat(row.total_billed),
      projectsCount: parseInt(row.projects_count)
    }));
  }

  static async getProjects(userId: string, clientId: string): Promise<any[]> {
    const sql = `
      SELECT
        p.*,
        COUNT(DISTINCT i.id) AS invoice_count,
        COALESCE(SUM(i.total), 0) AS total_invoiced,
        COUNT(DISTINCT s.id) AS subscription_count
      FROM projects p
      LEFT JOIN invoices i ON p.id = i.project_id
      LEFT JOIN subscriptions s ON p.id = s.project_id
      WHERE p.user_id = $1
        AND p.client_id = $2
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

    const result = await query(sql, [userId, clientId]);
    return result.rows.map(row => ({
      ...row,
      invoiceCount: parseInt(row.invoice_count),
      totalInvoiced: parseFloat(row.total_invoiced),
      subscriptionCount: parseInt(row.subscription_count)
    }));
  }

  static async getSubscriptions(userId: string, clientId: string): Promise<any[]> {
    const sql = `
      SELECT
        s.*,
        p.name AS project_name
      FROM subscriptions s
      LEFT JOIN projects p ON s.project_id = p.id
      WHERE s.user_id = $1
        AND s.client_id = $2
      ORDER BY s.next_billing_date ASC
    `;

    const result = await query(sql, [userId, clientId]);
    return result.rows;
  }

  static async getRevenueTrend(userId: string, months: number = 6): Promise<any[]> {
    const sql = `
      SELECT
        DATE_TRUNC('month', i.issue_date) AS month,
        COALESCE(SUM(i.total), 0) AS total_billed
      FROM invoices i
      WHERE i.user_id = $1
        AND i.issue_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${months - 1} months'
      GROUP BY month
      ORDER BY month
    `;

    const result = await query(sql, [userId]);
    return result.rows.map(row => ({
      month: row.month,
      totalBilled: parseFloat(row.total_billed)
    }));
  }
}

export default Client;
