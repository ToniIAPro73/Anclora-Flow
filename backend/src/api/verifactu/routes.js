const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const VerifactuService = require('../../services/verifactu.service');
const Invoice = require('../../models/Invoice');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /api/verifactu/config - Get Verifactu configuration
router.get('/config', async (req, res) => {
  try {
    const config = await VerifactuService.getConfig(req.user.id);

    if (!config) {
      return res.status(404).json({ error: 'Configuración de Verifactu no encontrada' });
    }

    // No enviar datos sensibles al frontend
    const safeConfig = {
      enabled: config.enabled,
      auto_register: config.auto_register,
      software_nif: config.software_nif,
      software_name: config.software_name,
      software_version: config.software_version,
      test_mode: config.test_mode,
      last_chain_index: config.last_chain_index,
      has_certificate: !!config.certificate_path
    };

    res.json(safeConfig);
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({ error: 'Error al obtener la configuración de Verifactu' });
  }
});

// PUT /api/verifactu/config - Update Verifactu configuration
router.put('/config',
  [
    body('enabled').optional().isBoolean(),
    body('auto_register').optional().isBoolean(),
    body('software_nif').optional().isString(),
    body('software_name').optional().isString(),
    body('software_version').optional().isString(),
    body('test_mode').optional().isBoolean()
  ],
  validate,
  async (req, res) => {
    try {
      const config = await VerifactuService.updateConfig(req.user.id, req.body);

      const safeConfig = {
        enabled: config.enabled,
        auto_register: config.auto_register,
        software_nif: config.software_nif,
        software_name: config.software_name,
        software_version: config.software_version,
        test_mode: config.test_mode,
        last_chain_index: config.last_chain_index
      };

      res.json({
        message: 'Configuración actualizada correctamente',
        config: safeConfig
      });
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      res.status(500).json({ error: 'Error al actualizar la configuración de Verifactu' });
    }
  }
);

// POST /api/verifactu/register/:invoiceId - Register invoice in Verifactu
router.post('/register/:invoiceId',
  [
    param('invoiceId').isUUID()
  ],
  validate,
  async (req, res) => {
    try {
      const { invoiceId } = req.params;

      // Verificar que la factura existe y pertenece al usuario
      const invoice = await Invoice.findById(invoiceId, req.user.id);

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
      const result = await VerifactuService.registerInvoice(invoiceId, req.user.id);

      res.json({
        message: 'Factura registrada en Verifactu correctamente',
        data: result
      });
    } catch (error) {
      console.error('Error registrando factura:', error);
      res.status(500).json({ error: error.message || 'Error al registrar la factura en Verifactu' });
    }
  }
);

// POST /api/verifactu/cancel/:invoiceId - Cancel invoice in Verifactu
router.post('/cancel/:invoiceId',
  [
    param('invoiceId').isUUID(),
    body('reason').notEmpty().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const { reason } = req.body;

      const result = await VerifactuService.cancelInvoice(invoiceId, req.user.id, reason);

      res.json(result);
    } catch (error) {
      console.error('Error cancelando factura:', error);
      res.status(500).json({ error: error.message || 'Error al cancelar la factura en Verifactu' });
    }
  }
);

// GET /api/verifactu/status/:invoiceId - Get Verifactu status of invoice
router.get('/status/:invoiceId',
  [
    param('invoiceId').isUUID()
  ],
  validate,
  async (req, res) => {
    try {
      const { invoiceId } = req.params;

      const status = await Invoice.getVerifactuStatus(invoiceId, req.user.id);

      if (!status) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      res.json(status);
    } catch (error) {
      console.error('Error obteniendo estado:', error);
      res.status(500).json({ error: 'Error al obtener el estado de Verifactu' });
    }
  }
);

// GET /api/verifactu/statistics - Get Verifactu statistics
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await Invoice.getVerifactuStatistics(req.user.id);

    res.json(statistics);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener las estadísticas de Verifactu' });
  }
});

// GET /api/verifactu/pending - Get invoices pending registration
router.get('/pending', async (req, res) => {
  try {
    const invoices = await Invoice.findPendingVerifactu(req.user.id);

    res.json({ invoices, count: invoices.length });
  } catch (error) {
    console.error('Error obteniendo facturas pendientes:', error);
    res.status(500).json({ error: 'Error al obtener las facturas pendientes' });
  }
});

// GET /api/verifactu/registered - Get registered invoices
router.get('/registered',
  [
    query('limit').optional().isInt({ min: 1, max: 500 })
  ],
  validate,
  async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 100;
      const invoices = await Invoice.findRegisteredVerifactu(req.user.id, limit);

      res.json({ invoices, count: invoices.length });
    } catch (error) {
      console.error('Error obteniendo facturas registradas:', error);
      res.status(500).json({ error: 'Error al obtener las facturas registradas' });
    }
  }
);

// GET /api/verifactu/logs - Get Verifactu logs
router.get('/logs',
  [
    query('limit').optional().isInt({ min: 1, max: 500 })
  ],
  validate,
  async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const logs = await VerifactuService.getLogs(req.user.id, limit);

      res.json({ logs, count: logs.length });
    } catch (error) {
      console.error('Error obteniendo logs:', error);
      res.status(500).json({ error: 'Error al obtener los logs de Verifactu' });
    }
  }
);

// GET /api/verifactu/verify-chain - Verify integrity of invoice chain
router.get('/verify-chain', async (req, res) => {
  try {
    const result = await VerifactuService.verifyChain(req.user.id);

    res.json(result);
  } catch (error) {
    console.error('Error verificando cadena:', error);
    res.status(500).json({ error: 'Error al verificar la cadena de facturas' });
  }
});

// POST /api/verifactu/batch-register - Register multiple invoices
router.post('/batch-register',
  [
    body('invoiceIds').isArray({ min: 1 }),
    body('invoiceIds.*').isUUID()
  ],
  validate,
  async (req, res) => {
    try {
      const { invoiceIds } = req.body;

      const results = [];
      const errors = [];

      for (const invoiceId of invoiceIds) {
        try {
          const result = await VerifactuService.registerInvoice(invoiceId, req.user.id);
          results.push({
            invoiceId,
            success: true,
            data: result
          });
        } catch (error) {
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
  }
);

module.exports = router;
