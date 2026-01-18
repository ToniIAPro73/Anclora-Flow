import { BaseRepository } from './base.repository.js';
import { IBankAccount, IBankAccountCreate, IBankAccountUpdate } from '../types/bank-account.js';

export class BankAccountRepository extends BaseRepository<IBankAccount> {
  protected tableName = 'bank_accounts';

  async create(userId: string, accountData: IBankAccountCreate): Promise<IBankAccount> {
    return this.withTransaction(async (client) => {
      const {
        bankName, accountHolder, iban, bic,
        accountType = 'business', currency = 'EUR',
        isDefault = false, notes
      } = accountData;

      // If this is set as default, unset other defaults first
      if (isDefault) {
        await client.query(
          'UPDATE bank_accounts SET is_default = false WHERE user_id = $1',
          [userId]
        );
      }

      const sql = `
        INSERT INTO bank_accounts (
          user_id, bank_name, account_holder, iban, bic,
          account_type, currency, is_default, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await client.query(sql, [
        userId, bankName, accountHolder, iban, bic,
        accountType, currency, isDefault, notes
      ]);

      return this.mapToCamel(result.rows[0]);
    });
  }

  async findById(id: string, userId: string): Promise<IBankAccount | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1 AND user_id = $2`;
    const result = await this.executeQuery(sql, [id, userId]);
    return result.rows[0] ? this.mapToCamel(result.rows[0]) : null;
  }

  async findAllByUser(userId: string, activeOnly: boolean = false): Promise<IBankAccount[]> {
    let sql = `SELECT * FROM ${this.tableName} WHERE user_id = $1`;
    
    if (activeOnly) {
      sql += ' AND is_active = true';
    }

    sql += ' ORDER BY is_default DESC, created_at DESC';

    const result = await this.executeQuery(sql, [userId]);
    return this.mapRows(result.rows);
  }

  async findDefault(userId: string): Promise<IBankAccount | null> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1 AND is_default = true AND is_active = true
      LIMIT 1
    `;

    const result = await this.executeQuery(sql, [userId]);
    return result.rows[0] ? this.mapToCamel(result.rows[0]) : null;
  }

  async update(id: string, userId: string, updates: IBankAccountUpdate): Promise<IBankAccount | null> {
    const allowedFields: Record<string, string> = {
      bankName: 'bank_name',
      accountHolder: 'account_holder',
      iban: 'iban',
      bic: 'bic',
      accountType: 'account_type',
      currency: 'currency',
      isDefault: 'is_default',
      isActive: 'is_active',
      notes: 'notes'
    };

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      const column = allowedFields[key];
      if (column) {
        fields.push(`${column} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return this.findById(id, userId);

    values.push(id, userId);
    const sql = `
      UPDATE ${this.tableName}
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await this.executeQuery(sql, values);
    return result.rows[0] ? this.mapToCamel(result.rows[0]) : null;
  }

  async setAsDefault(id: string, userId: string): Promise<IBankAccount | null> {
    return this.withTransaction(async (client) => {
      // Unset all defaults for this user
      await client.query(
        'UPDATE bank_accounts SET is_default = false WHERE user_id = $1',
        [userId]
      );

      // Set this one as default
      const result = await client.query(
        `UPDATE bank_accounts
         SET is_default = true
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, userId]
      );

      return result.rows[0] ? this.mapToCamel(result.rows[0]) : null;
    });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const sql = `
      DELETE FROM ${this.tableName}
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await this.executeQuery(sql, [id, userId]);
    return result.rowCount > 0;
  }
}

export const bankAccountRepository = new BankAccountRepository();
