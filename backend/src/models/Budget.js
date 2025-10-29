const { query } = require('../database/config');

class Budget {
  static normalizeMonth(month) {
    if (!month) {
      return new Date().toISOString().slice(0, 7);
    }
    const parsed = new Date(month);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toISOString().slice(0, 7);
    }
    return parsed.toISOString().slice(0, 7);
  }

  static async findByMonth(userId, month) {
    const monthIso = Budget.normalizeMonth(month);
    const sql = `
      WITH expenses_by_category AS (
        SELECT
          category,
          DATE_TRUNC('month', expense_date) AS month,
          SUM(amount) AS actual_spent
        FROM expenses
        WHERE user_id = $1
          AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', $2::date)
        GROUP BY category, DATE_TRUNC('month', expense_date)
      ),
      invoices_by_category AS (
        SELECT
          COALESCE(p.category, 'general') AS category,
          DATE_TRUNC('month', i.issue_date) AS month,
          SUM(i.total) AS billed
        FROM invoices i
        LEFT JOIN projects p ON p.id = i.project_id
        WHERE i.user_id = $1
          AND DATE_TRUNC('month', i.issue_date) = DATE_TRUNC('month', $2::date)
        GROUP BY COALESCE(p.category, 'general'), DATE_TRUNC('month', i.issue_date)
      )
      SELECT
        b.*,
        COALESCE(e.actual_spent, 0) AS actual_spent,
        COALESCE(inv.billed, 0) AS related_revenue,
        GREATEST(b.planned_amount - COALESCE(e.actual_spent, 0), 0) AS remaining_amount,
        CASE
          WHEN b.planned_amount = 0 THEN 0
          ELSE ROUND(COALESCE(e.actual_spent, 0) / b.planned_amount * 100, 2)
        END AS spending_ratio
      FROM budgets b
      LEFT JOIN expenses_by_category e
        ON e.category = b.category
      LEFT JOIN invoices_by_category inv
        ON inv.category = b.category
      WHERE b.user_id = $1
        AND DATE_TRUNC('month', b.month) = DATE_TRUNC('month', $2::date)
      ORDER BY b.category ASC
    `;

    const result = await query(sql, [userId, `${monthIso}-01`]);
    return result.rows;
  }

  static async getSummary(userId, month) {
    const monthIso = Budget.normalizeMonth(month);
    const sql = `
      WITH budget_base AS (
        SELECT
          b.*,
          COALESCE(SUM(e.amount), 0) AS actual_spent
        FROM budgets b
        LEFT JOIN expenses e
          ON e.user_id = b.user_id
         AND e.category = b.category
         AND DATE_TRUNC('month', e.expense_date) = DATE_TRUNC('month', b.month)
        WHERE b.user_id = $1
          AND DATE_TRUNC('month', b.month) = DATE_TRUNC('month', $2::date)
        GROUP BY b.id
      )
      SELECT
        COALESCE(SUM(planned_amount), 0) AS planned_total,
        COALESCE(SUM(actual_spent), 0) AS actual_total,
        COALESCE(SUM(GREATEST(planned_amount - actual_spent, 0)), 0) AS remaining_total,
        COUNT(*) FILTER (WHERE actual_spent <= planned_amount) AS on_track_categories,
        COUNT(*) AS tracked_categories
      FROM budget_base
    `;

    const result = await query(sql, [userId, `${monthIso}-01`]);
    return result.rows[0] || {
      planned_total: 0,
      actual_total: 0,
      remaining_total: 0,
      on_track_categories: 0,
      tracked_categories: 0,
    };
  }

  static async getSuggestions(userId, month, monthsLookback = 3) {
    const monthIso = Budget.normalizeMonth(month);
    const sql = `
      WITH historical_expenses AS (
        SELECT
          category,
          DATE_TRUNC('month', expense_date) AS month,
          SUM(amount) AS total_amount
        FROM expenses
        WHERE user_id = $1
          AND expense_date >= DATE_TRUNC('month', $2::date) - INTERVAL '${monthsLookback} months'
          AND expense_date < DATE_TRUNC('month', $2::date)
        GROUP BY category, DATE_TRUNC('month', expense_date)
      ),
      category_baseline AS (
        SELECT
          category,
          ROUND(AVG(total_amount)::numeric, 2) AS avg_monthly_spend,
          MAX(total_amount) AS peak_spend
        FROM historical_expenses
        GROUP BY category
      ),
      current_budget AS (
        SELECT
          category,
          planned_amount
        FROM budgets
        WHERE user_id = $1
          AND DATE_TRUNC('month', month) = DATE_TRUNC('month', $2::date)
      )
      SELECT
        cb.category,
        cb.avg_monthly_spend,
        cb.peak_spend,
        COALESCE(b.planned_amount, 0) AS planned_amount,
        ROUND(cb.avg_monthly_spend - COALESCE(b.planned_amount, 0), 2) AS suggested_delta,
        CASE
          WHEN cb.avg_monthly_spend = 0 THEN 'estable'
          WHEN COALESCE(b.planned_amount, 0) = 0 THEN 'nuevo'
          WHEN COALESCE(b.planned_amount, 0) < cb.avg_monthly_spend THEN 'incrementar'
          WHEN COALESCE(b.planned_amount, 0) - cb.avg_monthly_spend > cb.avg_monthly_spend * 0.2 THEN 'optimizar'
          ELSE 'estable'
        END AS recommendation
      FROM category_baseline cb
      LEFT JOIN current_budget b ON b.category = cb.category
      ORDER BY cb.avg_monthly_spend DESC
    `;

    const result = await query(sql, [userId, `${monthIso}-01`]);
    return result.rows;
  }

  static async createOrUpdate(userId, payload) {
    const {
      category,
      month,
      plannedAmount,
      notes,
    } = payload;

    const monthIso = Budget.normalizeMonth(month);

    const sql = `
      INSERT INTO budgets (user_id, category, month, planned_amount, notes)
      VALUES ($1, $2, DATE_TRUNC('month', $3::date), $4, $5)
      ON CONFLICT (user_id, category, month)
      DO UPDATE SET
        planned_amount = EXCLUDED.planned_amount,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await query(sql, [
      userId,
      category,
      `${monthIso}-01`,
      plannedAmount,
      notes || null,
    ]);

    return result.rows[0];
  }

  static async update(userId, id, payload) {
    const fields = [];
    const values = [];
    let index = 1;

    if (payload.category) {
      fields.push(`category = $${index}`);
      values.push(payload.category);
      index += 1;
    }

    if (payload.month) {
      fields.push(`month = DATE_TRUNC('month', $${index}::date)`);
      values.push(`${Budget.normalizeMonth(payload.month)}-01`);
      index += 1;
    }

    if (payload.plannedAmount !== undefined) {
      fields.push(`planned_amount = $${index}`);
      values.push(payload.plannedAmount);
      index += 1;
    }

    if (payload.notes !== undefined) {
      fields.push(`notes = $${index}`);
      values.push(payload.notes || null);
      index += 1;
    }

    if (!fields.length) {
      throw new Error('No valid fields to update');
    }

    values.push(userId, id);

    const sql = `
      UPDATE budgets
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE user_id = $${index} AND id = $${index + 1}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(userId, id) {
    const sql = `
      DELETE FROM budgets
      WHERE user_id = $1 AND id = $2
      RETURNING id
    `;
    const result = await query(sql, [userId, id]);
    return result.rows[0];
  }
}

module.exports = Budget;

