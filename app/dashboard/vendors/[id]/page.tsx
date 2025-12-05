'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Building2, Mail, Phone, Globe, Trash2, Plus, Upload, ArrowLeft, History, ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react'
import type { Vendor, Coupon } from '@/types/database'
import CouponModal from '@/components/coupons/CouponModal'
import CSVUploadModal from '@/components/coupons/CSVUploadModal'
import CouponDetailModal from '@/components/coupons/CouponDetailModal'
import { formatDate } from '@/lib/utils/format'
import { usePagination } from '@/lib/hooks/usePagination'
import { useSort } from '@/lib/hooks/useSort'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteDialog, SuccessDialog, ErrorDialog } from '@/components/ui/dialog-helpers'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Copy, Check, Key, RefreshCw, AlertTriangle } from 'lucide-react'

export default function VendorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const vendorId = params.id as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false)
  // Status filter removed - all coupons are shared/available

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)
  
  // Success/Error dialogs
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState('')
  
  // Coupon detail modal state
  const [isCouponDetailModalOpen, setIsCouponDetailModalOpen] = useState(false)
  const [selectedCouponForDetail, setSelectedCouponForDetail] = useState<string | null>(null)
  
  // Widget script copy state
  const [copiedScript, setCopiedScript] = useState(false)
  
  // Partner secret state
  const [partnerSecret, setPartnerSecret] = useState<string | null>(null)
  const [showPartnerSecret, setShowPartnerSecret] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [generatingSecret, setGeneratingSecret] = useState(false)

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }

    // Only super_admin can access this page
    if (session.user.role !== 'super_admin') {
      router.push('/dashboard')
      return
    }

    fetchVendor()
    fetchCoupons()
  }, [session, router, vendorId])

  const fetchVendor = async () => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}`)
      const data = await response.json()
      if (data.success) {
        setVendor(data.data)
        // Fetch partner secret status
        fetchPartnerSecretStatus()
      } else {
        setDialogMessage(data.error || 'Failed to fetch vendor information')
        setShowErrorDialog(true)
        setTimeout(() => router.push('/dashboard/vendors'), 2000)
      }
    } catch (error) {
      console.error('Error fetching vendor:', error)
      setDialogMessage('An error occurred while fetching vendor information')
      setShowErrorDialog(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchCoupons = async () => {
    try {
      const response = await fetch(`/api/coupons?vendor_id=${vendorId}`)
      const data = await response.json()
      if (data.success) {
        setCoupons(data.data)
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    }
  }

  const fetchPartnerSecretStatus = async () => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/partner-secret`)
      const data = await response.json()
      if (data.success) {
        // Don't store the actual secret, just track if it exists
        setPartnerSecret(data.data.has_secret ? 'exists' : null)
      }
    } catch (error) {
      console.error('Error fetching partner secret status:', error)
    }
  }

  const generatePartnerSecret = async () => {
    if (!confirm('Are you sure you want to generate a new partner secret? This will invalidate the old one and partners will need to update their code.')) {
      return
    }

    setGeneratingSecret(true)
    try {
      const response = await fetch(`/api/vendors/${vendorId}/partner-secret`, {
        method: 'POST',
      })
      const data = await response.json()
      
      if (data.success) {
        setPartnerSecret(data.data.partner_secret)
        setShowPartnerSecret(true)
        setDialogMessage('Partner secret generated successfully! Make sure to copy it now - it will not be shown again.')
        setShowSuccessDialog(true)
      } else {
        setDialogMessage(data.error || 'Failed to generate partner secret')
        setShowErrorDialog(true)
      }
    } catch (error) {
      console.error('Error generating partner secret:', error)
      setDialogMessage('An error occurred while generating partner secret')
      setShowErrorDialog(true)
    } finally {
      setGeneratingSecret(false)
    }
  }

  const copyPartnerSecret = () => {
    if (partnerSecret && partnerSecret !== 'exists') {
      navigator.clipboard.writeText(partnerSecret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  const handleDelete = (coupon: Coupon) => {
    setCouponToDelete(coupon)
    setIsDeleteDialogOpen(true)
  }

  const handleViewClaimHistory = (coupon: Coupon, e?: React.MouseEvent) => {
    e?.stopPropagation() // Prevent row click when clicking history button
    router.push(`/dashboard/coupons/${coupon.id}/claims`)
  }

  const handleViewCouponDetail = (coupon: Coupon) => {
    setSelectedCouponForDetail(coupon.id)
    setIsCouponDetailModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!couponToDelete) return

    try {
      const response = await fetch(`/api/coupons/${couponToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDialogMessage(`Coupon "${couponToDelete.code}" moved to trash successfully!`)
        setShowSuccessDialog(true)
        fetchCoupons()
      } else {
        setDialogMessage('Failed to delete coupon.')
        setShowErrorDialog(true)
      }
    } catch (error) {
      console.error('Error deleting coupon:', error)
      setDialogMessage('An error occurred while deleting the coupon.')
      setShowErrorDialog(true)
    } finally {
      setIsDeleteDialogOpen(false)
      setCouponToDelete(null)
    }
  }

  // All coupons are available (shared model)
  const filteredCoupons = coupons.filter((coupon) => {
    return true // All coupons are available
  })

  // Sorting
  const { sortedData: sortedCoupons, sortConfig, handleSort } = useSort<Coupon>(
    filteredCoupons,
    { key: 'created_at', direction: 'desc' }
  )

  // Pagination
  const {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    totalPages,
    getPaginatedData,
  } = usePagination(sortedCoupons, {
    defaultPageSize: 10,
    localStorageKey: 'vendor-profile-coupons-page-size',
  })

  const paginatedCoupons = getPaginatedData(sortedCoupons)
  const pageSizeOptions = [5, 10, 20, 50, 100]

  // Calculate stats - all coupons are available (shared model)
  const totalCoupons = coupons.length
  const availableCoupons = totalCoupons // All coupons are available
  // Note: Claim stats would need to come from claim_history API

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-48 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 text-destructive">
              <Building2 className="h-8 w-8" />
              <div>
                <h2 className="text-xl font-bold">Vendor Not Found</h2>
                <p className="text-muted-foreground">
                  The vendor you&apos;re looking for doesn&apos;t exist or has been deleted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/vendors">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Vendors
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">{vendor.name}</h1>
        <p className="text-muted-foreground mt-2">{vendor.description || 'No description provided'}</p>
      </div>

      {/* Vendor Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Vendor Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendor.contact_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span>{vendor.contact_email}</span>
              </div>
            )}
            {vendor.contact_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Phone:</span>
                <span>{vendor.contact_phone}</span>
              </div>
            )}
            {vendor.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Website:</span>
                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {vendor.website}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={vendor.active ? 'success' : 'destructive'}>
                {vendor.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partner Secret Management */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Partner Secret (for JWT Token Signing)
            </CardTitle>
            <Button
              onClick={generatePartnerSecret}
              variant="outline"
              size="sm"
              disabled={generatingSecret}
            >
              {generatingSecret ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : partnerSecret ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Generate Secret
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Partner secret is used to sign JWT tokens for widget authentication. Keep this secure and share only with the vendor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partnerSecret && partnerSecret !== 'exists' && showPartnerSecret ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Copy this secret now. It will not be displayed again for security reasons.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                  {partnerSecret}
                </code>
                <Button
                  onClick={copyPartnerSecret}
                  variant="outline"
                  size="sm"
                >
                  {copiedSecret ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : partnerSecret === 'exists' ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Partner secret is configured. Click "Regenerate" to create a new one (this will invalidate the old secret).
              </p>
              <Button
                onClick={() => {
                  if (confirm('This will show the current secret. Are you sure?')) {
                    fetchPartnerSecretStatus()
                  }
                }}
                variant="outline"
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Secret (Last 4 chars only)
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No partner secret configured. Generate one to enable partner token authentication.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coupon Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Coupons</CardDescription>
            <CardTitle className="text-3xl">{totalCoupons}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Available</CardDescription>
            <CardTitle className="text-3xl text-green-600">{availableCoupons}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{availableCoupons}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Coupons Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Coupons</CardTitle>
              <CardDescription>Manage coupons for this vendor</CardDescription>
            </div>
            <div className="flex gap-2">
              {vendor && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => router.push(`/widget/template/${vendor.id}`)}
                    title="Preview coupon widget template"
                  >
                    <Eye className="h-4 w-4" />
                    Preview Template
                  </Button>
                  {coupons.length > 0 && (
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        title="Copy widget embed code"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Widget
                      </Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="p-2">
                      <div className="mb-2 text-xs font-semibold text-muted-foreground">
                        Choose Embed Method:
                      </div>
                      <DropdownMenuItem
                        onClick={async () => {
                          const baseUrl = window.location.origin
                          const widgetScript = `<script src="${baseUrl}/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="${vendor.id}" 
     data-user-id="USER_ID_FROM_YOUR_SYSTEM"
     data-theme="light">
</div>

<!-- Instructions: Replace USER_ID_FROM_YOUR_SYSTEM with the authenticated user's ID -->`
                          try {
                            await navigator.clipboard.writeText(widgetScript)
                            setCopiedScript(true)
                            setTimeout(() => setCopiedScript(false), 2000)
                          } catch (err) {
                            console.error('Failed to copy:', err)
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <div>
                          <div className="font-medium">Script Embed (Recommended)</div>
                          <div className="text-xs text-muted-foreground">
                            For websites that support script tags
                          </div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async () => {
                          const baseUrl = window.location.origin
                          const iframeCode = `<iframe 
  src="${baseUrl}/widget/embed?vendor_id=${vendor.id}&user_id=USER_ID_FROM_YOUR_SYSTEM&theme=light"
  width="100%" 
  height="600" 
  frameborder="0" 
  style="border: none; border-radius: 8px;">
</iframe>

<!-- Instructions: Replace USER_ID_FROM_YOUR_SYSTEM with the authenticated user's ID -->
<!-- For Elementor: Use Shortcode widget or paste iframe code directly -->`
                          try {
                            await navigator.clipboard.writeText(iframeCode)
                            setCopiedScript(true)
                            setTimeout(() => setCopiedScript(false), 2000)
                          } catch (err) {
                            console.error('Failed to copy:', err)
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <div>
                          <div className="font-medium">Iframe Embed (Elementor)</div>
                          <div className="text-xs text-muted-foreground">
                            Works with Elementor Shortcode widget
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                  )}
                </>
              )}
              {copiedScript && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  Copied!
                </div>
              )}
              <Button onClick={() => setIsCSVModalOpen(true)} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Coupon
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Status filter removed - all coupons are shared/available */}

          {/* Coupons Table */}
          {paginatedCoupons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No coupons found. Create the first coupon for this vendor!
            </div>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          onClick={() => handleSort('code')}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          Code
                          {sortConfig?.key === 'code' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('description')}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          Description
                          {sortConfig?.key === 'description' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('discount_value')}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          Discount
                          {sortConfig?.key === 'discount_value' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('expiry_date')}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          Expiry Date
                          {sortConfig?.key === 'expiry_date' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('is_claimed')}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          Claimed
                          {sortConfig?.key === 'is_claimed' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('is_claimed')}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          Status
                          {sortConfig?.key === 'is_claimed' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCoupons.map((coupon) => (
                      <TableRow 
                        key={coupon.id}
                        onClick={() => handleViewCouponDetail(coupon)}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        <TableCell className="font-mono font-semibold">
                          {coupon.code}
                        </TableCell>
                        <TableCell>{coupon.description || '-'}</TableCell>
                        <TableCell>{coupon.discount_value || '-'}</TableCell>
                        <TableCell>
                          {coupon.expiry_date
                            ? formatDate(coupon.expiry_date)
                            : 'No expiry'}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {coupon.is_claimed ? (
                              <span className="text-green-600">Yes</span>
                            ) : (
                              <span className="text-gray-500">No</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={coupon.is_claimed ? 'destructive' : 'success'}>
                            {coupon.is_claimed ? 'Claimed' : 'Available'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleViewClaimHistory(coupon, e)}
                              className="text-primary hover:text-primary"
                              title="View claim history"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(coupon)
                              }}
                              className="text-destructive hover:text-destructive"
                              title="Delete coupon"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Items per page:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {pageSize}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {pageSizeOptions.map((size) => (
                        <DropdownMenuItem
                          key={size}
                          onClick={() => setPageSize(size)}
                        >
                          {size}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages || 1, currentPage + 1))}
                    disabled={currentPage >= (totalPages || 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CouponModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          fetchCoupons()
        }}
        vendors={vendor ? [vendor] : []}
      />

      <CSVUploadModal
        isOpen={isCSVModalOpen}
        onClose={() => {
          setIsCSVModalOpen(false)
          fetchCoupons()
        }}
        vendors={vendor ? [vendor] : []}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Coupon"
        itemName={couponToDelete?.code || ''}
        itemType="coupon"
      />

      {/* Success Dialog */}
      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        message={dialogMessage}
      />

      {/* Error Dialog */}
      <ErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        message={dialogMessage}
      />

      {/* Coupon Detail Modal */}
      <CouponDetailModal
        isOpen={isCouponDetailModalOpen}
        onClose={() => {
          setIsCouponDetailModalOpen(false)
          setSelectedCouponForDetail(null)
        }}
        couponId={selectedCouponForDetail}
      />
    </div>
  )
}

