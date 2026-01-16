import bcrypt from 'bcrypt';
import { query } from '../database/config.js';
import { IUser, IUserCreate, IUserUpdate } from '../types/user.js';

const USER_FIELDS = `
  id,
  email,
  name,
  first_name,
  last_name,
  company,
  phone,
  avatar_url,
  auth_provider,
  auth_provider_id,
  language,
  theme,
  email_verified_at,
  created_at,
  updated_at,
  last_login
`;

class User {
  static mapDisplayName({ name, firstName, lastName, email }: { name?: string; firstName?: string; lastName?: string; email: string }): string {
    if (name && name.trim()) {
      return name.trim();
    }

    const parts = [firstName, lastName]
      .filter((v): v is string => Boolean(v))
      .map((value) => value.trim())
      .filter(Boolean);

    if (parts.length) {
      return parts.join(' ');
    }

    return email;
  }

  static shapeRow(row: any): IUser | null {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      firstName: row.first_name,
      lastName: row.last_name,
      company: row.company,
      phone: row.phone,
      avatarUrl: row.avatar_url,
      authProvider: row.auth_provider,
      authProviderId: row.auth_provider_id,
      language: row.language,
      theme: row.theme,
      emailVerifiedAt: row.email_verified_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLogin: row.last_login,
    };
  }

  static async create(userData: IUserCreate): Promise<IUser | null> {
    const {
      email,
      name,
      firstName,
      lastName,
      company,
      phone,
      password,
      authProvider = 'local',
      authProviderId,
      avatarUrl,
      language = 'es',
      theme = 'light',
      emailVerifiedAt = null,
      verificationToken = null,
      verificationSentAt = null,
    } = userData;

    let passwordHash: string | null = null;

    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const displayName = User.mapDisplayName({
      name,
      firstName,
      lastName,
      email,
    });

    const sql = `
      INSERT INTO users (
        email,
        name,
        first_name,
        last_name,
        company,
        phone,
        password_hash,
        auth_provider,
        auth_provider_id,
        avatar_url,
        language,
        theme,
        email_verified_at,
        verification_token,
        verification_sent_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15
      )
      RETURNING ${USER_FIELDS}
    `;

    const result = await query(sql, [
      email,
      displayName,
      firstName || null,
      lastName || null,
      company || null,
      phone || null,
      passwordHash,
      authProvider,
      authProviderId || null,
      avatarUrl || null,
      language,
      theme,
      emailVerifiedAt,
      verificationToken,
      verificationSentAt,
    ]);

    return User.shapeRow(result.rows[0]);
  }

  static async findById(id: string, { raw = false } = {}): Promise<any | IUser | null> {
    const sql = `SELECT * FROM users WHERE id = $1`;
    const result = await query(sql, [id]);
    const row = result.rows[0];
    if (raw) {
      return row;
    }
    return User.shapeRow(row);
  }

  static async findByEmail(email: string): Promise<any | null> {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows[0];
  }

  static async findByVerificationToken(token: string): Promise<any | null> {
    const sql = 'SELECT * FROM users WHERE verification_token = $1';
    const result = await query(sql, [token]);
    return result.rows[0];
  }

  static async findByPasswordResetToken(token: string): Promise<any | null> {
    const sql = 'SELECT * FROM users WHERE password_reset_token = $1';
    const result = await query(sql, [token]);
    return result.rows[0];
  }

  static async findByAuthProvider(provider: string, providerId: string): Promise<any | null> {
    const sql = 'SELECT * FROM users WHERE auth_provider = $1 AND auth_provider_id = $2';
    const result = await query(sql, [provider, providerId]);
    return result.rows[0];
  }

  static async update(id: string, updates: IUserUpdate): Promise<IUser | null> {
    const allowed: Record<string, string> = {
      email: 'email',
      name: 'name',
      firstName: 'first_name',
      lastName: 'last_name',
      company: 'company',
      phone: 'phone',
      avatarUrl: 'avatar_url',
      language: 'language',
      theme: 'theme',
    };

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      const column = allowed[key];
      if (!column) {
        return;
      }

      fields.push(`${column} = $${paramCount}`);
      values.push(value);
      paramCount += 1;
    });

    if (!fields.length) {
      throw new Error('No valid fields to update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    values.push(id);
    const sql = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING ${USER_FIELDS}
    `;

    const result = await query(sql, values);
    return User.shapeRow(result.rows[0]);
  }

  static async updateLastLogin(id: string): Promise<void> {
    const sql = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await query(sql, [id]);
  }

  static async verifyPassword(password: string, passwordHash: string | null): Promise<boolean> {
    if (!passwordHash) {
      return false;
    }
    return bcrypt.compare(password, passwordHash);
  }

  static async updatePassword(id: string, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 10);
    const sql = `
      UPDATE users
      SET password_hash = $2,
          password_reset_token = NULL,
          password_reset_expires_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await query(sql, [id, passwordHash]);
  }

  static async setVerificationToken(id: string, token: string): Promise<void> {
    const sql = `
      UPDATE users
      SET verification_token = $2,
          verification_sent_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await query(sql, [id, token]);
  }

  static async markEmailVerified(id: string): Promise<void> {
    const sql = `
      UPDATE users
      SET email_verified_at = CURRENT_TIMESTAMP,
          verification_token = NULL,
          verification_sent_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await query(sql, [id]);
  }

  static async setPasswordResetToken(id: string, token: string, expiresAt: Date): Promise<void> {
    const sql = `
      UPDATE users
      SET password_reset_token = $2,
          password_reset_expires_at = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await query(sql, [id, token, expiresAt]);
  }

  static async clearPasswordResetToken(id: string): Promise<void> {
    const sql = `
      UPDATE users
      SET password_reset_token = NULL,
          password_reset_expires_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await query(sql, [id]);
  }

  static async setAuthProvider(id: string, provider: string, providerId: string): Promise<void> {
    const sql = `
      UPDATE users
      SET auth_provider = $2,
          auth_provider_id = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await query(sql, [id, provider, providerId]);
  }

  static async delete(id: string): Promise<{ id: string } | null> {
    const sql = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findAll(): Promise<(IUser | null)[]> {
    const sql = `
      SELECT ${USER_FIELDS}
      FROM users
      ORDER BY created_at DESC
    `;
    const result = await query(sql);
    return result.rows.map(User.shapeRow);
  }
}

export default User;
