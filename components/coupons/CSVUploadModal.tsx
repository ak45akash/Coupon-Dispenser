'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Download } from 'lucide-react'
import type { Vendor } from '@/types/database'
import { parseCSV } from '@/lib/utils/csv'

interface CSVUploadModalProps {
  isOpen: boolean
  onClose: () => void
  vendors: Vendor[]
}

export default function CSVUploadModal({
  isOpen,
  onClose,
  vendors,
}: CSVUploadModalProps) {
  const [vendorId, setVendorId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Auto-select vendor if there's only one
  useEffect(() => {
    if (vendors.length === 1 && isOpen && !vendorId) {
      setVendorId(vendors[0].id)
    }
  }, [vendors, vendorId, isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      const reset = vendors.length === 1 ? vendors[0].id : ''
      setVendorId(reset)
      setFile(null)
      setError('')
      setSuccess('')
    }
  }, [isOpen, vendors])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError('')
      setSuccess('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!file || !vendorId) {
      setError('Please select a vendor and upload a CSV file')
      return
    }

    setLoading(true)

    try {
      const coupons = await parseCSV(file)

      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          coupons,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message || 'Coupons uploaded successfully')
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setError(data.error || 'An error occurred')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV file')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csv = `code,description,discount_value,expiry_date
SAVE20,Get 20% off your purchase,20% off,2024-12-31
FREESHIP,Free shipping on orders,Free Shipping,2024-12-31
WELCOME10,Welcome discount,10% off,2024-12-31`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'coupon-template.csv'
    link.click()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Bulk Upload Coupons
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

          {success && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
              {success}
            </div>
          )}

          {vendors.length > 1 && (
            <div>
              <label htmlFor="vendor" className="label">
                Vendor *
              </label>
              <select
                id="vendor"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
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
            <label htmlFor="csv-file" className="label">
              CSV File *
            </label>
            <div className="mt-2 flex items-center gap-3">
              <label className="btn btn-secondary flex cursor-pointer items-center gap-2">
                <Upload className="h-5 w-5" />
                {file ? file.name : 'Choose File'}
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
              </label>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">
              CSV Format Requirements
            </h3>
            <p className="mb-3 text-sm text-blue-800">
              Your CSV file should include the following columns:
            </p>
            <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-blue-800">
              <li>
                <strong>code</strong> (required): Unique coupon code
              </li>
              <li>
                <strong>description</strong> (optional): Coupon description
              </li>
              <li>
                <strong>discount_value</strong> (optional): e.g., &quot;20% off&quot;
              </li>
              <li>
                <strong>expiry_date</strong> (optional): Format: YYYY-MM-DD
              </li>
            </ul>
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Download className="h-4 w-4" />
              Download CSV Template
            </button>
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
              {loading ? 'Uploading...' : 'Upload Coupons'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

