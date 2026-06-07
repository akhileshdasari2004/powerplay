import api from './api.js';

const CUSTOMERS_ENDPOINT = '/customers';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export const customerApi = {
  async list(params = {}) {
    const response = await api.get(CUSTOMERS_ENDPOINT, { params });
    return unwrap(response);
  },

  async getCustomers(params = {}) {
    const result = await this.list({ limit: 500, ...params });
    return result.customers ?? [];
  },

  async get(id) {
    const response = await api.get(`${CUSTOMERS_ENDPOINT}/${id}`);
    return unwrap(response);
  },

  async create(customerData) {
    const response = await api.post(CUSTOMERS_ENDPOINT, customerData);
    return unwrap(response);
  },

  async update(id, customerData) {
    const response = await api.put(`${CUSTOMERS_ENDPOINT}/${id}`, customerData);
    return unwrap(response);
  },

  async delete(id) {
    await api.delete(`${CUSTOMERS_ENDPOINT}/${id}`);
  },

  async getInvoices(id, params = {}) {
    const response = await api.get(`${CUSTOMERS_ENDPOINT}/${id}/invoices`, { params });
    return unwrap(response);
  },
};

export default customerApi;
