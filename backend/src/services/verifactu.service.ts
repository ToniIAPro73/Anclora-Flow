import crypto from 'crypto';
import { query, transaction } from '../database/config.js';
import { 
  IVerifactuConfig, 
  IVerifactuLog, 
  IVerifactuResponse, 
  IVerifactuChainVerification 
} from '../types/verifactu.js';
import { PoolClient } from 'pg';

/**
 * Servicio de integración con Verifactu (AEAT)
 */
class VerifactuService {
  /**
   * Registrar una factura en Verifactu
   */
  static async registerInvoice(invoiceId: string, userId: string): Promise<any> {
    try {
      return await transaction(async (client: PoolClient) => {
        // 1. Obtener configuración del usuario
        const configResult = await client.query(
          'SELECT * FROM verifactu_config WHERE user_id = $1',
          [userId]
        );

        if (!configResult.rows[0] || !configResult.rows[0].enabled) {
          throw new Error('Verifactu no está habilitado para este usuario');
        }

        const config = configResult.rows[0];

        // 2. Obtener la factura
        const invoiceResult = await client.query(
          'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
          [invoiceId, userId]
        );

        if (!invoiceResult.rows[0]) {
          throw new Error('Factura no encontrada');
        }

        const invoice = invoiceResult.rows[0];

        // 3. Verificar que no esté ya registrada
        if (invoice.verifactu_status === 'registered') {
          throw new Error('La factura ya está registrada en Verifactu');
        }

        // 4. Obtener el hash de la factura anterior
        const previousHash = config.last_chain_hash || this.generateGenesisHash(userId);
        const chainIndex = config.last_chain_index + 1;

        // 5. Generar hash de la factura actual
        const invoiceHash = this.generateInvoiceHash(invoice, previousHash, chainIndex);

        // 6. Generar firma electrónica (simulada en modo test)
        const signature = await this.signInvoice(invoice, config);

        // 7. Generar código QR
        const qrCode = this.generateQRCode(invoice, invoiceHash);

        // 8. Generar CSV (Código Seguro de Verificación)
        const csv = this.generateCSV(invoice, invoiceHash);

        // 9. Preparar datos para enviar a la AEAT
        const verifactuData = {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          issueDate: invoice.issue_date,
          total: invoice.total,
          hash: invoiceHash,
          previousHash: previousHash,
          chainIndex: chainIndex,
          signature: signature,
          softwareNIF: config.software_nif || 'B12345678',
          softwareName: config.software_name || 'Anclora Flow',
          softwareVersion: config.software_version || '1.0.0',
          operationType: invoice.operation_type || 'national',
          operationCode: invoice.verifactu_operation_code || '01',
          vatExemptionReason: invoice.vat_exemption_reason || null,
          reverseCharge: invoice.reverse_charge || false,
          clientVatNumber: invoice.client_vat_number || null,
          destinationCountry: invoice.destination_country_code || 'ES',
          goodsOrServices: invoice.goods_or_services || 'services',
        };

        // 10. Enviar a la AEAT (simulado en modo test)
        let verifactuResponse: any;
        if (config.test_mode) {
          verifactuResponse = await this.sendToAEATTest(verifactuData);
        } else {
          verifactuResponse = await this.sendToAEATProduction(verifactuData, config);
        }

        // 11. Actualizar la factura con los datos de Verifactu
        await client.query(
          `UPDATE invoices SET
            verifactu_enabled = true,
            verifactu_status = $1,
            verifactu_id = $2,
            verifactu_csv = $3,
            verifactu_qr_code = $4,
            verifactu_signature = $5,
            verifactu_hash = $6,
            verifactu_previous_hash = $7,
            verifactu_chain_index = $8,
            verifactu_registered_at = CURRENT_TIMESTAMP,
            verifactu_url = $9,
            verifactu_software_nif = $10,
            verifactu_software_name = $11,
            verifactu_software_version = $12
          WHERE id = $13`,
          [
            verifactuResponse.status,
            verifactuResponse.verifactuId,
            csv,
            qrCode,
            signature,
            invoiceHash,
            previousHash,
            chainIndex,
            verifactuResponse.url,
            config.software_nif || 'B12345678',
            config.software_name || 'Anclora Flow',
            config.software_version || '1.0.0',
            invoiceId
          ]
        );

        // 12. Actualizar la configuración con el nuevo índice y hash
        await client.query(
          `UPDATE verifactu_config SET
            last_chain_index = $1,
            last_chain_hash = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $3`,
          [chainIndex, invoiceHash, userId]
        );

        // 13. Registrar en logs
        await client.query(
          `INSERT INTO verifactu_logs (invoice_id, user_id, action, status, request_data, response_data)
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            invoiceId,
            userId,
            'register_attempt',
            'success',
            JSON.stringify(verifactuData),
            JSON.stringify(verifactuResponse)
          ]
        );

        return {
          success: true,
          verifactuId: verifactuResponse.verifactuId,
          csv: csv,
          qrCode: qrCode,
          url: verifactuResponse.url,
          hash: invoiceHash,
          chainIndex: chainIndex
        };
      });
    } catch (error: any) {
      console.error('Error registrando factura en Verifactu:', error);

      // Registrar error en logs
      await query(
        `INSERT INTO verifactu_logs (invoice_id, user_id, action, status, error_message)
        VALUES ($1, $2, $3, $4, $5)`,
        [invoiceId, userId, 'register_attempt', 'error', error.message]
      );

      // Actualizar factura con estado de error
      await query(
        `UPDATE invoices SET
          verifactu_status = 'error',
          verifactu_error_message = $1
        WHERE id = $2`,
        [error.message, invoiceId]
      );

      throw error;
    }
  }

  /**
   * Cancelar una factura en Verifactu
   */
  static async cancelInvoice(invoiceId: string, userId: string, reason: string): Promise<any> {
    try {
      return await transaction(async (client: PoolClient) => {
        // Obtener la factura
        const invoiceResult = await client.query(
          'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
          [invoiceId, userId]
        );

        if (!invoiceResult.rows[0]) {
          throw new Error('Factura no encontrada');
        }

        const invoice = invoiceResult.rows[0];

        if (invoice.verifactu_status !== 'registered') {
          throw new Error('La factura no está registrada en Verifactu');
        }

        // Obtener configuración
        const configResult = await client.query(
          'SELECT * FROM verifactu_config WHERE user_id = $1',
          [userId]
        );

        const config = configResult.rows[0];

        // Enviar cancelación a la AEAT
        const cancelData = {
          verifactuId: invoice.verifactu_id,
          invoiceNumber: invoice.invoice_number,
          reason: reason
        };

        let cancelResponse: any;
        if (config.test_mode) {
          cancelResponse = await this.cancelInAEATTest(cancelData);
        } else {
          cancelResponse = await this.cancelInAEATProduction(cancelData, config);
        }

        // Actualizar factura
        await client.query(
          `UPDATE invoices SET
            verifactu_status = 'cancelled',
            status = 'cancelled'
          WHERE id = $1`,
          [invoiceId]
        );

        // Registrar en logs
        await client.query(
          `INSERT INTO verifactu_logs (invoice_id, user_id, action, status, request_data, response_data)
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            invoiceId,
            userId,
            'cancel_attempt',
            'success',
            JSON.stringify(cancelData),
            JSON.stringify(cancelResponse)
          ]
        );

        return {
          success: true,
          message: 'Factura cancelada en Verifactu correctamente'
        };
      });
    } catch (error: any) {
      console.error('Error cancelando factura en Verifactu:', error);

      await query(
        `INSERT INTO verifactu_logs (invoice_id, user_id, action, status, error_message)
        VALUES ($1, $2, $3, $4, $5)`,
        [invoiceId, userId, 'cancel_attempt', 'error', error.message]
      );

      throw error;
    }
  }

  /**
   * Generar hash de la factura
   */
  static generateInvoiceHash(invoice: any, previousHash: string, chainIndex: number): string {
    const data = [
      invoice.invoice_number,
      invoice.issue_date,
      invoice.total.toString(),
      previousHash,
      chainIndex.toString(),
      invoice.user_id
    ].join('|');

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generar hash génesis para la primera factura
   */
  static generateGenesisHash(userId: string): string {
    return crypto.createHash('sha256').update(`GENESIS_${userId}`).digest('hex');
  }

  /**
   * Firmar factura (simulado en modo test)
   */
  static async signInvoice(invoice: any, config: any): Promise<string> {
    if (config.test_mode) {
      // Firma simulada para modo test
      const data = `${invoice.invoice_number}_${invoice.total}`;
      return crypto.createHash('sha256').update(data).digest('base64');
    } else {
      throw new Error('Firma electrónica en producción requiere certificado digital');
    }
  }

  /**
   * Generar código QR
   */
  static generateQRCode(invoice: any, hash: string): string {
    const verificationUrl = `https://sede.agenciatributaria.gob.es/verifactu?id=${hash}`;
    return `data:image/svg+xml;base64,${Buffer.from(`<svg>QR:${verificationUrl}</svg>`).toString('base64')}`;
  }

  /**
   * Generar CSV (Código Seguro de Verificación)
   */
  static generateCSV(invoice: any, hash: string): string {
    return hash.substring(0, 16).toUpperCase();
  }

  /**
   * Enviar a AEAT en modo test
   */
  static async sendToAEATTest(data: any): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'registered',
          verifactuId: `VTEST-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          url: `https://sede.agenciatributaria.gob.es/verifactu/test/${data.hash}`,
          timestamp: new Date().toISOString()
        });
      }, 1000);
    });
  }

  /**
   * Enviar a AEAT en modo producción
   */
  static async sendToAEATProduction(data: any, config: any): Promise<any> {
    throw new Error('Modo producción requiere certificado digital configurado');
  }

  /**
   * Cancelar en AEAT en modo test
   */
  static async cancelInAEATTest(data: any): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'cancelled',
          timestamp: new Date().toISOString()
        });
      }, 1000);
    });
  }

  /**
   * Cancelar en AEAT en modo producción
   */
  static async cancelInAEATProduction(data: any, config: any): Promise<any> {
    throw new Error('Modo producción requiere certificado digital configurado');
  }

  /**
   * Obtener configuración de Verifactu del usuario
   */
  static async getConfig(userId: string): Promise<IVerifactuConfig | null> {
    const result = await query(
      'SELECT * FROM verifactu_config WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      ...row,
      userId: row.user_id,
      autoRegister: row.auto_register,
      certificatePath: row.certificate_path,
      certificatePassword: row.certificate_password,
      softwareNif: row.software_nif,
      softwareName: row.software_name,
      softwareVersion: row.software_version,
      softwareLicense: row.software_license,
      testMode: row.test_mode,
      lastChainIndex: row.last_chain_index,
      lastChainHash: row.last_chain_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Actualizar configuración de Verifactu
   */
  static async updateConfig(userId: string, configData: any): Promise<IVerifactuConfig> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const allowedFields = [
      'enabled',
      'auto_register',
      'certificate_path',
      'certificate_password',
      'software_nif',
      'software_name',
      'software_version',
      'software_license',
      'test_mode'
    ];

    Object.keys(configData).forEach(key => {
      // Convert camelCase to snake_case if necessary (though the input seems to be snake_case based on route)
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(configData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }

    values.push(userId);

    const result = await query(
      `UPDATE verifactu_config
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $${paramCount}
       RETURNING *`,
      values
    );

    const row = result.rows[0];
    return {
      ...row,
      userId: row.user_id,
      autoRegister: row.auto_register,
      certificatePath: row.certificate_path,
      certificatePassword: row.certificate_password,
      softwareNif: row.software_nif,
      softwareName: row.software_name,
      softwareVersion: row.software_version,
      softwareLicense: row.software_license,
      testMode: row.test_mode,
      lastChainIndex: row.last_chain_index,
      lastChainHash: row.last_chain_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Obtener historial de logs de Verifactu
   */
  static async getLogs(userId: string, limit: number = 50): Promise<IVerifactuLog[]> {
    const result = await query(
      `SELECT vl.*, i.invoice_number
       FROM verifactu_logs vl
       LEFT JOIN invoices i ON vl.invoice_id = i.id
       WHERE vl.user_id = $1
       ORDER BY vl.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => ({
      ...row,
      invoiceId: row.invoice_id,
      userId: row.user_id,
      requestData: row.request_data,
      responseData: row.response_data,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      invoiceNumber: row.invoice_number
    }));
  }

  /**
   * Verificar integridad de la cadena de facturas
   */
  static async verifyChain(userId: string): Promise<IVerifactuChainVerification> {
    const invoices = await query(
      `SELECT id, invoice_number, verifactu_hash, verifactu_previous_hash, verifactu_chain_index
       FROM invoices
       WHERE user_id = $1 AND verifactu_status = 'registered'
       ORDER BY verifactu_chain_index ASC`,
      [userId]
    );

    const results = [];
    let valid = true;

    for (let i = 0; i < invoices.rows.length; i++) {
      const invoice = invoices.rows[i];
      const expected = i === 0
        ? this.generateGenesisHash(userId)
        : invoices.rows[i - 1].verifactu_hash;

      const isValid = invoice.verifactu_previous_hash === expected;

      if (!isValid) {
        valid = false;
      }

      results.push({
        invoiceNumber: invoice.invoice_number as string,
        chainIndex: parseInt(invoice.verifactu_chain_index),
        hash: invoice.verifactu_hash as string,
        previousHash: invoice.verifactu_previous_hash as string,
        expectedPreviousHash: expected as string,
        valid: isValid
      });
    }

    return {
      valid: valid,
      totalInvoices: invoices.rows.length,
      details: results
    };
  }
}

export default VerifactuService;
