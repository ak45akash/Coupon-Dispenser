import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAnalyticsOverview } from '@/lib/db/analytics'
import StatsCard from '@/components/dashboard/StatsCard'
import { Store, Ticket, TrendingUp, Users, ArrowRight, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const analytics = await getAnalyticsOverview()

  const claimedPercentage = analytics.total_coupons > 0
    ? (analytics.claimed_coupons / analytics.total_coupons) * 100
    : 0

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Header with gradient */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground text-lg">
              Welcome back! Here&apos;s what&apos;s happening with your coupons.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid with stagger animation */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="animate-in fade-in-0 slide-in-from-left-4 duration-500">
          <StatsCard
            title="Total Vendors"
            value={analytics.total_vendors}
            icon={Store}
          />
        </div>
        <div className="animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-75">
          <StatsCard
            title="Total Coupons"
            value={analytics.total_coupons}
            icon={Ticket}
          />
        </div>
        <div className="animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-100">
          <StatsCard
            title="Available Coupons"
            value={analytics.available_coupons}
            icon={TrendingUp}
          />
        </div>
        <div className="animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-150">
          <StatsCard
            title="Claims This Month"
            value={analytics.claims_this_month}
            icon={Users}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Coupon Distribution Card */}
        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              Coupon Distribution
            </CardTitle>
            <CardDescription>
              Track how your coupons are being utilized
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Claimed</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {analytics.claimed_coupons}
                </span>
              </div>
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    "h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000 ease-out shadow-lg"
                  )}
                  style={{ width: `${claimedPercentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                  {claimedPercentage.toFixed(1)}%
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                  <span className="text-sm font-medium">Available</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {analytics.available_coupons}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription>
              Manage your system efficiently
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {session?.user.role === 'super_admin' && (
              <>
                <Link href="/dashboard/vendors">
                  <Button 
                    variant="default" 
                    size="lg" 
                    className="w-full justify-between group hover:scale-[1.02] transition-transform duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Manage Vendors
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/dashboard/coupons">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full justify-between group hover:scale-[1.02] transition-transform duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      Manage Coupons
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </>
            )}
            {(session?.user.role === 'super_admin' ||
              session?.user.role === 'partner_admin') && (
              <Link href="/dashboard/analytics">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full justify-between group hover:scale-[1.02] transition-transform duration-200"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    View Analytics
                  </span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

