import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import pkg from 'express-validator';
const { validationResult } = pkg as any;
import { customerSubscriptionService } from '../../services/customer-subscription.service.js';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

export const getCustomerSubscriptions = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const filters = {
      status: req.query.status as string | undefined,
      clientId: req.query.clientId as string | undefined,
      planCode: req.query.planCode as string | undefined,
      search: req.query.search as string | undefined,
      orderBy: req.query.orderBy as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };

    const subscriptions = await customerSubscriptionService.findAllByUser(userId, filters);
    res.json({ subscriptions, count: subscriptions.length });
  } catch (error) {
    console.error('Error fetching customer subscriptions:', error);
    res.status(500).json({ error: 'Error al obtener las suscripciones de clientes' });
  }
};

export const getCustomerSubscriptionById = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const subscription = await customerSubscriptionService.findById(req.params.id as string, userId);

    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción de cliente no encontrada' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error fetching customer subscription:', error);
    res.status(500).json({ error: 'Error al obtener la suscripción de cliente' });
  }
};

export const createCustomerSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const subscription = await customerSubscriptionService.create(userId, req.body);
    res.status(201).json(subscription);
  } catch (error) {
    console.error('Error creating customer subscription:', error);
    res.status(500).json({ error: 'Error al crear la suscripción de cliente' });
  }
};

export const updateCustomerSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const subscription = await customerSubscriptionService.update(req.params.id as string, userId, req.body);

    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción de cliente no encontrada' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error updating customer subscription:', error);
    res.status(500).json({ error: 'Error al actualizar la suscripción de cliente' });
  }
};

export const deleteCustomerSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const success = await customerSubscriptionService.delete(req.params.id as string, userId);

    if (!success) {
      return res.status(404).json({ error: 'Suscripción de cliente no encontrada' });
    }

    res.json({ message: 'Suscripción de cliente eliminada correctamente', id: req.params.id });
  } catch (error) {
    console.error('Error deleting customer subscription:', error);
    res.status(500).json({ error: 'Error al eliminar la suscripción de cliente' });
  }
};

export const getMRR = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const mrr = await customerSubscriptionService.getMRR(userId);
    res.json(mrr);
  } catch (error) {
    console.error('Error fetching MRR:', error);
    res.status(500).json({ error: 'Error al obtener el MRR' });
  }
};

export const getARR = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const arr = await customerSubscriptionService.getARR(userId);
    res.json(arr);
  } catch (error) {
    console.error('Error fetching ARR:', error);
    res.status(500).json({ error: 'Error al obtener el ARR' });
  }
};

export const getExpiringTrials = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const trials = await customerSubscriptionService.getExpiringTrials(userId, days);
    res.json(trials);
  } catch (error) {
    console.error('Error fetching expiring trials:', error);
    res.status(500).json({ error: 'Error al obtener las pruebas próximas a expirar' });
  }
};

export const convertTrialToActive = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const subscription = await customerSubscriptionService.convertTrialToActive(req.params.id as string, userId);

    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción de prueba no encontrada' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error converting trial to active:', error);
    res.status(500).json({ error: 'Error al convertir la prueba a activa' });
  }
};

export const cancelCustomerSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const { reason } = req.body;
    const subscription = await customerSubscriptionService.cancel(req.params.id as string, userId, reason);

    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción de cliente no encontrada' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error cancelling customer subscription:', error);
    res.status(500).json({ error: 'Error al cancelar la suscripción de cliente' });
  }
};

export const upgradePlan = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const { planCode, amount } = req.body;
    
    if (!planCode || amount === undefined) {
      return res.status(400).json({ error: 'Se requieren planCode y amount' });
    }

    const subscription = await customerSubscriptionService.upgradePlan(req.params.id as string, userId, planCode, amount);

    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción de cliente no encontrada' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error upgrading plan:', error);
    res.status(500).json({ error: 'Error al actualizar el plan' });
  }
};
