import {
  isSuperAdmin,
  isPartnerAdmin,
  isUser,
  canManageVendors,
  canManageCoupons,
  canViewAnalytics,
  canManageUsers,
  canClaimCoupons,
} from '@/lib/auth/permissions'

describe('Permission Functions', () => {
  describe('isSuperAdmin', () => {
    it('should return true for super_admin role', () => {
      expect(isSuperAdmin('super_admin')).toBe(true)
    })

    it('should return false for other roles', () => {
      expect(isSuperAdmin('partner_admin')).toBe(false)
      expect(isSuperAdmin('user')).toBe(false)
    })
  })

  describe('isPartnerAdmin', () => {
    it('should return true for partner_admin role', () => {
      expect(isPartnerAdmin('partner_admin')).toBe(true)
    })

    it('should return false for other roles', () => {
      expect(isPartnerAdmin('super_admin')).toBe(false)
      expect(isPartnerAdmin('user')).toBe(false)
    })
  })

  describe('isUser', () => {
    it('should return true for user role', () => {
      expect(isUser('user')).toBe(true)
    })

    it('should return false for other roles', () => {
      expect(isUser('super_admin')).toBe(false)
      expect(isUser('partner_admin')).toBe(false)
    })
  })

  describe('canManageVendors', () => {
    it('should return true for super_admin and partner_admin', () => {
      expect(canManageVendors('super_admin')).toBe(true)
      expect(canManageVendors('partner_admin')).toBe(true)
      expect(canManageVendors('user')).toBe(false)
    })
  })

  describe('canManageCoupons', () => {
    it('should return true for super_admin and partner_admin', () => {
      expect(canManageCoupons('super_admin')).toBe(true)
      expect(canManageCoupons('partner_admin')).toBe(true)
      expect(canManageCoupons('user')).toBe(false)
    })
  })

  describe('canViewAnalytics', () => {
    it('should return true for super_admin and partner_admin', () => {
      expect(canViewAnalytics('super_admin')).toBe(true)
      expect(canViewAnalytics('partner_admin')).toBe(true)
      expect(canViewAnalytics('user')).toBe(false)
    })
  })

  describe('canManageUsers', () => {
    it('should return true only for super_admin', () => {
      expect(canManageUsers('super_admin')).toBe(true)
      expect(canManageUsers('partner_admin')).toBe(false)
      expect(canManageUsers('user')).toBe(false)
    })
  })

  describe('canClaimCoupons', () => {
    it('should return true for all roles', () => {
      expect(canClaimCoupons('super_admin')).toBe(true)
      expect(canClaimCoupons('partner_admin')).toBe(true)
      expect(canClaimCoupons('user')).toBe(true)
    })
  })
})

