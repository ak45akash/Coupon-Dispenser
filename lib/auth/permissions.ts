import { UserRole } from '@/types/database'

export const hasRole = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(userRole)
}

export const isSuperAdmin = (role: UserRole): boolean => {
  return role === 'super_admin'
}

export const isPartnerAdmin = (role: UserRole): boolean => {
  return role === 'partner_admin'
}

export const isUser = (role: UserRole): boolean => {
  return role === 'user'
}

export const canManageVendors = (role: UserRole): boolean => {
  return isSuperAdmin(role)
}

export const canManageCoupons = (role: UserRole): boolean => {
  return isSuperAdmin(role) || isPartnerAdmin(role)
}

/**
 * Check if a partner admin can manage coupons for a specific vendor
 * This should be used with hasVendorAccess() from lib/db/vendors
 */
export const canManageVendorCoupons = (role: UserRole): boolean => {
  return isSuperAdmin(role) || isPartnerAdmin(role)
}

export const canViewAnalytics = (role: UserRole): boolean => {
  return isSuperAdmin(role) || isPartnerAdmin(role)
}

export const canManageUsers = (role: UserRole): boolean => {
  return isSuperAdmin(role)
}

export const canClaimCoupons = (role: UserRole): boolean => {
  return true // All authenticated users can claim coupons
}

