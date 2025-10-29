const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const Subscription = require('../../models/Subscription');

router.use(authenticateToken);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

router.get(
  '/',
  [
    query('status').optional().isIn(['active', 'paused', 'cancelled']),
    query('billingCycle').optional().isIn(['monthly', 'quarterly', 'yearly', 'custom']),
    query('clientId').optional().isUUID(),
    query('projectId').optional().isUUID(),
    query('search').optional().isString(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('autoInvoice').optional().isBoolean(),
    query('orderBy')
      .optional()
      .isIn(['next_billing_date', 'amount_desc', 'amount_asc', 'name_desc']),
    query('limit').optional().isInt({ min: 1, max: 200 })
  ],
  validate,
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        billingCycle: req.query.billingCycle,
        clientId: req.query.clientId,
        projectId: req.query.projectId,
        search: req.query.search,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        autoInvoice:
          typeof req.query.autoInvoice === 'string'
            ? req.query.autoInvoice === 'true'
            : undefined,
        orderBy: req.query.orderBy,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined
      };

      const subscriptions = await Subscription.findAllByUser(req.user.id, filters);
      res.json({ subscriptions, count: subscriptions.length });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ error: 'Error al obtener las suscripciones' });
    }
  }
);

router.get('/summary', async (req, res) => {
  try {
    const summary = await Subscription.getSummary(req.user.id);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching subscriptions summary:', error);
    res.status(500).json({ error: 'Error al obtener el resumen de suscripciones' });
  }
});

router.get(
  '/upcoming',
  [query('limit').optional().isInt({ min: 1, max: 50 })],
  validate,
  async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 8;
      const upcoming = await Subscription.getUpcoming(req.user.id, limit);
      res.json(upcoming);
    } catch (error) {
      console.error('Error fetching upcoming subscriptions:', error);
      res.status(500).json({ error: 'Error al obtener pr�ximas suscripciones' });
    }
  }
);

router.get(
  '/forecast',
  [query('months').optional().isInt({ min: 1, max: 24 })],
  validate,
  async (req, res) => {
    try {
      const months = req.query.months ? parseInt(req.query.months, 10) : 6;
      const forecast = await Subscription.getRevenueForecast(req.user.id, months);
      res.json(forecast);
    } catch (error) {
      console.error('Error fetching subscription forecast:', error);
      res.status(500).json({ error: 'Error al obtener el pron�stico de suscripciones' });
    }
  }
);

router.get('/status-breakdown', async (req, res) => {
  try {
    const breakdown = await Subscription.getStatusBreakdown(req.user.id);
    res.json(breakdown);
  } catch (error) {
    console.error('Error fetching subscription status breakdown:', error);
    res
      .status(500)
      .json({ error: 'Error al obtener el desglose de estado de las suscripciones' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id, req.user.id);
    if (!subscription) {
      return res.status(404).json({ error: 'Suscripci�n no encontrada' });
    }
    return res.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return res.status(500).json({ error: 'Error al obtener la suscripci�n' });
  }
});

router.post(
  '/',
  [
    body('name').notEmpty().isString().trim(),
    body('clientId').optional().isUUID(),
    body('projectId').optional().isUUID(),
    body('description').optional().isString(),
    body('amount').notEmpty().isFloat({ min: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 5 }),
    body('billingCycle')
      .notEmpty()
      .isIn(['monthly', 'quarterly', 'yearly', 'custom']),
    body('startDate').notEmpty().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('nextBillingDate').notEmpty().isISO8601(),
    body('status').optional().isIn(['active', 'paused', 'cancelled']),
    body('autoInvoice').optional().isBoolean(),
    body('notes').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const subscription = await Subscription.create(req.user.id, req.body);
      res.status(201).json(subscription);
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: 'Error al crear la suscripci�n' });
    }
  }
);

router.put(
  '/:id',
  [
    body('name').optional().isString().trim(),
    body('clientId').optional().isUUID(),
    body('projectId').optional().isUUID(),
    body('description').optional().isString(),
    body('amount').optional().isFloat({ min: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 5 }),
    body('billingCycle')
      .optional()
      .isIn(['monthly', 'quarterly', 'yearly', 'custom']),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('nextBillingDate').optional().isISO8601(),
    body('status').optional().isIn(['active', 'paused', 'cancelled']),
    body('autoInvoice').optional().isBoolean(),
    body('notes').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const updated = await Subscription.update(req.params.id, req.user.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Suscripci�n no encontrada' });
      }
      return res.json(updated);
    } catch (error) {
      console.error('Error updating subscription:', error);
      return res.status(500).json({ error: 'Error al actualizar la suscripci�n' });
    }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Subscription.delete(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Suscripci�n no encontrada' });
    }
    return res.json({ id: deleted.id, message: 'Suscripci�n eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return res.status(500).json({ error: 'Error al eliminar la suscripci�n' });
  }
});

module.exports = router;

