const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const Client = require('../../models/Client');

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

// GET /api/clients - Get all clients with filters
router.get('/',
  [
    query('isActive').optional().isBoolean().toBoolean(),
    query('search').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const filters = {
        isActive: typeof req.query.isActive === 'boolean' ? req.query.isActive : undefined,
        search: req.query.search
      };

      const clients = await Client.findAllByUser(req.user.id, filters);
      res.json({ clients, count: clients.length });
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ error: 'Error al obtener los clientes' });
    }
  }
);

// GET /api/clients/top - Get top clients by billing
router.get('/top',
  [
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validate,
  async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 5;
      const topClients = await Client.getTopClients(req.user.id, limit);
      res.json(topClients);
    } catch (error) {
      console.error('Error fetching top clients:', error);
      res.status(500).json({ error: 'Error al obtener los principales clientes' });
    }
  }
);

// GET /api/clients/summary - Overall clients summary
router.get('/summary',
  async (req, res) => {
    try {
      const summary = await Client.getSummary(req.user.id);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching clients summary:', error);
      res.status(500).json({ error: 'Error al obtener el resumen de clientes' });
    }
  }
);

// GET /api/clients/recent - Recent clients
router.get('/recent',
  [
    query('limit').optional().isInt({ min: 1, max: 24 })
  ],
  validate,
  async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 6;
      const clients = await Client.getRecent(req.user.id, limit);
      res.json(clients);
    } catch (error) {
      console.error('Error fetching recent clients:', error);
      res.status(500).json({ error: 'Error al obtener clientes recientes' });
    }
  }
);

// GET /api/clients/analytics/revenue-trend - Monthly revenue trend
router.get('/analytics/revenue-trend',
  [
    query('months').optional().isInt({ min: 1, max: 24 })
  ],
  validate,
  async (req, res) => {
    try {
      const months = req.query.months ? parseInt(req.query.months, 10) : 6;
      const trend = await Client.getRevenueTrend(req.user.id, months);
      res.json(trend);
    } catch (error) {
      console.error('Error fetching clients revenue trend:', error);
      res.status(500).json({ error: 'Error al obtener la tendencia de ingresos' });
    }
  }
);

// GET /api/clients/:id/projects - Projects for a client
router.get('/:id/projects',
  async (req, res) => {
    try {
      const projects = await Client.getProjects(req.user.id, req.params.id);
      res.json(projects);
    } catch (error) {
      console.error('Error fetching client projects:', error);
      res.status(500).json({ error: 'Error al obtener los proyectos del cliente' });
    }
  }
);

// GET /api/clients/:id/subscriptions - Subscriptions for a client
router.get('/:id/subscriptions',
  async (req, res) => {
    try {
      const subscriptions = await Client.getSubscriptions(req.user.id, req.params.id);
      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching client subscriptions:', error);
      res.status(500).json({ error: 'Error al obtener las suscripciones del cliente' });
    }
  }
);

// GET /api/clients/:id - Get client by ID
router.get('/:id',
  async (req, res) => {
    try {
      const client = await Client.findById(req.params.id, req.user.id);

      if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.json(client);
    } catch (error) {
      console.error('Error fetching client:', error);
      res.status(500).json({ error: 'Error al obtener el cliente' });
    }
  }
);

// GET /api/clients/:id/statistics - Get client statistics
router.get('/:id/statistics',
  async (req, res) => {
    try {
      const statistics = await Client.getStatistics(req.user.id, req.params.id);
      res.json(statistics);
    } catch (error) {
      console.error('Error fetching client statistics:', error);
      res.status(500).json({ error: 'Error al obtener las estadísticas del cliente' });
    }
  }
);

// POST /api/clients - Create new client
router.post('/',
  [
    body('name').notEmpty().isString().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString().trim(),
    body('nifCif').optional().isString().trim(),
    body('address').optional().isString().trim(),
    body('city').optional().isString().trim(),
    body('postalCode').optional().isString().trim(),
    body('country').optional().isString().trim(),
    body('notes').optional().isString(),
    body('isActive').optional().isBoolean()
  ],
  validate,
  async (req, res) => {
    try {
      const client = await Client.create(req.user.id, req.body);
      res.status(201).json(client);
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({ error: 'Error al crear el cliente' });
    }
  }
);

// PUT /api/clients/:id - Update client
router.put('/:id',
  [
    body('name').optional().isString().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString().trim(),
    body('nifCif').optional().isString().trim(),
    body('address').optional().isString().trim(),
    body('city').optional().isString().trim(),
    body('postalCode').optional().isString().trim(),
    body('country').optional().isString().trim(),
    body('notes').optional().isString(),
    body('isActive').optional().isBoolean()
  ],
  validate,
  async (req, res) => {
    try {
      const client = await Client.update(req.params.id, req.user.id, req.body);

      if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.json(client);
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({ error: 'Error al actualizar el cliente' });
    }
  }
);

// DELETE /api/clients/:id - Delete client
router.delete('/:id',
  async (req, res) => {
    try {
      const deleted = await Client.delete(req.params.id, req.user.id);

      if (!deleted) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.json({ message: 'Cliente eliminado correctamente', id: deleted.id });
    } catch (error) {
      console.error('Error deleting client:', error);
      res.status(500).json({ error: 'Error al eliminar el cliente' });
    }
  }
);

module.exports = router;
