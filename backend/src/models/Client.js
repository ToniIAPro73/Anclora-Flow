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
    let sql = 'SELECT * FROM clients WHERE user_id = $1';
    const params = [userId];
    let paramCount = 2;

    // Apply filters
    if (filters.isActive !== undefined) {
      sql += ` AND is_active = $${paramCount}`;
      params.push(filters.isActive);
      paramCount++;
    }

    if (filters.search) {
      sql += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR nif_cif ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    sql += ' ORDER BY name ASC';

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
}

module.exports = Client;
