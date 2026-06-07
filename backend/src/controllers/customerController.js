import { customerService } from '../services/index.js';
import catchAsync from '../utils/catchAsync.js';

const getCustomers = catchAsync(async (req, res) => {
  const { page, limit, search } = req.query;
  const result = await customerService.getCustomers({
    page: page ? parseInt(page, 10) : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
    search,
  });
  res.status(200).json({
    status: 'success',
    data: result,
  });
});

const getCustomerById = catchAsync(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { customer },
  });
});

const createCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  res.status(201).json({
    status: 'success',
    data: { customer },
  });
});

const updateCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: { customer },
  });
});

const deleteCustomer = catchAsync(async (req, res) => {
  await customerService.deleteCustomer(req.params.id);
  res.status(204).send();
});

const getCustomerWithInvoices = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await customerService.getCustomerWithInvoices(req.params.id, {
    page: page ? parseInt(page, 10) : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
  });
  res.status(200).json({
    status: 'success',
    data: result,
  });
});

const getTopCustomers = catchAsync(async (req, res) => {
  const { limit = 5 } = req.query;
  const customers = await customerService.getTopCustomers(parseInt(limit, 10));
  res.status(200).json({
    status: 'success',
    data: { customers },
  });
});

export {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerWithInvoices,
  getTopCustomers,
};
export default {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerWithInvoices,
  getTopCustomers,
};