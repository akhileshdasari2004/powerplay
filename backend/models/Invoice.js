import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  issueDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > this.issueDate;
      },
      message: 'Due date must be after issue date'
    }
  }
}, {
  timestamps: true
});

invoiceSchema.index({ invoiceId: 1 }, { unique: true });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ issueDate: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ customerId: 1, status: 1 });
invoiceSchema.index({ amount: 1 }); // For sorting by amount
invoiceSchema.index({ status: 1, dueDate: 1 }); // For filtering by status + sorting by dueDate
invoiceSchema.index({ customerId: 1, issueDate: -1 }); // For customer invoice history

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;