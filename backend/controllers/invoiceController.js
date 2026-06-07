import invoiceService from '../services/InvoiceService.js';

const getInvoices = async (req, res) => {
  try {
    const {
      page, limit, status, customerId,
      issueDateFrom, issueDateTo, dueDateFrom, dueDateTo, sortBy, sortOrder
    } = req.query;

    const result = await invoiceService.getInvoices({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status, customerId,
      issueDateFrom, issueDateTo, dueDateFrom, dueDateTo,
      sortBy, sortOrder
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.createInvoice(req.body);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.deleteInvoice(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice };