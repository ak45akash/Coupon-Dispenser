'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Settings2, AlertCircle, CheckCircle } from 'lucide-react'
import type { VendorWithStats } from '@/types/database'
import VendorModal from '@/components/vendors/VendorModal'
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

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<VendorWithStats | null>(
    null
  )
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [vendorToDelete, setVendorToDelete] = useState<VendorWithStats | null>(null)
  
  // Success/Error dialogs
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState('')

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors?stats=true')
      const data = await response.json()
      if (data.success) {
        setVendors(data.data)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  const handleDelete = (vendor: VendorWithStats) => {
    setVendorToDelete(vendor)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!vendorToDelete) return

    try {
      const response = await fetch(`/api/vendors/${vendorToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDialogMessage(`Vendor "${vendorToDelete.name}" moved to trash successfully!`)
        setShowSuccessDialog(true)
        fetchVendors()
      } else {
        setDialogMessage('Failed to delete vendor.')
        setShowErrorDialog(true)
      }
    } catch (error) {
      console.error('Error deleting vendor:', error)
      setDialogMessage('An error occurred while deleting the vendor.')
      setShowErrorDialog(true)
    } finally {
      setIsDeleteDialogOpen(false)
      setVendorToDelete(null)
    }
  }

  const handleEdit = (vendor: VendorWithStats) => {
    setEditingVendor(vendor)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingVendor(null)
    fetchVendors()
  }

  // Pagination
  const {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    totalPages,
    getPaginatedData,
  } = usePagination(vendors, {
    defaultPageSize: 10,
    localStorageKey: 'vendors-page-size',
  })

  const paginatedVendors = getPaginatedData(vendors)
  const pageSizeOptions = [5, 10, 20, 50, 100]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading vendors...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your coupon vendors and partners
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Vendor
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Total Coupons</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Claimed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No vendors found. Add your first vendor to get started.
                </TableCell>
              </TableRow>
            ) : (
              paginatedVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div>
                      <Link
                        href={`/dashboard/vendors/${vendor.id}`}
                        className="font-medium text-primary hover:underline cursor-pointer"
                      >
                        {vendor.name}
                      </Link>
                      {vendor.website && (
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:underline block mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {vendor.website}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {vendor.contact_email && (
                      <div className="text-sm">{vendor.contact_email}</div>
                    )}
                    {vendor.contact_phone && (
                      <div className="text-sm text-muted-foreground">
                        {vendor.contact_phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{vendor.total_coupons}</TableCell>
                  <TableCell>
                    <Badge variant="success">{vendor.available_coupons}</Badge>
                  </TableCell>
                  <TableCell>{vendor.claimed_coupons}</TableCell>
                  <TableCell>
                    <Badge variant={vendor.active ? 'success' : 'destructive'}>
                      {vendor.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(vendor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(vendor)}
                        className="text-destructive hover:text-destructive"
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
      {vendors.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, vendors.length)} of {vendors.length} vendors
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

      <VendorModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        vendor={editingVendor}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        itemName={vendorToDelete?.name || ''}
        itemType="vendor"
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

