import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import pkg from 'express-validator';
const { validationResult } = pkg as any;
import Client from '../../models/Client.js';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

export const getClients = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const filters = {
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      search: req.query.search as string | undefined
    };

    const clients = await Client.findAllByUser(userId, filters);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Error al obtener los clientes' });
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const client = await Client.findById(req.params.id as string, userId);

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Error al obtener el cliente' });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const client = await Client.create(userId, req.body);
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Error al crear el cliente' });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const client = await Client.update(req.params.id as string, userId, req.body);

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Error al actualizar el cliente' });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const deleted = await Client.delete(req.params.id as string, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ message: 'Cliente eliminado correctamente', id: deleted.id });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Error al eliminar el cliente' });
  }
};

export const getStatistics = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const stats = await Client.getStatistics(userId, req.params.id as string);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching client statistics:', error);
    res.status(500).json({ error: 'Error al obtener las estadísticas del cliente' });
  }
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const summary = await Client.getSummary(userId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching client summary:', error);
    res.status(500).json({ error: 'Error al obtener el resumen de clientes' });
  }
};

export const getRecent = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const recent = await Client.getRecent(userId, limit);
    res.json(recent);
  } catch (error) {
    console.error('Error fetching recent clients:', error);
    res.status(500).json({ error: 'Error al obtener los clientes recientes' });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const projects = await Client.getProjects(userId, req.params.id as string);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching client projects:', error);
    res.status(500).json({ error: 'Error al obtener los proyectos del cliente' });
  }
};

export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const subs = await Client.getSubscriptions(userId, req.params.id as string);
    res.json(subs);
  } catch (error) {
    console.error('Error fetching client subscriptions:', error);
    res.status(500).json({ error: 'Error al obtener las suscripciones del cliente' });
  }
};
