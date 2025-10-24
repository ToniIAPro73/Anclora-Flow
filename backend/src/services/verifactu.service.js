const crypto = require('crypto');
const { query, transaction } = require('../database/config');

/**
 * Servicio de integración con Verifactu (AEAT)
 *
 * Verifactu es el sistema de verificación de facturas de la Agencia Tributaria Española.
 * Implementa una cadena de bloques (blockchain) para las facturas, donde cada factura
 * contiene el hash de la factura anterior, creando una cadena inmutable.
 *
 * Referencias:
 * - https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI35.shtml
 * - Reglamento de facturación (Real Decreto 1619/2012)
 */

class VerifactuService {
  /**
   * Registrar una factura en Verifactu
   */
  static async registerInvoice(invoiceId, userId) {
    try {
      return await transaction(async (client) => {
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
        };

        // 10. Enviar a la AEAT (simulado en modo test)
        let verifactuResponse;
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
    } catch (error) {
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
  static async cancelInvoice(invoiceId, userId, reason) {
    try {
      return await transaction(async (client) => {
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

        let cancelResponse;
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
    } catch (error) {
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
  static generateInvoiceHash(invoice, previousHash, chainIndex) {
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
  static generateGenesisHash(userId) {
    return crypto.createHash('sha256').update(`GENESIS_${userId}`).digest('hex');
  }

  /**
   * Firmar factura (simulado en modo test)
   */
  static async signInvoice(invoice, config) {
    if (config.test_mode) {
      // Firma simulada para modo test
      const data = `${invoice.invoice_number}_${invoice.total}`;
      return crypto.createHash('sha256').update(data).digest('base64');
    } else {
      // En producción, aquí se usaría el certificado digital
      // const forge = require('node-forge');
      // Implementar firma con certificado X.509
      throw new Error('Firma electrónica en producción requiere certificado digital');
    }
  }

  /**
   * Generar código QR
   */
  static generateQRCode(invoice, hash) {
    // URL de verificación de la AEAT
    const verificationUrl = `https://sede.agenciatributaria.gob.es/verifactu?id=${hash}`;

    // En producción, se generaría un QR real con una librería como qrcode
    // const qrcode = require('qrcode');
    // return await qrcode.toDataURL(verificationUrl);

    return `data:image/svg+xml;base64,${Buffer.from(`<svg>QR:${verificationUrl}</svg>`).toString('base64')}`;
  }

  /**
   * Generar CSV (Código Seguro de Verificación)
   */
  static generateCSV(invoice, hash) {
    // El CSV es un código alfanumérico de 16 caracteres
    return hash.substring(0, 16).toUpperCase();
  }

  /**
   * Enviar a AEAT en modo test
   */
  static async sendToAEATTest(data) {
    // Simular respuesta de la AEAT en modo test
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
  static async sendToAEATProduction(data, config) {
    // En producción, se haría una petición SOAP/REST a la AEAT
    // usando el certificado digital del usuario

    // Ejemplo con axios:
    // const axios = require('axios');
    // const https = require('https');
    // const fs = require('fs');
    //
    // const agent = new https.Agent({
    //   cert: fs.readFileSync(config.certificate_path),
    //   key: fs.readFileSync(config.certificate_path),
    //   passphrase: config.certificate_password
    // });
    //
    // const response = await axios.post(
    //   'https://sede.agenciatributaria.gob.es/verifactu/api/v1/register',
    //   data,
    //   { httpsAgent: agent }
    // );

    throw new Error('Modo producción requiere certificado digital configurado');
  }

  /**
   * Cancelar en AEAT en modo test
   */
  static async cancelInAEATTest(data) {
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
  static async cancelInAEATProduction(data, config) {
    throw new Error('Modo producción requiere certificado digital configurado');
  }

  /**
   * Obtener configuración de Verifactu del usuario
   */
  static async getConfig(userId) {
    const result = await query(
      'SELECT * FROM verifactu_config WHERE user_id = $1',
      [userId]
    );

    return result.rows[0];
  }

  /**
   * Actualizar configuración de Verifactu
   */
  static async updateConfig(userId, configData) {
    const fields = [];
    const values = [];
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
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
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

    return result.rows[0];
  }

  /**
   * Obtener historial de logs de Verifactu
   */
  static async getLogs(userId, limit = 50) {
    const result = await query(
      `SELECT vl.*, i.invoice_number
       FROM verifactu_logs vl
       LEFT JOIN invoices i ON vl.invoice_id = i.id
       WHERE vl.user_id = $1
       ORDER BY vl.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  /**
   * Verificar integridad de la cadena de facturas
   */
  static async verifyChain(userId) {
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
        invoiceNumber: invoice.invoice_number,
        chainIndex: invoice.verifactu_chain_index,
        hash: invoice.verifactu_hash,
        previousHash: invoice.verifactu_previous_hash,
        expectedPreviousHash: expected,
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

module.exports = VerifactuService;
