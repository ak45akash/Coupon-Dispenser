'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { User, Vendor } from '@/types/database'

interface PartnerAccessModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  vendors: Vendor[]
}

export default function PartnerAccessModal({
  isOpen,
  onClose,
  user,
  vendors,
}: PartnerAccessModalProps) {
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && user) {
      fetchCurrentAccess()
    }
  }, [isOpen, user])

  const fetchCurrentAccess = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}/access`)
      const data = await response.json()
      if (data.success) {
        setSelectedVendors(data.data)
      }
    } catch (error) {
      console.error('Error fetching vendor access:', error)
    }
  }

  const handleToggleVendor = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/users/${user.id}/access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_ids: selectedVendors }),
      })

      const data = await response.json()

      if (data.success) {
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
          <h2 className="text-2xl font-bold text-gray-900">
            Manage Vendor Access
          </h2>
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

          <div>
            <p className="mb-4 text-sm text-gray-600">
              User: <strong>{user.email}</strong>
            </p>
            <label className="label">Select Vendors</label>
            <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-4">
              {vendors.map((vendor) => (
                <label
                  key={vendor.id}
                  className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedVendors.includes(vendor.id)}
                    onChange={() => handleToggleVendor(vendor.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {vendor.name}
                    </div>
                    {vendor.description && (
                      <div className="text-sm text-gray-500">
                        {vendor.description}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <p>
              Selected {selectedVendors.length} vendor
              {selectedVendors.length !== 1 ? 's' : ''}. The partner admin will
              be able to manage coupons and view analytics for these vendors.
            </p>
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
              {loading ? 'Updating...' : 'Update Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

