'use client'

import { useState, useEffect } from 'react'
import { Trash2, RefreshCw, AlertCircle, Clock, Package, Users, Tag, CheckCircle } from 'lucide-react'
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
              className="btn btn-danger"
            >
              <Trash2 className={`h-4 w-4 ${actionLoading === 'all' ? 'animate-spin' : ''}`} />
              Delete All
            </button>
          )}
          <button onClick={fetchTrashItems} className="btn btn-secondary">
            <RefreshCw className="h-4 w-4" />
            Refresh
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
                        className="text-primary-600 hover:text-primary-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw className={`h-4 w-4 ${actionLoading === item.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(item)}
                        disabled={actionLoading === item.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
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
    </div>
  )
}


