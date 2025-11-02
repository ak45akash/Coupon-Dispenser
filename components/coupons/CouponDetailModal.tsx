'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Tag, Store, FileText, DollarSign, Clock, Users, History } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import CouponClaimHistoryModal from './CouponClaimHistoryModal'

interface CouponDetail {
  id: string
  code: string
  description: string | null
  discount_value: string | null
  expiry_date: string | null
  vendor_id: string
  created_by: string | null
  created_at: string
  updated_at: string
  vendor?: {
    id: string
    name: string
    description: string | null
    website: string | null
  }
  stats?: {
    total_claims: number
    this_month_claims: number
    unique_users: number
  }
}

interface CouponDetailModalProps {
  isOpen: boolean
  onClose: () => void
  couponId: string | null
}

export default function CouponDetailModal({
  isOpen,
  onClose,
  couponId,
}: CouponDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CouponDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isClaimHistoryModalOpen, setIsClaimHistoryModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen && couponId) {
      fetchCouponDetails()
    } else {
      setData(null)
      setError(null)
    }
  }, [isOpen, couponId])

  const fetchCouponDetails = async () => {
    if (!couponId) return

    setLoading(true)
    setError(null)

    try {
      // Fetch coupon details
      const couponResponse = await fetch(`/api/coupons/${couponId}`)
      const couponResult = await couponResponse.json()

      if (!couponResult.success) {
        setError(couponResult.error || 'Failed to load coupon details')
        return
      }

      const coupon = couponResult.data

      // Fetch vendor details if vendor_id is present
      let vendor = null
      if (coupon.vendor_id) {
        try {
          const vendorResponse = await fetch(`/api/vendors/${coupon.vendor_id}`)
          const vendorResult = await vendorResponse.json()
          if (vendorResult.success) {
            vendor = vendorResult.data
          }
        } catch (err) {
          // Vendor fetch is optional, continue without it
          console.warn('Could not fetch vendor details:', err)
        }
      }

      // Fetch claim statistics
      let stats = null
      try {
        const statsResponse = await fetch(`/api/coupons/${couponId}/claims`)
        const statsResult = await statsResponse.json()
        if (statsResult.success && statsResult.data.stats) {
          stats = statsResult.data.stats
        }
      } catch (err) {
        // Stats fetch is optional
        console.warn('Could not fetch claim statistics:', err)
      }

      setData({
        ...coupon,
        vendor,
        stats,
      })
    } catch (err: any) {
      setError('An error occurred while loading coupon details')
      console.error('Error fetching coupon details:', err)
    } finally {
      setLoading(false)
    }
  }

  const isExpired = data?.expiry_date 
    ? new Date(data.expiry_date) < new Date()
    : false

  const isExpiringSoon = data?.expiry_date
    ? {
        date: new Date(data.expiry_date),
        daysUntil: Math.ceil((new Date(data.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      }
    : null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Coupon Details
            </DialogTitle>
          </DialogHeader>

          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              {error}
            </div>
          )}

          {data && !loading && (
            <div className="space-y-6">
              {/* Coupon Code - Prominent Display */}
              <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-3xl font-bold">{data.code}</span>
                      <Badge variant="default">Active</Badge>
                      {isExpired && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                      {isExpiringSoon && !isExpired && isExpiringSoon.daysUntil <= 7 && (
                        <Badge variant="warning">
                          Expires in {isExpiringSoon.daysUntil} day{isExpiringSoon.daysUntil !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    {data.discount_value && (
                      <p className="text-lg font-semibold text-primary">{data.discount_value}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              {/* Main Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Description */}
                {data.description && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{data.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Discount Value */}
                {data.discount_value && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Discount
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">{data.discount_value}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Expiry Date */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Expiry Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.expiry_date ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{formatDate(data.expiry_date)}</p>
                        {isExpired && (
                          <p className="text-xs text-destructive">This coupon has expired</p>
                        )}
                        {isExpiringSoon && !isExpired && (
                          <p className="text-xs text-muted-foreground">
                            {isExpiringSoon.daysUntil} day{isExpiringSoon.daysUntil !== 1 ? 's' : ''} remaining
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No expiry date</p>
                    )}
                  </CardContent>
                </Card>

                {/* Created Date */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Created
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{formatDateTime(data.created_at)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated: {formatDateTime(data.updated_at)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Vendor Information */}
              {data.vendor && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Vendor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-semibold">{data.vendor.name}</p>
                      {data.vendor.description && (
                        <p className="text-sm text-muted-foreground">{data.vendor.description}</p>
                      )}
                      {data.vendor.website && (
                        <a
                          href={data.vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          Visit website →
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Claim Statistics */}
              {data.stats && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Claim Statistics
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsClaimHistoryModalOpen(true)}
                        className="gap-2"
                      >
                        <History className="h-3 w-3" />
                        View History
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Claims</p>
                        <p className="text-2xl font-bold">{data.stats.total_claims}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">This Month</p>
                        <p className="text-2xl font-bold text-blue-600">{data.stats.this_month_claims}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Unique Users</p>
                        <p className="text-2xl font-bold text-green-600">{data.stats.unique_users}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Claim History Modal */}
      <CouponClaimHistoryModal
        isOpen={isClaimHistoryModalOpen}
        onClose={() => setIsClaimHistoryModalOpen(false)}
        couponId={couponId}
      />
    </>
  )
}

