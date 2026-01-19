import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/customer-subscriptions - Temporal: devuelve array vacío
router.get('/', async (req, res) => {
  // TODO: Implementar lógica real de customer subscriptions
  res.json([]);
});

// GET /api/customer-subscriptions/mrr
router.get('/mrr', async (req, res) => {
  res.json({ mrr: 0 });
});

// GET /api/customer-subscriptions/arr
router.get('/arr', async (req, res) => {
  res.json({ arr: 0 });
});

export default router;
