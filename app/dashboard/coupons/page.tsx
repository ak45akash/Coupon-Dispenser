'use client'

import { useEffect, useState } from 'react'
import { Plus, Upload, Trash2, Filter } from 'lucide-react'
import type { Coupon, Vendor } from '@/types/database'
import CouponModal from '@/components/coupons/CouponModal'
import CSVUploadModal from '@/components/coupons/CSVUploadModal'
import { formatDate } from '@/lib/utils/format'

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'claimed' | 'unclaimed'>('all')

  const fetchCoupons = async () => {
    try {
      const url = selectedVendor
        ? `/api/coupons?vendor_id=${selectedVendor}`
        : '/api/coupons'
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setCoupons(data.data)
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    } finally {
      setLoading(false)
    }
  }

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

  useEffect(() => {
    fetchVendors()
  }, [])

  useEffect(() => {
    fetchCoupons()
  }, [selectedVendor])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return

    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCoupons()
      }
    } catch (error) {
      console.error('Error deleting coupon:', error)
    }
  }

  const getVendorName = (vendorId: string) => {
    return vendors.find((v) => v.id === vendorId)?.name || 'Unknown'
  }

  const filteredCoupons = coupons.filter((coupon) => {
    if (filterStatus === 'claimed') return coupon.is_claimed
    if (filterStatus === 'unclaimed') return !coupon.is_claimed
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading coupons...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="mt-1 text-gray-600">
            Manage coupon codes and track claims
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCSVModalOpen(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Upload className="h-5 w-5" />
            Bulk Upload
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Coupon
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="vendor-filter" className="label">
            Filter by Vendor
          </label>
          <select
            id="vendor-filter"
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

        <div className="flex-1">
          <label htmlFor="status-filter" className="label">
            Filter by Status
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="input"
          >
            <option value="all">All Coupons</option>
            <option value="unclaimed">Unclaimed</option>
            <option value="claimed">Claimed</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Vendor</th>
              <th>Description</th>
              <th>Discount</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="font-mono font-semibold">{coupon.code}</td>
                <td>{getVendorName(coupon.vendor_id)}</td>
                <td className="max-w-xs truncate">
                  {coupon.description || '-'}
                </td>
                <td>{coupon.discount_value || '-'}</td>
                <td>
                  {coupon.expiry_date
                    ? formatDate(coupon.expiry_date)
                    : 'No expiry'}
                </td>
                <td>
                  <span
                    className={`badge ${
                      coupon.is_claimed ? 'badge-warning' : 'badge-success'
                    }`}
                  >
                    {coupon.is_claimed ? 'Claimed' : 'Available'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={coupon.is_claimed}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCoupons.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No coupons found. Add coupons to get started.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Total: {filteredCoupons.length} coupons (
          {filteredCoupons.filter((c) => !c.is_claimed).length} available,{' '}
          {filteredCoupons.filter((c) => c.is_claimed).length} claimed)
        </div>
      </div>

      <CouponModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          fetchCoupons()
        }}
        vendors={vendors}
      />

      <CSVUploadModal
        isOpen={isCSVModalOpen}
        onClose={() => {
          setIsCSVModalOpen(false)
          fetchCoupons()
        }}
        vendors={vendors}
      />
    </div>
  )
}

