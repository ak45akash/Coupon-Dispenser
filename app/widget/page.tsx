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
  const [copySuccess, setCopySuccess] = useState(false)

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
      // First, get available coupons for this vendor
      const couponsResponse = await fetch(`/api/coupons?vendor_id=${vendorId}`)
      const couponsData = await couponsResponse.json()

      if (!couponsData.success || !couponsData.data || couponsData.data.length === 0) {
        setStatus('error')
        setMessage('No coupons available for this vendor')
        return
      }

      // Get the first available unclaimed coupon
      const availableCoupon = couponsData.data.find((c: any) => !c.is_claimed)
      
      if (!availableCoupon) {
        setStatus('error')
        setMessage('No coupons available - all have been claimed')
        return
      }

      // Claim the coupon
      const response = await fetch('/api/coupons/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_id: availableCoupon.id,
          user_email: userEmail,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus('success')
        setCoupon(data.data)
        setMessage('Coupon claimed successfully!')
      } else if (response.status === 409) {
        setStatus('error')
        setMessage(data.error || 'Coupon has already been claimed')
      } else if (response.status === 404) {
        setStatus('error')
        setMessage('Coupon not found')
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
                    setCopySuccess(true)
                    setTimeout(() => setCopySuccess(false), 3000)
                  }}
                  className="btn btn-primary mt-4 w-full relative"
                >
                  {copySuccess ? '✓ Copied!' : 'Copy Code'}
                </button>
                {copySuccess && (
                  <div className="mt-2 text-center text-sm text-green-600 animate-in fade-in-50 duration-300">
                    Coupon code copied to clipboard!
                  </div>
                )}
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

