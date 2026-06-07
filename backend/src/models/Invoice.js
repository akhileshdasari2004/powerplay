import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    taxRate: {
      type: Number,
      required: [true, 'Tax rate is required'],
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100'],
      default: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
        message: 'Invalid status. Must be one of: draft, pending, paid, overdue, cancelled',
      },
      default: 'draft',
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      validate: {
        validator: function (v) {
          return v > this.issueDate;
        },
        message: 'Due date must be after issue date',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Note: unique: true on field definition creates index automatically
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ issueDate: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ customerId: 1, status: 1 });
invoiceSchema.index({ amount: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ customerId: 1, issueDate: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
