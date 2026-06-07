import express from 'express';
import { invoiceController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';
import { validateInvoice, validateIdParam, validateInvoiceQuery } from '../middleware/validator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', validateInvoiceQuery, invoiceController.getInvoices);
router.get('/:id', validateIdParam('id'), invoiceController.getInvoiceById);
router.post('/', validateInvoice, invoiceController.createInvoice);
router.put('/:id', validateIdParam('id'), validateInvoice, invoiceController.updateInvoice);
router.delete('/:id', validateIdParam('id'), invoiceController.deleteInvoice);

export default router;