import { invoiceService } from '../services/index.js';
import catchAsync from '../utils/catchAsync.js';

const getInvoices = catchAsync(async (req, res) => {
  const {
    page,
    limit,
    status,
    customerId,
    issueDateFrom,
    issueDateTo,
    dueDateFrom,
    dueDateTo,
    sortBy,
    sortOrder,
  } = req.query;

  const result = await invoiceService.getInvoices({
    page: page ? parseInt(page, 10) : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
    status,
    customerId,
    issueDateFrom,
    issueDateTo,
    dueDateFrom,
    dueDateTo,
    sortBy,
    sortOrder,
  });

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

const getInvoiceById = catchAsync(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { invoice },
  });
});

const createInvoice = catchAsync(async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.body);
  res.status(201).json({
    status: 'success',
    data: { invoice },
  });
});

const updateInvoice = catchAsync(async (req, res) => {
  const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: { invoice },
  });
});

const deleteInvoice = catchAsync(async (req, res) => {
  await invoiceService.deleteInvoice(req.params.id);
  res.status(204).send();
});

export { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice };
export default { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice };