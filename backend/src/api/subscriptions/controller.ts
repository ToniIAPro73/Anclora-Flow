import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import pkg from 'express-validator';
const { validationResult } = pkg as any;
import { subscriptionRepository } from '../../repositories/subscription.repository.js';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const filters = {
      status: req.query.status as string | undefined,
      billingCycle: req.query.billingCycle as string | undefined,
      category: req.query.category as string | undefined,
      search: req.query.search as string | undefined,
      orderBy: req.query.orderBy as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };

    const subscriptions = await subscriptionRepository.findAllByUser(userId, filters);
    res.json({ subscriptions, count: subscriptions.length });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Error al obtener las suscripciones' });
  }
};

export const getSubscriptionById = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const subscription = await subscriptionRepository.findById(req.params.id as string, userId);

    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Error al obtener la suscripción' });
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const subscription = await subscriptionRepository.create(userId, req.body);
    res.status(201).json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Error al crear la suscripción' });
  }
};

export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const subscription = await subscriptionRepository.update(req.params.id as string, userId, req.body);

    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Error al actualizar la suscripción' });
  }
};

export const deleteSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const success = await subscriptionRepository.delete(req.params.id as string, userId);

    if (!success) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    res.json({ message: 'Suscripción eliminada correctamente', id: req.params.id });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ error: 'Error al eliminar la suscripción' });
  }
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const summary = await subscriptionRepository.getSummary(userId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching subscription summary:', error);
    res.status(500).json({ error: 'Error al obtener el resumen de suscripciones' });
  }
};
