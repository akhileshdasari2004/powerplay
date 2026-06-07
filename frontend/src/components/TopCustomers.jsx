import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsApi } from '../services/analyticsApi'

export default function TopCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    analyticsApi.getTopCustomers(5)
      .then(({ data }) => {
        if (!cancelled) setCustomers(data.customers || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || err.message || 'Failed to load customers')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  if (loading) return <p className="text-gray-500 py-4 text-center">Loading...</p>
  if (error) return <p className="text-red-500 py-4 text-center">{error}</p>

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
      {customers.length === 0 ? (
        <p className="text-gray-500 text-sm">No data</p>
      ) : (
        <div className="space-y-3">
          {customers.map((c, i) => (
            <div key={c._id} className="flex items-center justify-between">
              <div>
                <Link to={`/customers/${c._id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                  {c.name}
                </Link>
                <p className="text-xs text-gray-500">{c.company}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{formatCurrency(c.totalAmount)}</p>
                <p className="text-xs text-gray-500">{c.invoiceCount} invoices</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}