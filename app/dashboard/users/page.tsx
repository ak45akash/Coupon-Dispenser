'use client'

import { useEffect, useState } from 'react'
import { Shield, UserPlus } from 'lucide-react'
import type { User, Vendor } from '@/types/database'
import UserRoleModal from '@/components/users/UserRoleModal'
import PartnerAccessModal from '@/components/users/PartnerAccessModal'
import CreateUserModal from '@/components/users/CreateUserModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

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

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (role) {
      case 'super_admin':
        return 'destructive'
      case 'partner_admin':
        return 'secondary'
      default:
        return 'outline'
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
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-muted-foreground">
            Manage user roles and permissions
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          size="lg"
          className="gap-2"
        >
          <UserPlus className="h-5 w-5" />
          Create User
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRole(user)}
                      >
                        Change Role
                      </Button>
                      {user.role === 'partner_admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAccess(user)}
                        >
                          Manage Access
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-red-100 p-3">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Super Admins</p>
              <p className="text-3xl font-bold">
                {users.filter((u) => u.role === 'super_admin').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-yellow-100 p-3">
              <Shield className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Partner Admins</p>
              <p className="text-3xl font-bold">
                {users.filter((u) => u.role === 'partner_admin').length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-3">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Users</p>
              <p className="text-3xl font-bold">
                {users.filter((u) => u.role === 'user').length}
              </p>
            </div>
          </CardContent>
        </Card>
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

