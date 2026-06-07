import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';
import { v4 as uuidv4 } from 'uuid';

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
    sortOrder = 'asc'
  }) {
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (customerId) {
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
    }

    const skip = (page - 1) * limit;

    // Use aggregation with $lookup to avoid N+1 queries (single round-trip)
    const [invoices, total] = await Promise.all([
      Invoice.aggregate([
        { $match: filter },
        { $sort: sortOptions },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customerId'
          }
        },
        { $unwind: { path: '$customerId', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            invoiceId: 1,
            customerId: { _id: '$customerId._id', name: '$customerId.name', company: '$customerId.company' },
            amount: 1,
            taxRate: 1,
            tax: 1,
            total: 1,
            status: 1,
            issueDate: 1,
            dueDate: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ]),
      Invoice.countDocuments(filter)
    ]);

    return {
      invoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getInvoiceById(id) {
    const results = await Invoice.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customerId'
        }
      },
      { $unwind: { path: '$customerId', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          invoiceId: 1,
          customerId: { _id: '$customerId._id', name: '$customerId.name', company: '$customerId.company' },
          amount: 1,
          taxRate: 1,
          tax: 1,
          total: 1,
          status: 1,
          issueDate: 1,
          dueDate: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);
    return results[0] || null;
  }

  async createInvoice(data) {
    const invoiceId = `INV-${uuidv4().split('-')[0].toUpperCase()}`;
    const { amount, taxRate } = data;
    const tax = (amount * taxRate) / 100;
    const total = amount + tax;

    return Invoice.create({ ...data, invoiceId, tax, total });
  }

  async updateInvoice(id, data) {
    if (data.amount !== undefined || data.taxRate !== undefined) {
      const current = await Invoice.findById(id);
      if (!current) return null;
      const amount = data.amount ?? current.amount;
      const taxRate = data.taxRate ?? current.taxRate;
      data.tax = (amount * taxRate) / 100;
      data.total = amount + data.tax;
    }

    await Invoice.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    
    // Use aggregation to fetch updated invoice with customer (avoids N+1)
    const results = await Invoice.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customerId'
        }
      },
      { $unwind: { path: '$customerId', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          invoiceId: 1,
          customerId: { _id: '$customerId._id', name: '$customerId.name', company: '$customerId.company' },
          amount: 1,
          taxRate: 1,
          tax: 1,
          total: 1,
          status: 1,
          issueDate: 1,
          dueDate: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);
    return results[0] || null;
  }

  async deleteInvoice(id) {
    return Invoice.findByIdAndDelete(id);
  }
}

export default new InvoiceService();