'use client'

import { signOut } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'
import { UserRole } from '@/types/database'

interface TopbarProps {
  user: {
    name?: string | null
    email: string
    role: UserRole
  }
}

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  partner_admin: 'Partner Admin',
  user: 'User',
}

export default function Topbar({ user }: TopbarProps) {
  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-16 border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between px-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Welcome back, {user.name || user.email}
          </h2>
          <p className="text-sm text-gray-500">{roleLabels[user.role]}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {user.email}
            </span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}

