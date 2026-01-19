import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import * as controller from './controller.js';
// @ts-ignore
import pkg from 'express-validator';
const { check } = pkg as any;

const router = express.Router();

router.use(authenticateToken);

// Validaciones
const subscriptionValidation = [
  check('clientId').isUUID().withMessage('ID de cliente inválido'),
  check('planName').notEmpty().withMessage('El nombre del plan es obligatorio'),
  check('planCode').notEmpty().withMessage('El código del plan es obligatorio'),
  check('amount').isFloat({ min: 0 }).withMessage('El importe debe ser mayor o igual a 0'),
  check('billingFrequency').isIn(['monthly', 'quarterly', 'yearly']).withMessage('Frecuencia de facturación inválida'),
  check('startDate').isISO8601().withMessage('Fecha de inicio inválida'),
  check('currentPeriodStart').isISO8601().withMessage('Inicio del período actual inválido'),
  check('currentPeriodEnd').isISO8601().withMessage('Fin del período actual inválido')
];

// Rutas principales
router.get('/', controller.getCustomerSubscriptions);
router.post('/', subscriptionValidation, controller.validate, controller.createCustomerSubscription);

// Métricas y utilidades (deben ir antes de /:id para evitar conflictos)
router.get('/mrr', controller.getMRR);
router.get('/arr', controller.getARR);
router.get('/expiring-trials', controller.getExpiringTrials);

// Operaciones sobre suscripciones específicas
router.get('/:id', controller.getCustomerSubscriptionById);
router.put('/:id', controller.updateCustomerSubscription);
router.delete('/:id', controller.deleteCustomerSubscription);

// Acciones específicas
router.post('/:id/convert-trial', controller.convertTrialToActive);
router.post('/:id/cancel', controller.cancelCustomerSubscription);
router.post('/:id/upgrade', controller.upgradePlan);

export default router;
