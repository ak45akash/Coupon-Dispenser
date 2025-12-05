export type UserRole = 'super_admin' | 'partner_admin' | 'user'

export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  created_at: string
  updated_at: string
  deleted_at: string | null
  deleted_by: string | null
}

export interface Vendor {
  id: string
  name: string
  description: string | null
  website: string | null
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  deleted_by: string | null
  partner_secret?: string | null
  api_key?: string | null
}

export interface Coupon {
  id: string
  vendor_id: string
  code: string
  description: string | null
  discount_value: string | null
  expiry_date: string | null
  is_claimed: boolean
  claimed_by: string | null
  claimed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  deleted_by: string | null
}

export interface ClaimHistory {
  id: string
  user_id: string
  vendor_id: string
  coupon_id: string
  claimed_at: string
  claim_month: string
}

export interface PartnerVendorAccess {
  id: string
  user_id: string
  vendor_id: string
  created_at: string
}

export interface SystemConfig {
  id: string
  key: string
  value: Record<string, unknown>
  updated_at: string
}

export interface MonthlyClaimRule {
  enabled: boolean
  max_claims_per_vendor: number
}

// Database response types with relations
export interface CouponWithVendor extends Coupon {
  vendor: Vendor
}

// Note: Coupons are now shared - no exclusive user ownership
// Use ClaimHistory to track individual claims

export interface ClaimHistoryWithDetails extends ClaimHistory {
  user: User
  vendor: Vendor
  coupon: Coupon
}

export interface VendorWithStats extends Vendor {
  total_coupons: number
  claimed_coupons: number
  available_coupons: number
}

// Trash-related types
export type TrashItemType = 'user' | 'vendor' | 'coupon'

export interface TrashItem {
  id: string
  item_type: TrashItemType
  item_name: string
  item_identifier: string | null
  deleted_at: string
  deleted_by: string | null
  days_in_trash: number
  days_until_permanent_delete: number
}

export interface TrashItemWithDeleter extends TrashItem {
  deleted_by_user: User | null
}

