import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATUS_MAP = {
  Sent: 'pending',
  Unpaid: 'pending',
  Overdue: 'overdue',
  Paid: 'paid',
  Void: 'cancelled',
  Draft: 'draft'
};

async function seed() {
  const dataPath = path.join(__dirname, '../../seed-data.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const invoices = JSON.parse(rawData);

  // 1. Extract unique customers
  const customerMap = new Map();
  for (const inv of invoices) {
    const key = `${inv.customer}|${inv.company}`;
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        name: inv.customer,
        company: inv.company
      });
    }
  }

  // 2. Insert customers and create mapping
  const customerIdMap = new Map();
  const customers = Array.from(customerMap.values());

  console.log(`Inserting ${customers.length} customers...`);
  const insertedCustomers = await Customer.insertMany(customers, { ordered: false });

  insertedCustomers.forEach((cust, i) => {
    const key = `${cust.name}|${cust.company}`;
    customerIdMap.set(key, cust._id);
  });

  // 3. Prepare invoices with mapped customerIds
  const invoicesToInsert = invoices.map(inv => {
    const customerKey = `${inv.customer}|${inv.company}`;
    return {
      invoiceId: inv.invoiceId,
      customerId: customerIdMap.get(customerKey),
      amount: inv.amount,
      taxRate: inv.taxRate,
      tax: inv.tax,
      total: inv.total,
      status: STATUS_MAP[inv.status] || inv.status,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate
    };
  });

  console.log(`Inserting ${invoicesToInsert.length} invoices...`);
  await Invoice.insertMany(invoicesToInsert, { ordered: false });

  console.log('Seed complete.');
  console.log(`Customers: ${insertedCustomers.length}`);
  console.log(`Invoices: ${invoicesToInsert.length}`);
}

export default seed;