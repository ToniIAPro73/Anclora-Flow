const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const Budget = require('../../models/Budget');

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
  [query('month').optional().isISO8601()],
  validate,
  async (req, res) => {
    try {
      const budgets = await Budget.findByMonth(req.user.id, req.query.month);
      res.json(budgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      res.status(500).json({ error: 'Error al obtener los presupuestos' });
    }
  }
);

router.get(
  '/summary',
  [query('month').optional().isISO8601()],
  validate,
  async (req, res) => {
    try {
      const summary = await Budget.getSummary(req.user.id, req.query.month);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching budget summary:', error);
      res.status(500).json({ error: 'Error al obtener el resumen de presupuestos' });
    }
  }
);

router.get(
  '/suggestions',
  [
    query('month').optional().isISO8601(),
    query('historyMonths').optional().isInt({ min: 1, max: 12 }),
  ],
  validate,
  async (req, res) => {
    try {
      const months = req.query.historyMonths
        ? parseInt(req.query.historyMonths, 10)
        : 3;
      const suggestions = await Budget.getSuggestions(
        req.user.id,
        req.query.month,
        months
      );
      res.json(suggestions);
    } catch (error) {
      console.error('Error fetching budget suggestions:', error);
      res.status(500).json({ error: 'Error al generar recomendaciones de presupuesto' });
    }
  }
);

router.post(
  '/',
  [
    body('category').notEmpty().isString().trim(),
    body('month').optional().isISO8601(),
    body('plannedAmount').notEmpty().isFloat({ min: 0 }),
    body('notes').optional().isString().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const budget = await Budget.createOrUpdate(req.user.id, req.body);
      res.status(201).json(budget);
    } catch (error) {
      console.error('Error creating budget:', error);
      res.status(500).json({ error: 'Error al guardar el presupuesto' });
    }
  }
);

router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('category').optional().isString().trim(),
    body('month').optional().isISO8601(),
    body('plannedAmount').optional().isFloat({ min: 0 }),
    body('notes').optional().isString().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const budget = await Budget.update(req.user.id, req.params.id, req.body);
      if (!budget) {
        return res.status(404).json({ error: 'Presupuesto no encontrado' });
      }
      res.json(budget);
    } catch (error) {
      console.error('Error updating budget:', error);
      res.status(500).json({ error: 'Error al actualizar el presupuesto' });
    }
  }
);

router.delete(
  '/:id',
  [param('id').isUUID()],
  validate,
  async (req, res) => {
    try {
      const deleted = await Budget.delete(req.user.id, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Presupuesto no encontrado' });
      }
      res.json({ id: deleted.id, message: 'Presupuesto eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting budget:', error);
      res.status(500).json({ error: 'Error al eliminar el presupuesto' });
    }
  }
);

module.exports = router;

