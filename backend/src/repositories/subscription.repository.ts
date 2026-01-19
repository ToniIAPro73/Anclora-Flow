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
      SELECT *
      FROM subscriptions
      WHERE id = $1 AND user_id = $2
    `;

    const result = await this.executeQuery(sql, [id, userId]);
    return this.mapToCamel(result.rows[0]);
  }

  async findAllByUser(userId: string, filters: any = {}): Promise<ISubscription[]> {
    let sql = `
      SELECT *
      FROM subscriptions
      WHERE user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters.status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex += 1;
    }

    if (filters.billingCycle) {
      sql += ` AND billing_frequency = $${paramIndex}`;
      params.push(filters.billingCycle);
      paramIndex += 1;
    }

    if (filters.category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex += 1;
    }

    if (filters.search) {
      sql += ` AND (
        service_name ILIKE $${paramIndex}
        OR provider ILIKE $${paramIndex}
        OR description ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex += 1;
    }

    const orderBy = filters.orderBy === 'amount_desc'
      ? 'amount DESC'
      : filters.orderBy === 'amount_asc'
        ? 'amount ASC'
        : filters.orderBy === 'name_desc'
          ? 'service_name DESC'
          : 'next_billing_date ASC NULLS LAST';

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
      serviceName, provider, description, amount,
      currency = 'EUR', billingFrequency, nextBillingDate,
      status = 'active', category
    } = payload;

    const sql = `
      INSERT INTO subscriptions (
        user_id, service_name, provider, description, amount,
        currency, billing_frequency, next_billing_date,
        status, category
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await this.executeQuery(sql, [
      userId, serviceName, provider, description || null,
      amount, currency, billingFrequency, nextBillingDate,
      status, category || null
    ]);

    return this.mapToCamel(result.rows[0]);
  }

  async update(id: string, userId: string, updates: ISubscriptionUpdate): Promise<ISubscription | null> {
    const allowed: Map<string, string> = new Map([
      ['serviceName', 'service_name'],
      ['provider', 'provider'],
      ['description', 'description'],
      ['amount', 'amount'],
      ['currency', 'currency'],
      ['billingFrequency', 'billing_frequency'],
      ['nextBillingDate', 'next_billing_date'],
      ['status', 'status'],
      ['category', 'category']
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
              WHEN billing_frequency = 'monthly' THEN amount
              WHEN billing_frequency = 'quarterly' THEN amount / 3
              WHEN billing_frequency = 'yearly' THEN amount / 12
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
}

export const subscriptionRepository = new SubscriptionRepository();
