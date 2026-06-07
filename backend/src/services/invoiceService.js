import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { invoiceRepository, customerRepository } from '../repositories/index.js';
import ApiError from '../utils/ApiError.js';

class InvoiceService {
  async getInvoices({
    page = 1,
    limit = 10,
    status,
    customerId,
    issueDateFrom,
    issueDateTo,
    dueDateFrom,
    dueDateTo,
    sortBy = 'dueDate',
    sortOrder = 'asc',
  }) {
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (customerId) {
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        throw ApiError.badRequest('Invalid customer ID format');
      }
      filter.customerId = customerId;
    }

    if (issueDateFrom || issueDateTo) {
      filter.issueDate = {};
      if (issueDateFrom) filter.issueDate.$gte = new Date(issueDateFrom);
      if (issueDateTo) filter.issueDate.$lte = new Date(issueDateTo);
    }

    if (dueDateFrom || dueDateTo) {
      filter.dueDate = {};
      if (dueDateFrom) filter.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) filter.dueDate.$lte = new Date(dueDateTo);
    }

    const sortOptions = {};
    if (sortBy === 'amount') {
      sortOptions.amount = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'dueDate') {
      sortOptions.dueDate = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'issueDate') {
      sortOptions.issueDate = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.dueDate = 1;
    }

    return invoiceRepository.findAll({ page, limit, filter, sortOptions });
  }

  async getInvoiceById(id) {
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }
    return invoice;
  }

  async createInvoice(data) {
    const customerExists = await customerRepository.existsById(data.customerId);
    if (!customerExists) {
      throw ApiError.badRequest('Customer not found');
    }

    const { amount, taxRate } = data;
    const tax = (amount * taxRate) / 100;
    const total = amount + tax;
    const invoiceId = `INV-${uuidv4().split('-')[0].toUpperCase()}`;

    return invoiceRepository.create({
      ...data,
      invoiceId,
      tax,
      total,
    });
  }

  async updateInvoice(id, data) {
    const existingInvoice = await invoiceRepository.findById(id);
    if (!existingInvoice) {
      throw ApiError.notFound('Invoice not found');
    }

    if (data.customerId) {
      const customerExists = await customerRepository.existsById(data.customerId);
      if (!customerExists) {
        throw ApiError.badRequest('Customer not found');
      }
    }

    if (data.amount !== undefined || data.taxRate !== undefined) {
      const amount = data.amount ?? existingInvoice.amount;
      const taxRate = data.taxRate ?? existingInvoice.taxRate;
      data.tax = (amount * taxRate) / 100;
      data.total = amount + data.tax;
    }

    return invoiceRepository.updateById(id, data);
  }

  async deleteInvoice(id) {
    const invoice = await invoiceRepository.deleteById(id);
    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }
    return { message: 'Invoice deleted successfully' };
  }
}

export default new InvoiceService();