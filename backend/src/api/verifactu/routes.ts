import express from 'express';
// @ts-ignore
import { body, param, query } from 'express-validator';
import { authenticateToken } from '../../middleware/auth.js';
import * as verifactuController from './controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/config', verifactuController.getConfig);

router.put('/config',
  [
    body('enabled').optional().isBoolean(),
    body('auto_register').optional().isBoolean(),
    body('software_nif').optional().isString(),
    body('software_name').optional().isString(),
    body('software_version').optional().isString(),
    body('test_mode').optional().isBoolean()
  ],
  verifactuController.validate,
  verifactuController.updateConfig
);

router.post('/register/:invoiceId',
  [
    param('invoiceId').isUUID()
  ],
  verifactuController.validate,
  verifactuController.registerInvoice
);

router.post('/cancel/:invoiceId',
  [
    param('invoiceId').isUUID(),
    body('reason').notEmpty().isString()
  ],
  verifactuController.validate,
  verifactuController.cancelInvoice
);

router.get('/status/:invoiceId',
  [
    param('invoiceId').isUUID()
  ],
  verifactuController.validate,
  verifactuController.getInvoiceStatus
);

router.get('/statistics', verifactuController.getStatistics);

router.get('/pending', verifactuController.getPendingInvoices);

router.get('/registered',
  [
    query('limit').optional().isInt({ min: 1, max: 500 })
  ],
  verifactuController.validate,
  verifactuController.getRegisteredInvoices
);

router.get('/logs',
  [
    query('limit').optional().isInt({ min: 1, max: 500 })
  ],
  verifactuController.validate,
  verifactuController.getLogs
);

router.get('/verify-chain', verifactuController.verifyChain);

router.post('/batch-register',
  [
    body('invoiceIds').isArray({ min: 1 }),
    body('invoiceIds.*').isUUID()
  ],
  verifactuController.validate,
  verifactuController.batchRegister
);

export default router;
