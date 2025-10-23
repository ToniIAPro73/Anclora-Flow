const { query, transaction } = require('../database/config');

class Invoice {
  // Create a new invoice with line items
  static async create(userId, invoiceData) {
    return await transaction(async (client) => {
      const {
        clientId,
        projectId,
        invoiceNumber,
        issueDate,
        dueDate,
        status = 'draft',
        subtotal,
        vatPercentage = 21.00,
        vatAmount,
        irpfPercentage = 15.00,
        irpfAmount,
        total,
        currency = 'EUR',
        notes,
        items = []
      } = invoiceData;

      // Insert invoice
      const invoiceSql = `
        INSERT INTO invoices (
          user_id, client_id, project_id, invoice_number, issue_date, due_date,
          status, subtotal, vat_percentage, vat_amount, irpf_percentage, irpf_amount,
          total, currency, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const invoiceResult = await client.query(invoiceSql, [
        userId,
        clientId,
        projectId,
        invoiceNumber,
        issueDate,
        dueDate,
        status,
        subtotal,
        vatPercentage,
        vatAmount,
        irpfPercentage,
        irpfAmount,
        total,
        currency,
        notes
      ]);

      const invoice = invoiceResult.rows[0];

      // Insert invoice items
      if (items.length > 0) {
        const itemsSql = `
          INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const itemPromises = items.map(item =>
          client.query(itemsSql, [
            invoice.id,
            item.description,
            item.quantity || 1,
            item.unitType || 'hours',
            item.unitPrice,
            item.vatPercentage || 21.00,
            item.amount
          ])
        );

        const itemResults = await Promise.all(itemPromises);
        invoice.items = itemResults.map(r => r.rows[0]);
      }

      // Log activity
      await client.query(
        `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'invoice_created', 'invoice', invoice.id, `Factura ${invoiceNumber} creada`]
      );

      return invoice;
    });
  }

  // Find invoice by ID with items
  static async findById(id, userId) {
    const invoiceSql = 'SELECT * FROM invoices WHERE id = $1 AND user_id = $2';
    const invoiceResult = await query(invoiceSql, [id, userId]);

    if (invoiceResult.rows.length === 0) {
      return null;
    }

    const invoice = invoiceResult.rows[0];

    // Get invoice items
    const itemsSql = 'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at';
    const itemsResult = await query(itemsSql, [id]);
    invoice.items = itemsResult.rows;

    // Get client info
    if (invoice.client_id) {
      const clientSql = 'SELECT * FROM clients WHERE id = $1';
      const clientResult = await query(clientSql, [invoice.client_id]);
      invoice.client = clientResult.rows[0];
    }

    return invoice;
  }

  // Get all invoices for a user with filters
  static async findAllByUser(userId, filters = {}) {
    let sql = `
      SELECT
        i.*,
        c.name as client_name,
        c.email as client_email,
        CASE
          WHEN i.status = 'paid' THEN 0
          WHEN i.due_date < CURRENT_DATE THEN CURRENT_DATE - i.due_date
          ELSE 0
        END as days_late
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = $1
    `;

    const params = [userId];
    let paramCount = 2;

    // Apply filters
    if (filters.status) {
      sql += ` AND i.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.clientId) {
      sql += ` AND i.client_id = $${paramCount}`;
      params.push(filters.clientId);
      paramCount++;
    }

    if (filters.search) {
      sql += ` AND (i.invoice_number ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    if (filters.dateFrom) {
      sql += ` AND i.issue_date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND i.issue_date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    sql += ' ORDER BY i.issue_date DESC, i.created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  // Update invoice
  static async update(id, userId, updates) {
    return await transaction(async (client) => {
      const allowedFields = [
        'client_id',
        'project_id',
        'invoice_number',
        'issue_date',
        'due_date',
        'status',
        'subtotal',
        'vat_percentage',
        'vat_amount',
        'irpf_percentage',
        'irpf_amount',
        'total',
        'notes',
        'payment_method',
        'payment_date'
      ];

      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (allowedFields.includes(snakeKey)) {
          fields.push(`${snakeKey} = $${paramCount}`);
          values.push(updates[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id, userId);
      const sql = `
        UPDATE invoices
        SET ${fields.join(', ')}
        WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
        RETURNING *
      `;

      const result = await client.query(sql, values);

      // Update items if provided
      if (updates.items) {
        // Delete existing items
        await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);

        // Insert new items
        if (updates.items.length > 0) {
          const itemsSql = `
            INSERT INTO invoice_items (invoice_id, description, quantity, unit_type, unit_price, vat_percentage, amount)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;

          for (const item of updates.items) {
            await client.query(itemsSql, [
              id,
              item.description,
              item.quantity || 1,
              item.unitType || 'hours',
              item.unitPrice,
              item.vatPercentage || 21.00,
              item.amount
            ]);
          }
        }
      }

      return result.rows[0];
    });
  }

  // Delete invoice
  static async delete(id, userId) {
    const sql = 'DELETE FROM invoices WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await query(sql, [id, userId]);
    return result.rows[0];
  }

  // Mark invoice as paid
  static async markAsPaid(id, userId, paymentData = {}) {
    return await transaction(async (client) => {
      const { paymentDate = new Date(), paymentMethod, amount } = paymentData;

      // Get invoice
      const invoiceResult = await client.query(
        'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = invoiceResult.rows[0];

      // Update invoice status
      const updateResult = await client.query(
        `UPDATE invoices
         SET status = 'paid', payment_date = $1, payment_method = $2
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [paymentDate, paymentMethod, id, userId]
      );

      // Record payment
      await client.query(
        `INSERT INTO payments (user_id, invoice_id, amount, payment_date, payment_method)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, id, amount || invoice.total, paymentDate, paymentMethod]
      );

      // Log activity
      await client.query(
        `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'payment_received', 'invoice', id, `Pago recibido para factura ${invoice.invoice_number}`]
      );

      return updateResult.rows[0];
    });
  }

  // Get invoice statistics
  static async getStatistics(userId, filters = {}) {
    let sql = `
      SELECT
        COUNT(*) as total_invoices,
        COALESCE(SUM(total), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN status != 'paid' AND status != 'cancelled' THEN total ELSE 0 END), 0) as pending_amount,
        COALESCE(AVG(CASE WHEN status = 'paid' THEN total END), 0) as average_invoice,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
      FROM invoices
      WHERE user_id = $1
    `;

    const params = [userId];
    let paramCount = 2;

    if (filters.dateFrom) {
      sql += ` AND issue_date >= $${paramCount}`;
      params.push(filters.dateFrom);
      paramCount++;
    }

    if (filters.dateTo) {
      sql += ` AND issue_date <= $${paramCount}`;
      params.push(filters.dateTo);
      paramCount++;
    }

    const result = await query(sql, params);
    return result.rows[0];
  }

  // Get monthly income data
  static async getMonthlyIncome(userId, months = 12) {
    const sql = `
      SELECT
        TO_CHAR(issue_date, 'YYYY-MM') as month,
        COUNT(*) as invoice_count,
        COALESCE(SUM(total), 0) as total_income
      FROM invoices
      WHERE user_id = $1
        AND issue_date >= CURRENT_DATE - INTERVAL '1 month' * $2
        AND status = 'paid'
      GROUP BY TO_CHAR(issue_date, 'YYYY-MM')
      ORDER BY month
    `;

    const result = await query(sql, [userId, months]);
    return result.rows;
  }

  // Check for overdue invoices and update status
  static async updateOverdueStatus(userId) {
    const sql = `
      UPDATE invoices
      SET status = 'overdue'
      WHERE user_id = $1
        AND status IN ('pending', 'sent')
        AND due_date < CURRENT_DATE
      RETURNING id, invoice_number
    `;

    const result = await query(sql, [userId]);
    return result.rows;
  }
}

module.exports = Invoice;
