import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import pkg from 'express-validator';
const { validationResult } = pkg as any;
import Expense from '../../models/Expense.js';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const filters = {
      category: req.query.category as string | undefined,
      isDeductible: req.query.isDeductible !== undefined ? req.query.isDeductible === 'true' : undefined,
      projectId: req.query.projectId as string | undefined,
      search: req.query.search as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
      maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };

    const expenses = await Expense.findAllByUser(userId, filters);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Error al obtener los gastos' });
  }
};

export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const expense = await Expense.findById(req.params.id as string, userId);

    if (!expense) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Error al obtener el gasto' });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const expense = await Expense.create(userId, req.body);
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Error al crear el gasto' });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const expense = await Expense.update(req.params.id as string, userId, req.body);

    if (!expense) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Error al actualizar el gasto' });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const deleted = await Expense.delete(req.params.id as string, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    res.json({ message: 'Gasto eliminado correctamente', id: deleted.id });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Error al eliminar el gasto' });
  }
};

export const getStatistics = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const filters = {
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined
    };
    const stats = await Expense.getStatistics(userId, filters);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching expense statistics:', error);
    res.status(500).json({ error: 'Error al obtener las estadísticas de gastos' });
  }
};

export const getByCategory = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const filters = {
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined
    };
    const byCategory = await Expense.getByCategory(userId, filters);
    res.json(byCategory);
  } catch (error) {
    console.error('Error fetching expenses by category:', error);
    res.status(500).json({ error: 'Error al obtener los gastos por categoría' });
  }
};

export const getMonthlyExpenses = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const monthsParam = typeof req.query.months === 'string' ? req.query.months : undefined;
    const months = monthsParam ? parseInt(monthsParam) : 12;
    const monthlyData = await Expense.getMonthlyExpenses(userId, months);
    res.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    res.status(500).json({ error: 'Error al obtener los gastos mensuales' });
  }
};

export const getTopVendors = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const limitParam = typeof req.query.limit === 'string' ? req.query.limit : undefined;
    const limit = limitParam ? parseInt(limitParam) : 10;
    const vendors = await Expense.getTopVendors(userId, limit);
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching top vendors:', error);
    res.status(500).json({ error: 'Error al obtener los proveedores principales' });
  }
};
