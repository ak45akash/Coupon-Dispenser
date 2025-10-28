'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { VendorAnalytics, ClaimTrend, TopVendor } from '@/types/api'
import { formatNumber } from '@/lib/utils/format'

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AnalyticsPage() {
  const [vendorAnalytics, setVendorAnalytics] = useState<VendorAnalytics[]>([])
  const [claimTrends, setClaimTrends] = useState<ClaimTrend[]>([])
  const [topVendors, setTopVendors] = useState<TopVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(30)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [vendorsRes, trendsRes, topRes] = await Promise.all([
        fetch('/api/analytics?type=vendors'),
        fetch(`/api/analytics?type=trends&days=${timeRange}`),
        fetch('/api/analytics?type=top-vendors&limit=5'),
      ])

      const [vendorsData, trendsData, topData] = await Promise.all([
        vendorsRes.json(),
        trendsRes.json(),
        topRes.json(),
      ])

      if (vendorsData.success) setVendorAnalytics(vendorsData.data)
      if (trendsData.success) setClaimTrends(trendsData.data)
      if (topData.success) setTopVendors(topData.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-gray-600">
            Insights into coupon usage and performance
          </p>
        </div>
        <div>
          <label htmlFor="time-range" className="label">
            Time Range
          </label>
          <select
            id="time-range"
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="input"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Claim Trends */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Claim Trends
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={claimTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#0ea5e9"
              strokeWidth={2}
              name="Claims"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Vendor Performance */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Vendor Performance
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={vendorAnalytics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="vendor_name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="claimed_coupons" fill="#10b981" name="Claimed" />
            <Bar
              dataKey="available_coupons"
              fill="#0ea5e9"
              name="Available"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Vendors */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Top Vendors by Claims
          </h2>
          {topVendors.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topVendors}
                  dataKey="total_claims"
                  nameKey="vendor_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {topVendors.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500">No claim data available</p>
          )}
        </div>

        {/* Vendor Stats Table */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Vendor Statistics
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-left text-sm font-semibold">
                    Vendor
                  </th>
                  <th className="pb-2 text-right text-sm font-semibold">
                    Total
                  </th>
                  <th className="pb-2 text-right text-sm font-semibold">
                    Claimed
                  </th>
                  <th className="pb-2 text-right text-sm font-semibold">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {vendorAnalytics.map((vendor) => (
                  <tr key={vendor.vendor_id} className="border-b border-gray-100">
                    <td className="py-2 text-sm">{vendor.vendor_name}</td>
                    <td className="py-2 text-right text-sm">
                      {vendor.total_coupons}
                    </td>
                    <td className="py-2 text-right text-sm">
                      {vendor.claimed_coupons}
                    </td>
                    <td className="py-2 text-right text-sm">
                      {vendor.claim_rate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total Vendors</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {vendorAnalytics.length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Total Coupons</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatNumber(
              vendorAnalytics.reduce((sum, v) => sum + v.total_coupons, 0)
            )}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Total Claims</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatNumber(
              vendorAnalytics.reduce((sum, v) => sum + v.claimed_coupons, 0)
            )}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Avg Claim Rate</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {vendorAnalytics.length > 0
              ? (
                  vendorAnalytics.reduce((sum, v) => sum + v.claim_rate, 0) /
                  vendorAnalytics.length
                ).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>
    </div>
  )
}

