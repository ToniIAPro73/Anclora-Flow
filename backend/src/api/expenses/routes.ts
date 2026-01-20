import express from 'express';
// @ts-ignore
import { body, query, param } from 'express-validator';
import { authenticateToken } from '../../middleware/auth.js';
import * as expenseController from './controller.js';
import { uploadReceipt } from '../../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/',
  [
    query('category').optional().isString(),
    query('isDeductible').optional().isBoolean(),
    query('projectId').optional().isInt(),
    query('search').optional().isString(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('minAmount').optional().isFloat({ min: 0 }),
    query('maxAmount').optional().isFloat({ min: 0 }),
    query('limit').optional().isInt({ min: 1 })
  ],
  expenseController.validate,
  expenseController.getExpenses
);

router.get('/statistics',
  [
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
  ],
  expenseController.validate,
  expenseController.getStatistics
);

router.get('/by-category',
  [
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
  ],
  expenseController.validate,
  expenseController.getByCategory
);

router.get('/monthly',
  [
    query('months').optional().isInt({ min: 1, max: 24 })
  ],
  expenseController.validate,
  expenseController.getMonthlyExpenses
);

router.get('/top-vendors',
  [
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  expenseController.validate,
  expenseController.getTopVendors
);

router.get('/:id',
  [param('id').notEmpty()],
  expenseController.validate,
  expenseController.getExpenseById
);

router.post('/',
  [
    body('category').notEmpty().isString().trim(),
    body('description').notEmpty().isString().trim(),
    body('amount').notEmpty().isFloat({ min: 0 }),
    body('expenseDate').notEmpty().isISO8601(),
    body('isDeductible').optional().isBoolean(),
    body('projectId').optional().isInt()
  ],
  expenseController.validate,
  expenseController.createExpense
);

router.put('/:id',
  [
    param('id').notEmpty(),
    body('amount').optional().isFloat({ min: 0 }),
    body('expenseDate').optional().isISO8601()
  ],
  expenseController.validate,
  expenseController.updateExpense
);

router.delete('/:id',
  [param('id').notEmpty()],
  expenseController.validate,
  expenseController.deleteExpense
);

router.post('/:id/receipt',
  uploadReceipt,
  expenseController.uploadReceipt
);

router.get('/:id/audit-log',
  [param('id').notEmpty()],
  expenseController.validate,
  expenseController.getAuditLog
);

export default router;
