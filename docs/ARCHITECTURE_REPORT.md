# Architecture Report

## Executive Summary
Invoice Dashboard - A MERN stack (MongoDB, Express, React, Node.js) application for managing invoices and customers.

---

## 1. Folder Structure

```
powerplay/
├── backend/
│   ├── config/           # Configuration directory (empty, placeholder)
│   ├── controllers/      # Request handlers
│   │   ├── analyticsController.js
│   │   ├── customerController.js
│   │   └── invoiceController.js
│   ├── models/           # Mongoose schemas
│   │   ├── Customer.js
│   │   └── Invoice.js
│   ├── routes/           # Express routers
│   │   ├── analyticsRoutes.js
│   │   ├── customerRoutes.js
│   │   ├── index.js      # Central router
│   │   └── invoiceRoutes.js
│   ├── services/         # Business logic layer
│   │   ├── AnalyticsService.js
│   │   ├── CustomerService.js
│   │   └── InvoiceService.js
│   ├── scripts/          # Utility scripts
│   │   ├── runSeed.js
│   │   └── seed.js
│   ├── server.js         # Express app entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalyticsSummary.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── InvoiceForm.jsx
│   │   │   ├── InvoiceTable.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   └── TopCustomers.jsx
│   │   ├── pages/
│   │   │   ├── CustomerProfilePage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── EditInvoicePage.jsx
│   │   │   └── NewInvoicePage.jsx
│   │   ├── services/
│   │   │   ├── analyticsApi.js
│   │   │   ├── api.js
│   │   │   ├── customerApi.js
│   │   │   └── invoiceApi.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── docs/                  # Documentation (this report)
└── seed-data.json         # Seed data (527.5KB)
```

---

## 2. Frontend Architecture

### Stack
- **Framework**: React 18.3.1
- **Routing**: React Router DOM v6.26.0
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.10
- **HTTP Client**: Axios 1.7.7
- **Forms**: React Hook Form 7.53.0

### Component Hierarchy
```
App
└── Layout
    ├── DashboardPage
    │   ├── AnalyticsSummary
    │   │   └── StatsCard (x4)
    │   ├── FilterBar
    │   ├── InvoiceTable
    │   ├── Pagination
    │   └── TopCustomers
    ├── CustomerProfilePage
    │   └── InvoiceTable
    ├── NewInvoicePage
    │   └── InvoiceForm
    └── EditInvoicePage
        └── InvoiceForm
```

### State Management
- **Local State**: React useState/useEffect hooks
- **No Global State Manager**: Context API, Redux, or Zustand NOT used
- **Data Fetching**: Direct API calls in useEffect hooks

### API Integration Pattern
```
Pages → API Services → Axios Instance → Backend
```

---

## 3. Backend Architecture

### Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 4.21.0
- **Database**: MongoDB with Mongoose 8.6.0
- **CORS**: cors 2.8.5
- **Environment**: dotenv 16.6.1

### Layer Architecture
```
Request → Routes → Controllers → Services → Models → MongoDB
```

### Routes
| Route | Handler |
|-------|---------|
| GET /api/invoices | invoiceController.getInvoices |
| GET /api/invoices/:id | invoiceController.getInvoiceById |
| POST /api/invoices | invoiceController.createInvoice |
| PUT /api/invoices/:id | invoiceController.updateInvoice |
| DELETE /api/invoices/:id | invoiceController.deleteInvoice |
| GET /api/customers | customerController.getCustomers |
| GET /api/customers/:id | customerController.getCustomerById |
| POST /api/customers | customerController.createCustomer |
| PUT /api/customers/:id | customerController.updateCustomer |
| DELETE /api/customers/:id | customerController.deleteCustomer |
| GET /api/customers/:id/invoices | customerController.getCustomerWithInvoices |
| GET /api/analytics/summary | analyticsController.getSummary |
| GET /api/analytics/top-customers | analyticsController.getTopCustomers |
| GET /health | Health check endpoint |

---

## 4. Database Architecture

### Collections
1. **customers**
   - `_id`: ObjectId
   - `name`: String (required, trimmed)
   - `company`: String (optional)
   - `createdAt`, `updatedAt`: Date (auto)

2. **invoices**
   - `_id`: ObjectId
   - `invoiceId`: String (unique, indexed)
   - `customerId`: ObjectId (ref Customer, indexed)
   - `amount`: Number (required, min: 0)
   - `taxRate`: Number (required, 0-100, default: 0)
   - `tax`: Number (computed)
   - `total`: Number (computed)
   - `status`: Enum [draft, pending, paid, overdue, cancelled]
   - `issueDate`: Date
   - `dueDate`: Date
   - `createdAt`, `updatedAt`: Date (auto)

### Indexes
```javascript
// Invoice indexes
invoiceSchema.index({ invoiceId: 1 }, { unique: true });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ issueDate: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ customerId: 1, status: 1 });

// Customer indexes
customerSchema.index({ name: 1 });
customerSchema.index({ company: 1 });
```

---

## 5. API Architecture

### Base URL
- Development: `http://localhost:5001/api`
- Backend: `http://localhost:5000/api`

### Request/Response Pattern
```javascript
// List endpoints return:
{
  invoices/customers: [...],
  pagination: { page, limit, total, pages }
}

// Single item returns directly:
// {...}

// Error format:
{ error: "message" }
```

### Pagination
- Query params: `page`, `limit`
- Default: page=1, limit=10

---

## 6. Environment Configuration

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://akhileshdasari2004_db_user:***@cluster0.j3si0dy.mongodb.net/invoice-dashboard
PORT=5000
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5001/api
```

### Issues Found
1. **CRITICAL**: `.env` files contain actual credentials (backend/frontend/.env) - NOT .gitignore'd
2. PORT mismatch: Backend defaults to 5000, Frontend expects 5001

---

## 7. Authentication Flow
**STATUS: NOT IMPLEMENTED**

- No authentication middleware
- No JWT/session handling
- No authorization checks
- All endpoints publicly accessible

---

## 8. Build Configuration

### Frontend (Vite)
```javascript
// vite.config.js - default configuration
export default {
  plugins: [react()],
  server: { port: 5173 }
}
```

### Backend (Node.js)
```json
"start": "node --env-file=.env server.js",
"dev": "node --env-file=.env --watch server.js"
```

---

## 9. Dependency Report

### Backend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| cors | ^2.8.5 | Cross-Origin Resource Sharing |
| dotenv | ^16.6.1 | Environment variables |
| express | ^4.21.0 | Web framework |
| mongoose | ^8.6.0 | MongoDB ODM |
| uuid | ^10.0.0 | Unique ID generation |

### Frontend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| axios | ^1.7.7 | HTTP client |
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | DOM rendering |
| react-hook-form | ^7.53.0 | Form handling |
| react-router-dom | ^6.26.0 | Routing |

### Dev Dependencies (Frontend)
| Package | Version | Purpose |
|---------|---------|---------|
| @vitejs/plugin-react | ^4.3.1 | Vite React plugin |
| tailwindcss | ^3.4.10 | CSS framework |
| autoprefixer | ^10.4.20 | CSS prefixing |
| postcss | ^8.4.41 | CSS processing |
| eslint | ^9.9.0 | Linting |

---

## 10. Risk Report

| Risk | Severity | Description |
|------|----------|-------------|
| No Authentication | CRITICAL | All data publicly accessible |
| Credentials in Code | CRITICAL | MongoDB URI exposed in .env files |
| No Rate Limiting | HIGH | API vulnerable to DoS attacks |
| No Input Sanitization | HIGH | Potential NoSQL injection |
| No CSRF Protection | HIGH | Vulnerable to CSRF attacks |
| No Validation Middleware | MEDIUM | Inconsistent validation across endpoints |
| No Error Tracking | MEDIUM | No Sentry/Raygun/LogRocket |
| No Logging | MEDIUM | No structured logging |
| Missing Tests | HIGH | No unit/integration tests |
| No API Documentation | LOW | No Swagger/OpenAPI docs |

---

## 11. Missing Features Report

### Security
- [ ] Authentication/Authorization
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] Input sanitization
- [ ] Security headers (Helmet)
- [ ] HTTPS enforcement

### Functionality
- [ ] Invoice PDF generation
- [ ] Email notifications
- [ ] Invoice status updates
- [ ] Bulk operations
- [ ] Export/Import (CSV/Excel)
- [ ] Search across all entities

### Reliability
- [ ] Unit tests
- [ ] Integration tests
- [ ] Error boundaries
- [ ] Retry logic
- [ ] Circuit breaker

### Monitoring
- [ ] APM integration
- [ ] Error tracking
- [ ] Performance monitoring
- [ ] Uptime monitoring

### DevOps
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Environment-specific builds
- [ ] Database migrations