'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { User, UserRole } from '@/types/database'

interface UserRoleModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
}

export default function UserRoleModal({
  isOpen,
  onClose,
  user,
}: UserRoleModalProps) {
  const [role, setRole] = useState<UserRole>(user.role)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/users/${user.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
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
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Change User Role</h2>
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
            <p className="mb-2 text-sm text-gray-600">
              User: <strong>{user.email}</strong>
            </p>
            <label htmlFor="role" className="label">
              Select Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="input"
            >
              <option value="user">User</option>
              <option value="partner_admin">Partner Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <p className="mb-2 font-semibold">Role Permissions:</p>
            <ul className="list-inside list-disc space-y-1">
              {role === 'super_admin' && (
                <>
                  <li>Full access to all features</li>
                  <li>Manage vendors, coupons, and users</li>
                  <li>View all analytics and reports</li>
                </>
              )}
              {role === 'partner_admin' && (
                <>
                  <li>Manage assigned vendor coupons</li>
                  <li>View vendor-specific analytics</li>
                  <li>Cannot manage other users</li>
                </>
              )}
              {role === 'user' && (
                <>
                  <li>Claim coupons only</li>
                  <li>View own claim history</li>
                  <li>No administrative access</li>
                </>
              )}
            </ul>
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
              {loading ? 'Updating...' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

