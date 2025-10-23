const { query } = require('../database/config');
const bcrypt = require('bcrypt');

class User {
  // Create a new user
  static async create({ email, name, password, authProvider = 'local', authProviderId, avatarUrl, language = 'es', theme = 'light' }) {
    let passwordHash = null;

    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const sql = `
      INSERT INTO users (email, name, password_hash, auth_provider, auth_provider_id, avatar_url, language, theme)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, name, avatar_url, auth_provider, language, theme, created_at, updated_at
    `;

    const result = await query(sql, [email, name, passwordHash, authProvider, authProviderId, avatarUrl, language, theme]);
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const sql = 'SELECT id, email, name, avatar_url, auth_provider, language, theme, created_at, updated_at, last_login FROM users WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows[0];
  }

  // Find user by auth provider ID
  static async findByAuthProvider(provider, providerId) {
    const sql = 'SELECT * FROM users WHERE auth_provider = $1 AND auth_provider_id = $2';
    const result = await query(sql, [provider, providerId]);
    return result.rows[0];
  }

  // Update user
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (['email', 'name', 'avatar_url', 'language', 'theme'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const sql = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, name, avatar_url, auth_provider, language, theme, created_at, updated_at
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Update last login timestamp
  static async updateLastLogin(id) {
    const sql = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
    await query(sql, [id]);
  }

  // Verify password
  static async verifyPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }

  // Delete user
  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Get all users (admin only)
  static async findAll() {
    const sql = 'SELECT id, email, name, avatar_url, auth_provider, language, theme, created_at, updated_at FROM users ORDER BY created_at DESC';
    const result = await query(sql);
    return result.rows;
  }
}

module.exports = User;
