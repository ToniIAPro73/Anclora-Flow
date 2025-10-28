const { query } = require('../database/config');

class Client {
  // Create a new client
  static async create(userId, clientData) {
    const {
      name,
      email,
      phone,
      nifCif,
      address,
      city,
      postalCode,
      country = 'España',
      notes,
      isActive = true
    } = clientData;

    const sql = `
      INSERT INTO clients (user_id, name, email, phone, nif_cif, address, city, postal_code, country, notes, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await query(sql, [
      userId,
      name,
      email,
      phone,
      nifCif,
      address,
      city,
      postalCode,
      country,
      notes,
      isActive
    ]);

    return result.rows[0];
  }

  // Find client by ID
  static async findById(id, userId) {
    const sql = 'SELECT * FROM clients WHERE id = $1 AND user_id = $2';
    const result = await query(sql, [id, userId]);
    return result.rows[0];
  }

  // Get all clients for a user
  static async findAllByUser(userId, filters = {}) {
    let sql = `
      SELECT
        c.*,
        COALESCE(p.project_count, 0) AS projects_count,
        COALESCE(s.subscription_count, 0) AS subscriptions_count,
        COALESCE(inv.invoice_count, 0) AS invoice_count,
        COALESCE(inv.total_invoiced, 0) AS total_invoiced,
        COALESCE(inv.total_pending, 0) AS total_pending
      FROM clients c
      LEFT JOIN (
        SELECT client_id, COUNT(*) AS project_count
        FROM projects
        GROUP BY client_id
      ) p ON p.client_id = c.id
      LEFT JOIN (
        SELECT client_id, COUNT(*) AS subscription_count
        FROM subscriptions
        GROUP BY client_id
      ) s ON s.client_id = c.id
      LEFT JOIN (
        SELECT
          client_id,
          COUNT(*) AS invoice_count,
          COALESCE(SUM(total), 0) AS total_invoiced,
          COALESCE(SUM(CASE WHEN status != 'paid' THEN total ELSE 0 END), 0) AS total_pending
        FROM invoices
        WHERE user_id = $1
        GROUP BY client_id
      ) inv ON inv.client_id = c.id
      WHERE c.user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (filters.isActive !== undefined) {
      sql += ` AND c.is_active = $${paramIndex}`;
      params.push(filters.isActive);
      paramIndex += 1;
    }

    if (filters.search) {
      sql += ` AND (c.name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex} OR c.nif_cif ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex += 1;
    }

    sql += `
      ORDER BY c.name ASC
    `;

    const result = await query(sql, params);
    return result.rows;
  }

  // Update client
  static async update(id, userId, updates) {
    const allowedFields = [
      'name',
      'email',
      'phone',
      'nif_cif',
      'address',
      'city',
      'postal_code',
      'country',
      'notes',
      'is_active'
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
      UPDATE clients
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Delete client
  static async delete(id, userId) {
    const sql = 'DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await query(sql, [id, userId]);
    return result.rows[0];
  }

  // Get client statistics
  static async getStatistics(userId, clientId) {
    const sql = `
      SELECT
        COUNT(i.id) as total_invoices,
        COALESCE(SUM(i.total), 0) as total_billed,
        COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN i.status != 'paid' THEN i.total ELSE 0 END), 0) as total_pending
      FROM invoices i
      WHERE i.user_id = $1 AND i.client_id = $2
    `;

    const result = await query(sql, [userId, clientId]);
    return result.rows[0];
  }

  // Get top clients by billing
  static async getTopClients(userId, limit = 5) {
    const sql = `
      SELECT
        c.id,
        c.name,
        c.email,
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
    return result.rows;
  }

  static async getSummary(userId) {
    const sql = `
      WITH base AS (
        SELECT *
        FROM clients
        WHERE user_id = $1
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
    return result.rows[0] || null;
  }

  static async getRecent(userId, limit = 6) {
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
    return result.rows;
  }

  static async getProjects(userId, clientId) {
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
    return result.rows;
  }

  static async getSubscriptions(userId, clientId) {
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

  static async getRevenueTrend(userId, months = 6) {
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
    return result.rows;
  }
}

module.exports = Client;
