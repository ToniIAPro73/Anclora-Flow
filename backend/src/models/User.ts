import bcrypt from 'bcrypt';
import { query } from '../database/config.js';
import { IUser, IUserCreate, IUserUpdate } from '../types/user.js';
import { userRepository } from '../repositories/user.repository.js';

class User {
  static mapDisplayName({ name, firstName, lastName, email }: { name?: string; firstName?: string; lastName?: string; email: string }): string {
    if (name && name.trim()) return name.trim();
    const parts = [firstName, lastName].filter(Boolean).map(v => v!.trim());
    return parts.length ? parts.join(' ') : email;
  }

  static shapeRow(row: any): IUser | null {
    if (!row) return null;
    // Repository now returns camelCase, but ensure we return a clean IUser object
    return row as IUser;
  }

  static async create(userData: IUserCreate): Promise<IUser | null> {
    const {
      email, name, firstName, lastName, company, phone,
      password, authProvider = 'local', authProviderId, avatarUrl,
      language = 'es', theme = 'light', emailVerifiedAt = null,
      verificationToken = null, verificationSentAt = null,
    } = userData;

    let passwordHash: string | null = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const displayName = User.mapDisplayName({
      name, firstName, lastName, email,
    });

    const sql = `
      INSERT INTO users (
        email, name, first_name, last_name, company, phone,
        password_hash, auth_provider, auth_provider_id, avatar_url,
        language, theme, email_verified_at, verification_token, verification_sent_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const result = await query(sql, [
      email, displayName, firstName || null, lastName || null, company || null, phone || null,
      passwordHash, authProvider, authProviderId || null, avatarUrl || null,
      language, theme, emailVerifiedAt, verificationToken, verificationSentAt,
    ]);

    // Manual mapping for the raw query result in create
    const row = result.rows[0];
    return {
      ...row,
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
      passwordResetToken: row.password_reset_token,
      passwordResetExpires: row.password_reset_expires,
      verificationToken: row.verification_token,
      verificationSentAt: row.verification_sent_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLogin: row.last_login,
    } as IUser;
  }

  static async findById(id: string, options: { raw?: boolean } = {}): Promise<any | IUser | null> {
    const row = await userRepository.findById(id, true);
    if (!row) return null;
    return options.raw ? row : (row as IUser);
  }

  static async findByEmail(email: string): Promise<any | null> {
    return userRepository.findByEmail(email, true);
  }

  static async findByVerificationToken(token: string): Promise<any | null> {
    return userRepository.findByVerificationToken(token);
  }

  static async findByPasswordResetToken(token: string): Promise<any | null> {
    return userRepository.findByPasswordResetToken(token);
  }

  static async findByAuthProvider(provider: string, providerId: string): Promise<any | null> {
    return userRepository.findByAuthProvider(provider, providerId);
  }

  static async update(id: string, updates: IUserUpdate): Promise<IUser | null> {
    const row = await userRepository.update(id, updates);
    return row as IUser | null;
  }

  static async updateLastLogin(id: string): Promise<void> {
    await userRepository.updateLastLogin(id);
  }

  static async verifyPassword(password: string, passwordHash: string | null): Promise<boolean> {
    if (!passwordHash) return false;
    return bcrypt.compare(password, passwordHash);
  }

  static async updatePassword(id: string, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 10);
    await userRepository.updatePassword(id, passwordHash);
  }

  static async setVerificationToken(id: string, token: string): Promise<void> {
    await userRepository.setVerificationToken(id, token);
  }

  static async markEmailVerified(id: string): Promise<void> {
    await userRepository.markEmailVerified(id);
  }

  static async setPasswordResetToken(id: string, token: string, expiresAt: Date): Promise<void> {
    await userRepository.setPasswordResetToken(id, token, expiresAt);
  }

  static async clearPasswordResetToken(id: string): Promise<void> {
    await userRepository.clearPasswordResetToken(id);
  }

  static async setAuthProvider(id: string, provider: string, providerId: string): Promise<void> {
    await userRepository.setAuthProvider(id, provider, providerId);
  }

  static async delete(id: string): Promise<{ id: string } | null> {
    const deleted = await userRepository.delete(id);
    return deleted ? { id } : null;
  }

  static async findAll(): Promise<(IUser | null)[]> {
    const sql = `SELECT * FROM users ORDER BY created_at DESC`;
    const result = await query(sql);
    // Manual mapping for internal raw query
    return result.rows.map(row => ({
      ...row,
      firstName: row.first_name,
      lastName: row.last_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    } as IUser));
  }
}

export default User;
