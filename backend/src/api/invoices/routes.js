const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const Invoice = require('../../models/Invoice');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /api/invoices - Get all invoices with filters
router.get('/',
  [
    query('status').optional().isIn(['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled']),
    query('clientId').optional().isUUID(),
    query('search').optional().isString(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        clientId: req.query.clientId,
        search: req.query.search,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      };

      const invoices = await Invoice.findAllByUser(req.user.id, filters);
      res.json({ invoices, count: invoices.length });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: 'Error al obtener las facturas' });
    }
  }
);

// GET /api/invoices/statistics - Get invoice statistics
router.get('/statistics',
  [
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
  ],
  validate,
  async (req, res) => {
    try {
      const filters = {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const statistics = await Invoice.getStatistics(req.user.id, filters);
      res.json(statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ error: 'Error al obtener las estadísticas' });
    }
  }
);

// GET /api/invoices/monthly - Get monthly income data
router.get('/monthly',
  [
    query('months').optional().isInt({ min: 1, max: 24 })
  ],
  validate,
  async (req, res) => {
    try {
      const months = req.query.months ? parseInt(req.query.months) : 12;
      const monthlyData = await Invoice.getMonthlyIncome(req.user.id, months);
      res.json(monthlyData);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      res.status(500).json({ error: 'Error al obtener los datos mensuales' });
    }
  }
);

// GET /api/invoices/:id - Get invoice by ID
router.get('/:id',
  async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id, req.user.id);

      if (!invoice) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      res.json(invoice);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ error: 'Error al obtener la factura' });
    }
  }
);

// POST /api/invoices - Create new invoice
router.post('/',
  [
    body('clientId').optional().isUUID(),
    body('projectId').optional().isUUID(),
    body('invoiceNumber').notEmpty().isString(),
    body('issueDate').notEmpty().isISO8601(),
    body('dueDate').notEmpty().isISO8601(),
    body('status').optional().isIn(['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled']),
    body('subtotal').notEmpty().isFloat({ min: 0 }),
    body('vatPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('vatAmount').optional().isFloat({ min: 0 }),
    body('irpfPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('irpfAmount').optional().isFloat({ min: 0 }),
    body('total').notEmpty().isFloat({ min: 0 }),
    body('currency').optional().isString(),
    body('notes').optional().isString(),
    body('items').optional().isArray(),
    body('items.*.description').notEmpty().isString(),
    body('items.*.quantity').optional().isFloat({ min: 0 }),
    body('items.*.unitType').optional().isString(),
    body('items.*.unitPrice').notEmpty().isFloat({ min: 0 }),
    body('items.*.vatPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('items.*.amount').notEmpty().isFloat({ min: 0 })
  ],
  validate,
  async (req, res) => {
    try {
      const invoice = await Invoice.create(req.user.id, req.body);
      res.status(201).json(invoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'El número de factura ya existe' });
      }
      res.status(500).json({ error: 'Error al crear la factura' });
    }
  }
);

// PUT /api/invoices/:id - Update invoice
router.put('/:id',
  [
    body('clientId').optional().isUUID(),
    body('projectId').optional().isUUID(),
    body('invoiceNumber').optional().isString(),
    body('issueDate').optional().isISO8601(),
    body('dueDate').optional().isISO8601(),
    body('status').optional().isIn(['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled']),
    body('subtotal').optional().isFloat({ min: 0 }),
    body('vatPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('vatAmount').optional().isFloat({ min: 0 }),
    body('irpfPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('irpfAmount').optional().isFloat({ min: 0 }),
    body('total').optional().isFloat({ min: 0 }),
    body('notes').optional().isString(),
    body('items').optional().isArray()
  ],
  validate,
  async (req, res) => {
    try {
      const invoice = await Invoice.update(req.params.id, req.user.id, req.body);

      if (!invoice) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      res.json(invoice);
    } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(500).json({ error: 'Error al actualizar la factura' });
    }
  }
);

// POST /api/invoices/:id/mark-paid - Mark invoice as paid
router.post('/:id/mark-paid',
  [
    body('paymentDate').optional().isISO8601(),
    body('paymentMethod').optional().isString(),
    body('amount').optional().isFloat({ min: 0 })
  ],
  validate,
  async (req, res) => {
    try {
      const invoice = await Invoice.markAsPaid(req.params.id, req.user.id, req.body);

      if (!invoice) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      res.json(invoice);
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      res.status(500).json({ error: 'Error al marcar la factura como pagada' });
    }
  }
);

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id',
  async (req, res) => {
    try {
      const deleted = await Invoice.delete(req.params.id, req.user.id);

      if (!deleted) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      res.json({ message: 'Factura eliminada correctamente', id: deleted.id });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      res.status(500).json({ error: 'Error al eliminar la factura' });
    }
  }
);

// POST /api/invoices/update-overdue - Update overdue invoices (cron job)
router.post('/update-overdue',
  async (req, res) => {
    try {
      const updated = await Invoice.updateOverdueStatus(req.user.id);
      res.json({ message: 'Facturas vencidas actualizadas', count: updated.length, invoices: updated });
    } catch (error) {
      console.error('Error updating overdue invoices:', error);
      res.status(500).json({ error: 'Error al actualizar facturas vencidas' });
    }
  }
);

module.exports = router;
