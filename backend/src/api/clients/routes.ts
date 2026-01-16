import express from 'express';
// @ts-ignore
import { body, query, param } from 'express-validator';
import { authenticateToken } from '../../middleware/auth.js';
import * as clientController from './controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/',
  [
    query('isActive').optional().isBoolean(),
    query('search').optional().isString()
  ],
  clientController.validate,
  clientController.getClients
);

router.get('/summary', clientController.getSummary);

router.get('/recent',
  [query('limit').optional().isInt({ min: 1, max: 20 })],
  clientController.validate,
  clientController.getRecent
);

router.get('/:id',
  [param('id').isInt()],
  clientController.validate,
  clientController.getClientById
);

router.post('/',
  [
    body('name').notEmpty().isString().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString(),
    body('isActive').optional().isBoolean()
  ],
  clientController.validate,
  clientController.createClient
);

router.put('/:id',
  [
    param('id').isInt(),
    body('name').optional().isString().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('isActive').optional().isBoolean()
  ],
  clientController.validate,
  clientController.updateClient
);

router.delete('/:id',
  [param('id').isInt()],
  clientController.validate,
  clientController.deleteClient
);

router.get('/:id/statistics',
  [param('id').isInt()],
  clientController.validate,
  clientController.getStatistics
);

router.get('/:id/projects',
  [param('id').isInt()],
  clientController.validate,
  clientController.getProjects
);

router.get('/:id/subscriptions',
  [param('id').isInt()],
  clientController.validate,
  clientController.getSubscriptions
);

export default router;
