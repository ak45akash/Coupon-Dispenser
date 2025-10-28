'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { VendorWithStats } from '@/types/database'
import VendorModal from '@/components/vendors/VendorModal'

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<VendorWithStats | null>(
    null
  )

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors?stats=true')
      const data = await response.json()
      if (data.success) {
        setVendors(data.data)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return

    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchVendors()
      }
    } catch (error) {
      console.error('Error deleting vendor:', error)
    }
  }

  const handleEdit = (vendor: VendorWithStats) => {
    setEditingVendor(vendor)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingVendor(null)
    fetchVendors()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading vendors...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="mt-1 text-gray-600">
            Manage your coupon vendors and partners
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Vendor
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Total Coupons</th>
              <th>Available</th>
              <th>Claimed</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id}>
                <td>
                  <div>
                    <div className="font-medium text-gray-900">
                      {vendor.name}
                    </div>
                    {vendor.website && (
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:underline"
                      >
                        {vendor.website}
                      </a>
                    )}
                  </div>
                </td>
                <td>
                  {vendor.contact_email && (
                    <div className="text-sm">{vendor.contact_email}</div>
                  )}
                  {vendor.contact_phone && (
                    <div className="text-sm text-gray-500">
                      {vendor.contact_phone}
                    </div>
                  )}
                </td>
                <td>{vendor.total_coupons}</td>
                <td>
                  <span className="badge badge-success">
                    {vendor.available_coupons}
                  </span>
                </td>
                <td>{vendor.claimed_coupons}</td>
                <td>
                  <span
                    className={`badge ${
                      vendor.active ? 'badge-success' : 'badge-danger'
                    }`}
                  >
                    {vendor.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(vendor)}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(vendor.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {vendors.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No vendors found. Add your first vendor to get started.
          </div>
        )}
      </div>

      <VendorModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        vendor={editingVendor}
      />
    </div>
  )
}

