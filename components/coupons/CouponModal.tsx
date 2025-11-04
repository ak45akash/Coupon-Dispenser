'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Vendor } from '@/types/database'

interface CouponModalProps {
  isOpen: boolean
  onClose: () => void
  vendors: Vendor[]
}

// Reset form when modal closes
const resetForm = () => ({
  vendor_id: '',
  code: '',
  description: '',
  discount_value: '',
  expiry_date: '',
})

export default function CouponModal({
  isOpen,
  onClose,
  vendors,
}: CouponModalProps) {
  const [formData, setFormData] = useState({
    vendor_id: '',
    code: '',
    description: '',
    discount_value: '',
    expiry_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-select vendor if there's only one
  useEffect(() => {
    if (vendors.length === 1 && isOpen && !formData.vendor_id) {
      setFormData((prev) => ({ ...prev, vendor_id: vendors[0].id }))
    }
  }, [vendors, formData.vendor_id, isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      const reset = resetForm()
      if (vendors.length === 1) {
        reset.vendor_id = vendors[0].id
      }
      setFormData(reset)
      setError('')
    }
  }, [isOpen, vendors])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Prepare data - convert empty strings to undefined for optional fields
      let expiryDate: string | undefined = undefined
      if (formData.expiry_date) {
        // Convert date input (YYYY-MM-DD) to ISO datetime format
        expiryDate = new Date(formData.expiry_date + 'T23:59:59Z').toISOString()
      }

      const submitData = {
        vendor_id: formData.vendor_id,
        code: formData.code,
        description: formData.description,
        discount_value: formData.discount_value || undefined,
        expiry_date: expiryDate,
      }

      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (data.success) {
        setFormData(resetForm())
        onClose()
      } else {
        setError(data.error || 'An error occurred')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add Coupon</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {vendors.length > 1 && (
            <div>
              <label htmlFor="vendor_id" className="label">
                Vendor *
              </label>
              <select
                id="vendor_id"
                value={formData.vendor_id}
                onChange={(e) =>
                  setFormData({ ...formData, vendor_id: e.target.value })
                }
                className="input"
                required
              >
                <option value="">Select a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="code" className="label">
              Coupon Code *
            </label>
            <input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              className="input font-mono"
              placeholder="SAVE20"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input"
              rows={3}
              placeholder="Get 20% off your next purchase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="discount_value" className="label">
                Discount Value <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                id="discount_value"
                type="text"
                value={formData.discount_value}
                onChange={(e) =>
                  setFormData({ ...formData, discount_value: e.target.value })
                }
                className="input"
                placeholder="20% off"
              />
            </div>

            <div>
              <label htmlFor="expiry_date" className="label">
                Expiry Date <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) =>
                  setFormData({ ...formData, expiry_date: e.target.value })
                }
                className="input"
              />
              <p className="mt-1 text-xs text-gray-500">
                Note: If not set, expiry will be calculated when coupon is claimed (1 month from claim date)
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

