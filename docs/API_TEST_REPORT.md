# API Test Report

**Date:** 2026-06-07
**Auditor:** Staff QA Engineer
**Base URL:** http://localhost:5000/api

---

## Test Summary

| Category | Passed | Failed | Total |
|----------|--------|--------|-------|
| Invoice Endpoints | 0 | 0 | 0 |
| Customer Endpoints | 0 | 0 | 0 |
| Analytics Endpoints | 0 | 0 | 0 |
| **TOTAL** | **0** | **0** | **0** |

> **NOTE:** Live API testing requires running backend server and MongoDB instance.
> Manual testing required to verify actual behavior.

---

## 1. Invoice Endpoints

### 1.1 GET /api/invoices

**Purpose:** List invoices with pagination and filtering

| Test Case | Method | Input | Expected | Status |
|-----------|--------|-------|----------|--------|
| List default | GET | none | Paginated list | MANUAL |
| Pagination | GET | ?page=1&limit=10 | 10 results | MANUAL |
| Filter by status | GET | ?status=paid | Filtered list | MANUAL |
| Filter by customer | GET | ?customerId=xxx | Customer invoices | MANUAL |
| Filter by date range | GET | ?issueDateFrom=...&issueDateTo=... | Date filtered | MANUAL |
| Sort by amount | GET | ?sortBy=amount&sortOrder=desc | Sorted desc | MANUAL |
| Invalid page | GET | ?page=-1 | Error 500 | MANUAL |
| Invalid limit | GET | ?limit=abc | Error 500 | MANUAL |

**Missing Tests:**
- N+1 query detection (populate)
- Large result set performance
- Missing authorization

---

### 1.2 GET /api/invoices/:id

**Purpose:** Get single invoice by ID

| Test Case | Method | Input | Expected | Status |
|-----------|--------|-------|----------|--------|
| Valid ID | GET | /valid-objectid | Invoice object | MANUAL |
| Invalid ID format | GET | /invalid | CastError | MANUAL |
| Non-existent ID | GET | /000000000000000000000000 | 404 Not Found | MANUAL |

---

### 1.3 POST /api/invoices

**Purpose:** Create new invoice

| Test Case | Method | Input | Expected | Status |
|-----------|--------|-------|----------|--------|
| Valid invoice | POST | Full valid body | 201 Created | MANUAL |
| Missing required field | POST | No customerId | 400 Error | MANUAL |
| Invalid customerId ref | POST | Bad ObjectId | 400 Error | MANUAL |
| Negative amount | POST | amount: -100 | 400 Error | MANUAL |
| Amount zero | POST | amount: 0 | 201 Created | MANUAL |
| Tax rate > 100 | POST | taxRate: 150 | 400 Error | MANUAL |
| Invalid status | POST | status: 'invalid' | 400 Error | MANUAL |
| Empty body | POST | {} | 400 Error | MANUAL |
| Large payload | POST | 1MB data | Timeout/Error | MANUAL |

**Validation Gaps:**
- No string length limits on name fields
- No SQL injection protection (though using MongoDB)
- No XSS sanitization on string inputs

---

### 1.4 PUT /api/invoices/:id

**Purpose:** Update existing invoice

| Test Case | Method | Input | Expected | Status |
|-----------|--------|-------|----------|--------|
| Valid update | PUT | Partial body | Updated object | MANUAL |
| Update with recalc | PUT | {amount: 100, taxRate: 10} | Recalculated tax/total | MANUAL |
| Update non-existent | PUT | /non-existent | 404 Error | MANUAL |
| Update to invalid status | PUT | {status: 'invalid'} | 400 Error | MANUAL |
| Partial update | PUT | {status: 'paid'} | Only status updated | MANUAL |

---

### 1.5 DELETE /api/invoices/:id

**Purpose:** Delete invoice

| Test Case | Method | Input | Expected | Status |
|-----------|--------|-------|----------|--------|
| Delete existing | DELETE | /valid-id | 200 + message | MANUAL |
| Delete non-existent | DELETE | /000000000000000000000000 | 404 Error | MANUAL |
| Delete with invalid ID | DELETE | /invalid-id | 400 CastError | MANUAL |

---

## 2. Customer Endpoints

### 2.1 GET /api/customers

**Purpose:** List customers with pagination and search

| Test Case | Method | Input | Expected | Status |
|-----------|--------|-------|----------|--------|
| List default | GET | none | Paginated list | MANUAL |
| Search by name | GET | ?search=John | Filtered results | MANUAL |
| Search by company | GET | ?search=Acme | Filtered results | MANUAL |
| Combined pagination | GET | ?page=2&limit=20 | Page 2 | MANUAL |

**Security Note:** `$regex` search with 'i' option could be exploited for ReDoS with specially crafted patterns

---

### 2.2 GET /api/customers/:id

**Purpose:** Get single customer

| Test Case | Method | Input | Expected | Status |
|-----------|--------|-------|----------|--------|
| Valid ID | GET | /valid-objectid | Customer object | MANUAL |
| Invalid ID | GET | /invalid | CastError | MANUAL |
| Non-existent | GET | /000000000000000000000000 | 404 Not Found | MANUAL |

---

### 2.3 POST /api/customers

**Purpose:** Create customer

| Test Case | Method | Input | Expected | Status |
|-----------|--------|-------|----------|--------|
| Valid customer | POST | {name: "John", company: "Acme"} | 201 Created | MANUAL |
| Name only | POST | {name: "John"} | 201 Created | MANUAL |
| Empty name | POST | {name: ""} | 400 Error | MANUAL |
| Missing name | POST | {company: "Acme"} | 400 Error | MANUAL |
| Duplicate name | POST | {name: "Existing"} | 201 (no unique constraint) | MANUAL |

---

### 2.4 PUT /api/customers/:id

**Purpose:** Update customer

| Test Case | Method | Input | Expected | Status |
|-----------|--------|-------|----------|--------|
| Valid update | PUT | {name: "New Name"} | Updated customer | MANUAL |
| Update non-existent | PUT | /non-existent | 404 Error | MANUAL |

---

### 2.5 DELETE /api/customers/:id

**Purpose:** Delete customer

| Test Case | Method | Input | Expected | Status |
|-----------|--------|-------|----------|--------|
| Delete existing | DELETE | /valid-id | 200 + message | MANUAL |
| Delete with invoices | DELETE | /customer-with-invoices | Should warn or cascade | MANUAL |

**CRITICAL:** No cascade delete - orphaned invoices remain

---

### 2.6 GET /api/customers/:id/invoices

**Purpose:** Get customer with their invoices

| Test Case | Method | Input | Expected | Status |
|-----------|--------|-------|----------|--------|
| Valid customer | GET | /valid-id | Customer + invoices array | MANUAL |
| Non-existent | GET | /non-existent | 404 Error | MANUAL |

---

## 3. Analytics Endpoints

### 3.1 GET /api/analytics/summary

**Purpose:** Get invoice analytics summary

| Test Case | Method | Input | Expected | Status |
|-----------|--------|-------|----------|--------|
| Default call | GET | none | Summary object | MANUAL |
| Empty database | GET | (no invoices) | Zero values | MANUAL |

**Aggregation Pipeline Issues:**
- No index hints for $group operations
- Could be slow with millions of records

---

### 3.2 GET /api/analytics/top-customers

**Purpose:** Get top customers by revenue

| Test Case | Method | Input | Expected | Status |
|-----------|--------|-------|----------|--------|
| Default (5) | GET | none | Top 5 customers | MANUAL |
| Custom limit | GET | ?limit=10 | Top 10 customers | MANUAL |
| Zero limit | GET | ?limit=0 | Empty array | MANUAL |
| Negative limit | GET | ?limit=-1 | Empty/error | MANUAL |

---

## 4. Health Endpoint

### GET /health

**Purpose:** Server health check

| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| When healthy | none | {status: "ok", database: "connected"} | MANUAL |
| When DB down | (DB disconnected) | {status: "error", database: "disconnected"} | MANUAL |

---

## 5. Error Handling Gaps

| Issue | Severity | Description |
|-------|----------|-------------|
| No 404 for unknown routes | MEDIUM | Unknown routes return default 404 |
| No 500 error details | LOW | Errors return generic message |
| No validation errors detail | MEDIUM | Mongoose validation errors not formatted |
| No retry on connection loss | HIGH | No automatic reconnection logic |

---

## 6. API Documentation Gaps

| Missing | Impact |
|---------|--------|
| No OpenAPI/Swagger | High - can't generate clients |
| No Postman collection | Medium - harder to test |
| No API versioning | High - breaking changes can't be deployed |
| No deprecation headers | Medium - clients can't anticipate changes |

---

## Test Execution Requirements

To execute manual tests:

```bash
# Start backend
cd /Users/akhildasari/Downloads/powerplay/backend
npm start

# Test endpoints
curl http://localhost:5000/health
curl http://localhost:5000/api/invoices
curl http://localhost:5000/api/customers
curl http://localhost:5000/api/analytics/summary
```

---

## Verdict

**API testing incomplete - requires running server**

The API structure is sound but comprehensive testing requires a live MongoDB instance and running server. Key concerns:

1. No authentication - all endpoints publicly accessible
2. No rate limiting - vulnerable to abuse
3. No input sanitization - potential injection risks
4. Missing error standardization - inconsistent responses
5. No API documentation -，难以集成