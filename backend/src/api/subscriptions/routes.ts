import express from 'express';
// @ts-ignore
import { body, query, param } from 'express-validator';
import { authenticateToken } from '../../middleware/auth.js';
import * as subscriptionController from './controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/',
  [
    query('status').optional().isIn(['active', 'paused', 'cancelled', 'pending']),
    query('billingCycle').optional().isIn(['monthly', 'quarterly', 'yearly']),
    query('clientId').optional().isInt(),
    query('projectId').optional().isInt(),
    query('autoInvoice').optional().isBoolean(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('search').optional().isString()
  ],
  subscriptionController.validate,
  subscriptionController.getSubscriptions
);

router.get('/summary', subscriptionController.getSummary);
router.get('/status-breakdown', subscriptionController.getStatusBreakdown);
router.get('/forecast',
  [query('months').optional().isInt({ min: 1, max: 24 })],
  subscriptionController.validate,
  subscriptionController.getRevenueForecast
);
router.get('/upcoming',
  [query('limit').optional().isInt({ min: 1, max: 20 })],
  subscriptionController.validate,
  subscriptionController.getUpcoming
);

router.get('/:id',
  [param('id').isInt()],
  subscriptionController.validate,
  subscriptionController.getSubscriptionById
);

router.post('/',
  [
    body('name').notEmpty().isString().trim(),
    body('amount').notEmpty().isFloat({ min: 0 }),
    body('billingCycle').notEmpty().isIn(['monthly', 'quarterly', 'yearly']),
    body('startDate').notEmpty().isISO8601(),
    body('nextBillingDate').notEmpty().isISO8601(),
    body('clientId').optional().isInt(),
    body('projectId').optional().isInt()
  ],
  subscriptionController.validate,
  subscriptionController.createSubscription
);

router.put('/:id',
  [
    param('id').isInt(),
    body('amount').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['active', 'paused', 'cancelled', 'pending'])
  ],
  subscriptionController.validate,
  subscriptionController.updateSubscription
);

router.delete('/:id',
  [param('id').isInt()],
  subscriptionController.validate,
  subscriptionController.deleteSubscription
);

export default router;
