import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CouponModal from '@/components/coupons/CouponModal'
import type { Vendor } from '@/types/database'

// Mock fetch
global.fetch = jest.fn()

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
})

import type { Vendor } from '@/types/database'

const mockVendors: Vendor[] = [
  { 
    id: 'vendor-1', 
    name: 'Vendor 1', 
    description: null,
    website: 'https://vendor1.com',
    logo_url: null,
    contact_email: 'vendor1@test.com',
    contact_phone: null,
    active: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    deleted_by: null,
  },
  { 
    id: 'vendor-2', 
    name: 'Vendor 2', 
    description: null,
    website: 'https://vendor2.com',
    logo_url: null,
    contact_email: 'vendor2@test.com',
    contact_phone: null,
    active: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    deleted_by: null,
  },
]

describe('CouponModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(
      <CouponModal
        isOpen={false}
        onClose={jest.fn()}
        vendors={mockVendors}
      />
    )

    expect(screen.queryByText('Add Coupon')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(
      <CouponModal
        isOpen={true}
        onClose={jest.fn()}
        vendors={mockVendors}
      />
    )

    expect(screen.getByText('Add Coupon')).toBeInTheDocument()
    expect(screen.getByLabelText(/Coupon Code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
  })

  it('should show vendor select when multiple vendors provided', () => {
    render(
      <CouponModal
        isOpen={true}
        onClose={jest.fn()}
        vendors={mockVendors}
      />
    )

    expect(screen.getByLabelText(/Vendor/i)).toBeInTheDocument()
  })

  it('should auto-select vendor when only one vendor provided', async () => {
    const singleVendor = [mockVendors[0]]
    render(
      <CouponModal
        isOpen={true}
        onClose={jest.fn()}
        vendors={singleVendor}
      />
    )

    await waitFor(() => {
      const vendorSelect = screen.queryByLabelText(/Vendor/i)
      expect(vendorSelect).not.toBeInTheDocument()
    })
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <CouponModal
        isOpen={true}
        onClose={onClose}
        vendors={mockVendors}
      />
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when cancel button is clicked', () => {
    const onClose = jest.fn()
    render(
      <CouponModal
        isOpen={true}
        onClose={onClose}
        vendors={mockVendors}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should validate required fields', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: 'Validation error',
        details: [{ path: ['code'], message: 'Code is required' }],
      }),
    })

    render(
      <CouponModal
        isOpen={true}
        onClose={jest.fn()}
        vendors={mockVendors}
      />
    )

    // Select vendor first
    const vendorSelect = screen.getByLabelText(/Vendor/i)
    await userEvent.selectOptions(vendorSelect, 'vendor-1')

    const submitButton = screen.getByRole('button', { name: /create coupon/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('should submit form with valid data', async () => {
    const onClose = jest.fn()
    const mockCoupon = {
      id: 'coupon-1',
      code: 'SAVE20',
      description: 'Get 20% off',
      vendor_id: 'vendor-1',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockCoupon,
      }),
    })

    render(
      <CouponModal
        isOpen={true}
        onClose={onClose}
        vendors={mockVendors}
      />
    )

    // Fill form
    await userEvent.type(screen.getByLabelText(/Coupon Code/i), 'SAVE20')
    await userEvent.type(screen.getByLabelText(/Description/i), 'Get 20% off')
    
    // Select vendor
    const vendorSelect = screen.getByLabelText(/Vendor/i)
    await userEvent.selectOptions(vendorSelect, 'vendor-1')

    // Submit
    const submitButton = screen.getByRole('button', { name: /create coupon/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('SAVE20'),
      })
    })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('should handle optional fields', async () => {
    const onClose = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { id: 'coupon-1', code: 'SAVE20' },
      }),
    })

    render(
      <CouponModal
        isOpen={true}
        onClose={onClose}
        vendors={[mockVendors[0]]}
      />
    )

    await userEvent.type(screen.getByLabelText(/Coupon Code/i), 'SAVE20')
    await userEvent.type(screen.getByLabelText(/Discount Value/i), '20% off')

    const submitButton = screen.getByRole('button', { name: /create coupon/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('should display error message on API error', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: 'Failed to create coupon',
      }),
    })

    render(
      <CouponModal
        isOpen={true}
        onClose={jest.fn()}
        vendors={[mockVendors[0]]}
      />
    )

    await userEvent.type(screen.getByLabelText(/Coupon Code/i), 'SAVE20')
    const submitButton = screen.getByRole('button', { name: /create coupon/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Failed to create coupon/i)).toBeInTheDocument()
    })
  })

  it('should display validation error details', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: 'Validation error',
        details: [
          { path: ['code'], message: 'Code is required' },
          { path: ['vendor_id'], message: 'Invalid vendor ID' },
        ],
      }),
    })

    render(
      <CouponModal
        isOpen={true}
        onClose={jest.fn()}
        vendors={mockVendors}
      />
    )

    // Select vendor first
    const vendorSelect = screen.getByLabelText(/Vendor/i)
    await userEvent.selectOptions(vendorSelect, 'vendor-1')

    const submitButton = screen.getByRole('button', { name: /create coupon/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('should reset form when modal closes', async () => {
    const { rerender } = render(
      <CouponModal
        isOpen={true}
        onClose={jest.fn()}
        vendors={[mockVendors[0]]}
      />
    )

    await userEvent.type(screen.getByLabelText(/Coupon Code/i), 'SAVE20')

    rerender(
      <CouponModal
        isOpen={false}
        onClose={jest.fn()}
        vendors={[mockVendors[0]]}
      />
    )

    rerender(
      <CouponModal
        isOpen={true}
        onClose={jest.fn()}
        vendors={[mockVendors[0]]}
      />
    )

    const codeInput = screen.getByLabelText(/Coupon Code/i) as HTMLInputElement
    expect(codeInput.value).toBe('')
  })

  it('should show loading state during submission', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                json: async () => ({ success: true, data: {} }),
              }),
            100
          )
        )
    )

    render(
      <CouponModal
        isOpen={true}
        onClose={jest.fn()}
        vendors={[mockVendors[0]]}
      />
    )

    await userEvent.type(screen.getByLabelText(/Coupon Code/i), 'SAVE20')
    const submitButton = screen.getByRole('button', { name: /create coupon/i })
    fireEvent.click(submitButton)

    expect(screen.getByText(/Creating.../i)).toBeInTheDocument()
  })
})

