import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import pkg from 'express-validator';
const { validationResult } = pkg as any;
import { budgetRepository } from '../../repositories/budget.repository.js';
import Budget from '../../models/Budget.js';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

export const getBudgets = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const month = req.query.month as string | undefined;
    const budgets = await budgetRepository.findByMonth(userId, month);
    res.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Error al obtener los presupuestos' });
  }
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const month = req.query.month as string | undefined;
    const summary = await budgetRepository.getSummary(userId, month);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching budget summary:', error);
    res.status(500).json({ error: 'Error al obtener el resumen de presupuestos' });
  }
};

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const month = req.query.month as string | undefined;
    const historyMonthsParam = req.query.historyMonths as string | undefined;
    const months = historyMonthsParam 
      ? parseInt(historyMonthsParam, 10) 
      : 3;
    const suggestions = await budgetRepository.getSuggestions(
      userId,
      month,
      months
    );
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching budget suggestions:', error);
    res.status(500).json({ error: 'Error al generar recomendaciones de presupuesto' });
  }
};

export const createOrUpdate = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const budget = await budgetRepository.createOrUpdate(userId, req.body);
    res.status(201).json(budget);
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Error al guardar el presupuesto' });
  }
};

export const updateBudget = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const budget = await budgetRepository.update(req.params.id as string, userId, req.body);
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    res.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Error al actualizar el presupuesto' });
  }
};

export const deleteBudget = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const success = await budgetRepository.delete(req.params.id as string, userId);
    if (!success) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    res.json({ id: req.params.id, message: 'Presupuesto eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ error: 'Error al eliminar el presupuesto' });
  }
};
