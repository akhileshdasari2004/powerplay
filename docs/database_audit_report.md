# Database Audit Report

**Project:** PowerPlay Invoice Dashboard
**Date:** 2026-06-07
**Auditor:** Staff QA Engineer

---

## Schema Overview

### Customer Schema

```javascript
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  company: { type: String, trim: true }
}, {
  timestamps: true  // adds createdAt, updatedAt
});

// Indexes:
customerSchema.index({ name: 1 });
customerSchema.index({ company: 1 });
```

### Invoice Schema

```javascript
const invoiceSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true },
  customerId: { type: ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, required: true, min: 0, max: 100, default: 0 },
  tax: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'], default: 'draft' },
  issueDate: { type: Date, required: true },
  dueDate: { type: Date, required: true }
}, {
  timestamps: true
});

// Indexes:
invoiceSchema.index({ invoiceId: 1 }, { unique: true });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ issueDate: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ customerId: 1, status: 1 });
```

---

## ISSUES IDENTIFIED

### 1. Missing Index: Customer Search with Case-Insensitive Regex

**Location:** `CustomerService.js` - `getCustomers()` method

**Query Pattern:**
```javascript
filter.$or = [
  { name: { $regex: search, $options: 'i' } },
  { company: { $regex: search, $options: 'i' } }
];
```

**Issue:** `$options: 'i'` (case-insensitive) regex queries cannot use standard B-tree indexes. These queries will perform collection scans.

**Severity:** Medium
**Recommendation:** Create a text index or use case-insensitive collation. For large datasets, consider storing a lowercase normalized field.

```javascript
// Option A: Text index (allows $text search)
customerSchema.index({ name: 'text', company: 'text' });

// Option B: Collation with case-insensitive index
customerSchema.index({ name: 1 }, { collation: { locale: 'en', strength: 2 } });
```

---

### 2. Missing Compound Index: Customer Name + Company

**Location:** `CustomerService.js` - `getCustomers()` and potential future queries

**Issue:** No compound index for queries that filter/sort by both name and company.

**Severity:** Low
**Recommendation:**
```javascript
customerSchema.index({ name: 1, company: 1 });
```

---

### 3. No Index for Date Range Queries

**Location:** `InvoiceService.js` - `getInvoices()` method

**Query Pattern:**
```javascript
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
```

**Issue:** Range queries on `issueDate` and `dueDate` individually don't have compound indexes to support combined filtering efficiently.

**Severity:** Medium
**Recommendation:** Add compound indexes:
```javascript
invoiceSchema.index({ issueDate: 1, dueDate: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
```

---

### 4. Missing Index: Sort by Issue Date

**Location:** `InvoiceService.js` - `getInvoices()` method with `sortBy: 'issueDate'`

**Issue:** The sort options only cover `amount` and `dueDate`:
```javascript
const sortOptions = {};
if (sortBy === 'amount') {
  sortOptions.amount = sortOrder === 'asc' ? 1 : -1;
} else if (sortBy === 'dueDate') {
  sortOptions.dueDate = sortOrder === 'asc' ? 1 : -1;
}
```

**Severity:** Low
**Impact:** Sorting by `issueDate` performs an in-memory sort without index support.

---

### 5. Potential N+1 Query: getCustomerWithInvoices

**Location:** `CustomerService.js` - `getCustomerWithInvoices()`

**Code:**
```javascript
async getCustomerWithInvoices(id) {
  const customer = await Customer.findById(id);
  if (!customer) return null;

  const invoices = await Invoice.find({ customerId: id })
    .sort({ issueDate: -1 })
    .select('invoiceId amount tax total status issueDate dueDate');

  return { customer, invoices };
}
```

**Issue:** This is actually a well-optimized query with proper use of `select()`. However, the pattern of "fetch customer, then fetch related invoices" is susceptible to N+1 if extended to list multiple customers.

**Severity:** Low (acceptable for single-customer view)
**Note:** This pattern is fine for the current use case but should be refactored with `$lookup` if displaying multiple customers with their invoices on the same page.

---

### 6. Aggregation Pipeline Efficiency: getSummary()

**Location:** `AnalyticsService.js` - `getSummary()`

**Current Implementation:**
```javascript
async getSummary() {
  const [totalInvoices, totalRevenue, statusBreakdown] = await Promise.all([
    Invoice.countDocuments(),
    Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
    Invoice.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$total' } } }
    ])
  ]);
  // ...
}
```

**Issue:** Three separate database round trips. The first two aggregations could be combined.

**Severity:** Low
**Recommendation:** Use `$facet` to compute all metrics in a single aggregation:
```javascript
Invoice.aggregate([
  {
    $facet: {
      totalInvoices: [{ $count: 'count' }],
      totalRevenue: [{ $group: { _id: null, total: { $sum: '$total' } } }],
      statusBreakdown: [{ $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$total' } } }]
    }
  }
]);
```

---

### 7. Aggregation Pipeline: getTopCustomers() - Unindexed Sort

**Location:** `CustomerService.js` - `getTopCustomers()`

**Query:**
```javascript
Invoice.aggregate([
  { $group: { _id: '$customerId', totalAmount: { $sum: '$total' }, invoiceCount: { $sum: 1 } } },
  { $sort: { totalAmount: -1 } },  // Sorting on computed field
  { $limit: limit },
  { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
  { $unwind: '$customer' },
  // ...
])
```

**Issue:** `$sort` is performed on a computed field (`totalAmount`) which requires processing all invoices before sorting. With large invoice collections, this is expensive.

**Severity:** Medium
**Recommendation:** Consider maintaining a denormalized `totalAmount` field on Customer schema with incremental updates, or accept the aggregation cost for now.

---

### 8. Missing Unique Constraint: Customer Name

**Location:** `Customer.js` model

**Issue:** Customer `name` field has no unique constraint. Two customers can have the same name.

**Severity:** Low
**Impact:** Ambiguous results in `getTopCustomers()` when displaying customer names.

---

### 9. No TTL Index for Automatic Cleanup

**Issue:** Invoice data grows indefinitely. There's no TTL (Time-To-Live) index on any field for automatic archival or cleanup.

**Severity:** Low (business decision)
**Recommendation:** If invoices need archival, add:
```javascript
invoiceSchema.index({ issueDate: 1 }, { expireAfterSeconds: 31536000 }); // 1 year TTL
```

---

### 10. Missing Partial Index: Overdue Invoices

**Issue:** Common query pattern filters for `overdue` status invoices, but there's no partial index to optimize this.

**Severity:** Low
**Recommendation:**
```javascript
invoiceSchema.index(
  { dueDate: 1 },
  { partialFilterExpression: { status: { $in: ['pending', 'overdue'] } } }
);
```

---

## INDEX COVERAGE SUMMARY

### Customer Collection

| Query Pattern | Indexed? |
|---------------|----------|
| Find by `_id` | Yes (primary) |
| Find by `name` (exact) | Yes |
| Find by `company` (exact) | Yes |
| Search by name (regex, case-insensitive) | **No** |
| Search by company (regex, case-insensitive) | **No** |

### Invoice Collection

| Query Pattern | Indexed? |
|---------------|----------|
| Find by `_id` | Yes (primary) |
| Find by `invoiceId` (unique) | Yes |
| Filter by `customerId` | Yes |
| Filter by `status` | Yes |
| Filter by `issueDate` range | Yes (single field, no compound) |
| Filter by `dueDate` range | Yes (single field, no compound) |
| Filter by `customerId` + `status` | Yes (compound) |
| Sort by `dueDate` | Yes |
| Sort by `amount` | Yes |
| Sort by `issueDate` | **No** |
| Filter + Sort combinations | **No** |

---

## VALIDATION ISSUES

### 1. Schema Validation Gaps

**Invoice Schema:**
- `min: 0` on `amount`, `tax`, `total` is good
- `min: 0, max: 100` on `taxRate` is good
- No validation that `total === amount + tax`
- No validation that `dueDate > issueDate`
- No validation that `status` transitions are legal

**Severity:** Medium
**Recommendation:** Add custom validation:
```javascript
invoiceSchema.pre('save', function(next) {
  if (this.total !== this.amount + this.tax) {
    return next(new Error('Total must equal amount plus tax'));
  }
  if (this.dueDate <= this.issueDate) {
    return next(new Error('Due date must be after issue date'));
  }
  next();
});
```

---

### 2. No Cascade Delete

**Issue:** Deleting a customer leaves orphaned invoices with references to non-existent customer.

**Severity:** Medium
**Recommendation:** Add middleware or handle at application layer:
```javascript
customerSchema.pre('deleteOne', { document: true, query: false }, async function() {
  await Invoice.deleteMany({ customerId: this._id });
});
```

---

## SUMMARY TABLE

| Category | Count | Severity |
|----------|-------|----------|
| Missing indexes (search) | 2 | Medium |
| Missing indexes (sort) | 1 | Low |
| Missing compound indexes | 2 | Medium |
| N+1 query risk | 1 | Low |
| Aggregation inefficiency | 2 | Low |
| Missing validation | 2 | Medium |
| Missing cascade delete | 1 | Medium |
| Missing unique constraint | 1 | Low |

**Total Issues:** 12
**High Priority:** 0
**Medium Priority:** 6
**Low Priority:** 6

---

## RECOMMENDATIONS

### Immediate Actions
1. Add text index or case-insensitive collation for customer name/company search
2. Add validation that `total === amount + tax` at schema level
3. Add validation that `dueDate > issueDate`

### Short-term
4. Add compound indexes for common filter combinations
5. Implement cascade delete for customer → invoices
6. Refactor `getSummary()` to use `$facet`

### Long-term
7. Consider denormalized `totalAmount` on Customer for faster analytics
8. Implement pagination for large result sets in aggregations
9. Add TTL index strategy for data lifecycle management