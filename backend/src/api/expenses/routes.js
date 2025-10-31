const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const Expense = require('../../models/Expense');

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

// GET /api/expenses - Get all expenses with filters
router.get('/',
  [
    query('category').optional().isString(),
    query('isDeductible').optional().isBoolean(),
    query('projectId').optional().isUUID(),
    query('search').optional().isString(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('minAmount').optional().isFloat({ min: 0 }),
    query('maxAmount').optional().isFloat({ min: 0 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  async (req, res) => {
    try {
      const hasDeductibleFilter = Object.prototype.hasOwnProperty.call(req.query, 'isDeductible');
      const filters = {
        category: req.query.category,
        isDeductible: hasDeductibleFilter ? req.query.isDeductible === 'true' : undefined,
        projectId: req.query.projectId,
        search: req.query.search,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      };

      const expenses = await Expense.findAllByUser(req.user.id, filters);
      res.json({ expenses, count: expenses.length });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ error: 'Error al obtener los gastos' });
    }
  }
);

// GET /api/expenses/statistics - Get expense statistics
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

      const statistics = await Expense.getStatistics(req.user.id, filters);
      res.json(statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ error: 'Error al obtener las estadísticas' });
    }
  }
);

// GET /api/expenses/by-category - Get expenses grouped by category
router.get('/by-category',
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

      const categoryData = await Expense.getByCategory(req.user.id, filters);
      res.json(categoryData);
    } catch (error) {
      console.error('Error fetching category data:', error);
      res.status(500).json({ error: 'Error al obtener los datos por categoría' });
    }
  }
);

// GET /api/expenses/monthly - Get monthly expense data
router.get('/monthly',
  [
    query('months').optional().isInt({ min: 1, max: 24 })
  ],
  validate,
  async (req, res) => {
    try {
      const months = req.query.months ? parseInt(req.query.months) : 12;
      const monthlyData = await Expense.getMonthlyExpenses(req.user.id, months);
      res.json(monthlyData);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      res.status(500).json({ error: 'Error al obtener los datos mensuales' });
    }
  }
);

// GET /api/expenses/top-vendors - Get top vendors
router.get('/top-vendors',
  [
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validate,
  async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const vendors = await Expense.getTopVendors(req.user.id, limit);
      res.json(vendors);
    } catch (error) {
      console.error('Error fetching top vendors:', error);
      res.status(500).json({ error: 'Error al obtener los proveedores principales' });
    }
  }
);

// GET /api/expenses/:id - Get expense by ID
router.get('/:id',
  async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id, req.user.id);

      if (!expense) {
        return res.status(404).json({ error: 'Gasto no encontrado' });
      }

      res.json(expense);
    } catch (error) {
      console.error('Error fetching expense:', error);
      res.status(500).json({ error: 'Error al obtener el gasto' });
    }
  }
);

// POST /api/expenses - Create new expense
router.post('/',
  [
    body('projectId').optional().isUUID(),
    body('category').notEmpty().isString(),
    body('subcategory').optional().isString(),
    body('description').notEmpty().isString(),
    body('amount').notEmpty().isFloat({ min: 0 }),
    body('vatAmount').optional().isFloat({ min: 0 }),
    body('vatPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('isDeductible').optional().isBoolean(),
    body('deductiblePercentage').optional().isFloat({ min: 0, max: 100 }),
    body('expenseDate').notEmpty().isISO8601(),
    body('paymentMethod').optional().isString(),
    body('vendor').optional().isString(),
    body('receiptUrl').optional().isURL(),
    body('notes').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const expense = await Expense.create(req.user.id, req.body);
      res.status(201).json(expense);
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ error: 'Error al crear el gasto' });
    }
  }
);

// PUT /api/expenses/:id - Update expense
router.put('/:id',
  [
    body('projectId').optional().isUUID(),
    body('category').optional().isString(),
    body('subcategory').optional().isString(),
    body('description').optional().isString(),
    body('amount').optional().isFloat({ min: 0 }),
    body('vatAmount').optional().isFloat({ min: 0 }),
    body('vatPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('isDeductible').optional().isBoolean(),
    body('deductiblePercentage').optional().isFloat({ min: 0, max: 100 }),
    body('expenseDate').optional().isISO8601(),
    body('paymentMethod').optional().isString(),
    body('vendor').optional().isString(),
    body('receiptUrl').optional().isURL(),
    body('notes').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const expense = await Expense.update(req.params.id, req.user.id, req.body);

      if (!expense) {
        return res.status(404).json({ error: 'Gasto no encontrado' });
      }

      res.json(expense);
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ error: 'Error al actualizar el gasto' });
    }
  }
);

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id',
  async (req, res) => {
    try {
      const deleted = await Expense.delete(req.params.id, req.user.id);

      if (!deleted) {
        return res.status(404).json({ error: 'Gasto no encontrado' });
      }

      res.json({ message: 'Gasto eliminado correctamente', id: deleted.id });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ error: 'Error al eliminar el gasto' });
    }
  }
);

module.exports = router;
