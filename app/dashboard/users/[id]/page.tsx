'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { User, Mail, Shield, Calendar, ArrowLeft, Ticket, Store, Clock, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import Link from 'next/link'
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
import { Skeleton } from '@/components/ui/skeleton'

interface ClaimHistoryItem {
  id: string
  claimed_at: string
  claim_month: string
  coupon: {
    id: string
    code: string
    description: string | null
    discount_value: string | null
    vendor_id: string
    expiry_date: string | null
  }
  vendor: {
    id: string
    name: string
  }
  next_available_claim_date: string | null
  can_claim_now: boolean
  days_remaining: number | null
  time_remaining_text: string
}

interface UserDetailData {
  user: {
    id: string
    email: string
    name: string | null
    role: string
    created_at: string
    updated_at: string
    phone: string | null
    last_sign_in_at: string | null
    email_confirmed: boolean
  }
  stats: {
    total_claims: number
    this_month_claims: number
    unique_vendors: number
  }
  claim_history: ClaimHistoryItem[]
  vendor_access: Array<{
    vendor_id: string
    vendor: {
      id: string
      name: string
    }
  }>
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const userId = params.id as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UserDetailData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }

    // Only super admin can access this page
    if (session.user.role !== 'super_admin') {
      router.push('/dashboard')
      return
    }

    fetchUserDetails()
  }, [session, router, userId])

  const fetchUserDetails = async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/users/${userId}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to load user details')
      }
    } catch (err: any) {
      setError('An error occurred while loading user details')
      console.error('Error fetching user details:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/users">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              {error || 'User not found'}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive'
      case 'partner_admin':
        return 'default'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/users">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8" />
          {data.user.name || data.user.email}
        </h1>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Email</span>
                {data.user.email_confirmed && (
                  <Badge variant="success" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-base">{data.user.email}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Name</span>
              </div>
              <p className="text-base">{data.user.name || 'Not provided'}</p>
            </div>
            {data.user.phone && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Phone</span>
                </div>
                <p className="text-base">{data.user.phone}</p>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Role</span>
              </div>
              <Badge variant={getRoleBadgeVariant(data.user.role)}>
                {data.user.role.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Registered</span>
              </div>
              <p className="text-base">{formatDateTime(data.user.created_at)}</p>
              <p className="text-xs text-muted-foreground">
                Updated: {formatDateTime(data.user.updated_at)}
              </p>
            </div>
            {data.user.last_sign_in_at && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Last Sign In</span>
                </div>
                <p className="text-base">{formatDateTime(data.user.last_sign_in_at)}</p>
              </div>
            )}
            {!data.user.last_sign_in_at && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Last Sign In</span>
                </div>
                <p className="text-base text-muted-foreground">Never</p>
              </div>
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
              <p className="text-sm font-medium text-muted-foreground">Vendors Used</p>
              <p className="text-2xl font-bold text-green-600">{data.stats.unique_vendors}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partner Admin Vendor Access */}
      {data.user.role === 'partner_admin' && data.vendor_access.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Vendor Access
            </CardTitle>
            <CardDescription>Vendors this partner admin can manage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.vendor_access.map((access) => (
                <Link
                  key={access.vendor_id}
                  href={`/dashboard/vendors/${access.vendor_id}`}
                >
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    {access.vendor.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claim History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Claim History
          </CardTitle>
          <CardDescription>All coupons claimed by this user</CardDescription>
        </CardHeader>
        <CardContent>
          {data.claim_history.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No claims yet</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coupon</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Claimed At</TableHead>
                    <TableHead>Claim Month</TableHead>
                    <TableHead>Next Claim Available</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.claim_history.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/coupons/${claim.coupon.id}`}
                          className="font-mono font-medium text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {claim.coupon.code}
                        </Link>
                        {claim.coupon.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {claim.coupon.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/vendors/${claim.vendor.id}`}
                          className="font-medium text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {claim.vendor.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {claim.coupon.discount_value || '-'}
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
                          {claim.can_claim_now ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Available Now
                            </Badge>
                          ) : (
                            <div>
                              <Badge variant="warning" className="gap-1 mb-1">
                                <XCircle className="h-3 w-3" />
                                {claim.time_remaining_text}
                              </Badge>
                              {claim.next_available_claim_date && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Until {formatDate(claim.next_available_claim_date)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {claim.can_claim_now ? (
                          <Badge variant="success">Can Claim</Badge>
                        ) : (
                          <Badge variant="warning">Limit Reached</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

