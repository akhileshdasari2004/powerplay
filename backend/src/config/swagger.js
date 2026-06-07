import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Invoice Dashboard API',
      version: '1.0.0',
      description:
        'RESTful API for the Invoice Dashboard application. Supports invoice and customer management, plus analytics endpoints.',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' },
          },
          example: { error: 'Invoice not found' },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            pages: { type: 'integer' },
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'MongoDB ObjectId' },
            invoiceId: { type: 'string', description: 'Human-readable ID (e.g. INV-ABC123)' },
            customerId: {
              type: 'object',
              description: 'Populated customer reference',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                company: { type: 'string' },
              },
            },
            amount: { type: 'number', description: 'Pre-tax subtotal' },
            taxRate: { type: 'number', description: 'Tax percentage (0–100)' },
            tax: { type: 'number', description: 'Calculated tax amount' },
            total: { type: 'number', description: 'amount + tax' },
            status: {
              type: 'string',
              enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
            },
            issueDate: { type: 'string', format: 'date-time' },
            dueDate: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        InvoiceListResponse: {
          type: 'object',
          properties: {
            invoices: { type: 'array', items: { $ref: '#/components/schemas/Invoice' } },
            pagination: { $ref: '#/components/schemas/Pagination' },
          },
        },
        CreateInvoice: {
          type: 'object',
          required: ['customerId', 'amount', 'taxRate', 'issueDate', 'dueDate'],
          properties: {
            customerId: { type: 'string', description: 'MongoDB ObjectId of the customer' },
            amount: { type: 'number', minimum: 0, description: 'Pre-tax subtotal' },
            taxRate: { type: 'number', minimum: 0, maximum: 100, description: 'Tax percentage' },
            status: {
              type: 'string',
              enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
              default: 'draft',
            },
            issueDate: { type: 'string', format: 'date-time' },
            dueDate: { type: 'string', format: 'date-time' },
          },
          example: {
            customerId: '674f1a2b3c4d5e6f7a8b9c0d',
            amount: 1500,
            taxRate: 18,
            status: 'draft',
            issueDate: '2025-01-15T00:00:00Z',
            dueDate: '2025-02-15T00:00:00Z',
          },
        },
        UpdateInvoice: {
          type: 'object',
          properties: {
            customerId: { type: 'string' },
            amount: { type: 'number', minimum: 0 },
            taxRate: { type: 'number', minimum: 0, maximum: 100 },
            status: { type: 'string', enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'] },
            issueDate: { type: 'string', format: 'date-time' },
            dueDate: { type: 'string', format: 'date-time' },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            company: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CustomerListResponse: {
          type: 'object',
          properties: {
            customers: { type: 'array', items: { $ref: '#/components/schemas/Customer' } },
            pagination: { $ref: '#/components/schemas/Pagination' },
          },
        },
        CreateCustomer: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', description: 'Customer full name' },
            company: { type: 'string', description: 'Company name (optional)' },
          },
          example: { name: 'Aarav Sharma', company: 'Infosys Technologies' },
        },
        UpdateCustomer: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            company: { type: 'string' },
          },
        },
        CustomerWithInvoices: {
          type: 'object',
          properties: {
            customer: { $ref: '#/components/schemas/Customer' },
            invoices: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  invoiceId: { type: 'string' },
                  amount: { type: 'number' },
                  tax: { type: 'number' },
                  total: { type: 'number' },
                  status: { type: 'string' },
                  issueDate: { type: 'string', format: 'date-time' },
                  dueDate: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        AnalyticsSummary: {
          type: 'object',
          properties: {
            totalInvoices: { type: 'integer' },
            totalRevenue: { type: 'number' },
            statusBreakdown: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  count: { type: 'integer' },
                  amount: { type: 'number' },
                },
              },
              example: {
                draft: { count: 2, amount: 4300.5 },
                paid: { count: 5, amount: 12340.0 },
              },
            },
          },
        },
        TopCustomer: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Customer ObjectId' },
            name: { type: 'string' },
            company: { type: 'string' },
            totalAmount: { type: 'number', description: 'Sum of all invoice totals' },
            invoiceCount: { type: 'integer' },
          },
        },
        TopCustomersResponse: {
          type: 'object',
          properties: {
            customers: { type: 'array', items: { $ref: '#/components/schemas/TopCustomer' } },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'error'] },
            database: { type: 'string' },
            uptime: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Invoices', description: 'Invoice CRUD operations' },
      { name: 'Customers', description: 'Customer CRUD operations' },
      { name: 'Analytics', description: 'Revenue and summary statistics' },
      { name: 'Health', description: 'Service health check' },
    ],
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;