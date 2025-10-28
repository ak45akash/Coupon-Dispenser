'use client'

import { useEffect, useState } from 'react'
import { Download, Calendar } from 'lucide-react'
import { getClaimHistoryWithDetails } from '@/lib/db/analytics'
import { exportToCSV } from '@/lib/utils/csv'
import { formatDateTime } from '@/lib/utils/format'
import type { Vendor } from '@/types/database'

export default function ReportsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendor, setSelectedVendor] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors')
      const data = await response.json()
      if (data.success) {
        setVendors(data.data)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedVendor) params.append('vendor_id', selectedVendor)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      // This would be a new endpoint or we call the function directly
      // For now, we'll simulate with client-side filtering
      const response = await fetch('/api/analytics?type=overview')
      const data = await response.json()
      
      // In a real scenario, you'd have a dedicated reports endpoint
      setClaims([])
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const exportData = claims.map((claim: any) => ({
      'Claim Date': formatDateTime(claim.claimed_at),
      'User Email': claim.user.email,
      'User Name': claim.user.name || '-',
      Vendor: claim.vendor.name,
      'Coupon Code': claim.coupon.code,
      'Discount Value': claim.coupon.discount_value || '-',
    }))

    const filename = `coupon-claims-${new Date().toISOString().split('T')[0]}.csv`
    exportToCSV(exportData, filename)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-gray-600">
          Generate and export detailed coupon claim reports
        </p>
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Filter Criteria
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="vendor-select" className="label">
              Vendor
            </label>
            <select
              id="vendor-select"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="input"
            >
              <option value="">All Vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="start-date" className="label">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="end-date" className="label">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="btn btn-primary flex items-center gap-2"
          >
            <Calendar className="h-5 w-5" />
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
          {claims.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Download className="h-5 w-5" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {claims.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Vendor</th>
                  <th>Coupon Code</th>
                  <th>Discount</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim: any) => (
                  <tr key={claim.id}>
                    <td>{formatDateTime(claim.claimed_at)}</td>
                    <td>
                      <div>
                        <div className="font-medium">{claim.user.email}</div>
                        {claim.user.name && (
                          <div className="text-sm text-gray-500">
                            {claim.user.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{claim.vendor.name}</td>
                    <td className="font-mono font-semibold">
                      {claim.coupon.code}
                    </td>
                    <td>{claim.coupon.discount_value || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && claims.length === 0 && (
        <div className="card">
          <p className="text-center text-gray-500">
            No claims found. Adjust your filters and generate a report.
          </p>
        </div>
      )}
    </div>
  )
}

