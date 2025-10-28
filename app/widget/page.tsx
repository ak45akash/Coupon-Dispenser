'use client'

import { useState, useEffect } from 'react'
import { Ticket, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

// This widget can be embedded in partner websites
export default function WidgetPage() {
  const [vendorId, setVendorId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'limit'>(
    'idle'
  )
  const [message, setMessage] = useState('')
  const [coupon, setCoupon] = useState<any>(null)

  useEffect(() => {
    // Get vendor ID from URL params
    const params = new URLSearchParams(window.location.search)
    const vid = params.get('vendor')
    if (vid) setVendorId(vid)
  }, [])

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setMessage('')

    try {
      const response = await fetch('/api/coupons/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          user_email: userEmail,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        setCoupon(data.data)
        setMessage('Coupon claimed successfully!')
      } else if (response.status === 429) {
        setStatus('limit')
        setMessage(data.error || 'Monthly claim limit reached')
      } else if (response.status === 404) {
        setStatus('error')
        setMessage('No coupons available')
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to claim coupon')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <Ticket className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Claim Your Coupon
            </h1>
            <p className="mt-2 text-gray-600">
              Get exclusive discounts and offers
            </p>
          </div>

          {status === 'success' && coupon ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center text-green-600">
                <CheckCircle className="h-12 w-12" />
              </div>
              <div className="text-center">
                <p className="mb-2 text-lg font-semibold text-gray-900">
                  {message}
                </p>
                <div className="rounded-lg bg-primary-50 p-4">
                  <p className="text-sm text-gray-600">Your coupon code:</p>
                  <p className="mt-2 text-2xl font-bold text-primary-600">
                    {coupon.code}
                  </p>
                  {coupon.discount_value && (
                    <p className="mt-2 text-sm text-gray-600">
                      {coupon.discount_value}
                    </p>
                  )}
                  {coupon.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {coupon.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(coupon.code)
                    alert('Coupon code copied!')
                  }}
                  className="btn btn-primary mt-4 w-full"
                >
                  Copy Code
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleClaim} className="space-y-4">
              {status === 'error' && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                  <XCircle className="h-5 w-5" />
                  {message}
                </div>
              )}

              {status === 'limit' && (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  {message}
                </div>
              )}

              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !vendorId}
                className="btn btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Claiming...' : 'Claim Coupon'}
              </button>

              <p className="text-center text-xs text-gray-500">
                You can claim one coupon per vendor per month
              </p>
            </form>
          )}
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          Powered by Coupon Dispenser
        </div>
      </div>
    </div>
  )
}

