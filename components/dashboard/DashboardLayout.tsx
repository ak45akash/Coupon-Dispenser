'use client'

import { SessionProvider } from 'next-auth/react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { UserRole } from '@/types/database'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: {
    name?: string | null
    email: string
    role: UserRole
  }
}

export default function DashboardLayout({
  children,
  user,
}: DashboardLayoutProps) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar userRole={user.role} />
        <Topbar user={user} />
        <main className="ml-64 pt-16">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SessionProvider>
  )
}

