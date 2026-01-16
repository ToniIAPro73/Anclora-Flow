import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import pkg from 'express-validator';
const { validationResult } = pkg as any;
import Subscription from '../../models/Subscription.js';

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
      clientId: req.query.clientId as string | undefined,
      projectId: req.query.projectId as string | undefined,
      autoInvoice: req.query.autoInvoice !== undefined ? req.query.autoInvoice === 'true' : undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      search: req.query.search as string | undefined,
      orderBy: req.query.orderBy as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };

    const subscriptions = await Subscription.findAllByUser(userId, filters);
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Error al obtener las suscripciones' });
  }
};

export const getSubscriptionById = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const subscription = await Subscription.findById(req.params.id as string, userId);

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
    const subscription = await Subscription.create(userId, req.body);
    res.status(201).json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Error al crear la suscripción' });
  }
};

export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const subscription = await Subscription.update(req.params.id as string, userId, req.body);

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
    const deleted = await Subscription.delete(req.params.id as string, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    res.json({ message: 'Suscripción eliminada correctamente', id: deleted.id });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ error: 'Error al eliminar la suscripción' });
  }
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const summary = await Subscription.getSummary(userId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching subscription summary:', error);
    res.status(500).json({ error: 'Error al obtener el resumen de suscripciones' });
  }
};

export const getStatusBreakdown = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const breakdown = await Subscription.getStatusBreakdown(userId);
    res.json(breakdown);
  } catch (error) {
    console.error('Error fetching status breakdown:', error);
    res.status(500).json({ error: 'Error al obtener el desglose por estado' });
  }
};

export const getRevenueForecast = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const months = req.query.months ? parseInt(req.query.months as string) : 6;
    const forecast = await Subscription.getRevenueForecast(userId, months);
    res.json(forecast);
  } catch (error) {
    console.error('Error fetching revenue forecast:', error);
    res.status(500).json({ error: 'Error al obtener la previsión de ingresos' });
  }
};

export const getUpcoming = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
    const upcoming = await Subscription.getUpcoming(userId, limit);
    res.json(upcoming);
  } catch (error) {
    console.error('Error fetching upcoming subscriptions:', error);
    res.status(500).json({ error: 'Error al obtener las próximas suscripciones' });
  }
};
