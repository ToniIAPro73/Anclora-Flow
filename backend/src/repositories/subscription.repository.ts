import { BaseRepository } from './base.repository.js';
import {
  ISubscription,
  ISubscriptionCreate,
  ISubscriptionUpdate,
  ISubscriptionSummary,
  ISubscriptionStatusBreakdown,
  IRevenueForecast
} from '../types/subscription.js';

export class SubscriptionRepository extends BaseRepository<ISubscription> {
  protected tableName = 'subscriptions';

  async findById(id: string, userId: string): Promise<ISubscription | null> {
    const sql = `
      SELECT
        s.*,
        c.name AS client_name,
        p.name AS project_name
      FROM subscriptions s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN projects p ON s.project_id = p.id
      WHERE s.id = $1
        AND s.user_id = $2
    `;

    const result = await this.executeQuery(sql, [id, userId]);
    return this.mapToCamel(result.rows[0]);
  }

  async findAllByUser(userId: string, filters: any = {}): Promise<ISubscription[]> {
    let sql = `
      SELECT
        s.*,
        c.name AS client_name,
        p.name AS project_name
      FROM subscriptions s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN projects p ON s.project_id = p.id
      WHERE s.user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters.status) {
      sql += ` AND s.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex += 1;
    }

    if (filters.billingCycle) {
      sql += ` AND s.billing_cycle = $${paramIndex}`;
      params.push(filters.billingCycle);
      paramIndex += 1;
    }

    if (filters.clientId) {
      sql += ` AND s.client_id = $${paramIndex}`;
      params.push(filters.clientId);
      paramIndex += 1;
    }

    if (filters.projectId) {
      sql += ` AND s.project_id = $${paramIndex}`;
      params.push(filters.projectId);
      paramIndex += 1;
    }

    if (typeof filters.autoInvoice === 'boolean') {
      sql += ` AND s.auto_invoice = $${paramIndex}`;
      params.push(filters.autoInvoice);
      paramIndex += 1;
    }

    if (filters.dateFrom) {
      sql += ` AND s.next_billing_date >= $${paramIndex}`;
      params.push(filters.dateFrom);
      paramIndex += 1;
    }

    if (filters.dateTo) {
      sql += ` AND s.next_billing_date <= $${paramIndex}`;
      params.push(filters.dateTo);
      paramIndex += 1;
    }

    if (filters.search) {
      sql += ` AND (
        s.name ILIKE $${paramIndex}
        OR s.description ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex += 1;
    }

    const orderBy = filters.orderBy === 'amount_desc'
      ? 's.amount DESC'
      : filters.orderBy === 'amount_asc'
        ? 's.amount ASC'
        : filters.orderBy === 'name_desc'
          ? 's.name DESC'
          : 's.next_billing_date ASC';

    sql += ` ORDER BY ${orderBy}`;

    if (filters.limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
    }

    const result = await this.executeQuery(sql, params);
    return this.mapRows(result.rows);
  }

  async create(userId: string, payload: ISubscriptionCreate): Promise<ISubscription> {
    const {
      clientId, projectId, name, description, amount,
      currency = 'EUR', billingCycle, startDate, endDate,
      nextBillingDate, status = 'active', autoInvoice = true
    } = payload;

    const sql = `
      INSERT INTO subscriptions (
        user_id, client_id, project_id, name, description, amount,
        currency, billing_cycle, start_date, end_date, next_billing_date,
        status, auto_invoice
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await this.executeQuery(sql, [
      userId, clientId || null, projectId || null, name, description || null,
      amount, currency, billingCycle, startDate, endDate || null,
      nextBillingDate, status, autoInvoice
    ]);

    return this.mapToCamel(result.rows[0]);
  }

  async update(id: string, userId: string, updates: ISubscriptionUpdate): Promise<ISubscription | null> {
    const allowed: Map<string, string> = new Map([
      ['clientId', 'client_id'],
      ['projectId', 'project_id'],
      ['name', 'name'],
      ['description', 'description'],
      ['amount', 'amount'],
      ['currency', 'currency'],
      ['billingCycle', 'billing_cycle'],
      ['startDate', 'start_date'],
      ['endDate', 'end_date'],
      ['nextBillingDate', 'next_billing_date'],
      ['status', 'status'],
      ['autoInvoice', 'auto_invoice']
    ]);

    const entries = Object.entries(updates).filter(([key]) => allowed.has(key));

    if (entries.length === 0) return null;

    const setFragments: string[] = [];
    const values: any[] = [];

    entries.forEach(([key, value], idx) => {
      setFragments.push(`${allowed.get(key)} = $${idx + 1}`);
      values.push(value ?? null);
    });

    values.push(id, userId);

    const sql = `
      UPDATE subscriptions
      SET ${setFragments.join(', ')}
      WHERE id = $${entries.length + 1}
        AND user_id = $${entries.length + 2}
      RETURNING *
    `;

    const result = await this.executeQuery(sql, values);
    return this.mapToCamel(result.rows[0]);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const sql = `DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING id`;
    const result = await this.executeQuery(sql, [id, userId]);
    return result.rowCount > 0;
  }

  async getSummary(userId: string): Promise<ISubscriptionSummary | null> {
    const sql = `
      WITH base AS (
        SELECT *
        FROM subscriptions
        WHERE user_id = $1
      ),
      mrr AS (
        SELECT
          SUM(
            CASE
              WHEN billing_cycle = 'monthly' THEN amount
              WHEN billing_cycle = 'quarterly' THEN amount / 3
              WHEN billing_cycle = 'yearly' THEN amount / 12
              ELSE amount
            END
          ) AS normalized_amount
        FROM base
        WHERE status = 'active'
      )
      SELECT
        COUNT(*) AS total_subscriptions,
        COUNT(*) FILTER (WHERE status = 'active') AS active_subscriptions,
        COUNT(*) FILTER (WHERE status = 'paused') AS paused_subscriptions,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_subscriptions,
        COALESCE(SUM(amount), 0) AS total_amount,
        COALESCE((SELECT normalized_amount FROM mrr), 0) AS monthly_recurring_revenue,
        COALESCE(SUM(amount) FILTER (WHERE next_billing_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'), 0) AS next_30_days_revenue
      FROM base
    `;

    const result = await this.executeQuery(sql, [userId]);
    const row = result.rows[0];
    if (!row) return null;
    
    const mapped = this.mapToCamel(row);
    return {
      totalSubscriptions: parseInt(mapped.totalSubscriptions || 0),
      activeSubscriptions: parseInt(mapped.activeSubscriptions || 0),
      pausedSubscriptions: parseInt(mapped.pausedSubscriptions || 0),
      cancelledSubscriptions: parseInt(mapped.cancelledSubscriptions || 0),
      totalAmount: parseFloat(mapped.totalAmount || 0),
      monthlyRecurringRevenue: parseFloat(mapped.monthlyRecurringRevenue || 0),
      next30DaysRevenue: parseFloat(mapped.next30DaysRevenue || 0)
    };
  }

  async getStatusBreakdown(userId: string): Promise<ISubscriptionStatusBreakdown[]> {
    const sql = `
      SELECT
        status,
        COUNT(*) AS count,
        COALESCE(SUM(amount), 0) AS total_amount
      FROM subscriptions
      WHERE user_id = $1
      GROUP BY status
      ORDER BY status
    `;

    const result = await this.executeQuery(sql, [userId]);
    return result.rows.map((row: any) => {
      const mapped = this.mapToCamel(row);
      return {
        status: mapped.status,
        count: parseInt(mapped.count || 0),
        totalAmount: parseFloat(mapped.totalAmount || 0)
      };
    });
  }

  async getRevenueForecast(userId: string, months: number = 6): Promise<IRevenueForecast[]> {
    const sql = `
      WITH expanded AS (
        SELECT
          id,
          user_id,
          name,
          amount,
          billing_cycle,
          status,
          next_billing_date,
          GENERATE_SERIES(0, $2 - 1) AS month_offset
        FROM subscriptions
        WHERE user_id = $1
          AND status = 'active'
      )
      SELECT
        DATE_TRUNC('month', next_billing_date + (INTERVAL '1 month' * month_offset)) AS month,
        SUM(
          CASE billing_cycle
            WHEN 'monthly' THEN amount
            WHEN 'quarterly' THEN
              CASE WHEN month_offset % 3 = 0 THEN amount ELSE 0 END
            WHEN 'yearly' THEN
              CASE WHEN month_offset = 0 THEN amount ELSE 0 END
            ELSE amount
          END
        ) AS forecast_amount
      FROM expanded
      GROUP BY month
      ORDER BY month
    `;

    const result = await this.executeQuery(sql, [userId, months]);
    return result.rows.map((row: any) => {
      const mapped = this.mapToCamel(row);
      return {
        month: mapped.month,
        forecastAmount: parseFloat(mapped.forecastAmount || 0)
      };
    });
  }

  async getUpcoming(userId: string, limit: number = 8): Promise<any[]> {
    const sql = `
      SELECT
        s.*,
        c.name AS client_name,
        p.name AS project_name
      FROM subscriptions s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN projects p ON s.project_id = p.id
      WHERE s.user_id = $1
        AND s.next_billing_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY s.next_billing_date ASC
      LIMIT $2
    `;

    const result = await this.executeQuery(sql, [userId, limit]);
    return this.mapRows(result.rows);
  }

  async getForProject(userId: string, projectId: string): Promise<any[]> {
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

  async getForClient(userId: string, clientId: string): Promise<any[]> {
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
    const result = await this.executeQuery(sql, [userId, clientId]);
    return this.mapRows(result.rows);
  }
}

export const subscriptionRepository = new SubscriptionRepository();
