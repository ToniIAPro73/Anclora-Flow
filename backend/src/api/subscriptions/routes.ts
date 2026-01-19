import express from 'express';
//  @ts-ignore
import { body, query, param } from 'express-validator';
import { authenticateToken } from '../../middleware/auth.js';
import * as subscriptionController from './controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/',
  [
    query('status').optional().isIn(['active', 'paused', 'cancelled', 'trial', 'expired']),
    query('billingCycle').optional().isIn(['monthly', 'quarterly', 'yearly']),
    query('category').optional().isString(),
    query('search').optional().isString()
  ],
  subscriptionController.validate,
  subscriptionController.getSubscriptions
);

router.get('/summary', subscriptionController.getSummary);

router.get('/:id',
  [param('id').isUUID()],
  subscriptionController.validate,
  subscriptionController.getSubscriptionById
);

router.post('/',
  [
    body('serviceName').notEmpty().isString().trim(),
    body('provider').notEmpty().isString().trim(),
    body('amount').notEmpty().isFloat({ min: 0 }),
    body('billingFrequency').notEmpty().isIn(['monthly', 'quarterly', 'yearly']),
    body('nextBillingDate').optional().isISO8601(),
    body('category').optional().isString()
  ],
  subscriptionController.validate,
  subscriptionController.createSubscription
);

router.put('/:id',
  [
    param('id').isUUID(),
    body('amount').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['active', 'paused', 'cancelled', 'trial', 'expired'])
  ],
  subscriptionController.validate,
  subscriptionController.updateSubscription
);

router.delete('/:id',
  [param('id').isUUID()],
  subscriptionController.validate,
  subscriptionController.deleteSubscription
);

export default router;
