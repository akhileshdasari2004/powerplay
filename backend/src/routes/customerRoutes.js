import express from 'express';
import { customerController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';
import { validateCustomer, validateIdParam } from '../middleware/validator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', customerController.getCustomers);
router.get('/top', customerController.getTopCustomers);
router.get('/:id', validateIdParam('id'), customerController.getCustomerById);
router.get('/:id/invoices', validateIdParam('id'), customerController.getCustomerWithInvoices);
router.post('/', validateCustomer, customerController.createCustomer);
router.put('/:id', validateIdParam('id'), validateCustomer, customerController.updateCustomer);
router.delete('/:id', validateIdParam('id'), customerController.deleteCustomer);

export default router;