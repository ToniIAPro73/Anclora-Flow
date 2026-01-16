import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import pkg from 'express-validator';
const { validationResult } = pkg as any;
import { projectRepository } from '../../repositories/project.repository.js';
import Project from '../../models/Project.js';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const filters = {
      status: req.query.status as string | undefined,
      clientId: req.query.clientId as string | undefined,
      search: req.query.search as string | undefined
    };

    const projects = await projectRepository.findAllByUser(userId, filters);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Error al obtener los proyectos' });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const project = await projectRepository.findById(req.params.id as string, userId);

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Error al obtener el proyecto' });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const project = await projectRepository.create(userId, req.body);
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Error al crear el proyecto' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const project = await projectRepository.update(req.params.id as string, userId, req.body);

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Error al actualizar el proyecto' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const success = await projectRepository.delete(req.params.id as string, userId);

    if (!success) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json({ message: 'Proyecto eliminado correctamente', id: req.params.id });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Error al eliminar el proyecto' });
  }
};

export const getStatistics = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const stats = await projectRepository.getStatistics(userId, req.params.id as string);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching project statistics:', error);
    res.status(500).json({ error: 'Error al obtener las estadísticas del proyecto' });
  }
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const summary = await projectRepository.getSummary(userId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching project summary:', error);
    res.status(500).json({ error: 'Error al obtener el resumen de proyectos' });
  }
};

export const getStatusMetrics = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const metrics = await projectRepository.getStatusMetrics(userId);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching project status metrics:', error);
    res.status(500).json({ error: 'Error al obtener las métricas de estado de proyectos' });
  }
};

export const getUpcomingDeadlines = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
    const deadlines = await projectRepository.getUpcomingDeadlines(userId, limit);
    res.json(deadlines);
  } catch (error) {
    console.error('Error fetching upcoming deadlines:', error);
    res.status(500).json({ error: 'Error al obtener los plazos próximos' });
  }
};

export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const subs = await projectRepository.getSubscriptions(userId, req.params.id as string);
    res.json(subs);
  } catch (error) {
    console.error('Error fetching project subscriptions:', error);
    res.status(500).json({ error: 'Error al obtener las suscripciones del proyecto' });
  }
};
