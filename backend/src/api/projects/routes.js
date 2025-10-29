const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const Project = require('../../models/Project');

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
    query('status').optional().isIn(['active', 'completed', 'cancelled', 'on-hold']),
    query('clientId').optional().isUUID(),
    query('search').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        clientId: req.query.clientId,
        search: req.query.search
      };

      const projects = await Project.findAllByUser(req.user.id, filters);
      res.json({ projects, count: projects.length });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Error al obtener los proyectos' });
    }
  }
);

router.get('/summary', async (req, res) => {
  try {
    const summary = await Project.getSummary(req.user.id);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching project summary:', error);
    res.status(500).json({ error: 'Error al obtener el resumen de proyectos' });
  }
});

router.get('/status-metrics', async (req, res) => {
  try {
    const metrics = await Project.getStatusMetrics(req.user.id);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching project status metrics:', error);
    res.status(500).json({ error: 'Error al obtener metricas por estado' });
  }
});

router.get(
  '/upcoming-deadlines',
  [query('limit').optional().isInt({ min: 1, max: 24 })],
  validate,
  async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 6;
      const upcoming = await Project.getUpcomingDeadlines(req.user.id, limit);
      res.json(upcoming);
    } catch (error) {
      console.error('Error fetching project deadlines:', error);
      res.status(500).json({ error: 'Error al obtener proximos vencimientos' });
    }
  }
);

router.get('/:id/statistics', async (req, res) => {
  try {
    const statistics = await Project.getStatistics(req.user.id, req.params.id);
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching project statistics:', error);
    res.status(500).json({ error: 'Error al obtener las estadisticas del proyecto' });
  }
});

router.get('/:id/subscriptions', async (req, res) => {
  try {
    const subscriptions = await Project.getSubscriptions(req.user.id, req.params.id);
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching project subscriptions:', error);
    res.status(500).json({ error: 'Error al obtener suscripciones del proyecto' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id, req.user.id);

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Error al obtener el proyecto' });
  }
});

router.post(
  '/',
  [
    body('clientId').optional().isUUID(),
    body('name').notEmpty().isString().trim(),
    body('description').optional().isString(),
    body('status').optional().isIn(['active', 'completed', 'cancelled', 'on-hold']),
    body('budget').optional().isFloat({ min: 0 }),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/)
  ],
  validate,
  async (req, res) => {
    try {
      const project = await Project.create(req.user.id, req.body);
      res.status(201).json(project);
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Error al crear el proyecto' });
    }
  }
);

router.put(
  '/:id',
  [
    body('clientId').optional().isUUID(),
    body('name').optional().isString().trim(),
    body('description').optional().isString(),
    body('status').optional().isIn(['active', 'completed', 'cancelled', 'on-hold']),
    body('budget').optional().isFloat({ min: 0 }),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/)
  ],
  validate,
  async (req, res) => {
    try {
      const project = await Project.update(req.params.id, req.user.id, req.body);

      if (!project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      res.json(project);
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Error al actualizar el proyecto' });
    }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Project.delete(req.params.id, req.user.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json({ message: 'Proyecto eliminado correctamente', id: deleted.id });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Error al eliminar el proyecto' });
  }
});

module.exports = router;

