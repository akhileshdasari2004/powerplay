import api from './api.js';

const INVOICES_ENDPOINT = '/invoices';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

function mapListParams(params = {}) {
  const mapped = { ...params };
  if (mapped.pageSize != null) {
    mapped.limit = mapped.pageSize;
    delete mapped.pageSize;
  }
  if (mapped.dateFrom) {
    mapped.issueDateFrom = mapped.dateFrom;
    delete mapped.dateFrom;
  }
  if (mapped.dateTo) {
    mapped.issueDateTo = mapped.dateTo;
    delete mapped.dateTo;
  }
  return mapped;
}

export const invoiceApi = {
  async list(params = {}) {
    const response = await api.get(INVOICES_ENDPOINT, { params: mapListParams(params) });
    return unwrap(response);
  },

  async getInvoices(params = {}) {
    const result = await this.list(params);
    return {
      data: result.invoices ?? [],
      total: result.pagination?.total ?? 0,
      pagination: result.pagination,
    };
  },

  async get(id) {
    const response = await api.get(`${INVOICES_ENDPOINT}/${id}`);
    return unwrap(response);
  },

  async getInvoice(id) {
    const result = await this.get(id);
    const invoice = result.invoice ?? result;
    return normalizeInvoice(invoice);
  },

  async create(invoiceData) {
    const response = await api.post(INVOICES_ENDPOINT, invoiceData);
    return unwrap(response);
  },

  async createInvoice(invoiceData) {
    const result = await this.create(invoiceData);
    const invoice = result.invoice ?? result;
    return normalizeInvoice(invoice);
  },

  async update(id, invoiceData) {
    const response = await api.put(`${INVOICES_ENDPOINT}/${id}`, invoiceData);
    return unwrap(response);
  },

  async updateInvoice(id, invoiceData) {
    const payload = mapFormToPayload(invoiceData);
    const result = await this.update(id, payload);
    return result.invoice ?? result;
  },

  async delete(id) {
    await api.delete(`${INVOICES_ENDPOINT}/${id}`);
  },

  async deleteInvoice(id) {
    return this.delete(id);
  },

  async getInvoiceStats() {
    const response = await api.get('/analytics/summary');
    const result = unwrap(response);
    const summary = result.summary ?? result;
    const breakdown = summary.statusBreakdown ?? {};

    return {
      totalRevenue: summary.totalRevenue ?? 0,
      totalInvoices: summary.totalInvoices ?? 0,
      outstandingAmount:
        (breakdown.pending?.amount ?? 0) + (breakdown.overdue?.amount ?? 0),
      overdueAmount: breakdown.overdue?.amount ?? 0,
    };
  },
};

function normalizeInvoice(invoice) {
  if (!invoice) return invoice;
  return {
    ...invoice,
    id: invoice._id ?? invoice.id,
    invoiceNumber: invoice.invoiceId ?? invoice.invoiceNumber,
    customerId:
      typeof invoice.customerId === 'object'
        ? invoice.customerId._id
        : invoice.customerId,
    date: invoice.issueDate
      ? new Date(invoice.issueDate).toISOString().split('T')[0]
      : invoice.date,
    dueDate: invoice.dueDate
      ? new Date(invoice.dueDate).toISOString().split('T')[0]
      : '',
  };
}

export function mapFormToPayload(formData) {
  const issueDate = formData.date ?? formData.issueDate;
  let dueDate = formData.dueDate;

  if (issueDate && dueDate && new Date(dueDate) <= new Date(issueDate)) {
    const nextDay = new Date(issueDate);
    nextDay.setDate(nextDay.getDate() + 1);
    dueDate = nextDay.toISOString().split('T')[0];
  }

  const amount = Number(formData.total ?? formData.amount ?? 0);

  return {
    customerId: formData.customerId,
    amount,
    taxRate: Number(formData.taxRate ?? 0),
    issueDate,
    dueDate,
    status: formData.status ?? 'draft',
  };
}

export default invoiceApi;