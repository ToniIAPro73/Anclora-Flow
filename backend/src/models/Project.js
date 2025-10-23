const { query } = require('../database/config');

class Project {
  // Create a new project
  static async create(userId, projectData) {
    const {
      clientId,
      name,
      description,
      status = 'active',
      budget,
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

    return result.rows[0];
  }

  // Find project by ID
  static async findById(id, userId) {
    const sql = `
      SELECT
        p.*,
        c.name as client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = $1 AND p.user_id = $2
    `;

    const result = await query(sql, [id, userId]);
    return result.rows[0];
  }

  // Get all projects for a user with filters
  static async findAllByUser(userId, filters = {}) {
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

    const params = [userId];
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
    return result.rows;
  }

  // Update project
  static async update(id, userId, updates) {
    const allowedFields = [
      'client_id',
      'name',
      'description',
      'status',
      'budget',
      'start_date',
      'end_date',
      'color'
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
      UPDATE projects
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Delete project
  static async delete(id, userId) {
    const sql = 'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await query(sql, [id, userId]);
    return result.rows[0];
  }

  // Get project statistics
  static async getStatistics(userId, projectId) {
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
    return result.rows[0];
  }
}

module.exports = Project;
