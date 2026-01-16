import { BaseRepository } from './base.repository.js';
import { IUser } from '../types/user.js';

export class UserRepository extends BaseRepository<IUser> {
  protected tableName = 'users';

  async findByEmail(email: string): Promise<any | null> {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await this.executeQuery(sql, [email]);
    return result.rows[0] || null;
  }

  async findByAuthProvider(provider: string, providerId: string): Promise<any | null> {
    const sql = 'SELECT * FROM users WHERE auth_provider = $1 AND auth_provider_id = $2';
    const result = await this.executeQuery(sql, [provider, providerId]);
    return result.rows[0] || null;
  }

  async update(id: string, updates: any): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      // Map camelsCase to snake_case if necessary, or assume allowedFields
      // For now, simple implementation
      fields.push(`${this.toSnakeCase(key)} = $${paramCount}`);
      values.push(value);
      paramCount++;
    });

    if (fields.length === 0) return null;

    values.push(id);
    const sql = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.executeQuery(sql, values);
    return result.rows[0];
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

export const userRepository = new UserRepository();
