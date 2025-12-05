'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Building2, Mail, Phone, Globe, Trash2, Plus, Upload, ArrowLeft, History, ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react'
import type { Vendor, Coupon } from '@/types/database'
import CouponModal from '@/components/coupons/CouponModal'
import CSVUploadModal from '@/components/coupons/CSVUploadModal'
import CouponDetailModal from '@/components/coupons/CouponDetailModal'
import { formatDate } from '@/lib/utils/format'
import { usePagination } from '@/lib/hooks/usePagination'
import { useSort } from '@/lib/hooks/useSort'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteDialog, SuccessDialog, ErrorDialog } from '@/components/ui/dialog-helpers'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import Link from 'next/link'
import { Copy, Check, Key, RefreshCw, AlertTriangle, Code, FileCode, Download, Sparkles } from 'lucide-react'

export default function VendorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const vendorId = params.id as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false)
  // Status filter removed - all coupons are shared/available

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)
  
  // Success/Error dialogs
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState('')
  
  // Coupon detail modal state
  const [isCouponDetailModalOpen, setIsCouponDetailModalOpen] = useState(false)
  const [selectedCouponForDetail, setSelectedCouponForDetail] = useState<string | null>(null)
  
  // Widget script copy state
  const [copiedScript, setCopiedScript] = useState(false)
  
  // Partner secret state
  const [partnerSecret, setPartnerSecret] = useState<string | null>(null)
  const [showPartnerSecret, setShowPartnerSecret] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [generatingSecret, setGeneratingSecret] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<'wordpress' | 'nodejs' | 'python'>('wordpress')
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null)

  // API key state
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [copiedApiKey, setCopiedApiKey] = useState(false)
  const [generatingApiKey, setGeneratingApiKey] = useState(false)
  const [selectedApiKeyPlatform, setSelectedApiKeyPlatform] = useState<'wordpress' | 'nodejs' | 'python'>('nodejs')

  // Integration method tab
  const [activeIntegrationTab, setActiveIntegrationTab] = useState<'wordpress' | 'api-key' | 'jwt'>('api-key')

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }

    // Super admin can access any vendor, partner admin only their assigned vendor
    if (session.user.role === 'super_admin') {
      // Super admin has access to all vendors
    } else if (session.user.role === 'partner_admin') {
      // Partner admin - check if they have access to this vendor
      // We'll verify access on the backend, but we can still show the page
    } else {
      router.push('/dashboard')
      return
    }

    fetchVendor()
    fetchCoupons()
  }, [session, router, vendorId])

  const fetchVendor = async () => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}`)
      const data = await response.json()
      if (data.success) {
        setVendor(data.data)
        // Fetch partner secret status
        fetchPartnerSecretStatus()
        // Fetch API key status
        fetchApiKeyStatus()
      } else {
        setDialogMessage(data.error || 'Failed to fetch vendor information')
        setShowErrorDialog(true)
        setTimeout(() => router.push('/dashboard/vendors'), 2000)
      }
    } catch (error) {
      console.error('Error fetching vendor:', error)
      setDialogMessage('An error occurred while fetching vendor information')
      setShowErrorDialog(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchCoupons = async () => {
    try {
      const response = await fetch(`/api/coupons?vendor_id=${vendorId}`)
      const data = await response.json()
      if (data.success) {
        setCoupons(data.data)
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    }
  }

  const fetchPartnerSecretStatus = async () => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/partner-secret`)
      const data = await response.json()
      if (data.success) {
        // Don't store the actual secret, just track if it exists
        setPartnerSecret(data.data.has_secret ? 'exists' : null)
      }
    } catch (error) {
      console.error('Error fetching partner secret status:', error)
    }
  }

  const generatePartnerSecret = async () => {
    if (!confirm('Are you sure you want to generate a new partner secret? This will invalidate the old one and partners will need to update their code.')) {
      return
    }

    setGeneratingSecret(true)
    try {
      const response = await fetch(`/api/vendors/${vendorId}/partner-secret`, {
        method: 'POST',
      })
      const data = await response.json()
      
      if (data.success) {
        setPartnerSecret(data.data.partner_secret)
        setShowPartnerSecret(true)
        setDialogMessage('Partner secret generated successfully! Make sure to copy it now - it will not be shown again.')
        setShowSuccessDialog(true)
      } else {
        setDialogMessage(data.error || 'Failed to generate partner secret')
        setShowErrorDialog(true)
      }
    } catch (error) {
      console.error('Error generating partner secret:', error)
      setDialogMessage('An error occurred while generating partner secret')
      setShowErrorDialog(true)
    } finally {
      setGeneratingSecret(false)
    }
  }

  const copyPartnerSecret = () => {
    if (partnerSecret && partnerSecret !== 'exists') {
      navigator.clipboard.writeText(partnerSecret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  // API Key Management Functions
  const fetchApiKeyStatus = async () => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/api-key`)
      const data = await response.json()
      if (data.success) {
        // Track if API key exists (don't store the actual key until generated)
        setApiKey(data.data.has_key ? 'exists' : null)
      }
    } catch (error) {
      console.error('Error fetching API key status:', error)
    }
  }

  const generateApiKey = async () => {
    if (!confirm('Are you sure you want to generate a new API key? This will invalidate the old one and partners will need to update their code.')) {
      return
    }

    setGeneratingApiKey(true)
    try {
      const response = await fetch(`/api/vendors/${vendorId}/api-key`, {
        method: 'POST',
      })
      const data = await response.json()
      
      if (data.success) {
        setApiKey(data.data.api_key)
        setShowApiKey(true)
        setDialogMessage('API key generated successfully! Make sure to copy it now - it will not be shown again.')
        setShowSuccessDialog(true)
      } else {
        setDialogMessage(data.error || 'Failed to generate API key')
        setShowErrorDialog(true)
      }
    } catch (error) {
      console.error('Error generating API key:', error)
      setDialogMessage('An error occurred while generating API key')
      setShowErrorDialog(true)
    } finally {
      setGeneratingApiKey(false)
    }
  }

  const copyApiKey = () => {
    if (apiKey && apiKey !== 'exists') {
      navigator.clipboard.writeText(apiKey)
      setCopiedApiKey(true)
      setTimeout(() => setCopiedApiKey(false), 2000)
    }
  }

  // Helper function to generate Python code with proper @ escaping
  const getPythonCode = () => {
    try {
      const decorator = String.fromCharCode(64) // '@'
      const secret = partnerSecret && partnerSecret !== 'exists' ? partnerSecret : 'YOUR_PARTNER_SECRET'
      const vendor = vendorId || 'YOUR_VENDOR_ID'
      return `from flask import Flask, jsonify
import jwt
import time
import secrets

VENDOR_ID = '${vendor}'
PARTNER_SECRET = '${secret}'

${decorator}app.route('/api/coupon-token', methods=['GET'])
${decorator}require_auth
def generate_coupon_token():
    try:
        external_user_id = str(get_current_user().id)
        jti = f"jti-{int(time.time())}-{secrets.token_urlsafe(12)}"
        
        payload = {
            'vendor': VENDOR_ID,
            'external_user_id': external_user_id,
            'jti': jti,
            'iat': int(time.time()),
            'exp': int(time.time()) + 180,
        }
        
        token = jwt.encode(payload, PARTNER_SECRET, algorithm='HS256')
        return jsonify({'token': token})
    except Exception as e:
        return jsonify({'error': 'Failed to generate token'}), 500`
    } catch (error) {
      console.error('Error generating Python code:', error)
      return `# Error generating code. Please check the console.`
    }
  }

  // Helper function to generate API Key Python code
  const getApiKeyPythonCode = () => {
    const apiKeyValue = apiKey && apiKey !== 'exists' ? apiKey : 'YOUR_API_KEY'
    const vendor = vendorId || 'YOUR_VENDOR_ID'
    const decorator = String.fromCharCode(64) // '@'
    return `from flask import Flask, jsonify, request
import requests

VENDOR_ID = '${vendor}'
API_KEY = '${apiKeyValue}'
WIDGET_SESSION_URL = 'https://your-domain.com/api/widget-session'

${decorator}app.route('/api/coupon-token', methods=['GET'])
${decorator}require_auth
def generate_coupon_token():
    try:
        # Get user ID from your authentication system
        user_id = str(get_current_user().id)
        # Or use email: user_email = get_current_user().email
        
        # Call our API to get widget session token
        response = requests.post(WIDGET_SESSION_URL, json={
            'api_key': API_KEY,
            'vendor_id': VENDOR_ID,
            'user_id': user_id,  # or 'user_email': user_email
        })
        
        if response.status_code == 200:
            data = response.json()
            return jsonify({'token': data['data']['session_token']})
        else:
            return jsonify({'error': 'Failed to generate token'}), 500
    except Exception as e:
        return jsonify({'error': 'Failed to generate token'}), 500`
  }

  // Helper function to generate API Key Node.js code
  const getApiKeyNodeCode = () => {
    const apiKeyValue = apiKey && apiKey !== 'exists' ? apiKey : 'YOUR_API_KEY'
    const vendor = vendorId || 'YOUR_VENDOR_ID'
    return `const fetch = require('node-fetch'); // or use built-in fetch in Node 18+

const VENDOR_ID = '${vendor}';
const API_KEY = '${apiKeyValue}';
const WIDGET_SESSION_URL = 'https://your-domain.com/api/widget-session';

app.get('/api/coupon-token', authenticateUser, async (req, res) => {
  try {
    // Get user ID from your authentication system
    const userId = req.user.id.toString();
    // Or use email: const userEmail = req.user.email;
    
    // Call our API to get widget session token
    const response = await fetch(WIDGET_SESSION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: API_KEY,
        vendor_id: VENDOR_ID,
        user_id: userId,  // or user_email: userEmail
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      res.json({ token: data.data.session_token });
    } else {
      res.status(500).json({ error: 'Failed to generate token' });
    }
  } catch (error) {
    console.error('Error generating coupon token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});`
  }

  const handleDelete = (coupon: Coupon) => {
    setCouponToDelete(coupon)
    setIsDeleteDialogOpen(true)
  }

  const handleViewClaimHistory = (coupon: Coupon, e?: React.MouseEvent) => {
    e?.stopPropagation() // Prevent row click when clicking history button
    router.push(`/dashboard/coupons/${coupon.id}/claims`)
  }

  const handleViewCouponDetail = (coupon: Coupon) => {
    setSelectedCouponForDetail(coupon.id)
    setIsCouponDetailModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!couponToDelete) return

    try {
      const response = await fetch(`/api/coupons/${couponToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDialogMessage(`Coupon "${couponToDelete.code}" moved to trash successfully!`)
        setShowSuccessDialog(true)
        fetchCoupons()
      } else {
        setDialogMessage('Failed to delete coupon.')
        setShowErrorDialog(true)
      }
    } catch (error) {
      console.error('Error deleting coupon:', error)
      setDialogMessage('An error occurred while deleting the coupon.')
      setShowErrorDialog(true)
    } finally {
      setIsDeleteDialogOpen(false)
      setCouponToDelete(null)
    }
  }

  // All coupons are available (shared model)
  const filteredCoupons = coupons.filter((coupon) => {
    return true // All coupons are available
  })

  // Sorting
  const { sortedData: sortedCoupons, sortConfig, handleSort } = useSort<Coupon>(
    filteredCoupons,
    { key: 'created_at', direction: 'desc' }
  )

  // Pagination
  const {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    totalPages,
    getPaginatedData,
  } = usePagination(sortedCoupons, {
    defaultPageSize: 10,
    localStorageKey: 'vendor-profile-coupons-page-size',
  })

  const paginatedCoupons = getPaginatedData(sortedCoupons)
  const pageSizeOptions = [5, 10, 20, 50, 100]

  // Calculate stats - all coupons are available (shared model)
  const totalCoupons = coupons.length
  const availableCoupons = totalCoupons // All coupons are available
  // Note: Claim stats would need to come from claim_history API

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-48 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 text-destructive">
              <Building2 className="h-8 w-8" />
              <div>
                <h2 className="text-xl font-bold">Vendor Not Found</h2>
                <p className="text-muted-foreground">
                  The vendor you&apos;re looking for doesn&apos;t exist or has been deleted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/vendors">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Vendors
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">{vendor.name}</h1>
        <p className="text-muted-foreground mt-2">{vendor.description || 'No description provided'}</p>
      </div>

      {/* Vendor Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Vendor Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendor.contact_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span>{vendor.contact_email}</span>
              </div>
            )}
            {vendor.contact_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Phone:</span>
                <span>{vendor.contact_phone}</span>
              </div>
            )}
            {vendor.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Website:</span>
                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {vendor.website}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={vendor.active ? 'success' : 'destructive'}>
                {vendor.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Methods - Tabbed Interface */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Integration Methods
          </CardTitle>
          <CardDescription>
            Choose the integration method that best fits your partner&apos;s technical capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeIntegrationTab} onValueChange={(value) => setActiveIntegrationTab(value as 'wordpress' | 'api-key' | 'jwt')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="wordpress">
                <Sparkles className="h-4 w-4 mr-2" />
                WordPress Plugin
              </TabsTrigger>
              <TabsTrigger value="api-key">
                <Key className="h-4 w-4 mr-2" />
                API Key Method
              </TabsTrigger>
              <TabsTrigger value="jwt">
                <Code className="h-4 w-4 mr-2" />
                JWT Method
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: WordPress Plugin */}
            <TabsContent value="wordpress" className="space-y-4 mt-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Sparkles className="h-8 w-8 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">WordPress Plugin - Zero Code Solution</h3>
                    <p className="text-blue-800 mb-4">
                      Perfect for WordPress users! Install our plugin and you&apos;re done. No coding required.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <Check className="h-4 w-4" />
                        <span>Automatic user detection</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <Check className="h-4 w-4" />
                        <span>One-click installation</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <Check className="h-4 w-4" />
                        <span>Works with any WordPress theme</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-sm text-blue-600 mb-2">
                        Download the plugin ZIP file pre-configured with your vendor ID and API key. Simply upload and activate in WordPress.
                      </p>
                      <Button 
                        onClick={() => {
                          window.location.href = `/api/vendors/${vendorId}/wordpress-plugin`
                        }}
                        variant="outline" 
                        size="sm"
                        disabled={!apiKey || apiKey === 'exists'}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {(!apiKey || apiKey === 'exists') ? 'Generate API Key First' : 'Download Plugin'}
                      </Button>
                      {(!apiKey || apiKey === 'exists') && (
                        <p className="text-xs text-blue-500 mt-2">
                          You need to generate an API key first. Go to the &quot;API Key Method&quot; tab to generate one.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget Embed Code - Coming Soon */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="h-5 w-5" />
                    Widget Embed Code
                  </CardTitle>
                  <CardDescription>
                    Once the WordPress plugin is available, you&apos;ll be able to embed the widget using a simple shortcode.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <code className="text-sm font-mono">
                      [coupon_widget vendor_id=&quot;{vendorId}&quot;]
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    <strong>Coming Soon:</strong> The WordPress plugin will handle all authentication and widget embedding automatically.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: API Key Method */}
            <TabsContent value="api-key" className="space-y-6 mt-6">
              {/* API Key Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      API Key (Simple Method)
                    </CardTitle>
                    <Button
                      onClick={generateApiKey}
                      variant="outline"
                      size="sm"
                      disabled={generatingApiKey}
                    >
                      {generatingApiKey ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : apiKey ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          Generate API Key
                        </>
                      )}
                    </Button>
                  </div>
                  <CardDescription>
                    API key is used for simple widget authentication. Partners make a backend call instead of signing JWT tokens. Keep this secure.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {apiKey && apiKey !== 'exists' && showApiKey ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          <strong>Important:</strong> Copy this API key now. It will not be displayed again for security reasons.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                          {apiKey}
                        </code>
                        <Button
                          onClick={copyApiKey}
                          variant="outline"
                          size="sm"
                        >
                          {copiedApiKey ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : apiKey === 'exists' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        API key is configured. Click &quot;Regenerate&quot; to create a new one (this will invalidate the old key).
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        No API key configured. Generate one to enable simple API key authentication.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* API Key Code Examples */}
              {apiKey && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      Integration Code Examples
                    </CardTitle>
                    <CardDescription>
                      Copy these code examples for the simple API key method. Your backend makes a direct API call instead of signing JWT tokens.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Platform Selector */}
                    <div className="flex gap-2 border-b pb-4">
                      <Button
                        variant={selectedApiKeyPlatform === 'wordpress' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedApiKeyPlatform('wordpress')}
                      >
                        WordPress (PHP)
                      </Button>
                      <Button
                        variant={selectedApiKeyPlatform === 'nodejs' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedApiKeyPlatform('nodejs')}
                      >
                        Node.js / Express
                      </Button>
                      <Button
                        variant={selectedApiKeyPlatform === 'python' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedApiKeyPlatform('python')}
                      >
                        Python / Flask
                      </Button>
                    </div>

                    {/* WordPress Code Example */}
                    {selectedApiKeyPlatform === 'wordpress' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold mb-1">WordPress Integration (API Key Method)</h4>
                            <p className="text-sm text-muted-foreground">
                              Add this to your theme&apos;s <code className="bg-muted px-1 rounded">functions.php</code> file
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const apiKeyValue = apiKey && apiKey !== 'exists' ? apiKey : 'YOUR_API_KEY'
                              const vendorIdValue = vendorId || 'YOUR_VENDOR_ID'
                              const widgetSessionUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/widget-session` : 'https://your-domain.com/api/widget-session'
                              const code = `<?php
/**
 * Coupon Widget Token Generator - API Key Method
 * Add this to your theme's functions.php file
 */

function generate_coupon_widget_token() {
    // Configuration
    $vendor_id = '${vendorIdValue}';
    $api_key = '${apiKeyValue}';
    $widget_session_url = '${widgetSessionUrl}';
    
    // Only generate token for logged-in users
    if (!is_user_logged_in()) {
        return;
    }
    
    $user_id = get_current_user_id();
    
    // Call our API to get widget session token
    $response = wp_remote_post($widget_session_url, [
        'headers' => ['Content-Type' => 'application/json'],
        'body' => json_encode([
            'api_key' => $api_key,
            'vendor_id' => $vendor_id,
            'user_id' => (string)$user_id,
        ]),
    ]);
    
    if (is_wp_error($response)) {
        error_log('Coupon widget token generation failed: ' . $response->get_error_message());
        return;
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    if (isset($data['success']) && $data['success'] && isset($data['data']['session_token'])) {
        $token = $data['data']['session_token'];
        
        // Send token to widget
        echo '<script>';
        echo 'if (typeof window.sendCouponToken === "function") {';
        echo '  window.sendCouponToken("' . esc_js($token) . '");';
        echo '}';
        echo '</script>';
    }
}

// Hook into wp_footer to inject token
add_action('wp_footer', 'generate_coupon_widget_token');`
                              navigator.clipboard.writeText(code)
                              setCopiedCodeIndex(0)
                              setTimeout(() => setCopiedCodeIndex(null), 2000)
                            }}
                          >
                            {copiedCodeIndex === 0 ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Code
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                          <pre className="text-xs font-mono">
                            <code>{`<?php
function generate_coupon_widget_token() {
    $vendor_id = '${vendorId}';
    $api_key = '${apiKey && apiKey !== 'exists' ? apiKey : 'YOUR_API_KEY'}';
    $widget_session_url = '${typeof window !== 'undefined' ? `${window.location.origin}/api/widget-session` : 'https://your-domain.com/api/widget-session'}';
    
    if (!is_user_logged_in()) return;
    
    $user_id = get_current_user_id();
    
    $response = wp_remote_post($widget_session_url, [
        'headers' => ['Content-Type' => 'application/json'],
        'body' => json_encode([
            'api_key' => $api_key,
            'vendor_id' => $vendor_id,
            'user_id' => (string)$user_id,
        ]),
    ]);
    
    if (is_wp_error($response)) return;
    
    $data = json_decode(wp_remote_retrieve_body($response), true);
    
    if (isset($data['success']) && $data['success']) {
        $token = $data['data']['session_token'];
        echo '<script>';
        echo 'if (typeof window.sendCouponToken === "function") {';
        echo '  window.sendCouponToken("' . esc_js($token) . '");';
        echo '}';
        echo '</script>';
    }
}

add_action('wp_footer', 'generate_coupon_widget_token');`}</code>
                          </pre>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                          <p className="font-semibold text-blue-900 mb-1">Installation Steps:</p>
                          <ol className="list-decimal list-inside space-y-1 text-blue-800">
                            <li>Copy the code above to your theme&apos;s <code className="bg-blue-100 px-1 rounded">functions.php</code></li>
                            <li>Replace <code className="bg-blue-100 px-1 rounded">YOUR_API_KEY</code> with your API key from above</li>
                            <li>Embed the widget script on pages where you want coupons displayed</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* Node.js Code Example */}
                    {selectedApiKeyPlatform === 'nodejs' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold mb-1">Node.js / Express Integration (API Key Method)</h4>
                            <p className="text-sm text-muted-foreground">
                              Add this route to your Express application
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const code = getApiKeyNodeCode()
                              navigator.clipboard.writeText(code)
                              setCopiedCodeIndex(1)
                              setTimeout(() => setCopiedCodeIndex(null), 2000)
                            }}
                          >
                            {copiedCodeIndex === 1 ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Code
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                          <pre className="text-xs font-mono">
                            <code>{getApiKeyNodeCode()}</code>
                          </pre>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                          <p className="font-semibold text-blue-900 mb-1">Installation Steps:</p>
                          <ol className="list-decimal list-inside space-y-1 text-blue-800">
                            <li>Install node-fetch (or use built-in fetch in Node 18+): <code className="bg-blue-100 px-1 rounded">npm install node-fetch</code></li>
                            <li>Add the route to your Express app</li>
                            <li>Replace <code className="bg-blue-100 px-1 rounded">authenticateUser</code> with your auth middleware</li>
                            <li>Add the frontend code to load the token when page loads</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* Python Code Example */}
                    {selectedApiKeyPlatform === 'python' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold mb-1">Python / Flask Integration (API Key Method)</h4>
                            <p className="text-sm text-muted-foreground">
                              Add this route to your Flask application
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const code = getApiKeyPythonCode()
                              navigator.clipboard.writeText(code)
                              setCopiedCodeIndex(2)
                              setTimeout(() => setCopiedCodeIndex(null), 2000)
                            }}
                          >
                            {copiedCodeIndex === 2 ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Code
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                          <pre className="text-xs font-mono">
                            <code>{getApiKeyPythonCode()}</code>
                          </pre>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                          <p className="font-semibold text-blue-900 mb-1">Installation Steps:</p>
                          <ol className="list-decimal list-inside space-y-1 text-blue-800">
                            <li>Install requests: <code className="bg-blue-100 px-1 rounded">pip install requests</code></li>
                            <li>Add the route to your Flask app</li>
                            <li>Replace <code className="bg-blue-100 px-1 rounded">{'@'}require_auth</code> with your auth decorator</li>
                            <li>Add frontend JavaScript to load token when page loads</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* Widget Embed Code */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold mb-2">Widget Embed Code</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Add this to your HTML pages where you want the coupon widget to appear. Replace <code className="bg-muted px-1 rounded">YOUR_API_ENDPOINT</code> with your backend endpoint that calls our API:
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-xs break-all">
                          {`<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="${vendorId}"
     data-api-key-endpoint="https://your-site.com/api/coupon-token">
</div>`}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const code = `<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="${vendorId}"
     data-api-key-endpoint="https://your-site.com/api/coupon-token">
</div>`
                            navigator.clipboard.writeText(code)
                            setCopiedCodeIndex(3)
                            setTimeout(() => setCopiedCodeIndex(null), 2000)
                          }}
                        >
                          {copiedCodeIndex === 3 ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm mt-3">
                        <p className="font-semibold text-blue-900 mb-1">How it works:</p>
                        <ol className="list-decimal list-inside space-y-1 text-blue-800">
                          <li>Widget automatically calls your backend endpoint (<code className="bg-blue-100 px-1 rounded">data-api-key-endpoint</code>)</li>
                          <li>Your backend authenticates the user and calls our <code className="bg-blue-100 px-1 rounded">/api/widget-session</code> endpoint</li>
                          <li>Your backend returns the widget session token to the widget</li>
                          <li>Widget uses the token to authenticate all API calls</li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab 3: JWT Method */}
            <TabsContent value="jwt" className="space-y-6 mt-6">
              {/* Partner Secret Management */}
              {(partnerSecret && partnerSecret !== 'exists' && showPartnerSecret) || partnerSecret === 'exists' ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Partner Secret (JWT Method)
                      </CardTitle>
                      <Button
                        onClick={generatePartnerSecret}
                        variant="outline"
                        size="sm"
                        disabled={generatingSecret}
                      >
                        {generatingSecret ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : partnerSecret ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </>
                        ) : (
                          <>
                            <Key className="h-4 w-4 mr-2" />
                            Generate Partner Secret
                          </>
                        )}
                      </Button>
                    </div>
                    <CardDescription>
                      Partner secret is used for JWT token signing. Partners sign tokens with this secret on their backend. Keep this secure.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {partnerSecret && partnerSecret !== 'exists' && showPartnerSecret ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <p className="text-sm text-yellow-800">
                            <strong>Important:</strong> Copy this partner secret now. It will not be displayed again for security reasons.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                            {partnerSecret}
                          </code>
                          <Button
                            onClick={copyPartnerSecret}
                            variant="outline"
                            size="sm"
                          >
                            {copiedSecret ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : partnerSecret === 'exists' ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Partner secret is configured. Click &quot;Regenerate&quot; to create a new one (this will invalidate the old secret).
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          No partner secret configured. Generate one to enable JWT token authentication.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {/* JWT Code Examples */}
              {(partnerSecret && partnerSecret !== 'exists' && showPartnerSecret) || partnerSecret === 'exists' ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      Integration Code Examples
                    </CardTitle>
                    <CardDescription>
                      Copy these code examples and share with your partner. Replace placeholders with actual values from above.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Platform Selector */}
                    <div className="flex gap-2 border-b pb-4">
                      <Button
                        variant={selectedPlatform === 'wordpress' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPlatform('wordpress')}
                      >
                        WordPress (PHP)
                      </Button>
                      <Button
                        variant={selectedPlatform === 'nodejs' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPlatform('nodejs')}
                      >
                        Node.js / Express
                      </Button>
                      <Button
                        variant={selectedPlatform === 'python' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPlatform('python')}
                      >
                        Python / Flask
                      </Button>
                    </div>

            {/* WordPress Code Example */}
            {selectedPlatform === 'wordpress' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold mb-1">WordPress Integration</h4>
                    <p className="text-sm text-muted-foreground">
                      Add this to your theme&apos;s <code className="bg-muted px-1 rounded">functions.php</code> file
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const code = `<?php
/**
 * Coupon Widget Token Generator for WordPress
 * Add this to your theme's functions.php file
 */

use Firebase\\JWT\\JWT;
use Firebase\\JWT\\Key;

function generate_coupon_widget_token() {
    // Configuration - Replace with your values
    $vendor_id = '${vendorId}';
    $partner_secret = '${partnerSecret && partnerSecret !== 'exists' ? partnerSecret : 'YOUR_PARTNER_SECRET'}';
    
    // Only generate token for logged-in users
    if (!is_user_logged_in()) {
        return;
    }
    
    $external_user_id = get_current_user_id();
    $jti = 'jti-' . time() . '-' . wp_generate_password(12, false);
    
    $payload = [
        'vendor' => $vendor_id,
        'external_user_id' => (string)$external_user_id,
        'jti' => $jti,
        'iat' => time(),
        'exp' => time() + 180, // 3 minutes
    ];
    
    try {
        $token = JWT::encode($payload, $partner_secret, 'HS256');
        
        // Send token to widget
        echo '<script>';
        echo 'if (typeof window.sendCouponToken === "function") {';
        echo '  window.sendCouponToken("' . esc_js($token) . '");';
        echo '}';
        echo '</script>';
    } catch (Exception $e) {
        // Log error but don't break the page
        error_log('Coupon widget token generation failed: ' . $e->getMessage());
    }
}

// Hook into wp_footer to inject token
add_action('wp_footer', 'generate_coupon_widget_token');

// Note: Install Firebase JWT library via Composer:
// composer require firebase/php-jwt`
                      navigator.clipboard.writeText(code)
                      setCopiedCodeIndex(0)
                      setTimeout(() => setCopiedCodeIndex(null), 2000)
                    }}
                  >
                    {copiedCodeIndex === 0 ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs font-mono">
                    <code>{`<?php
use Firebase\\JWT\\JWT;

function generate_coupon_widget_token() {
    $vendor_id = '${vendorId}';
    $partner_secret = '${partnerSecret && partnerSecret !== 'exists' ? partnerSecret : 'YOUR_PARTNER_SECRET'}';
    
    if (!is_user_logged_in()) return;
    
    $external_user_id = get_current_user_id();
    $jti = 'jti-' . time() . '-' . wp_generate_password(12, false);
    
    $payload = [
        'vendor' => $vendor_id,
        'external_user_id' => (string)$external_user_id,
        'jti' => $jti,
        'iat' => time(),
        'exp' => time() + 180,
    ];
    
    try {
        $token = JWT::encode($payload, $partner_secret, 'HS256');
        echo '<script>';
        echo 'if (typeof window.sendCouponToken === "function") {';
        echo '  window.sendCouponToken("' . esc_js($token) . '");';
        echo '}';
        echo '</script>';
    } catch (Exception $e) {
        error_log('Coupon widget token generation failed: ' . $e->getMessage());
    }
}

add_action('wp_footer', 'generate_coupon_widget_token');`}</code>
                  </pre>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="font-semibold text-blue-900 mb-1">Installation Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Install Firebase JWT: <code className="bg-blue-100 px-1 rounded">composer require firebase/php-jwt</code></li>
                    <li>Copy the code above to your theme&apos;s <code className="bg-blue-100 px-1 rounded">functions.php</code></li>
                    <li>Replace <code className="bg-blue-100 px-1 rounded">YOUR_PARTNER_SECRET</code> with the secret from above</li>
                    <li>Embed the widget script on pages where you want coupons displayed</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Node.js Code Example */}
            {selectedPlatform === 'nodejs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold mb-1">Node.js / Express Integration</h4>
                    <p className="text-sm text-muted-foreground">
                      Add this route to your Express application
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const code = `const jwt = require('jsonwebtoken');

// Configuration
const vendorId = '${vendorId}';
const partnerSecret = '${partnerSecret && partnerSecret !== 'exists' ? partnerSecret : 'YOUR_PARTNER_SECRET'}';

app.get('/api/coupon-token', authenticateUser, (req, res) => {
  try {
    const externalUserId = req.user.id.toString();
    const jti = \`jti-\${Date.now()}-\${Math.random().toString(36).substring(2, 15)}\`;
    
    const token = jwt.sign(
      {
        vendor: vendorId,
        external_user_id: externalUserId,
        jti: jti,
      },
      partnerSecret,
      {
        algorithm: 'HS256',
        expiresIn: '3m',
      }
    );
    
    res.json({ token });
  } catch (error) {
    console.error('Error generating coupon token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Frontend: Fetch token and send to widget
async function loadCouponWidget() {
  try {
    const response = await fetch('/api/coupon-token', {
      credentials: 'include',
    });
    const data = await response.json();
    
    if (data.token && typeof window.sendCouponToken === 'function') {
      window.sendCouponToken(data.token);
    }
  } catch (error) {
    console.error('Failed to load coupon widget token:', error);
  }
}

loadCouponWidget();`
                      navigator.clipboard.writeText(code)
                      setCopiedCodeIndex(1)
                      setTimeout(() => setCopiedCodeIndex(null), 2000)
                    }}
                  >
                    {copiedCodeIndex === 1 ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs font-mono">
                    <code>{`const jwt = require('jsonwebtoken');

const vendorId = '${vendorId}';
const partnerSecret = '${partnerSecret && partnerSecret !== 'exists' ? partnerSecret : 'YOUR_PARTNER_SECRET'}';

app.get('/api/coupon-token', authenticateUser, (req, res) => {
  try {
    const externalUserId = req.user.id.toString();
    const jti = \`jti-\${Date.now()}-\${Math.random().toString(36).substring(2, 15)}\`;
    
    const token = jwt.sign(
      {
        vendor: vendorId,
        external_user_id: externalUserId,
        jti: jti,
      },
      partnerSecret,
      { algorithm: 'HS256', expiresIn: '3m' }
    );
    
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate token' });
  }
});`}</code>
                  </pre>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="font-semibold text-blue-900 mb-1">Installation Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Install jsonwebtoken: <code className="bg-blue-100 px-1 rounded">npm install jsonwebtoken</code></li>
                    <li>Add the route to your Express app</li>
                    <li>Replace <code className="bg-blue-100 px-1 rounded">authenticateUser</code> with your auth middleware</li>
                    <li>Add the frontend code to load the token when page loads</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Python Code Example */}
            {selectedPlatform === 'python' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold mb-1">Python / Flask Integration</h4>
                    <p className="text-sm text-muted-foreground">
                      Add this route to your Flask application
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const code = getPythonCode()
                      navigator.clipboard.writeText(code)
                      setCopiedCodeIndex(2)
                      setTimeout(() => setCopiedCodeIndex(null), 2000)
                    }}
                  >
                    {copiedCodeIndex === 2 ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs font-mono">
                    <code>{getPythonCode()}</code>
                  </pre>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="font-semibold text-blue-900 mb-1">Installation Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Install PyJWT: <code className="bg-blue-100 px-1 rounded">pip install PyJWT</code></li>
                    <li>Add the route to your Flask app</li>
                    <li>Replace <code className="bg-blue-100 px-1 rounded">{'@'}require_auth</code> with your auth decorator</li>
                    <li>Add frontend JavaScript to load token when page loads</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Widget Embed Code */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-2">Widget Embed Code</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Add this to your HTML pages. After your backend generates the JWT token, call <code className="bg-muted px-1 rounded">window.sendCouponToken()</code> to authenticate:
              </p>
              <div className="flex items-center gap-2 mb-2">
                <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-xs break-all">
                  {`<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/widget-embed.js"></script>
<div id="coupon-widget" data-vendor-id="${vendorId}"></div>

<!-- After your backend generates JWT token: -->
<script>
  // Example: Fetch token from your backend endpoint
  fetch('/api/coupon-token')
    .then(response => response.json())
    .then(data => {
      if (data.token) {
        window.sendCouponToken(data.token);
      }
    });
</script>`}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const code = `<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/widget-embed.js"></script>
<div id="coupon-widget" data-vendor-id="${vendorId}"></div>

<!-- After your backend generates JWT token: -->
<script>
  // Example: Fetch token from your backend endpoint
  fetch('/api/coupon-token')
    .then(response => response.json())
    .then(data => {
      if (data.token) {
        window.sendCouponToken(data.token);
      }
    });
</script>`
                    navigator.clipboard.writeText(code)
                    setCopiedCodeIndex(3)
                    setTimeout(() => setCopiedCodeIndex(null), 2000)
                  }}
                >
                  {copiedCodeIndex === 3 ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm mt-3">
                <p className="font-semibold text-blue-900 mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Include the widget script and container div</li>
                  <li>Your backend generates a JWT token using the Partner Secret (see code examples above)</li>
                  <li>Call <code className="bg-blue-100 px-1 rounded">window.sendCouponToken(jwtToken)</code> to authenticate</li>
                  <li>Widget automatically exchanges the JWT token for a widget session token</li>
                  <li>Widget uses the session token for all API calls</li>
                </ol>
              </div>
            </div>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Coupon Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Coupons</CardDescription>
            <CardTitle className="text-3xl">{totalCoupons}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Available</CardDescription>
            <CardTitle className="text-3xl text-green-600">{availableCoupons}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{availableCoupons}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Coupons Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Coupons</CardTitle>
              <CardDescription>Manage coupons for this vendor</CardDescription>
            </div>
            <div className="flex gap-2">
              {vendor && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => router.push(`/widget/template/${vendor.id}`)}
                    title="Preview coupon widget template"
                  >
                    <Eye className="h-4 w-4" />
                    Preview Template
                  </Button>
                  {coupons.length > 0 && (
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        title="Copy widget embed code"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Widget
                      </Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="p-2">
                      <div className="mb-2 text-xs font-semibold text-muted-foreground">
                        Choose Embed Method:
                      </div>
                      <DropdownMenuItem
                        onClick={async () => {
                          const baseUrl = window.location.origin
                          const widgetScript = `<script src="${baseUrl}/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="${vendor.id}" 
     data-user-id="USER_ID_FROM_YOUR_SYSTEM"
     data-theme="light">
</div>

<!-- Instructions: Replace USER_ID_FROM_YOUR_SYSTEM with the authenticated user's ID -->`
                          try {
                            await navigator.clipboard.writeText(widgetScript)
                            setCopiedScript(true)
                            setTimeout(() => setCopiedScript(false), 2000)
                          } catch (err) {
                            console.error('Failed to copy:', err)
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <div>
                          <div className="font-medium">Script Embed (Recommended)</div>
                          <div className="text-xs text-muted-foreground">
                            For websites that support script tags
                          </div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async () => {
                          const baseUrl = window.location.origin
                          const iframeCode = `<iframe 
  src="${baseUrl}/widget/embed?vendor_id=${vendor.id}&user_id=USER_ID_FROM_YOUR_SYSTEM&theme=light"
  width="100%" 
  height="600" 
  frameborder="0" 
  style="border: none; border-radius: 8px;">
</iframe>

<!-- Instructions: Replace USER_ID_FROM_YOUR_SYSTEM with the authenticated user's ID -->
<!-- For Elementor: Use Shortcode widget or paste iframe code directly -->`
                          try {
                            await navigator.clipboard.writeText(iframeCode)
                            setCopiedScript(true)
                            setTimeout(() => setCopiedScript(false), 2000)
                          } catch (err) {
                            console.error('Failed to copy:', err)
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <div>
                          <div className="font-medium">Iframe Embed (Elementor)</div>
                          <div className="text-xs text-muted-foreground">
                            Works with Elementor Shortcode widget
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                  )}
                </>
              )}
              {copiedScript && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  Copied!
                </div>
              )}
              <Button onClick={() => setIsCSVModalOpen(true)} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Coupon
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Status filter removed - all coupons are shared/available */}

          {/* Coupons Table */}
          {paginatedCoupons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No coupons found. Create the first coupon for this vendor!
            </div>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          onClick={() => handleSort('code')}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          Code
                          {sortConfig?.key === 'code' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('description')}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          Description
                          {sortConfig?.key === 'description' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('discount_value')}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          Discount
                          {sortConfig?.key === 'discount_value' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('expiry_date')}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          Expiry Date
                          {sortConfig?.key === 'expiry_date' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('is_claimed')}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          Claimed
                          {sortConfig?.key === 'is_claimed' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('is_claimed')}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          Status
                          {sortConfig?.key === 'is_claimed' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCoupons.map((coupon) => (
                      <TableRow 
                        key={coupon.id}
                        onClick={() => handleViewCouponDetail(coupon)}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        <TableCell className="font-mono font-semibold">
                          {coupon.code}
                        </TableCell>
                        <TableCell>{coupon.description || '-'}</TableCell>
                        <TableCell>{coupon.discount_value || '-'}</TableCell>
                        <TableCell>
                          {coupon.expiry_date
                            ? formatDate(coupon.expiry_date)
                            : 'No expiry'}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {coupon.is_claimed ? (
                              <span className="text-green-600">Yes</span>
                            ) : (
                              <span className="text-gray-500">No</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={coupon.is_claimed ? 'destructive' : 'success'}>
                            {coupon.is_claimed ? 'Claimed' : 'Available'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleViewClaimHistory(coupon, e)}
                              className="text-primary hover:text-primary"
                              title="View claim history"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(coupon)
                              }}
                              className="text-destructive hover:text-destructive"
                              title="Delete coupon"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Items per page:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {pageSize}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {pageSizeOptions.map((size) => (
                        <DropdownMenuItem
                          key={size}
                          onClick={() => setPageSize(size)}
                        >
                          {size}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages || 1, currentPage + 1))}
                    disabled={currentPage >= (totalPages || 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CouponModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          fetchCoupons()
        }}
        vendors={vendor ? [vendor] : []}
      />

      <CSVUploadModal
        isOpen={isCSVModalOpen}
        onClose={() => {
          setIsCSVModalOpen(false)
          fetchCoupons()
        }}
        vendors={vendor ? [vendor] : []}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Coupon"
        itemName={couponToDelete?.code || ''}
        itemType="coupon"
      />

      {/* Success Dialog */}
      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        message={dialogMessage}
      />

      {/* Error Dialog */}
      <ErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        message={dialogMessage}
      />

      {/* Coupon Detail Modal */}
      <CouponDetailModal
        isOpen={isCouponDetailModalOpen}
        onClose={() => {
          setIsCouponDetailModalOpen(false)
          setSelectedCouponForDetail(null)
        }}
        couponId={selectedCouponForDetail}
      />
    </div>
  )
}

