const { query } = require('../database/config');

class Subscription {
  static async create(userId, payload) {
    const {
      clientId,
      projectId,
      name,
      description,
      amount,
      currency = 'EUR',
      billingCycle,
      startDate,
      endDate,
      nextBillingDate,
      status = 'active',
      autoInvoice = true
    } = payload;

    const sql = `
      INSERT INTO subscriptions (
        user_id,
        client_id,
        project_id,
        name,
        description,
        amount,
        currency,
        billing_cycle,
        start_date,
        end_date,
        next_billing_date,
        status,
        auto_invoice
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await query(sql, [
      userId,
      clientId || null,
      projectId || null,
      name,
      description || null,
      amount,
      currency,
      billingCycle,
      startDate,
      endDate || null,
      nextBillingDate,
      status,
      autoInvoice
    ]);

    return result.rows[0];
  }

  static async findById(id, userId) {
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

    const result = await query(sql, [id, userId]);
    return result.rows[0];
  }

  static async findAllByUser(userId, filters = {}) {
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

    const params = [userId];
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

    const result = await query(sql, params);
    return result.rows;
  }

  static async update(id, userId, updates) {
    const allowed = new Map([
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

    if (entries.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setFragments = [];
    const values = [];

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

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(id, userId) {
    const sql = `
      DELETE FROM subscriptions
      WHERE id = $1
        AND user_id = $2
      RETURNING id
    `;
    const result = await query(sql, [id, userId]);
    return result.rows[0];
  }

  static async getSummary(userId) {
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

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
  }

  static async getStatusBreakdown(userId) {
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

    const result = await query(sql, [userId]);
    return result.rows;
  }

  static async getRevenueForecast(userId, months = 6) {
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

    const result = await query(sql, [userId, months]);
    return result.rows;
  }

  static async getUpcoming(userId, limit = 8) {
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

    const result = await query(sql, [userId, limit]);
    return result.rows;
  }

  static async getForProject(userId, projectId) {
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

  static async getForClient(userId, clientId) {
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
}

module.exports = Subscription;
