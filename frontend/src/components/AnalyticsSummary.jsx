import { useState, useEffect } from 'react'
import { analyticsApi } from '../services/analyticsApi'
import StatsCard from './StatsCard'

export default function AnalyticsSummary() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    analyticsApi.getSummary()
      .then(({ data }) => {
        if (!cancelled) setData(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || err.message || 'Failed to load analytics')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) return <p className="text-gray-500 py-4 text-center">Loading...</p>
  if (error) return <p className="text-red-500 py-4 text-center">{error}</p>
  if (!data) return <p className="text-gray-500 py-4 text-center">No data available</p>

  const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatsCard
        title="Total Invoices"
        value={data?.totalInvoices || 0}
        color="blue"
      />
      <StatsCard
        title="Total Revenue"
        value={formatCurrency(data?.totalRevenue || 0)}
        color="green"
      />
      <StatsCard
        title="Paid Invoices"
        value={data?.statusBreakdown?.paid?.count || 0}
        subtext={formatCurrency(data?.statusBreakdown?.paid?.amount || 0)}
        color="green"
      />
      <StatsCard
        title="Pending Invoices"
        value={(data?.statusBreakdown?.pending?.count || 0) + (data?.statusBreakdown?.overdue?.count || 0)}
        subtext={formatCurrency((data?.statusBreakdown?.pending?.amount || 0) + (data?.statusBreakdown?.overdue?.amount || 0))}
        color="yellow"
      />
    </div>
  )
}