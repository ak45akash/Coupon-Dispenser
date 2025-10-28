import { UserRole } from './database'

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// API Request types
export interface CreateVendorRequest {
  name: string
  description?: string
  website?: string
  logo_url?: string
  contact_email?: string
  contact_phone?: string
}

export interface UpdateVendorRequest extends Partial<CreateVendorRequest> {
  active?: boolean
}

export interface CreateCouponRequest {
  vendor_id: string
  code: string
  description?: string
  discount_value?: string
  expiry_date?: string
}

export interface BulkCreateCouponsRequest {
  vendor_id: string
  coupons: Array<{
    code: string
    description?: string
    discount_value?: string
    expiry_date?: string
  }>
}

export interface ClaimCouponRequest {
  vendor_id: string
  user_email?: string
}

export interface UpdateUserRoleRequest {
  role: UserRole
}

export interface AssignPartnerAccessRequest {
  user_id: string
  vendor_ids: string[]
}

// Analytics types
export interface AnalyticsOverview {
  total_vendors: number
  total_coupons: number
  claimed_coupons: number
  available_coupons: number
  total_users: number
  claims_this_month: number
}

export interface VendorAnalytics {
  vendor_id: string
  vendor_name: string
  total_coupons: number
  claimed_coupons: number
  available_coupons: number
  claim_rate: number
  claims_by_month: Array<{
    month: string
    count: number
  }>
}

export interface ClaimTrend {
  date: string
  count: number
}

export interface TopVendor {
  vendor_id: string
  vendor_name: string
  total_claims: number
}

