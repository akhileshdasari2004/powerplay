import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_DATA_PATH = path.join(__dirname, '../../../seed-data.json');

const STATUS_MAP = {
  Sent: 'pending',
  Unpaid: 'pending',
  Overdue: 'overdue',
  Paid: 'paid',
  Void: 'cancelled',
  Draft: 'draft',
};

const DEMO_USERS = [
  { email: 'admin@test.com', password: 'Admin@123', name: 'Admin User', role: 'admin' },
  { email: 'user@test.com', password: 'User@123', name: 'Demo User', role: 'user' },
];

const customerKey = (name, company) => `${name}|${company || ''}`;

function loadSeedInvoices() {
  if (!fs.existsSync(SEED_DATA_PATH)) {
    throw new Error(`Seed data file not found at ${SEED_DATA_PATH}`);
  }
  const rawData = fs.readFileSync(SEED_DATA_PATH, 'utf8');
  return JSON.parse(rawData);
}

async function seedUsers() {
  let imported = 0;
  let skipped = 0;

  for (const demoUser of DEMO_USERS) {
    const exists = await User.findOne({ email: demoUser.email });
    if (exists) {
      skipped += 1;
      continue;
    }
    await User.create(demoUser);
    imported += 1;
  }

  return { imported, skipped };
}

async function seedCustomersAndInvoices({ onlyIfEmpty = false } = {}) {
  const [customerCount, invoiceCount] = await Promise.all([
    Customer.countDocuments(),
    Invoice.countDocuments(),
  ]);

  if (onlyIfEmpty && customerCount > 0 && invoiceCount > 0) {
    console.log('  Customers: skipped (collection not empty)');
    console.log('  Invoices:  skipped (collection not empty)');
    return {
      customers: { imported: 0, skipped: customerCount },
      invoices: { imported: 0, skipped: invoiceCount },
    };
  }

  const seedInvoices = loadSeedInvoices();

  const existingCustomers = await Customer.find().select('name company').lean();
  const customerIdMap = new Map(
    existingCustomers.map((c) => [customerKey(c.name, c.company), c._id.toString()])
  );

  const uniqueCustomers = new Map();
  for (const inv of seedInvoices) {
    const key = customerKey(inv.customer, inv.company);
    if (!uniqueCustomers.has(key) && !customerIdMap.has(key)) {
      uniqueCustomers.set(key, { name: inv.customer, company: inv.company });
    }
  }

  let customersImported = 0;
  let customersSkipped = existingCustomers.length;

  if (uniqueCustomers.size > 0) {
    const inserted = await Customer.insertMany(Array.from(uniqueCustomers.values()), {
      ordered: false,
    });
    inserted.forEach((cust) => {
      customerIdMap.set(customerKey(cust.name, cust.company), cust._id.toString());
    });
    customersImported = inserted.length;
    customersSkipped = existingCustomers.length;
  }

  const existingInvoiceIds = new Set(
    (await Invoice.find().select('invoiceId').lean()).map((inv) => inv.invoiceId)
  );

  const invoicesToInsert = [];
  let invoicesSkipped = 0;

  for (const inv of seedInvoices) {
    if (existingInvoiceIds.has(inv.invoiceId)) {
      invoicesSkipped += 1;
      continue;
    }

    const key = customerKey(inv.customer, inv.company);
    const customerId = customerIdMap.get(key);
    if (!customerId) {
      invoicesSkipped += 1;
      continue;
    }

    invoicesToInsert.push({
      invoiceId: inv.invoiceId,
      customerId,
      amount: inv.amount,
      taxRate: inv.taxRate,
      tax: inv.tax,
      total: inv.total,
      status: STATUS_MAP[inv.status] || 'pending',
      issueDate: new Date(inv.issueDate),
      dueDate: new Date(inv.dueDate),
    });
  }

  let invoicesImported = 0;
  const BATCH_SIZE = 500;

  for (let i = 0; i < invoicesToInsert.length; i += BATCH_SIZE) {
    const batch = invoicesToInsert.slice(i, i + BATCH_SIZE);
    await Invoice.insertMany(batch, { ordered: false });
    invoicesImported += batch.length;
  }

  return {
    customers: { imported: customersImported, skipped: customersSkipped },
    invoices: { imported: invoicesImported, skipped: invoicesSkipped },
  };
}

export async function seedDatabase({ onlyIfEmpty = false, silent = false } = {}) {
  const log = silent ? () => {} : console.log;

  log('\n--- Database Seed ---');

  const users = await seedUsers();
  log(`  Users:     ${users.imported} imported, ${users.skipped} skipped`);

  const data = await seedCustomersAndInvoices({ onlyIfEmpty });
  log(
    `  Customers: ${data.customers.imported} imported, ${data.customers.skipped} skipped`
  );
  log(`  Invoices:  ${data.invoices.imported} imported, ${data.invoices.skipped} skipped`);
  log('  Analytics: derived from invoice data (no separate collection)');
  log('--- Seed Complete ---\n');

  return { users, ...data };
}

export default seedDatabase;
