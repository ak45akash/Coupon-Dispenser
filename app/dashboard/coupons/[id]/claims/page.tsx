'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Users, Calendar, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface ClaimHistoryItem {
  id: string
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
  claimed_at: string
  claim_month: string
  next_available_claim_date: string | null
  can_claim_now: boolean
}

interface CouponClaimHistoryData {
  coupon: {
    id: string
    code: string
    description: string | null
    discount_value: string | null
    vendor_id: string
  }
  stats: {
    total_claims: number
    this_month_claims: number
    unique_users: number
  }
  claims: ClaimHistoryItem[]
}

export default function CouponClaimHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const couponId = params.id as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CouponClaimHistoryData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }

    fetchClaimHistory()
  }, [session, router, couponId])

  const fetchClaimHistory = async () => {
    if (!couponId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/coupons/${couponId}/claims`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to load claim history')
      }
    } catch (err: any) {
      setError('An error occurred while loading claim history')
      console.error('Error fetching claim history:', err)
    } finally {
      setLoading(false)
    }
  }

  const getNextAvailableDateText = (claim: ClaimHistoryItem) => {
    if (claim.can_claim_now) {
      return { text: 'Available Now', variant: 'success' as const }
    }

    if (claim.next_available_claim_date) {
      const date = new Date(claim.next_available_claim_date)
      const now = new Date()
      const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntil <= 0) {
        return { text: 'Available Now', variant: 'success' as const }
      }

      return {
        text: `Available in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} (${formatDate(claim.next_available_claim_date)})`,
        variant: 'warning' as const,
      }
    }

    return { text: 'Available Now', variant: 'success' as const }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/coupons">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Coupons
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/coupons">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Coupons
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Coupon Claim History
        </h1>
      </div>

      {/* Coupon Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg">{data.coupon.code}</span>
            <Badge variant="default">Coupon</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.coupon.description && (
              <p className="text-sm text-muted-foreground">{data.coupon.description}</p>
            )}
            {data.coupon.discount_value && (
              <p className="text-sm font-medium">{data.coupon.discount_value}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Claims</p>
              <p className="text-2xl font-bold">{data.stats.total_claims}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-blue-600">{data.stats.this_month_claims}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
              <p className="text-2xl font-bold text-green-600">{data.stats.unique_users}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claim History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Claim History</CardTitle>
        </CardHeader>
        <CardContent>
          {data.claims.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No claims yet for this coupon</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Claimed At</TableHead>
                    <TableHead>Claim Month</TableHead>
                    <TableHead>Next Available</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.claims.map((claim) => {
                    const nextAvailable = getNextAvailableDateText(claim)
                    return (
                      <TableRow key={claim.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/users/${claim.user.id}`}
                            className="font-medium text-primary hover:underline cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div>
                              <div className="font-medium">
                                {claim.user.name || claim.user.email}
                              </div>
                              {claim.user.name && (
                                <div className="text-sm text-muted-foreground">
                                  {claim.user.email}
                                </div>
                              )}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {claim.user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDateTime(claim.claimed_at)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(claim.claim_month)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {nextAvailable.text}
                          </div>
                        </TableCell>
                        <TableCell>
                          {claim.can_claim_now ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Can Claim
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Limit Reached
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

