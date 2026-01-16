import express from 'express';
// @ts-ignore
import { body, query, param } from 'express-validator';
import { authenticateToken } from '../../middleware/auth.js';
import * as budgetController from './controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get(
  '/',
  [query('month').optional().isISO8601()],
  budgetController.validate,
  budgetController.getBudgets
);

router.get(
  '/summary',
  [query('month').optional().isISO8601()],
  budgetController.validate,
  budgetController.getSummary
);

router.get(
  '/suggestions',
  [
    query('month').optional().isISO8601(),
    query('historyMonths').optional().isInt({ min: 1, max: 12 }),
  ],
  budgetController.validate,
  budgetController.getSuggestions
);

router.post(
  '/',
  [
    body('category').notEmpty().isString().trim(),
    body('month').optional().isISO8601(),
    body('plannedAmount').notEmpty().isFloat({ min: 0 }),
    body('notes').optional().isString().trim(),
  ],
  budgetController.validate,
  budgetController.createOrUpdate
);

router.put(
  '/:id',
  [
    param('id').isInt(),
    body('category').optional().isString().trim(),
    body('month').optional().isISO8601(),
    body('plannedAmount').optional().isFloat({ min: 0 }),
    body('notes').optional().isString().trim(),
  ],
  budgetController.validate,
  budgetController.updateBudget
);

router.delete(
  '/:id',
  [param('id').isInt()],
  budgetController.validate,
  budgetController.deleteBudget
);

export default router;
