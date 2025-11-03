'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
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
import { ChevronDown } from 'lucide-react'
import type { VendorAnalytics, ClaimTrend, TopVendor } from '@/types/api'
import { formatNumber } from '@/lib/utils/format'
import { Card } from '@/components/ui/card'

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const isPartnerAdmin = session?.user?.role === 'partner_admin'
  
  const [vendorAnalytics, setVendorAnalytics] = useState<VendorAnalytics[]>([])
  const [partnerVendorAnalytics, setPartnerVendorAnalytics] = useState<VendorAnalytics[]>([])
  const [claimTrends, setClaimTrends] = useState<ClaimTrend[]>([])
  const [topVendors, setTopVendors] = useState<TopVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(30)
  const [showAllAnalytics, setShowAllAnalytics] = useState(false)
  const [partnerVendor, setPartnerVendor] = useState<any>(null)

  const fetchPartnerVendor = useCallback(async () => {
    try {
      const response = await fetch('/api/vendors/my-vendor')
      const data = await response.json()
      if (data.success) {
        setPartnerVendor(data.data)
      }
    } catch (error) {
      console.error('Error fetching partner vendor:', error)
    }
  }, [])

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      if (isPartnerAdmin && partnerVendor) {
        // Fetch only partner's vendor analytics
        const [vendorsRes, trendsRes] = await Promise.all([
          fetch(`/api/analytics?type=vendors&vendor_id=${partnerVendor.id}`),
          fetch(`/api/analytics?type=trends&days=${timeRange}&vendor_id=${partnerVendor.id}`),
        ])

        const [vendorsData, trendsData] = await Promise.all([
          vendorsRes.json(),
          trendsRes.json(),
        ])

        if (vendorsData.success) setPartnerVendorAnalytics(vendorsData.data)
        if (trendsData.success) setClaimTrends(trendsData.data)
      } else if (!isPartnerAdmin) {
        // Fetch all analytics for super admin
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
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [isPartnerAdmin, partnerVendor, timeRange])

  const fetchAllAnalytics = useCallback(async () => {
    try {
      const [vendorsRes, topRes] = await Promise.all([
        fetch('/api/analytics?type=vendors'),
        fetch('/api/analytics?type=top-vendors&limit=5'),
      ])

      const [vendorsData, topData] = await Promise.all([
        vendorsRes.json(),
        topRes.json(),
      ])

      if (vendorsData.success) setVendorAnalytics(vendorsData.data)
      if (topData.success) setTopVendors(topData.data)
    } catch (error) {
      console.error('Error fetching all analytics:', error)
    }
  }, [])

  // Fetch partner vendor first if partner admin
  useEffect(() => {
    if (isPartnerAdmin) {
      fetchPartnerVendor()
    }
  }, [isPartnerAdmin, fetchPartnerVendor])

  // Fetch analytics when vendor or time range changes
  useEffect(() => {
    if (!isPartnerAdmin || partnerVendor) {
      fetchAnalytics()
    }
  }, [timeRange, partnerVendor, isPartnerAdmin, fetchAnalytics])

  // Also fetch all analytics for partner admin accordion
  useEffect(() => {
    if (isPartnerAdmin && showAllAnalytics) {
      fetchAllAnalytics()
    }
  }, [showAllAnalytics, isPartnerAdmin, fetchAllAnalytics])

  const displayVendorAnalytics = isPartnerAdmin ? partnerVendorAnalytics : vendorAnalytics

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
            {isPartnerAdmin 
              ? `Insights for ${partnerVendor?.name || 'your vendor'}`
              : 'Insights into coupon usage and performance'}
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
          {isPartnerAdmin ? 'Your Vendor Performance' : 'Vendor Performance'}
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={displayVendorAnalytics}>
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

      {/* Partner Admin: All Vendors Analytics in Accordion */}
      {isPartnerAdmin && (
        <div className="card">
          <button
            onClick={() => setShowAllAnalytics(!showAllAnalytics)}
            className="flex w-full items-center justify-between text-left"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              All Vendors Analytics
            </h2>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${
                showAllAnalytics ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showAllAnalytics && (
            <div className="mt-6 space-y-6">
              {/* Top Vendors */}
              <div>
                <h3 className="mb-4 text-md font-semibold text-gray-900">
                  Top Vendors by Claims
                </h3>
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
              <div>
                <h3 className="mb-4 text-md font-semibold text-gray-900">
                  All Vendors Statistics
                </h3>
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

              {/* All Vendors Performance */}
              <div>
                <h3 className="mb-4 text-md font-semibold text-gray-900">
                  All Vendors Performance
                </h3>
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
            </div>
          )}
        </div>
      )}

      {/* Super Admin: Always show top vendors */}
      {!isPartnerAdmin && (
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
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total Vendors</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {displayVendorAnalytics.length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Total Coupons</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatNumber(
              displayVendorAnalytics.reduce((sum, v) => sum + v.total_coupons, 0)
            )}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Total Claims</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatNumber(
              displayVendorAnalytics.reduce((sum, v) => sum + v.claimed_coupons, 0)
            )}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Avg Claim Rate</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {displayVendorAnalytics.length > 0
              ? (
                  displayVendorAnalytics.reduce((sum, v) => sum + v.claim_rate, 0) /
                  displayVendorAnalytics.length
                ).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>
    </div>
  )
}
