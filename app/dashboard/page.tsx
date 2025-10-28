import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAnalyticsOverview } from '@/lib/db/analytics'
import StatsCard from '@/components/dashboard/StatsCard'
import { Store, Ticket, TrendingUp, Users } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const analytics = await getAnalyticsOverview()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Overview of your coupon management system
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Vendors"
          value={analytics.total_vendors}
          icon={Store}
        />
        <StatsCard
          title="Total Coupons"
          value={analytics.total_coupons}
          icon={Ticket}
        />
        <StatsCard
          title="Available Coupons"
          value={analytics.available_coupons}
          icon={TrendingUp}
        />
        <StatsCard
          title="Claims This Month"
          value={analytics.claims_this_month}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900">
            Coupon Distribution
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Claimed</span>
              <span className="text-sm font-medium text-gray-900">
                {analytics.claimed_coupons}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-primary-600"
                style={{
                  width: `${
                    analytics.total_coupons > 0
                      ? (analytics.claimed_coupons / analytics.total_coupons) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Available</span>
              <span className="text-sm font-medium text-gray-900">
                {analytics.available_coupons}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900">
            Quick Actions
          </h3>
          <div className="mt-4 space-y-3">
            {session?.user.role === 'super_admin' && (
              <>
                <a
                  href="/dashboard/vendors"
                  className="btn btn-primary block text-center"
                >
                  Manage Vendors
                </a>
                <a
                  href="/dashboard/coupons"
                  className="btn btn-secondary block text-center"
                >
                  Manage Coupons
                </a>
              </>
            )}
            {(session?.user.role === 'super_admin' ||
              session?.user.role === 'partner_admin') && (
              <a
                href="/dashboard/analytics"
                className="btn btn-secondary block text-center"
              >
                View Analytics
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

