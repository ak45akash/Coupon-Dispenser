'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Store,
  Ticket,
  Users,
  BarChart3,
  FileText,
  Trash2,
} from 'lucide-react'
import { UserRole } from '@/types/database'
import clsx from 'clsx'

interface SidebarProps {
  userRole: UserRole
}

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  roles: UserRole[]
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'partner_admin', 'user'],
  },
  {
    name: 'Vendors',
    href: '/dashboard/vendors',
    icon: Store,
    roles: ['super_admin', 'partner_admin'],
  },
  {
    name: 'Coupons',
    href: '/dashboard/coupons',
    icon: Ticket,
    roles: ['super_admin', 'partner_admin'],
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: Users,
    roles: ['super_admin'],
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['super_admin', 'partner_admin'],
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    roles: ['super_admin'],
  },
  {
    name: 'Trash',
    href: '/dashboard/trash',
    icon: Trash2,
    roles: ['super_admin'],
  },
]

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  )

  // Separate trash from other items
  const mainNavItems = filteredNavItems.filter((item) => item.href !== '/dashboard/trash')
  const trashItem = filteredNavItems.find((item) => item.href === '/dashboard/trash')

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">
            Coupon Dispenser
          </h1>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Trash at the bottom */}
        {trashItem && (
          <div className="border-t border-gray-200 p-4">
            <Link
              href={trashItem.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === trashItem.href
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Trash2 className="h-5 w-5" />
              {trashItem.name}
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}

