import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VendorModal from '@/components/vendors/VendorModal'

// Mock fetch
global.fetch = jest.fn()

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
})

const mockVendor = {
  id: 'vendor-1',
  name: 'Test Vendor',
  email: 'vendor@test.com',
  phone: '123-456-7890',
  website: 'https://test.com',
  logo_url: 'https://test.com/logo.png',
  is_active: true,
}

describe('VendorModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(
      <VendorModal
        isOpen={false}
        onClose={jest.fn()}
        vendor={null}
      />
    )

    expect(screen.queryByText(/Add Vendor|Edit Vendor/i)).not.toBeInTheDocument()
  })

  it('should render in create mode when vendor is null', () => {
    render(
      <VendorModal
        isOpen={true}
        onClose={jest.fn()}
        vendor={null}
      />
    )

    expect(screen.getByText(/Add Vendor/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
  })

  it('should render in edit mode when vendor is provided', () => {
    render(
      <VendorModal
        isOpen={true}
        onClose={jest.fn()}
        vendor={mockVendor}
      />
    )

    expect(screen.getByText(/Edit Vendor/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Vendor')).toBeInTheDocument()
    expect(screen.getByDisplayValue('vendor@test.com')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <VendorModal
        isOpen={true}
        onClose={onClose}
        vendor={null}
      />
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when cancel button is clicked', () => {
    const onClose = jest.fn()
    render(
      <VendorModal
        isOpen={true}
        onClose={onClose}
        vendor={null}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should validate required fields', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: 'Name is required',
      }),
    })

    render(
      <VendorModal
        isOpen={true}
        onClose={jest.fn()}
        vendor={null}
      />
    )

    const submitButton = screen.getByRole('button', { name: /create vendor|save changes/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('should submit form with valid data in create mode', async () => {
    const onClose = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { id: 'vendor-1', ...mockVendor },
      }),
    })

    render(
      <VendorModal
        isOpen={true}
        onClose={onClose}
        vendor={null}
      />
    )

    await userEvent.type(screen.getByLabelText(/Name/i), 'New Vendor')
    await userEvent.type(screen.getByLabelText(/Email/i), 'new@vendor.com')

    const submitButton = screen.getByRole('button', { name: /create vendor/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('New Vendor'),
      })
    })
  })

  it('should submit form with valid data in edit mode', async () => {
    const onClose = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockVendor,
      }),
    })

    render(
      <VendorModal
        isOpen={true}
        onClose={onClose}
        vendor={mockVendor}
      />
    )

    const nameInput = screen.getByLabelText(/Name/i)
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Updated Vendor')

    const submitButton = screen.getByRole('button', { name: /save changes/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/vendors/${mockVendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Updated Vendor'),
      })
    })
  })

  it('should handle optional fields', async () => {
    const onClose = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { id: 'vendor-1', name: 'Vendor', email: 'vendor@test.com' },
      }),
    })

    render(
      <VendorModal
        isOpen={true}
        onClose={onClose}
        vendor={null}
      />
    )

    await userEvent.type(screen.getByLabelText(/Name/i), 'Vendor')
    await userEvent.type(screen.getByLabelText(/Email/i), 'vendor@test.com')
    await userEvent.type(screen.getByLabelText(/Phone/i), '123-456-7890')
    await userEvent.type(screen.getByLabelText(/Website/i), 'https://vendor.com')

    const submitButton = screen.getByRole('button', { name: /create vendor/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('should display error message on API error', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: 'Failed to create vendor',
      }),
    })

    render(
      <VendorModal
        isOpen={true}
        onClose={jest.fn()}
        vendor={null}
      />
    )

    await userEvent.type(screen.getByLabelText(/Name/i), 'Vendor')
    await userEvent.type(screen.getByLabelText(/Email/i), 'vendor@test.com')

    const submitButton = screen.getByRole('button', { name: /create vendor/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Failed to create vendor/i)).toBeInTheDocument()
    })
  })

  it('should reset form when modal closes', async () => {
    const { rerender } = render(
      <VendorModal
        isOpen={true}
        onClose={jest.fn()}
        vendor={null}
      />
    )

    await userEvent.type(screen.getByLabelText(/Name/i), 'Test Vendor')

    rerender(
      <VendorModal
        isOpen={false}
        onClose={jest.fn()}
        vendor={null}
      />
    )

    rerender(
      <VendorModal
        isOpen={true}
        onClose={jest.fn()}
        vendor={null}
      />
    )

    const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement
    expect(nameInput.value).toBe('')
  })
})

