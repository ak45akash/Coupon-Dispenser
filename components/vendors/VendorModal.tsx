'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Vendor } from '@/types/database'

interface VendorModalProps {
  isOpen: boolean
  onClose: () => void
  vendor?: Vendor | null
}

export default function VendorModal({
  isOpen,
  onClose,
  vendor,
}: VendorModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    active: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name,
        description: vendor.description || '',
        website: vendor.website || '',
        logo_url: vendor.logo_url || '',
        contact_email: vendor.contact_email || '',
        contact_phone: vendor.contact_phone || '',
        active: vendor.active,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        website: '',
        logo_url: '',
        contact_email: '',
        contact_phone: '',
        active: true,
      })
    }
  }, [vendor, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = vendor ? `/api/vendors/${vendor.id}` : '/api/vendors'
      const method = vendor ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
            {vendor ? 'Edit Vendor' : 'Add Vendor'}
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
            <label htmlFor="name" className="label">
              Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input"
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
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="website" className="label">
                Website
              </label>
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="input"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label htmlFor="logo_url" className="label">
                Logo URL
              </label>
              <input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={(e) =>
                  setFormData({ ...formData, logo_url: e.target.value })
                }
                className="input"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact_email" className="label">
                Contact Email
              </label>
              <input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) =>
                  setFormData({ ...formData, contact_email: e.target.value })
                }
                className="input"
                placeholder="contact@example.com"
              />
            </div>

            <div>
              <label htmlFor="contact_phone" className="label">
                Contact Phone
              </label>
              <input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) =>
                  setFormData({ ...formData, contact_phone: e.target.value })
                }
                className="input"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {vendor && (
            <div className="flex items-center gap-2">
              <input
                id="active"
                type="checkbox"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="active" className="text-sm font-medium">
                Active
              </label>
            </div>
          )}

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
              {loading ? 'Saving...' : vendor ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

