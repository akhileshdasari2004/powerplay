import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

customerSchema.index({ name: 1 });
customerSchema.index({ company: 1 });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;