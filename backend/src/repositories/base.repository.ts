import { query } from '../database/config.js';

export abstract class BaseRepository<T> {
  protected abstract tableName: string;

  protected async executeQuery(sql: string, params: any[] = []): Promise<any> {
    return query(sql, params);
  }

  async findById(id: string): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.executeQuery(sql, [id]);
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`;
    const result = await this.executeQuery(sql, [id]);
    return result.rowCount > 0;
  }

  protected mapRows(rows: any[]): T[] {
    return rows as T[];
  }
}
