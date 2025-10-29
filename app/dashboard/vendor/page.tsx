'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Upload, Trash2, Building2, Mail, Phone, Globe, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Vendor, Coupon } from '@/types/database'
import CouponModal from '@/components/coupons/CouponModal'
import CSVUploadModal from '@/components/coupons/CSVUploadModal'
import { formatDate } from '@/lib/utils/format'
import { usePagination } from '@/lib/hooks/usePagination'
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

export default function VendorProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'claimed' | 'unclaimed'>('all')

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)
  
  // Success/Error dialogs
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState('')

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }

    // Only partner admins can access this page
    if (session.user.role !== 'partner_admin') {
      router.push('/dashboard')
      return
    }

    fetchVendor()
    fetchCoupons()
  }, [session, router])

  const fetchVendor = async () => {
    try {
      const response = await fetch('/api/vendors/my-vendor')
      const data = await response.json()
      if (data.success) {
        setVendor(data.data)
      } else {
        setDialogMessage(data.error || 'Failed to fetch vendor information')
        setShowErrorDialog(true)
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
      const response = await fetch('/api/coupons')
      const data = await response.json()
      if (data.success) {
        setCoupons(data.data)
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    }
  }

  const handleDelete = (coupon: Coupon) => {
    setCouponToDelete(coupon)
    setIsDeleteDialogOpen(true)
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

  const filteredCoupons = coupons.filter((coupon) => {
    if (filterStatus === 'claimed') return coupon.is_claimed
    if (filterStatus === 'unclaimed') return !coupon.is_claimed
    return true
  })

  // Pagination
  const {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    totalPages,
    getPaginatedData,
  } = usePagination(filteredCoupons, {
    defaultPageSize: 10,
    localStorageKey: 'vendor-coupons-page-size',
  })

  const paginatedCoupons = getPaginatedData(filteredCoupons)
  const pageSizeOptions = [5, 10, 20, 50, 100]

  // Calculate stats
  const totalCoupons = coupons.length
  const availableCoupons = coupons.filter((c) => !c.is_claimed).length
  const claimedCoupons = coupons.filter((c) => c.is_claimed).length

  if (loading) {
    return (
      <div className="ml-64 p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-48 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="ml-64 p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <div>
                <h2 className="text-xl font-bold">No Vendor Found</h2>
                <p className="text-muted-foreground">
                  You don't have a vendor associated with your account. Please contact an administrator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="ml-64 p-8">
      <div className="mb-6">
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
          </div>
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
            <CardDescription>Claimed</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{claimedCoupons}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Coupons Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Coupons</CardTitle>
              <CardDescription>Manage your vendor coupons</CardDescription>
            </div>
            <div className="flex gap-2">
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
          {/* Filter */}
          <div className="mb-4 flex items-center gap-4">
            <label className="text-sm font-medium">Filter by Status:</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[180px]">
                  {filterStatus === 'all' && 'All Coupons'}
                  {filterStatus === 'claimed' && 'Claimed'}
                  {filterStatus === 'unclaimed' && 'Available'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                  All Coupons
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('unclaimed')}>
                  Available
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('claimed')}>
                  Claimed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Coupons Table */}
          {paginatedCoupons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No coupons found. Create your first coupon!
            </div>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCoupons.map((coupon) => (
                      <TableRow key={coupon.id}>
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
                          <Badge variant={coupon.is_claimed ? 'warning' : 'success'}>
                            {coupon.is_claimed ? 'Claimed' : 'Available'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(coupon)}
                            disabled={coupon.is_claimed}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </div>
  )
}

