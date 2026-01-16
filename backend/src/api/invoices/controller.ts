import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import pkg from 'express-validator';
const { validationResult } = pkg as any;
import Invoice from '../../models/Invoice.js';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status,
      clientId: req.query.clientId,
      search: req.query.search,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };

    const userId = (req.user as any).id as string;
    const invoices = await Invoice.findAllByUser(userId, filters);
    res.json({ invoices, count: invoices.length });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Error al obtener las facturas' });
  }
};

export const getStatistics = async (req: Request, res: Response) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    const userId = (req.user as any).id as string;
    const statistics = await Invoice.getStatistics(userId, filters);
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Error al obtener las estadísticas' });
  }
};

export const getMonthlyIncome = async (req: Request, res: Response) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string) : 12;
    const userId = (req.user as any).id as string;
    const monthlyData = await Invoice.getMonthlyIncome(userId, months);
    res.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    res.status(500).json({ error: 'Error al obtener los datos mensuales' });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoice = await Invoice.findById(req.params.id as string, userId);

    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Error al obtener la factura' });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoice = await Invoice.create(userId, req.body);
    res.status(201).json(invoice);
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'El número de factura ya existe' });
    }
    res.status(500).json({ error: 'Error al crear la factura' });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoice = await Invoice.update(req.params.id as string, userId, req.body);

    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Error al actualizar la factura' });
  }
};

export const markAsPaid = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoice = await Invoice.markAsPaid(req.params.id as string, userId, req.body);

    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(500).json({ error: 'Error al marcar la factura como pagada' });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const deleted = await Invoice.delete(req.params.id as string, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json({ message: 'Factura eliminada correctamente', id: deleted.id });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Error al eliminar la factura' });
  }
};

export const updateOverdueStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const updated = await Invoice.updateOverdueStatus(userId);
    res.json({ message: 'Facturas vencidas actualizadas', count: updated.length, invoices: updated });
  } catch (error) {
    console.error('Error updating overdue invoices:', error);
    res.status(500).json({ error: 'Error al actualizar facturas vencidas' });
  }
};
