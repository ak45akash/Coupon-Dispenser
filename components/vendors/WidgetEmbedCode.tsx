'use client'

import { useState } from 'react'
import { Copy, Check, Code, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface WidgetEmbedCodeProps {
  vendorId: string
  vendorName: string
}

export default function WidgetEmbedCode({ vendorId, vendorName }: WidgetEmbedCodeProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light')
  const [copiedMainScript, setCopiedMainScript] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text)
      if (index !== undefined) {
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
      } else {
        setCopiedMainScript(true)
        setTimeout(() => setCopiedMainScript(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Complete ready-to-use script (auto-detects user ID from WordPress/CMS)
  const completeWidgetScript = `<script src="${baseUrl}/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="${vendorId}" 
     data-theme="${selectedTheme}">
</div>

<!-- 
  Note: User ID is automatically detected from WordPress/CMS if available.
  For WordPress: Add the helper code from WORDPRESS_AUTO_USER_ID.md to your functions.php
  For other platforms: Set window.COUPON_WIDGET_USER_ID or use data-user-id attribute
  If no user ID is found, an anonymous ID will be generated automatically.
-->`

  const basicEmbedCode = `<script src="${baseUrl}/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="${vendorId}" 
     data-user-id="USER_ID_FROM_YOUR_SYSTEM"
     data-theme="${selectedTheme}">
</div>`

  const customEmbedCode = `<script src="${baseUrl}/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="${vendorId}" 
     data-user-id="USER_ID_FROM_YOUR_SYSTEM"
     data-theme="${selectedTheme}">
</div>`

  const programmaticCode = `<!-- Add this script tag -->
<script src="${baseUrl}/widget-embed.js"></script>

<!-- Initialize widget -->
<script>
  CouponWidget.init({
    vendorId: '${vendorId}',
    userId: 'USER_ID_FROM_YOUR_SYSTEM', // Get from your authentication system
    theme: '${selectedTheme}',
    containerId: 'my-coupon-widget'
  });
</script>

<!-- Add container -->
<div id="my-coupon-widget"></div>`

  const embedCodes = [
    { name: 'Basic', code: basicEmbedCode },
    { name: 'Custom Title', code: customEmbedCode },
    { name: 'Programmatic', code: programmaticCode },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Widget Embed Script
            </CardTitle>
            <CardDescription>
              Copy the widget script to embed on your website. User ID is automatically detected from WordPress/CMS. No manual editing required!
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Theme:</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {selectedTheme === 'light' ? '☀️ Light' : '🌙 Dark'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedTheme('light')}>
                  ☀️ Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedTheme('dark')}>
                  🌙 Dark
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Copy Script Button - Prominent */}
        <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex-1 min-w-[300px]">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Code className="h-5 w-5" />
                Copy Widget Script
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                One-click copy. Just replace <code className="bg-muted px-1 rounded text-xs">USER_ID_FROM_YOUR_SYSTEM</code> with your authenticated user&apos;s ID.
              </p>
            </div>
            <Button
              onClick={() => copyToClipboard(completeWidgetScript)}
              size="lg"
              className="gap-2 shrink-0"
            >
              {copiedMainScript ? (
                <>
                  <Check className="h-5 w-5" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5" />
                  Copy Script
                </>
              )}
            </Button>
          </div>
          <div className="bg-muted p-3 rounded-lg border">
            <pre className="text-xs overflow-x-auto font-mono">
              <code>{completeWidgetScript}</code>
            </pre>
          </div>
        </div>

        <div className="text-sm text-muted-foreground border-t pt-4">
          <p className="font-medium mb-2">Advanced Options:</p>
        </div>

        {embedCodes.map((embed, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{embed.name} Embed Code</span>
                <Badge variant="secondary" className="text-xs">
                  {embed.name === 'Programmatic' ? 'JavaScript API' : 'HTML'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(embed.code, index)}
                  className="gap-2"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
                {index === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`${baseUrl}/widget-demo.html`, '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Demo
                  </Button>
                )}
              </div>
            </div>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                <code>{embed.code}</code>
              </pre>
            </div>
          </div>
        ))}

        <div className="pt-4 border-t space-y-2">
          <p className="text-sm font-medium">Quick Tips:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Replace <code className="bg-muted px-1 rounded">USER_ID_FROM_YOUR_SYSTEM</code> with the actual user ID from your authentication system</li>
            <li>Replace the script URL with your production domain when deploying</li>
            <li>The widget displays coupons in a card grid layout</li>
            <li>Users click &quot;Generate Code&quot; to claim and reveal coupon codes</li>
            <li>Each coupon card shows vendor logo, offer, and description</li>
            <li>Test the widget on the demo page before embedding on your site</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

