import { BaseRepository } from './base.repository.js';
import {
  ICustomerSubscription,
  ICustomerSubscriptionCreate,
  ICustomerSubscriptionUpdate,
  ICustomerSubscriptionMRR,
  ICustomerSubscriptionARR
} from '../types/customer-subscription.js';

export class CustomerSubscriptionRepository extends BaseRepository<ICustomerSubscription> {
  protected tableName = 'customer_subscriptions';

  async findById(id: string, userId: string): Promise<ICustomerSubscription | null> {
    const sql = `
      SELECT cs.*, c.name as client_name, c.email as client_email
      FROM customer_subscriptions cs
      LEFT JOIN clients c ON cs.client_id = c.id
      WHERE cs.id = $1 AND cs.user_id = $2
    `;

    const result = await this.executeQuery(sql, [id, userId]);
    return this.mapToCamel(result.rows[0]);
  }

  async findAllByUser(userId: string, filters: any = {}): Promise<ICustomerSubscription[]> {
    let sql = `
      SELECT cs.*, c.name as client_name, c.email as client_email
      FROM customer_subscriptions cs
      LEFT JOIN clients c ON cs.client_id = c.id
      WHERE cs.user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters.status) {
      sql += ` AND cs.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex += 1;
    }

    if (filters.clientId) {
      sql += ` AND cs.client_id = $${paramIndex}`;
      params.push(filters.clientId);
      paramIndex += 1;
    }

    if (filters.planCode) {
      sql += ` AND cs.plan_code = $${paramIndex}`;
      params.push(filters.planCode);
      paramIndex += 1;
    }

    if (filters.search) {
      sql += ` AND (
        cs.plan_name ILIKE $${paramIndex}
        OR c.name ILIKE $${paramIndex}
        OR cs.description ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex += 1;
    }

    const orderBy = filters.orderBy === 'amount_desc'
      ? 'cs.amount DESC'
      : filters.orderBy === 'amount_asc'
        ? 'cs.amount ASC'
        : filters.orderBy === 'client_name'
          ? 'c.name ASC'
          : 'cs.next_billing_date ASC NULLS LAST';

    sql += ` ORDER BY ${orderBy}`;

    if (filters.limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
    }

    const result = await this.executeQuery(sql, params);
    return this.mapRows(result.rows);
  }

  async create(userId: string, payload: ICustomerSubscriptionCreate): Promise<ICustomerSubscription> {
    const {
      clientId, planName, planCode, description, amount, currency = 'EUR',
      billingFrequency, startDate, currentPeriodStart, currentPeriodEnd,
      nextBillingDate, status = 'active', hasTrial = false, trialDays,
      trialStartDate, trialEndDate, autoInvoice = true, autoSendInvoice = false,
      invoiceDay = 1, discountPercentage = 0, discountEndDate, paymentMethod, notes
    } = payload;

    const sql = `
      INSERT INTO customer_subscriptions (
        user_id, client_id, plan_name, plan_code, description, amount, currency,
        billing_frequency, start_date, current_period_start, current_period_end,
        next_billing_date, status, has_trial, trial_days, trial_start_date,
        trial_end_date, auto_invoice, auto_send_invoice, invoice_day,
        discount_percentage, discount_end_date, payment_method, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *
    `;

    const result = await this.executeQuery(sql, [
      userId, clientId, planName, planCode, description || null, amount, currency,
      billingFrequency, startDate, currentPeriodStart, currentPeriodEnd,
      nextBillingDate, status, hasTrial, trialDays || null, trialStartDate || null,
      trialEndDate || null, autoInvoice, autoSendInvoice, invoiceDay,
      discountPercentage, discountEndDate || null, paymentMethod || null, notes || null
    ]);

    return this.mapToCamel(result.rows[0]);
  }

  async update(id: string, userId: string, updates: ICustomerSubscriptionUpdate): Promise<ICustomerSubscription | null> {
    const allowed: Map<string, string> = new Map([
      ['planName', 'plan_name'],
      ['planCode', 'plan_code'],
      ['description', 'description'],
      ['amount', 'amount'],
      ['currency', 'currency'],
      ['billingFrequency', 'billing_frequency'],
      ['nextBillingDate', 'next_billing_date'],
      ['status', 'status'],
      ['autoInvoice', 'auto_invoice'],
      ['autoSendInvoice', 'auto_send_invoice'],
      ['invoiceDay', 'invoice_day'],
      ['discountPercentage', 'discount_percentage'],
      ['discountEndDate', 'discount_end_date'],
      ['paymentMethod', 'payment_method'],
      ['notes', 'notes']
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
      UPDATE customer_subscriptions
      SET ${setFragments.join(', ')}
      WHERE id = $${entries.length + 1}
        AND user_id = $${entries.length + 2}
      RETURNING *
    `;

    const result = await this.executeQuery(sql, values);
    return this.mapToCamel(result.rows[0]);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const sql = `DELETE FROM customer_subscriptions WHERE id = $1 AND user_id = $2 RETURNING id`;
    const result = await this.executeQuery(sql, [id, userId]);
    return result.rowCount > 0;
  }

  // Obtener MRR (Monthly Recurring Revenue)
  async getMRR(userId: string): Promise<ICustomerSubscriptionMRR | null> {
    const sql = `
      SELECT
        user_id,
        COUNT(*) FILTER (WHERE status IN ('trial', 'active')) as active_subscriptions,
        SUM(CASE 
          WHEN billing_frequency = 'monthly' THEN amount
          WHEN billing_frequency = 'quarterly' THEN amount / 3
          WHEN billing_frequency = 'yearly' THEN amount / 12
        END) FILTER (WHERE status IN ('trial', 'active')) as mrr,
        AVG(amount) FILTER (WHERE status IN ('trial', 'active')) as avg_subscription_value
      FROM customer_subscriptions
      WHERE user_id = $1
      GROUP BY user_id
    `;

    const result = await this.executeQuery(sql, [userId]);
    if (result.rows.length === 0) {
      return {
        userId,
        activeSubscriptions: 0,
        mrr: 0,
        avgSubscriptionValue: 0
      };
    }

    const row = this.mapToCamel(result.rows[0]);
    return {
      userId: row.userId,
      activeSubscriptions: parseInt(row.activeSubscriptions || 0),
      mrr: parseFloat(row.mrr || 0),
      avgSubscriptionValue: parseFloat(row.avgSubscriptionValue || 0)
    };
  }

  // Obtener ARR (Annual Recurring Revenue)
  async getARR(userId: string): Promise<ICustomerSubscriptionARR | null> {
    const sql = `
      SELECT 
        user_id,
        SUM(CASE 
          WHEN billing_frequency = 'monthly' THEN amount * 12
          WHEN billing_frequency = 'quarterly' THEN amount * 4
          WHEN billing_frequency = 'yearly' THEN amount
        END) as arr,
        COUNT(*) as total_active_subscriptions
      FROM customer_subscriptions
      WHERE user_id = $1 AND status IN ('trial', 'active')
      GROUP BY user_id
    `;

    const result = await this.executeQuery(sql, [userId]);
    if (result.rows.length === 0) {
      return {
        userId,
        arr: 0,
        totalActiveSubscriptions: 0
      };
    }

    const row = this.mapToCamel(result.rows[0]);
    return {
      userId: row.userId,
      arr: parseFloat(row.arr || 0),
      totalActiveSubscriptions: parseInt(row.totalActiveSubscriptions || 0)
    };
  }

  // Obtener trials próximos a expirar
  async getExpiringTrials(userId: string, days: number = 7): Promise<ICustomerSubscription[]> {
    const sql = `
      SELECT cs.*, c.name as client_name, c.email as client_email
      FROM customer_subscriptions cs
      LEFT JOIN clients c ON cs.client_id = c.id
      WHERE cs.user_id = $1
        AND cs.status = 'trial'
        AND cs.has_trial = true
        AND cs.trial_converted = false
        AND cs.trial_end_date <= CURRENT_DATE + INTERVAL '${days} days'
        AND cs.trial_end_date >= CURRENT_DATE
      ORDER BY cs.trial_end_date ASC
    `;

    const result = await this.executeQuery(sql, [userId]);
    return this.mapRows(result.rows);
  }

  // Convertir trial a activo
  async convertTrialToActive(id: string, userId: string): Promise<ICustomerSubscription | null> {
    const sql = `
      UPDATE customer_subscriptions
      SET status = 'active',
          trial_converted = true,
          trial_conversion_date = CURRENT_DATE
      WHERE id = $1 AND user_id = $2 AND status = 'trial'
      RETURNING *
    `;

    const result = await this.executeQuery(sql, [id, userId]);
    return this.mapToCamel(result.rows[0]);
  }

  // Cancelar suscripción
  async cancel(id: string, userId: string): Promise<ICustomerSubscription | null> {
    const sql = `
      UPDATE customer_subscriptions
      SET status = 'cancelled',
          cancellation_date = CURRENT_DATE,
          cancellation_effective_date = current_period_end,
          next_billing_date = NULL
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await this.executeQuery(sql, [id, userId]);
    return this.mapToCamel(result.rows[0]);
  }

  // Upgrade de plan
  async upgradePlan(id: string, userId: string, newPlanCode: string, newAmount: number): Promise<ICustomerSubscription | null> {
    const sql = `
      UPDATE customer_subscriptions
      SET previous_plan_code = plan_code,
          plan_code = $3,
          amount = $4,
          plan_changed_at = CURRENT_TIMESTAMP,
          plan_change_type = 'upgrade'
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await this.executeQuery(sql, [id, userId, newPlanCode, newAmount]);
    return this.mapToCamel(result.rows[0]);
  }
}

export const customerSubscriptionRepository = new CustomerSubscriptionRepository();
