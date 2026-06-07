import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';

class InvoiceRepository {
  async findAll({ page = 1, limit = 10, filter = {}, sortOptions = { dueDate: 1 } }) {
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: filter },
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          invoiceId: 1,
          customerId: { _id: '$customer._id', name: '$customer.name', company: '$customer.company' },
          amount: 1,
          taxRate: 1,
          tax: 1,
          total: 1,
          status: 1,
          issueDate: 1,
          dueDate: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    const [invoices, total] = await Promise.all([
      Invoice.aggregate(pipeline),
      Invoice.countDocuments(filter),
    ]);

    return { invoices, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findById(id) {
    const results = await Invoice.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          invoiceId: 1,
          customerId: { _id: '$customer._id', name: '$customer.name', company: '$customer.company' },
          amount: 1,
          taxRate: 1,
          tax: 1,
          total: 1,
          status: 1,
          issueDate: 1,
          dueDate: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
    return results[0] || null;
  }

  async create(invoiceData) {
    return Invoice.create(invoiceData);
  }

  async updateById(id, updateData) {
    const results = await Invoice.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!results) return null;

    const updated = await this.findById(id);
    return updated;
  }

  async deleteById(id) {
    return Invoice.findByIdAndDelete(id);
  }

  async existsById(id) {
    const count = await Invoice.countDocuments({ _id: id });
    return count > 0;
  }

  async count(filter = {}) {
    return Invoice.countDocuments(filter);
  }

  async aggregate(pipeline) {
    return Invoice.aggregate(pipeline);
  }
}

export default new InvoiceRepository();