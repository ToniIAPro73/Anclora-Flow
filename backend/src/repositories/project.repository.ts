import { BaseRepository } from './base.repository.js';
import { IProject, IProjectCreate, IProjectUpdate, IProjectSummary, IProjectStatusMetric } from '../types/project.js';

export class ProjectRepository extends BaseRepository<IProject> {
  protected tableName = 'projects';

  async findById(id: string, userId: string): Promise<IProject | null> {
    const sql = `
      SELECT
        p.*,
        c.name as client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = $1 AND p.user_id = $2
    `;

    const result = await this.executeQuery(sql, [id, userId]);
    return this.mapToCamel(result.rows[0]);
  }

  async findAllByUser(userId: string, filters: any = {}): Promise<IProject[]> {
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

    const result = await this.executeQuery(sql, params);
    return result.rows.map((row: any) => {
      const mapped = this.mapToCamel(row);
      return {
        ...mapped,
        invoiceCount: parseInt(mapped.invoiceCount || 0),
        totalInvoiced: parseFloat(mapped.totalInvoiced || 0)
      };
    });
  }

  async create(userId: string, projectData: IProjectCreate): Promise<IProject> {
    const {
      clientId, name, description, status = 'active',
      budget = 0, startDate, endDate, color
    } = projectData;

    const sql = `
      INSERT INTO projects (user_id, client_id, name, description, status, budget, start_date, end_date, color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await this.executeQuery(sql, [
      userId, clientId, name, description, status, budget, startDate, endDate, color
    ]);

    return this.mapToCamel(result.rows[0]);
  }

  async update(id: string, userId: string, updates: IProjectUpdate): Promise<IProject | null> {
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

    if (fields.length === 0) return null;

    values.push(id, userId);
    const sql = `
      UPDATE projects
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await this.executeQuery(sql, values);
    return this.mapToCamel(result.rows[0]);
  }

  async getStatistics(userId: string, projectId: string): Promise<any> {
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

    const result = await this.executeQuery(sql, [userId, projectId]);
    const row = result.rows[0];
    if (!row) return null;
    
    const mapped = this.mapToCamel(row);
    return {
      invoiceCount: parseInt(mapped.invoiceCount || 0),
      totalInvoiced: parseFloat(mapped.totalInvoiced || 0),
      expenseCount: parseInt(mapped.expenseCount || 0),
      totalExpenses: parseFloat(mapped.totalExpenses || 0),
      netProfit: parseFloat(mapped.netProfit || 0)
    };
  }

  async getSummary(userId: string): Promise<IProjectSummary | null> {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM projects WHERE user_id = $1) AS total_projects,
        (SELECT COUNT(*) FROM projects WHERE user_id = $1 AND status = 'active') AS active_projects,
        (SELECT COUNT(*) FROM projects WHERE user_id = $1 AND status = 'on-hold') AS on_hold_projects,
        (SELECT COUNT(*) FROM projects WHERE user_id = $1 AND status = 'completed') AS completed_projects,
        COALESCE((SELECT SUM(budget) FROM projects WHERE user_id = $1), 0) AS total_budget,
        COALESCE((SELECT SUM(total) FROM invoices WHERE user_id = $1 AND project_id IS NOT NULL), 0) AS total_invoiced
    `;

    const result = await this.executeQuery(sql, [userId]);
    const row = result.rows[0];
    if (!row) return null;
    
    const mapped = this.mapToCamel(row);
    return {
      totalProjects: parseInt(mapped.totalProjects || 0),
      activeProjects: parseInt(mapped.activeProjects || 0),
      onHoldProjects: parseInt(mapped.onHoldProjects || 0),
      completedProjects: parseInt(mapped.completedProjects || 0),
      totalBudget: parseFloat(mapped.totalBudget || 0),
      totalInvoiced: parseFloat(mapped.totalInvoiced || 0)
    };
  }

  async getStatusMetrics(userId: string): Promise<IProjectStatusMetric[]> {
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

    const result = await this.executeQuery(sql, [userId]);
    return result.rows.map((row: any) => {
      const mapped = this.mapToCamel(row);
      return {
        status: mapped.status,
        count: parseInt(mapped.count || 0),
        totalBudget: parseFloat(mapped.totalBudget || 0),
        totalInvoiced: parseFloat(mapped.totalInvoiced || 0)
      };
    });
  }

  async getUpcomingDeadlines(userId: string, limit: number = 6): Promise<any[]> {
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

    const result = await this.executeQuery(sql, [userId, limit]);
    return result.rows.map((row: any) => {
      const mapped = this.mapToCamel(row);
      return {
        ...mapped,
        subscriptionCount: parseInt(mapped.subscriptionCount || 0),
        totalInvoiced: parseFloat(mapped.totalInvoiced || 0)
      };
    });
  }

  async getSubscriptions(userId: string, projectId: string): Promise<any[]> {
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

    const result = await this.executeQuery(sql, [userId, projectId]);
    return this.mapRows(result.rows);
  }
}

export const projectRepository = new ProjectRepository();
