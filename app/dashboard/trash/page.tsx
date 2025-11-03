'use client'

import { useState, useEffect } from 'react'
import { Trash2, RefreshCw, AlertCircle, Clock, Package, Users, Tag, CheckCircle, CheckSquare, Square } from 'lucide-react'
import type { TrashItem } from '@/types/database'
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
import { RestoreDialog, PermanentDeleteDialog, SuccessDialog, ErrorDialog, DeleteAllDialog } from '@/components/ui/dialog-helpers'
import { Button } from '@/components/ui/button'

export default function TrashPage() {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'user' | 'vendor' | 'coupon'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Dialog states
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null)
  const [dialogMessage, setDialogMessage] = useState('')
  
  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showBulkRestoreDialog, setShowBulkRestoreDialog] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  useEffect(() => {
    fetchTrashItems()
  }, [])

  const fetchTrashItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/trash')
      if (!response.ok) throw new Error('Failed to fetch trash items')
      const data = await response.json()
      setTrashItems(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = (item: TrashItem) => {
    setSelectedItem(item)
    setShowRestoreDialog(true)
  }

  const confirmRestore = async () => {
    if (!selectedItem) return

    try {
      setActionLoading(selectedItem.id)
      const response = await fetch('/api/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedItem.id, type: selectedItem.item_type }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to restore item')
      }

      setDialogMessage(`${selectedItem.item_type} restored successfully!`)
      setShowSuccessDialog(true)
      fetchTrashItems()
    } catch (err: any) {
      setDialogMessage(`Error: ${err.message}`)
      setShowErrorDialog(true)
    } finally {
      setActionLoading(null)
      setShowRestoreDialog(false)
      setSelectedItem(null)
    }
  }

  const handlePermanentDelete = (item: TrashItem) => {
    setSelectedItem(item)
    setShowDeleteDialog(true)
  }

  const confirmPermanentDelete = async () => {
    if (!selectedItem) return

    try {
      setActionLoading(selectedItem.id)
      const response = await fetch('/api/trash/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedItem.id, type: selectedItem.item_type }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete item')
      }

      setDialogMessage(`${selectedItem.item_type} permanently deleted`)
      setShowSuccessDialog(true)
      fetchTrashItems()
    } catch (err: any) {
      setDialogMessage(`Error: ${err.message}`)
      setShowErrorDialog(true)
    } finally {
      setActionLoading(null)
      setShowDeleteDialog(false)
      setSelectedItem(null)
    }
  }

  const handleDeleteAll = () => {
    setShowDeleteAllDialog(true)
  }

  const confirmDeleteAll = async () => {
    try {
      setActionLoading('all')
      const response = await fetch('/api/trash/delete-all', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete all items')
      }

      const data = await response.json()
      setDialogMessage(data.message || 'All trash items permanently deleted')
      setShowSuccessDialog(true)
      fetchTrashItems()
    } catch (err: any) {
      setDialogMessage(`Error: ${err.message}`)
      setShowErrorDialog(true)
    } finally {
      setActionLoading(null)
      setShowDeleteAllDialog(false)
    }
  }

  const filteredItems = filter === 'all' ? trashItems : trashItems.filter((item) => item.item_type === filter)

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)))
    }
  }

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleBulkRestore = () => {
    if (selectedItems.size === 0) return
    setShowBulkRestoreDialog(true)
  }

  const confirmBulkRestore = async () => {
    try {
      const promises = Array.from(selectedItems).map(id => {
        const item = trashItems.find(t => t.id === id)
        if (!item) return Promise.reject(new Error('Item not found'))
        
        return fetch('/api/trash/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, type: item.item_type }),
        })
      })
      
      const results = await Promise.all(promises)
      const failed = results.filter(r => !r.ok).length
      
      if (failed === 0) {
        setDialogMessage(`Successfully restored ${selectedItems.size} item(s)!`)
        setShowSuccessDialog(true)
        setSelectedItems(new Set())
        fetchTrashItems()
      } else {
        setDialogMessage(`Failed to restore ${failed} item(s).`)
        setShowErrorDialog(true)
      }
    } catch (error) {
      console.error('Error bulk restoring items:', error)
      setDialogMessage('An error occurred while restoring items.')
      setShowErrorDialog(true)
    } finally {
      setShowBulkRestoreDialog(false)
    }
  }

  const handleBulkPermanentDelete = () => {
    if (selectedItems.size === 0) return
    setShowBulkDeleteDialog(true)
  }

  const confirmBulkPermanentDelete = async () => {
    try {
      const promises = Array.from(selectedItems).map(id => {
        const item = trashItems.find(t => t.id === id)
        if (!item) return Promise.reject(new Error('Item not found'))
        
        return fetch('/api/trash/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, type: item.item_type }),
        })
      })
      
      const results = await Promise.all(promises)
      const failed = results.filter(r => !r.ok).length
      
      if (failed === 0) {
        setDialogMessage(`Successfully permanently deleted ${selectedItems.size} item(s)`)
        setShowSuccessDialog(true)
        setSelectedItems(new Set())
        fetchTrashItems()
      } else {
        setDialogMessage(`Failed to delete ${failed} item(s).`)
        setShowErrorDialog(true)
      }
    } catch (error) {
      console.error('Error bulk deleting items:', error)
      setDialogMessage('An error occurred while deleting items.')
      setShowErrorDialog(true)
    } finally {
      setShowBulkDeleteDialog(false)
    }
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="h-5 w-5" />
      case 'vendor':
        return <Package className="h-5 w-5" />
      case 'coupon':
        return <Tag className="h-5 w-5" />
      default:
        return null
    }
  }

  const getStatusColor = (daysRemaining: number) => {
    if (daysRemaining <= 7) return 'text-red-600 bg-red-50'
    if (daysRemaining <= 14) return 'text-orange-600 bg-orange-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Loading trash...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Trash2 className="h-8 w-8" />
            Trash
          </h1>
          <p className="mt-2 text-gray-600">
            Items are automatically deleted after 30 days. Restore or permanently delete items below.
          </p>
        </div>
        <div className="flex gap-2">
          {trashItems.length > 0 && (
            <button 
              onClick={handleDeleteAll} 
              disabled={actionLoading === 'all'}
              className="btn btn-danger flex items-center gap-2"
            >
              <Trash2 className={`h-4 w-4 ${actionLoading === 'all' ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Delete All</span>
            </button>
          )}
          <button onClick={fetchTrashItems} className="btn btn-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'all' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600'
          }`}
        >
          All ({trashItems.length})
        </button>
        <button
          onClick={() => setFilter('user')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'user' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Users className="inline h-4 w-4 mr-1" />
          Users ({trashItems.filter((i) => i.item_type === 'user').length})
        </button>
        <button
          onClick={() => setFilter('vendor')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'vendor' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Package className="inline h-4 w-4 mr-1" />
          Vendors ({trashItems.filter((i) => i.item_type === 'vendor').length})
        </button>
        <button
          onClick={() => setFilter('coupon')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'coupon' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600'
          }`}
        >
          <Tag className="inline h-4 w-4 mr-1" />
          Coupons ({trashItems.filter((i) => i.item_type === 'coupon').length})
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between bg-primary/10 p-4 rounded-lg">
          <span className="text-sm font-medium">
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkRestore}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Restore Selected</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkPermanentDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete Selected</span>
            </Button>
          </div>
        </div>
      )}

      {/* Trash Items */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No items in trash</h3>
          <p className="mt-1 text-gray-500">
            {filter === 'all' ? 'Your trash is empty' : `No ${filter}s in trash`}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <button onClick={handleSelectAll} className="flex items-center">
                    {selectedItems.size === filteredItems.length ? (
                      <CheckSquare className="h-5 w-5 text-primary-600" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Identifier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deleted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Remaining
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleSelectItem(item.id)} className="flex items-center">
                      {selectedItems.has(item.id) ? (
                        <CheckSquare className="h-5 w-5 text-primary-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="text-gray-600">{getItemIcon(item.item_type)}</div>
                      <span className="capitalize font-medium text-gray-900">{item.item_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{item.item_identifier || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {Math.floor(item.days_in_trash)} day{Math.floor(item.days_in_trash) !== 1 ? 's' : ''} ago
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        item.days_until_permanent_delete
                      )}`}
                    >
                      <Clock className="h-3 w-3" />
                      {Math.ceil(item.days_until_permanent_delete)} day
                      {Math.ceil(item.days_until_permanent_delete) !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleRestore(item)}
                        disabled={actionLoading === item.id}
                        className="text-primary-600 hover:text-primary-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <RefreshCw className={`h-4 w-4 ${actionLoading === item.id ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Restore</span>
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(item)}
                        disabled={actionLoading === item.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <RestoreDialog
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        onConfirm={confirmRestore}
        itemType={selectedItem?.item_type || ''}
      />

      {/* Permanent Delete Confirmation Dialog */}
      <PermanentDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmPermanentDelete}
        itemType={selectedItem?.item_type || ''}
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

      {/* Delete All Confirmation Dialog */}
      <DeleteAllDialog
        open={showDeleteAllDialog}
        onOpenChange={setShowDeleteAllDialog}
        onConfirm={confirmDeleteAll}
        itemCount={trashItems.length}
      />

      {/* Bulk Restore Confirmation Dialog */}
      <AlertDialog open={showBulkRestoreDialog} onOpenChange={setShowBulkRestoreDialog}>
        <AlertDialogContent>
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100">
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">Restore Selected Items</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              Are you sure you want to restore {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''}?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                The items will be moved back to the main list and fully accessible again.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkRestore}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Restore {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Permanent Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-red-200 animate-pulse">
            <Trash2 className="h-10 w-10 text-red-700" />
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-red-700 text-2xl">
              ⚠️ Permanently Delete Selected Items
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base pt-2">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-3">
                <strong className="text-red-700 text-lg">WARNING:</strong>
                <br />
                <span className="text-red-600">
                  Are you sure you want to PERMANENTLY delete {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''}?
                </span>
              </div>
              <strong className="text-destructive block mt-3 text-base">
                This action CANNOT be undone!
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkPermanentDelete}
              className="w-full sm:w-auto bg-red-700 text-white hover:bg-red-800"
            >
              Delete {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


