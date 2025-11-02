'use client'

import { useEffect, useState } from 'react'
import { Plus, Upload, Trash2, Filter, ChevronLeft, ChevronRight, Settings2, AlertCircle, CheckCircle, History } from 'lucide-react'
import type { Coupon, Vendor } from '@/types/database'
import CouponModal from '@/components/coupons/CouponModal'
import CSVUploadModal from '@/components/coupons/CSVUploadModal'
import CouponClaimHistoryModal from '@/components/coupons/CouponClaimHistoryModal'
import CouponDetailModal from '@/components/coupons/CouponDetailModal'
import { formatDate } from '@/lib/utils/format'
import { usePagination } from '@/lib/hooks/usePagination'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DeleteDialog, SuccessDialog, ErrorDialog } from '@/components/ui/dialog-helpers'

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<string>('')
  // Status filter removed - all coupons are shared/available
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)
  
  // Success/Error dialogs
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState('')
  
  // Claim history modal state
  const [isClaimHistoryModalOpen, setIsClaimHistoryModalOpen] = useState(false)
  const [selectedCouponForHistory, setSelectedCouponForHistory] = useState<string | null>(null)
  
  // Coupon detail modal state
  const [isCouponDetailModalOpen, setIsCouponDetailModalOpen] = useState(false)
  const [selectedCouponForDetail, setSelectedCouponForDetail] = useState<string | null>(null)

  const fetchCoupons = async () => {
    try {
      const url = selectedVendor
        ? `/api/coupons?vendor_id=${selectedVendor}`
        : '/api/coupons'
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setCoupons(data.data)
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors')
      const data = await response.json()
      if (data.success) {
        setVendors(data.data)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  useEffect(() => {
    fetchCoupons()
  }, [selectedVendor])

  const handleDelete = (coupon: Coupon) => {
    setCouponToDelete(coupon)
    setIsDeleteDialogOpen(true)
  }

  const handleViewClaimHistory = (coupon: Coupon, e?: React.MouseEvent) => {
    e?.stopPropagation() // Prevent row click when clicking history button
    setSelectedCouponForHistory(coupon.id)
    setIsClaimHistoryModalOpen(true)
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

  const getVendorName = (vendorId: string) => {
    return vendors.find((v) => v.id === vendorId)?.name || 'Unknown'
  }

  // All coupons are available (shared model)
  // Status filtering removed since coupons are reusable
  const filteredCoupons = coupons.filter((coupon) => {
    // Vendor filter only
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
    localStorageKey: 'coupons-page-size',
  })

  const paginatedCoupons = getPaginatedData(filteredCoupons)

  const pageSizeOptions = [5, 10, 20, 50, 100]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading coupons...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="mt-1 text-muted-foreground">
            Manage coupon codes and track claims
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setIsCSVModalOpen(true)}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Upload className="h-5 w-5" />
            Bulk Upload
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            size="lg"
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Coupon
          </Button>
        </div>
      </div>

      {/* Stats Cards at Top */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Coupons</p>
              <p className="text-3xl font-bold">{filteredCoupons.length}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <Plus className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available</p>
              <p className="text-3xl font-bold text-green-600">
                {filteredCoupons.length}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Filter className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vendors</p>
              <p className="text-3xl font-bold text-blue-600">
                {vendors.length}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vendor-filter">Filter by Vendor</Label>
            <select
              id="vendor-filter"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter removed - all coupons are shared/available */}
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCoupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No coupons found. Add coupons to get started.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCoupons.map((coupon) => (
                <TableRow 
                  key={coupon.id}
                  onClick={() => handleViewCouponDetail(coupon)}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <TableCell className="font-mono font-semibold">{coupon.code}</TableCell>
                  <TableCell>{getVendorName(coupon.vendor_id)}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {coupon.description || '-'}
                  </TableCell>
                  <TableCell>{coupon.discount_value || '-'}</TableCell>
                  <TableCell>
                    {coupon.expiry_date
                      ? formatDate(coupon.expiry_date)
                      : 'No expiry'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">
                      Available
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
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination Controls */}
      {filteredCoupons.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredCoupons.length)} of {filteredCoupons.length} coupons
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  {pageSize} per page
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {pageSizeOptions.map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => setPageSize(size)}
                    className={pageSize === size ? 'bg-accent' : ''}
                  >
                    {size} per page
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
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="min-w-[2.5rem]"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <CouponModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          fetchCoupons()
        }}
        vendors={vendors}
      />

      <CSVUploadModal
        isOpen={isCSVModalOpen}
        onClose={() => {
          setIsCSVModalOpen(false)
          fetchCoupons()
        }}
        vendors={vendors}
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

      {/* Claim History Modal */}
      <CouponClaimHistoryModal
        isOpen={isClaimHistoryModalOpen}
        onClose={() => {
          setIsClaimHistoryModalOpen(false)
          setSelectedCouponForHistory(null)
        }}
        couponId={selectedCouponForHistory}
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

