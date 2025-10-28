'use client'

import { useEffect, useState } from 'react'
import { Shield, UserPlus } from 'lucide-react'
import type { User, Vendor } from '@/types/database'
import UserRoleModal from '@/components/users/UserRoleModal'
import PartnerAccessModal from '@/components/users/PartnerAccessModal'
import CreateUserModal from '@/components/users/CreateUserModal'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
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
    fetchUsers()
    fetchVendors()
  }, [])

  const handleEditRole = (user: User) => {
    setSelectedUser(user)
    setIsRoleModalOpen(true)
  }

  const handleEditAccess = (user: User) => {
    setSelectedUser(user)
    setIsAccessModalOpen(true)
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'badge-danger'
      case 'partner_admin':
        return 'badge-warning'
      default:
        return 'badge-info'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin'
      case 'partner_admin':
        return 'Partner Admin'
      default:
        return 'User'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-gray-600">
            Manage user roles and permissions
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          Create User
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="font-medium">{user.email}</td>
                <td>{user.name || '-'}</td>
                <td>
                  <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditRole(user)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Change Role
                    </button>
                    {user.role === 'partner_admin' && (
                      <button
                        onClick={() => handleEditAccess(user)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Manage Access
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No users found.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="card">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Super Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.role === 'super_admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Partner Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.role === 'partner_admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u) => u.role === 'user').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          fetchUsers()
        }}
      />

      {selectedUser && (
        <>
          <UserRoleModal
            isOpen={isRoleModalOpen}
            onClose={() => {
              setIsRoleModalOpen(false)
              setSelectedUser(null)
              fetchUsers()
            }}
            user={selectedUser}
          />

          <PartnerAccessModal
            isOpen={isAccessModalOpen}
            onClose={() => {
              setIsAccessModalOpen(false)
              setSelectedUser(null)
            }}
            user={selectedUser}
            vendors={vendors}
          />
        </>
      )}
    </div>
  )
}

