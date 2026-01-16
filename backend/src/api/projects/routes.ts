import express from 'express';
// @ts-ignore
import { body, query, param } from 'express-validator';
import { authenticateToken } from '../../middleware/auth.js';
import * as projectController from './controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/',
  [
    query('status').optional().isIn(['active', 'on-hold', 'completed', 'cancelled']),
    query('clientId').optional().isInt(),
    query('search').optional().isString()
  ],
  projectController.validate,
  projectController.getProjects
);

router.get('/summary', projectController.getSummary);
router.get('/status-metrics', projectController.getStatusMetrics);
router.get('/deadlines',
  [query('limit').optional().isInt({ min: 1, max: 20 })],
  projectController.validate,
  projectController.getUpcomingDeadlines
);

router.get('/:id',
  [param('id').isInt()],
  projectController.validate,
  projectController.getProjectById
);

router.post('/',
  [
    body('clientId').notEmpty().isInt(),
    body('name').notEmpty().isString().trim(),
    body('status').optional().isIn(['active', 'on-hold', 'completed', 'cancelled']),
    body('budget').optional().isFloat({ min: 0 })
  ],
  projectController.validate,
  projectController.createProject
);

router.put('/:id',
  [
    param('id').isInt(),
    body('name').optional().isString().trim(),
    body('status').optional().isIn(['active', 'on-hold', 'completed', 'cancelled']),
    body('budget').optional().isFloat({ min: 0 })
  ],
  projectController.validate,
  projectController.updateProject
);

router.delete('/:id',
  [param('id').isInt()],
  projectController.validate,
  projectController.deleteProject
);

router.get('/:id/statistics',
  [param('id').isInt()],
  projectController.validate,
  projectController.getStatistics
);

router.get('/:id/subscriptions',
  [param('id').isInt()],
  projectController.validate,
  projectController.getSubscriptions
);

export default router;
