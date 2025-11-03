import { AlertCircle, CheckCircle, RefreshCw, Trash2 } from 'lucide-react'
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

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  itemName: string
  itemType: string
}

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  itemName,
  itemType,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base">
            Are you sure you want to delete <strong className="font-semibold text-foreground">{itemName}</strong>?
            <br />
            <span className="text-sm text-muted-foreground mt-2 block">
              This will move the {itemType} to trash and it can be restored within 30 days.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface RestoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  itemType: string
}

export function RestoreDialog({
  open,
  onOpenChange,
  onConfirm,
  itemType,
}: RestoreDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100">
          <RefreshCw className="h-8 w-8 text-blue-600" />
        </div>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">Restore Item</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base">
            Are you sure you want to restore this {itemType}?
            <br />
            <span className="text-sm text-muted-foreground mt-2 block">
              The item will be moved back to the main list and fully accessible again.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Restore
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface PermanentDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  itemType: string
}

export function PermanentDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  itemType,
}: PermanentDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-red-200 animate-pulse">
          <Trash2 className="h-10 w-10 text-red-700" />
        </div>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-red-700 text-2xl">
            ⚠️ Permanent Delete
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base pt-2">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-3">
              <strong className="text-red-700 text-lg">WARNING:</strong>
              <br />
              <span className="text-red-600">Are you sure you want to PERMANENTLY delete this {itemType}?</span>
            </div>
            <strong className="text-destructive block mt-3 text-base">
              This action CANNOT be undone!
            </strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full sm:w-auto bg-red-700 text-white hover:bg-red-800"
          >
            Delete Forever
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface SuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
}

export function SuccessDialog({ open, onOpenChange, message }: SuccessDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-green-700">
            Success
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)} className="w-full bg-green-600 text-white hover:bg-green-700">
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface ErrorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
}

export function ErrorDialog({ open, onOpenChange, message }: ErrorDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-red-700">
            Error
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)} className="w-full bg-red-600 text-white hover:bg-red-700">
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface DeleteAllDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  itemCount: number
}

export function DeleteAllDialog({
  open,
  onOpenChange,
  onConfirm,
  itemCount,
}: DeleteAllDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-red-200 animate-pulse">
          <Trash2 className="h-10 w-10 text-red-700" />
        </div>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-red-700 text-2xl">
            ⚠️ Delete All Trash
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base pt-2">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-3">
              <strong className="text-red-700 text-lg">WARNING:</strong>
              <br />
              <span className="text-red-600">
                Are you sure you want to PERMANENTLY delete ALL {itemCount} item{itemCount !== 1 ? 's' : ''} in trash?
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
            onClick={onConfirm}
            className="w-full sm:w-auto bg-red-700 text-white hover:bg-red-800"
          >
            Delete All Forever
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
