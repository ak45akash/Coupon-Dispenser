'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateUserModal({
  isOpen,
  onClose,
}: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'user' as 'super_admin' | 'partner_admin' | 'user',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        alert('User created successfully! A password reset email has been sent to their email address.')
        setFormData({ email: '', name: '', role: 'user' })
        onClose()
      } else {
        setError(data.error || 'Failed to create user')
      }
    } catch (err) {
      setError('An error occurred while creating the user')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        <div className="modal-header">
          <h3 className="modal-title">Create New User</h3>
          <button onClick={onClose} className="modal-close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                placeholder="user@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                A password reset link will be sent to this email
              </p>
            </div>

            <div>
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="role" className="label">
                Role
              </label>
              <select
                id="role"
                className="input"
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as
                      | 'super_admin'
                      | 'partner_admin'
                      | 'user',
                  })
                }
              >
                <option value="user">User - View only access</option>
                <option value="partner_admin">
                  Partner Admin - Manage assigned vendors
                </option>
                <option value="super_admin">
                  Super Admin - Full system access
                </option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {formData.role === 'super_admin' &&
                  'Full access to all features and data'}
                {formData.role === 'partner_admin' &&
                  'Can manage coupons for assigned vendors only'}
                {formData.role === 'user' && 'Read-only access to dashboard'}
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

