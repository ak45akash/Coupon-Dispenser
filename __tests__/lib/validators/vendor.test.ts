import { createVendorSchema, updateVendorSchema } from '@/lib/validators/vendor'

describe('Vendor Validators', () => {
  describe('createVendorSchema', () => {
    it('should validate a valid vendor', () => {
      const validVendor = {
        name: 'Test Vendor',
        description: 'A test vendor',
        website: 'https://example.com',
        logo_url: 'https://example.com/logo.png',
        contact_email: 'contact@example.com',
        contact_phone: '+1234567890',
      }

      expect(() => createVendorSchema.parse(validVendor)).not.toThrow()
    })

    it('should require name', () => {
      const invalidVendor = {
        description: 'A test vendor',
      }

      expect(() => createVendorSchema.parse(invalidVendor)).toThrow()
    })

    it('should validate email format', () => {
      const invalidVendor = {
        name: 'Test Vendor',
        contact_email: 'invalid-email',
      }

      expect(() => createVendorSchema.parse(invalidVendor)).toThrow()
    })

    it('should validate URL format', () => {
      const invalidVendor = {
        name: 'Test Vendor',
        website: 'not-a-url',
      }

      expect(() => createVendorSchema.parse(invalidVendor)).toThrow()
    })

    it('should allow empty optional fields', () => {
      const vendor = {
        name: 'Test Vendor',
        website: '',
        logo_url: '',
        contact_email: '',
      }

      expect(() => createVendorSchema.parse(vendor)).not.toThrow()
    })
  })

  describe('updateVendorSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        name: 'Updated Name',
      }

      expect(() => updateVendorSchema.parse(partialUpdate)).not.toThrow()
    })

    it('should validate active boolean', () => {
      const update = {
        active: true,
      }

      expect(() => updateVendorSchema.parse(update)).not.toThrow()
    })
  })
})

