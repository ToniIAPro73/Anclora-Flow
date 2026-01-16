import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import pkg from 'express-validator';
const { validationResult } = pkg as any;
import VerifactuService from '../../services/verifactu.service.js';
import Invoice from '../../models/Invoice.js';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

export const getConfig = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const config = await VerifactuService.getConfig(userId);

    if (!config) {
      return res.status(404).json({ error: 'Configuración de Verifactu no encontrada' });
    }

    // No enviar datos sensibles al frontend
    const safeConfig = {
      enabled: config.enabled,
      autoRegister: config.autoRegister,
      softwareNif: config.softwareNif,
      softwareName: config.softwareName,
      softwareVersion: config.softwareVersion,
      testMode: config.testMode,
      lastChainIndex: config.lastChainIndex,
      hasCertificate: !!config.certificatePath
    };

    res.json(safeConfig);
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({ error: 'Error al obtener la configuración de Verifactu' });
  }
};

export const updateConfig = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const config = await VerifactuService.updateConfig(userId, req.body);

    const safeConfig = {
      enabled: config.enabled,
      autoRegister: config.autoRegister,
      softwareNif: config.softwareNif,
      softwareName: config.softwareName,
      softwareVersion: config.softwareVersion,
      testMode: config.testMode,
      lastChainIndex: config.lastChainIndex
    };

    res.json({
      message: 'Configuración actualizada correctamente',
      config: safeConfig
    });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({ error: 'Error al actualizar la configuración de Verifactu' });
  }
};

export const registerInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const { invoiceId } = req.params;
    const invoiceIdStr = invoiceId as string;

    // Verificar que la factura existe y pertenece al usuario
    const invoice = await Invoice.findById(invoiceIdStr, userId);

    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    // Verificar que la factura no esté en estado draft o cancelled
    if (invoice.status === 'draft') {
      return res.status(400).json({ error: 'No se pueden registrar facturas en estado borrador' });
    }

    if (invoice.status === 'cancelled') {
      return res.status(400).json({ error: 'No se pueden registrar facturas canceladas' });
    }

    // Registrar en Verifactu
    const result = await VerifactuService.registerInvoice(invoiceIdStr, userId);

    res.json({
      message: 'Factura registrada en Verifactu correctamente',
      data: result
    });
  } catch (error: any) {
    console.error('Error registrando factura:', error);
    res.status(500).json({ error: error.message || 'Error al registrar la factura en Verifactu' });
  }
};

export const cancelInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoiceId = req.params.invoiceId as string;
    const { reason } = req.body;

    const result = await VerifactuService.cancelInvoice(invoiceId, userId, reason);

    res.json(result);
  } catch (error: any) {
    console.error('Error cancelando factura:', error);
    res.status(500).json({ error: error.message || 'Error al cancelar la factura en Verifactu' });
  }
};

export const getInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoiceId = req.params.invoiceId as string;

    const status = await Invoice.getVerifactuStatus(invoiceId, userId);

    if (!status) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json(status);
  } catch (error) {
    console.error('Error obteniendo estado:', error);
    res.status(500).json({ error: 'Error al obtener el estado de Verifactu' });
  }
};

export const getStatistics = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const statistics = await Invoice.getVerifactuStatistics(userId);

    res.json(statistics);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener las estadísticas de Verifactu' });
  }
};

export const getPendingInvoices = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const invoices = await Invoice.findPendingVerifactu(userId);

    res.json({ invoices, count: invoices.length });
  } catch (error) {
    console.error('Error obteniendo facturas pendientes:', error);
    res.status(500).json({ error: 'Error al obtener las facturas pendientes' });
  }
};

export const getRegisteredInvoices = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const limitParam = req.query.limit as string | undefined;
    const limit = limitParam ? parseInt(limitParam) : 100;
    const invoices = await Invoice.findRegisteredVerifactu(userId, limit);

    res.json({ invoices, count: invoices.length });
  } catch (error) {
    console.error('Error obteniendo facturas registradas:', error);
    res.status(500).json({ error: 'Error al obtener las facturas registradas' });
  }
};

export const getLogs = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const limitParam = req.query.limit as string | undefined;
    const limit = limitParam ? parseInt(limitParam) : 50;
    const logs = await VerifactuService.getLogs(userId, limit);

    res.json({ logs, count: logs.length });
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    res.status(500).json({ error: 'Error al obtener los logs de Verifactu' });
  }
};

export const verifyChain = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const result = await VerifactuService.verifyChain(userId);

    res.json(result);
  } catch (error) {
    console.error('Error verificando cadena:', error);
    res.status(500).json({ error: 'Error al verificar la cadena de facturas' });
  }
};

export const batchRegister = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id as string;
    const { invoiceIds } = req.body;

    const results = [];
    const errors = [];

    for (const invoiceId of invoiceIds) {
      try {
        const result = await VerifactuService.registerInvoice(invoiceId, userId);
        results.push({
          invoiceId,
          success: true,
          data: result
        });
      } catch (error: any) {
        errors.push({
          invoiceId,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      message: `Procesadas ${invoiceIds.length} facturas`,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Error en registro masivo:', error);
    res.status(500).json({ error: 'Error al registrar las facturas en lote' });
  }
};
