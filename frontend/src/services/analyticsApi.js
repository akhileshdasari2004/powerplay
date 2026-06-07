import api from './api'

export const analyticsApi = {
  getSummary: () => api.get('/analytics/summary'),
  getTopCustomers: (limit) => api.get('/analytics/top-customers', { params: { limit } })
}