import { query } from '../database/config.js';
import { IProject, IProjectCreate, IProjectUpdate, IProjectSummary, IProjectStatusMetric } from '../types/project.js';

class Project {
  // Create a new project
  static async create(userId: string, projectData: IProjectCreate): Promise<IProject> {
    const {
      clientId,
      name,
      description,
      status = 'active',
      budget = 0,
      startDate,
      endDate,
      color
    } = projectData;

    const sql = `
      INSERT INTO projects (user_id, client_id, name, description, status, budget, start_date, end_date, color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await query(sql, [
      userId,
      clientId,
      name,
      description,
      status,
      budget,
      startDate,
      endDate,
      color
    ]);

    const row = result.rows[0];
    return {
      ...row,
      userId: row.user_id,
      clientId: row.client_id,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Find project by ID
  static async findById(id: string, userId: string): Promise<IProject | null> {
    const sql = `
      SELECT
        p.*,
        c.name as client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = $1 AND p.user_id = $2
    `;

    const result = await query(sql, [id, userId]);
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      ...row,
      userId: row.user_id,
      clientId: row.client_id,
      clientName: row.client_name,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Get all projects for a user with filters
  static async findAllByUser(userId: string, filters: any = {}): Promise<IProject[]> {
    let sql = `
      SELECT
        p.*,
        c.name as client_name,
        COUNT(DISTINCT i.id) as invoice_count,
        COALESCE(SUM(i.total), 0) as total_invoiced
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN invoices i ON p.id = i.project_id
      WHERE p.user_id = $1
    `;

    const params: any[] = [userId];
    let paramCount = 2;

    // Apply filters
    if (filters.status) {
      sql += ` AND p.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.clientId) {
      sql += ` AND p.client_id = $${paramCount}`;
      params.push(filters.clientId);
      paramCount++;
    }

    if (filters.search) {
      sql += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    sql += ' GROUP BY p.id, c.name ORDER BY p.created_at DESC';

    const result = await query(sql, params);
    return result.rows.map(row => ({
      ...row,
      userId: row.user_id,
      clientId: row.client_id,
      clientName: row.client_name,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      invoiceCount: parseInt(row.invoice_count),
      totalInvoiced: parseFloat(row.total_invoiced)
    }));
  }

  // Update project
  static async update(id: string, userId: string, updates: IProjectUpdate): Promise<IProject> {
    const allowedFields: Record<string, string> = {
      clientId: 'client_id',
      name: 'name',
      description: 'description',
      status: 'status',
      budget: 'budget',
      startDate: 'start_date',
      endDate: 'end_date',
      color: 'color'
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

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id, userId);
    const sql = `
      UPDATE projects
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await query(sql, values);
    const row = result.rows[0];
    return {
      ...row,
      userId: row.user_id,
      clientId: row.client_id,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Delete project
  static async delete(id: string, userId: string): Promise<{ id: string } | null> {
    const sql = 'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await query(sql, [id, userId]);
    return result.rows[0];
  }

  // Get project statistics
  static async getStatistics(userId: string, projectId: string): Promise<any> {
    const sql = `
      SELECT
        COUNT(DISTINCT i.id) as invoice_count,
        COALESCE(SUM(i.total), 0) as total_invoiced,
        COUNT(DISTINCT e.id) as expense_count,
        COALESCE(SUM(e.amount), 0) as total_expenses,
        COALESCE(SUM(i.total), 0) - COALESCE(SUM(e.amount), 0) as net_profit
      FROM projects p
      LEFT JOIN invoices i ON p.id = i.project_id
      LEFT JOIN expenses e ON p.id = e.project_id
      WHERE p.user_id = $1 AND p.id = $2
      GROUP BY p.id
    `;

    const result = await query(sql, [userId, projectId]);
    const row = result.rows[0];
    if (!row) return null;
    
    return {
      invoiceCount: parseInt(row.invoice_count),
      totalInvoiced: parseFloat(row.total_invoiced),
      expenseCount: parseInt(row.expense_count),
      totalExpenses: parseFloat(row.total_expenses),
      netProfit: parseFloat(row.net_profit)
    };
  }

  static async getSummary(userId: string): Promise<IProjectSummary | null> {
    const sql = `
      SELECT
        COUNT(*) AS total_projects,
        COUNT(*) FILTER (WHERE status = 'active') AS active_projects,
        COUNT(*) FILTER (WHERE status = 'on-hold') AS on_hold_projects,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_projects,
        COALESCE(SUM(budget), 0) AS total_budget,
        COALESCE(SUM(i.total), 0) AS total_invoiced
      FROM projects p
      LEFT JOIN invoices i ON p.id = i.project_id AND i.user_id = $1
      WHERE p.user_id = $1
    `;

    const result = await query(sql, [userId]);
    const row = result.rows[0];
    if (!row) return null;
    
    return {
      totalProjects: parseInt(row.total_projects),
      activeProjects: parseInt(row.active_projects),
      onHoldProjects: parseInt(row.on_hold_projects),
      completedProjects: parseInt(row.completed_projects),
      totalBudget: parseFloat(row.total_budget),
      totalInvoiced: parseFloat(row.total_invoiced)
    };
  }

  static async getStatusMetrics(userId: string): Promise<IProjectStatusMetric[]> {
    const sql = `
      SELECT
        p.status,
        COUNT(*) AS count,
        COALESCE(SUM(p.budget), 0) AS total_budget,
        COALESCE(SUM(i.total), 0) AS total_invoiced
      FROM projects p
      LEFT JOIN invoices i ON p.id = i.project_id AND i.user_id = $1
      WHERE p.user_id = $1
      GROUP BY p.status
      ORDER BY p.status
    `;

    const result = await query(sql, [userId]);
    return result.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count),
      totalBudget: parseFloat(row.total_budget),
      totalInvoiced: parseFloat(row.total_invoiced)
    }));
  }

  static async getUpcomingDeadlines(userId: string, limit: number = 6): Promise<any[]> {
    const sql = `
      SELECT
        p.*,
        c.name AS client_name,
        COUNT(DISTINCT t.id) AS subscription_count,
        COALESCE(SUM(i.total), 0) AS total_invoiced
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN subscriptions t ON p.id = t.project_id
      LEFT JOIN invoices i ON p.id = i.project_id AND i.user_id = $1
      WHERE p.user_id = $1
        AND p.end_date IS NOT NULL
        AND p.end_date >= CURRENT_DATE
      GROUP BY p.id, c.name
      ORDER BY p.end_date ASC
      LIMIT $2
    `;

    const result = await query(sql, [userId, limit]);
    return result.rows.map(row => ({
      ...row,
      userId: row.user_id,
      clientId: row.client_id,
      clientName: row.client_name,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      subscriptionCount: parseInt(row.subscription_count),
      totalInvoiced: parseFloat(row.total_invoiced)
    }));
  }

  static async getSubscriptions(userId: string, projectId: string): Promise<any[]> {
    const sql = `
      SELECT
        s.*,
        c.name AS client_name
      FROM subscriptions s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.user_id = $1
        AND s.project_id = $2
      ORDER BY s.next_billing_date ASC
    `;

    const result = await query(sql, [userId, projectId]);
    return result.rows;
  }
}

export default Project;
