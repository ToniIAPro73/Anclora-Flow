import { BaseRepository } from './base.repository.js';
import { IReceipt, IReceiptCreate, IReceiptUpdate } from '../types/receipt.js';

export class ReceiptRepository extends BaseRepository<IReceipt> {
  protected tableName = 'receipts';

  async create(userId: string, receiptData: IReceiptCreate, fileMetadata: any): Promise<IReceipt> {
    return this.withTransaction(async (client) => {
      const { receiptType, entityType, entityId, documentDate, vendorName, invoiceNumber, notes } = receiptData;
      const { fileName, fileSize, fileType, fileUrl, thumbnailUrl } = fileMetadata;

      const sql = `
        INSERT INTO receipts (
          user_id, receipt_type, entity_type, entity_id,
          file_name, file_size, file_type, file_url, thumbnail_url,
          document_date, vendor_name, invoice_number, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const result =await client.query(sql, [
        userId, receiptType, entityType, entityId,
        fileName, fileSize, fileType, fileUrl, thumbnailUrl,
        documentDate, vendorName, invoiceNumber, notes
      ]);

      const receipt = this.mapToCamel(result.rows[0]);

      // Log activity
      await client.query(
        `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'receipt_uploaded', 'receipt', receipt.id, `Justificante ${fileName} subido`]
      );

      return receipt;
    });
  }

  async findById(id: string, userId: string): Promise<IReceipt | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1 AND user_id = $2`;
    const result = await this.executeQuery(sql, [id, userId]);
    return result.rows[0] ? this.mapToCamel(result.rows[0]) : null;
  }

  async findByEntity(entityType: string, entityId: string, userId: string): Promise<IReceipt[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE entity_type = $1 AND entity_id = $2 AND user_id = $3
      ORDER BY created_at DESC
    `;

    const result = await this.executeQuery(sql, [entityType, entityId, userId]);
    return this.mapRows(result.rows);
  }

  async findAllByUser(userId: string, filters: any = {}): Promise<IReceipt[]> {
    let sql = `SELECT * FROM ${this.tableName} WHERE user_id = $1`;
    const params: any[] = [userId];
    let paramCount = 2;

    if (filters.receiptType) {
      sql += ` AND receipt_type = $${paramCount}`;
      params.push(filters.receiptType);
      paramCount++;
    }

    if (filters.entityType) {
      sql += ` AND entity_type = $${paramCount}`;
      params.push(filters.entityType);
      paramCount++;
    }

    if (filters.extractionStatus) {
      sql += ` AND extraction_status = $${paramCount}`;
      params.push(filters.extractionStatus);
      paramCount++;
    }

    sql += ' ORDER BY created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await this.executeQuery(sql, params);
    return this.mapRows(result.rows);
  }

  async update(id: string, userId: string, updates: IReceiptUpdate): Promise<IReceipt | null> {
    const allowedFields: Record<string, string> = {
      isVerified: 'is_verified',
      extractionStatus: 'extraction_status',
      extractedData: 'extracted_data',
      documentDate: 'document_date',
      vendorName: 'vendor_name',
      invoiceNumber: 'invoice_number',
      documentTotal: 'document_total',
      notes: 'notes'
    };

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      const column = allowedFields[key];
      if (column) {
        fields.push(`${column} = $${paramCount}`);
        // Special handling for JSONB field
        values.push(column === 'extracted_data' ? JSON.stringify(value) : value);
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

  async delete(id: string, userId: string): Promise<boolean> {
    const sql = `
      DELETE FROM ${this.tableName}
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await this.executeQuery(sql, [id, userId]);
    return result.rowCount > 0;
  }

  async deleteWithFileInfo(id: string, userId: string): Promise<{ id: string; fileUrl: string; thumbnailUrl?: string } | null> {
    const sql = `
      DELETE FROM ${this.tableName}
      WHERE id = $1 AND user_id = $2
      RETURNING id, file_url, thumbnail_url
    `;

    const result = await this.executeQuery(sql, [id, userId]);
    
    if (result.rowCount > 0) {
      const row = result.rows[0];
      return { 
        id: row.id, 
        fileUrl: row.file_url,
        thumbnailUrl: row.thumbnail_url
      };
    }

    return null;
  }

  async findPendingOCR(userId: string): Promise<IReceipt[]> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1 AND extraction_status = 'pending'
      ORDER BY created_at ASC
      LIMIT 50
    `;

    const result = await this.executeQuery(sql, [userId]);
    return this.mapRows(result.rows);
  }

  async updateExtractionStatus(
    id: string,
    userId: string,
    status: string,
    extractedData: any = null
  ): Promise<IReceipt | null> {
    const sql = `
      UPDATE ${this.tableName}
      SET extraction_status = $1, extracted_data = $2
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `;

    const result = await this.executeQuery(sql, [
      status,
      extractedData ? JSON.stringify(extractedData) : null,
      id,
      userId
    ]);

    return result.rows[0] ? this.mapToCamel(result.rows[0]) : null;
  }
}

export const receiptRepository = new ReceiptRepository();
