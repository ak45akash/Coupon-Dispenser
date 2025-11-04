'use client'

import { signOut } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'
import { UserRole } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

const roleVariants: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  super_admin: 'default',
  partner_admin: 'secondary',
  user: 'outline',
}

export default function Topbar({ user }: TopbarProps) {
  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-16 border-b bg-card shadow-sm backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              Welcome back, {user.name || user.email.split('@')[0] || 'User'}
            </h2>
            <Badge variant={roleVariants[user.role]} className="mt-1">
              {roleLabels[user.role]}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {user.email}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}

