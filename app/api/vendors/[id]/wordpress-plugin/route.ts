import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSuperAdmin, isPartnerAdmin } from '@/lib/auth/permissions'
import { getVendorById, hasVendorAccess } from '@/lib/db/vendors'
import archiver from 'archiver'
import { Readable } from 'stream'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * GET /api/vendors/[id]/wordpress-plugin
 * Generate WordPress plugin ZIP file with vendor_id and API key pre-configured
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const vendor = await getVendorById(id)

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Check permissions: Super admin can access any vendor, partner admin only their own
    if (!isSuperAdmin(session.user.role) && !(isPartnerAdmin(session.user.role) && await hasVendorAccess(session.user.id, id))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have access to download plugin for this vendor.' },
        { status: 403 }
      )
    }

    // API key is optional - vendors can add it manually in WordPress admin panel
    const apiKey = (vendor as any)?.api_key || ''

    // Get API base URL from the request (where the plugin is downloaded from)
    // Priority: referer > origin > host > env variables > default
    const referer = request.headers.get('referer')
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    
    let apiBaseUrl: string | null = null
    
    // 1. Try to extract from referer (most reliable - contains the full URL of the page)
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        const refererHost = refererUrl.host
        
        // If downloaded from localhost, use vercel.app as fallback
        if (refererHost === 'localhost' || refererHost.startsWith('localhost:') || refererHost === '127.0.0.1') {
          apiBaseUrl = 'https://coupon-dispenser.vercel.app'
        } else {
          apiBaseUrl = `${refererUrl.protocol}//${refererHost}`
        }
      } catch (e) {
        // Invalid referer URL, continue
      }
    }
    
    // 2. Try origin header if referer didn't work
    if (!apiBaseUrl && origin) {
      try {
        const originUrl = new URL(origin)
        const originHost = originUrl.host
        
        // If downloaded from localhost, use vercel.app as fallback
        if (originHost === 'localhost' || originHost.startsWith('localhost:') || originHost === '127.0.0.1') {
          apiBaseUrl = 'https://coupon-dispenser.vercel.app'
        } else {
          apiBaseUrl = origin
        }
      } catch (e) {
        // Invalid origin URL, continue
      }
    }
    
    // 3. Try host header if referer/origin didn't work
    if (!apiBaseUrl && host) {
      // If host is localhost, use vercel.app as fallback
      if (host === 'localhost' || host.startsWith('localhost:') || host === '127.0.0.1') {
        apiBaseUrl = 'https://coupon-dispenser.vercel.app'
      } else {
        // Use https by default (assume production uses https)
        apiBaseUrl = `https://${host}`
      }
    }
    
    // 4. Fallback to environment variables
    if (!apiBaseUrl) {
      apiBaseUrl = process.env.NEXTAUTH_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    }
    
    // 5. Final fallback to vercel.app
    if (!apiBaseUrl) {
      apiBaseUrl = 'https://coupon-dispenser.vercel.app'
    }
    
    const cleanApiBaseUrl = apiBaseUrl.replace(/\/$/, '') // Remove trailing slash

    // Read plugin template files
    const pluginDir = path.join(process.cwd(), 'wordpress-plugin')
    
    // Read main plugin file
    let mainPluginContent = await fs.readFile(
      path.join(pluginDir, 'coupon-dispenser-widget.php'),
      'utf-8'
    )
    
    // Read settings class
    const settingsContent = await fs.readFile(
      path.join(pluginDir, 'includes', 'class-settings.php'),
      'utf-8'
    )
    
    // Read shortcode class
    const shortcodeContent = await fs.readFile(
      path.join(pluginDir, 'includes', 'class-shortcode.php'),
      'utf-8'
    )
    
    // Read widget render class
    const widgetRenderContent = await fs.readFile(
      path.join(pluginDir, 'includes', 'class-widget-render.php'),
      'utf-8'
    )

    // Replace configuration placeholders in main plugin file
    // Vendor ID is pre-configured, but API key is left empty for vendors to add manually
    mainPluginContent = mainPluginContent.replace(/PLUGIN_CONFIG_VENDOR_ID/g, id)
    mainPluginContent = mainPluginContent.replace(/PLUGIN_CONFIG_API_KEY/g, '') // Leave empty - vendors add it in WordPress admin
    mainPluginContent = mainPluginContent.replace(/PLUGIN_CONFIG_API_BASE_URL/g, cleanApiBaseUrl)

    // Add README file
    const readmeContent = `=== Coupon Dispenser Widget ===
Contributors: akash
Tags: coupons, widget, ecommerce
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.1.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Plugin URI: https://iakash.dev
Author: Akash
Author URI: https://iakash.dev

Embed coupon widgets from Coupon Dispenser platform. Zero-code integration for WordPress.

== Description ==

This plugin allows you to embed coupon widgets from the Coupon Dispenser platform directly into your WordPress site. The plugin is pre-configured with your vendor ID. You'll need to add your API key in the WordPress admin panel after installation.

== Important Notes ==

* **API Key Setup:** After installation, go to **Settings → Coupon Dispenser** in your WordPress admin panel and enter your API key. You can find your API key in the Coupon Dispenser dashboard.
* **One Plugin Per Vendor:** Each plugin is pre-configured with one vendor ID. Use separate plugin installations for different vendors.

== Installation ==

1. Upload the plugin ZIP file through the WordPress 'Plugins' menu
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to **Settings → Coupon Dispenser** and enter your API key
4. Use the shortcode [coupon_widget] to display coupons on any page or post

== Frequently Asked Questions ==

= How do I display coupons? =

Simply add the shortcode [coupon_widget] to any page or post where you want to display coupons.

= Can I customize the widget? =

Yes, you can change the container ID using the container_id attribute:
[coupon_widget container_id="my-custom-id"]

== Changelog ==

= 1.1.2 =
* Pre-configured with vendor ID
* Manual API key entry via WordPress admin panel
* Auto-fix for Vercel preview URLs
* Enhanced logging and diagnostics
* Improved user authentication detection
* Better error handling and PHP 7.4+ compatibility

== Upgrade Notice ==

= 1.1.2 =
Current stable version. Recommended for all users.
`

    // Create ZIP file in memory
    return new Promise<NextResponse>((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      })

      const chunks: Buffer[] = []
      
      archive.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })

      archive.on('error', (err: Error) => {
        console.error('Error creating ZIP:', err)
        reject(err)
      })

      archive.on('end', () => {
        const zipBuffer = Buffer.concat(chunks)
        const filename = `coupon-dispenser-widget-${vendor.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${Date.now()}.zip`
        
        resolve(new NextResponse(zipBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': zipBuffer.length.toString(),
          },
        }))
      })

      // Add plugin files to ZIP
      archive.append(mainPluginContent, { name: 'coupon-dispenser-widget/coupon-dispenser-widget.php' })
      archive.append(settingsContent, { name: 'coupon-dispenser-widget/includes/class-settings.php' })
      archive.append(shortcodeContent, { name: 'coupon-dispenser-widget/includes/class-shortcode.php' })
      archive.append(widgetRenderContent, { name: 'coupon-dispenser-widget/includes/class-widget-render.php' })
      archive.append(readmeContent, { name: 'coupon-dispenser-widget/readme.txt' })

      // Finalize the archive
      archive.finalize()
    })

  } catch (err: unknown) {
    console.error('Error generating WordPress plugin ZIP:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

