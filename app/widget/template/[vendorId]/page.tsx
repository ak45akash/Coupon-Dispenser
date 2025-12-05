'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Eye, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function WidgetTemplateContent() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const vendorId = params.vendorId as string

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && vendorId) {
      // Load script if not already loaded
      const loadScript = () => {
        if (document.querySelector('script[src*="widget-embed.js"]')) {
          // Script already loaded, initialize in preview mode
          if (window.CouponWidget) {
            window.CouponWidget.init({
              vendorId,
              userId: 'PREVIEW_MODE_USER_ID', // Special preview user ID
              theme: 'light',
              containerId: 'coupon-widget-template',
              previewMode: true, // Enable preview mode
            })
          }
        } else {
          // Load script
          const script = document.createElement('script')
          script.src = '/widget-embed.js'
          script.onload = () => {
            if (window.CouponWidget) {
              window.CouponWidget.init({
                vendorId,
                userId: 'PREVIEW_MODE_USER_ID', // Special preview user ID
                theme: 'light',
                containerId: 'coupon-widget-template',
                previewMode: true, // Enable preview mode
              })
            }
          }
          document.body.appendChild(script)
        }
      }

      // Wait a bit for DOM to be ready
      setTimeout(loadScript, 100)
    }
  }, [mounted, vendorId])

  if (!vendorId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Vendor ID is required.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Coupon Widget Template</h1>
              <p className="text-muted-foreground mt-1">
                Preview how your coupon widget will appear to users
              </p>
            </div>
          </div>
        </div>

        {/* Preview Mode Alert */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Preview Mode</h3>
                <p className="text-sm text-blue-800">
                  This is a preview of your coupon widget. Clicking &quot;Generate Code&quot; will
                  simulate the claim process but will NOT actually claim any coupons or make changes
                  to your database. This allows you to test the widget without affecting real data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget Container */}
        <Card>
          <CardHeader>
            <CardTitle>Widget Preview</CardTitle>
            <CardDescription>
              This is how your widget will appear on partner websites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              id="coupon-widget-template"
              style={{
                minHeight: '400px',
                padding: '20px',
              }}
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use This Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. Preview the Widget</h3>
              <p className="text-sm text-muted-foreground">
                The widget above shows how it will appear to your users. You can interact with
                it to see the full user experience.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">2. Test the Claim Flow</h3>
              <p className="text-sm text-muted-foreground">
                Click &quot;Generate Code&quot; to see how the claim process works. In preview
                mode, no actual coupons will be claimed.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">3. Copy the Embed Code</h3>
              <p className="text-sm text-muted-foreground">
                When you&apos;re ready, go back to your vendor page and use the &quot;Copy Widget&quot;
                button to get the embed code for your website.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function WidgetTemplatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading template...</div>
      </div>
    }>
      <WidgetTemplateContent />
    </Suspense>
  )
}

