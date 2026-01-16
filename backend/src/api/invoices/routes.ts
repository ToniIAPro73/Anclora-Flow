import express from 'express';
// @ts-ignore
import { body, query } from 'express-validator';
import { authenticateToken } from '../../middleware/auth.js';
import * as invoiceController from './controller.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/invoices - Get all invoices with filters
router.get('/',
  [
    query('status').optional().isIn(['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled']),
    query('clientId').optional().isInt(),
    query('search').optional().isString(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  invoiceController.validate,
  invoiceController.getInvoices
);

// GET /api/invoices/statistics - Get invoice statistics
router.get('/statistics',
  [
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
  ],
  invoiceController.validate,
  invoiceController.getStatistics
);

// GET /api/invoices/monthly - Get monthly income data
router.get('/monthly',
  [
    query('months').optional().isInt({ min: 1, max: 24 })
  ],
  invoiceController.validate,
  invoiceController.getMonthlyIncome
);

// GET /api/invoices/:id - Get invoice by ID
router.get('/:id', invoiceController.getInvoiceById);

// POST /api/invoices - Create new invoice
router.post('/',
  [
    body('clientId').optional().isInt(),
    body('projectId').optional().isInt(),
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
  invoiceController.validate,
  invoiceController.createInvoice
);

// PUT /api/invoices/:id - Update invoice
router.put('/:id',
  [
    body('clientId').optional().isInt(),
    body('projectId').optional().isInt(),
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
  invoiceController.validate,
  invoiceController.updateInvoice
);

// POST /api/invoices/:id/mark-paid - Mark invoice as paid
router.post('/:id/mark-paid',
  [
    body('paymentDate').optional().isISO8601(),
    body('paymentMethod').optional().isString(),
    body('amount').optional().isFloat({ min: 0 })
  ],
  invoiceController.validate,
  invoiceController.markAsPaid
);

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', invoiceController.deleteInvoice);

// POST /api/invoices/update-overdue - Update overdue invoices (cron job)
router.post('/update-overdue', invoiceController.updateOverdueStatus);

export default router;
