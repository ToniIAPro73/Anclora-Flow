import { BaseRepository } from './base.repository.js';
import { IUser, IUserUpdate } from '../types/user.js';

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

export class UserRepository extends BaseRepository<IUser> {
  protected tableName = 'users';

  async findByEmail(email: string, includePassword = false): Promise<any | null> {
    const sql = `SELECT ${USER_FIELDS}${includePassword ? ', password_hash' : ''} FROM users WHERE email = $1`;
    const result = await this.executeQuery(sql, [email]);
    return this.mapToCamel(result.rows[0]);
  }

  async findByAuthProvider(provider: string, providerId: string): Promise<any | null> {
    const sql = `SELECT ${USER_FIELDS} FROM users WHERE auth_provider = $1 AND auth_provider_id = $2`;
    const result = await this.executeQuery(sql, [provider, providerId]);
    return this.mapToCamel(result.rows[0]);
  }

  async findById(id: string, includePassword = false): Promise<any | null> {
    const sql = `SELECT ${USER_FIELDS}${includePassword ? ', password_hash' : ''} FROM users WHERE id = $1`;
    const result = await this.executeQuery(sql, [id]);
    return this.mapToCamel(result.rows[0]);
  }

  async findByVerificationToken(token: string): Promise<any | null> {
    const sql = `SELECT * FROM users WHERE verification_token = $1`;
    const result = await this.executeQuery(sql, [token]);
    return this.mapToCamel(result.rows[0]);
  }

  async findByPasswordResetToken(token: string): Promise<any | null> {
    const sql = `SELECT * FROM users WHERE password_reset_token = $1`;
    const result = await this.executeQuery(sql, [token]);
    return this.mapToCamel(result.rows[0]);
  }

  async update(id: string, updates: IUserUpdate): Promise<any> {
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
      if (!column) return;

      fields.push(`${column} = $${paramCount}`);
      values.push(value);
      paramCount += 1;
    });

    if (!fields.length) return null;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const sql = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING ${USER_FIELDS}
    `;

    const result = await this.executeQuery(sql, values);
    return this.mapToCamel(result.rows[0]);
  }

  async updateLastLogin(id: string): Promise<void> {
    const sql = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.executeQuery(sql, [id]);
  }

  async setVerificationToken(id: string, token: string): Promise<void> {
    const sql = `
      UPDATE users
      SET verification_token = $2,
          verification_sent_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.executeQuery(sql, [id, token]);
  }

  async markEmailVerified(id: string): Promise<void> {
    const sql = `
      UPDATE users
      SET email_verified_at = CURRENT_TIMESTAMP,
          verification_token = NULL,
          verification_sent_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.executeQuery(sql, [id]);
  }

  async setPasswordResetToken(id: string, token: string, expiresAt: Date): Promise<void> {
    const sql = `
      UPDATE users
      SET password_reset_token = $2,
          password_reset_expires_at = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.executeQuery(sql, [id, token, expiresAt]);
  }

  async clearPasswordResetToken(id: string): Promise<void> {
    const sql = `
      UPDATE users
      SET password_reset_token = NULL,
          password_reset_expires_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.executeQuery(sql, [id]);
  }

  async setAuthProvider(id: string, provider: string, providerId: string): Promise<void> {
    const sql = `
      UPDATE users
      SET auth_provider = $2,
          auth_provider_id = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.executeQuery(sql, [id, provider, providerId]);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const sql = `
      UPDATE users
      SET password_hash = $2,
          password_reset_token = NULL,
          password_reset_expires_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await this.executeQuery(sql, [id, passwordHash]);
  }
}

export const userRepository = new UserRepository();
