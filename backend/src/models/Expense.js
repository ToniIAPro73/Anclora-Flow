const { query } = require('../database/config');

class Expense {
  // Create a new expense
  static async create(userId, expenseData) {
    const {
      projectId,
      category,
      subcategory,
      description,
      amount,
      vatAmount = 0,
      vatPercentage = 21.00,
      isDeductible = true,
      deductiblePercentage = 100.00,
      expenseDate,
      paymentMethod,
      vendor,
      receiptUrl,
      notes
    } = expenseData;

    const sql = `
      INSERT INTO expenses (
        user_id, project_id, category, subcategory, description, amount,
        vat_amount, vat_percentage, is_deductible, deductible_percentage,
        expense_date, payment_method, vendor, receipt_url, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const result = await query(sql, [
      userId,
      projectId,
      category,
      subcategory,
      description,
      amount,
      vatAmount,
      vatPercentage,
      isDeductible,
      deductiblePercentage,
      expenseDate,
      paymentMethod,
      vendor,
      receiptUrl,
      notes
    ]);

    // Log activity
    await query(
      `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'expense_added', 'expense', result.rows[0].id, `Gasto ${category} añadido: ${amount}€`]
    );

    return result.rows[0];
  }

  // Find expense by ID
  static async findById(id, userId) {
    const sql = `
      SELECT
        e.*,
        p.name as project_name
      FROM expenses e
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.id = $1 AND e.user_id = $2
    `;

    const result = await query(sql, [id, userId]);
    return result.rows[0];
  }

  // Get all expenses for a user with filters
  static async findAllByUser(userId, filters = {}) {
    let sql = `
      SELECT
        e.*,
        p.name as project_name
      FROM expenses e
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.user_id = $1
    `;

    const params = [userId];
    let paramCount = 2;

    // Apply filters
    if (filters.category) {
      sql += ` AND e.category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.isDeductible !== undefined) {
      sql += ` AND e.is_deductible = $${paramCount}`;
      params.push(filters.isDeductible);
      paramCount++;
    }

    if (filters.projectId) {
      sql += ` AND e.project_id = $${paramCount}`;
      params.push(filters.projectId);
      paramCount++;
    }

    if (filters.search) {
      sql += ` AND (e.description ILIKE $${paramCount} OR e.vendor ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    if (filters.dateFrom) {
      sql += ` AND e.expense_date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND e.expense_date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    if (filters.minAmount) {
      sql += ` AND e.amount >= $${paramCount}`;
      params.push(filters.minAmount);
      paramCount++;
    }

    if (filters.maxAmount) {
      sql += ` AND e.amount <= $${paramCount}`;
      params.push(filters.maxAmount);
      paramCount++;
    }

    sql += ' ORDER BY e.expense_date DESC, e.created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  // Update expense
  static async update(id, userId, updates) {
    const allowedFields = [
      'project_id',
      'category',
      'subcategory',
      'description',
      'amount',
      'vat_amount',
      'vat_percentage',
      'is_deductible',
      'deductible_percentage',
      'expense_date',
      'payment_method',
      'vendor',
      'receipt_url',
      'notes'
    ];

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id, userId);
    const sql = `
      UPDATE expenses
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Delete expense
  static async delete(id, userId) {
    const sql = 'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await query(sql, [id, userId]);
    return result.rows[0];
  }

  // Get expense statistics
  static async getStatistics(userId, filters = {}) {
    let sql = `
      SELECT
        COUNT(*) as total_expenses,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(vat_amount), 0) as total_vat,
        COALESCE(SUM(CASE WHEN is_deductible THEN amount * (deductible_percentage / 100) ELSE 0 END), 0) as deductible_amount,
        COALESCE(AVG(amount), 0) as average_expense
      FROM expenses
      WHERE user_id = $1
    `;

    const params = [userId];
    let paramCount = 2;

    if (filters.dateFrom) {
      sql += ` AND expense_date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND expense_date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    const result = await query(sql, params);
    return result.rows[0];
  }

  // Get expenses by category
  static async getByCategory(userId, filters = {}) {
    let sql = `
      SELECT
        category,
        COUNT(*) as expense_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as average_amount
      FROM expenses
      WHERE user_id = $1
    `;

    const params = [userId];
    let paramCount = 2;

    if (filters.dateFrom) {
      sql += ` AND expense_date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND expense_date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    sql += ' GROUP BY category ORDER BY total_amount DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  // Get monthly expenses
  static async getMonthlyExpenses(userId, months = 12) {
    const sql = `
      SELECT
        TO_CHAR(expense_date, 'YYYY-MM') as month,
        COUNT(*) as expense_count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM expenses
      WHERE user_id = $1
        AND expense_date >= CURRENT_DATE - INTERVAL '1 month' * $2
      GROUP BY TO_CHAR(expense_date, 'YYYY-MM')
      ORDER BY month
    `;

    const result = await query(sql, [userId, months]);
    return result.rows;
  }

  // Get top vendors
  static async getTopVendors(userId, limit = 10) {
    const sql = `
      SELECT
        vendor,
        COUNT(*) as expense_count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM expenses
      WHERE user_id = $1 AND vendor IS NOT NULL AND vendor != ''
      GROUP BY vendor
      ORDER BY total_amount DESC
      LIMIT $2
    `;

    const result = await query(sql, [userId, limit]);
    return result.rows;
  }
}

module.exports = Expense;
