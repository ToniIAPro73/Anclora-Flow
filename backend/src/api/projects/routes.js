const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const Project = require('../../models/Project');

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

// GET /api/projects - Get all projects with filters
router.get('/',
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

// GET /api/projects/:id - Get project by ID
router.get('/:id',
  async (req, res) => {
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
  }
);

// GET /api/projects/:id/statistics - Get project statistics
router.get('/:id/statistics',
  async (req, res) => {
    try {
      const statistics = await Project.getStatistics(req.user.id, req.params.id);
      res.json(statistics);
    } catch (error) {
      console.error('Error fetching project statistics:', error);
      res.status(500).json({ error: 'Error al obtener las estadísticas del proyecto' });
    }
  }
);

// POST /api/projects - Create new project
router.post('/',
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

// PUT /api/projects/:id - Update project
router.put('/:id',
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

// DELETE /api/projects/:id - Delete project
router.delete('/:id',
  async (req, res) => {
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
  }
);

module.exports = router;
