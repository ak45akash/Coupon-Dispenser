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

    // Get API key
    const apiKey = (vendor as any)?.api_key || null
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Vendor does not have API key configured. Please generate an API key first.' },
        { status: 400 }
      )
    }

    // Get API base URL from request origin (where the download came from)
    // This ensures the correct URL is used based on where the request came from
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    const referer = request.headers.get('referer')
    
    // Try to extract URL from referer if origin is not available
    let apiBaseUrl = origin
    if (!apiBaseUrl && referer) {
      try {
        const refererUrl = new URL(referer)
        apiBaseUrl = `${refererUrl.protocol}//${refererUrl.host}`
      } catch (e) {
        // Invalid referer, continue
      }
    }
    
    // Fallback to host from request
    if (!apiBaseUrl && host) {
      apiBaseUrl = `https://${host}`
    }
    
    // Fallback to environment variables
    if (!apiBaseUrl) {
      apiBaseUrl = process.env.NEXTAUTH_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                   'https://coupon-dispenser.vercel.app'
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
    mainPluginContent = mainPluginContent.replace(/PLUGIN_CONFIG_VENDOR_ID/g, id)
    mainPluginContent = mainPluginContent.replace(/PLUGIN_CONFIG_API_KEY/g, apiKey)
    mainPluginContent = mainPluginContent.replace(/PLUGIN_CONFIG_API_BASE_URL/g, cleanApiBaseUrl)

    // Add README file
    const readmeContent = `=== Coupon Dispenser Widget ===
Contributors: akash
Tags: coupons, widget, ecommerce
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Plugin URI: https://iakash.dev
Author: Akash
Author URI: https://iakash.dev

Embed coupon widgets from Coupon Dispenser platform. Zero-code integration for WordPress.

== Description ==

This plugin allows you to embed coupon widgets from the Coupon Dispenser platform directly into your WordPress site. The plugin is pre-configured with your vendor ID and API key, so you can start using it immediately after installation.

== Important Notes ==

* **API Key Updates:** If you regenerate your API key in the dashboard, you can update it directly in WordPress. Go to Settings → Coupon Dispenser and paste your new API key. No need to download a new plugin!
* **One Plugin Per Vendor:** Each plugin is pre-configured with one vendor ID and API key. Use separate plugin installations for different vendors.

== Installation ==

1. Upload the plugin ZIP file through the WordPress 'Plugins' menu
2. Activate the plugin through the 'Plugins' menu in WordPress
3. The plugin is already configured with your vendor ID and API key
4. Use the shortcode [coupon_widget] to display coupons on any page or post

== Frequently Asked Questions ==

= How do I display coupons? =

Simply add the shortcode [coupon_widget] to any page or post where you want to display coupons.

= Can I customize the widget? =

Yes, you can change the container ID using the container_id attribute:
[coupon_widget container_id="my-custom-id"]

== Changelog ==

= 1.0.0 =
* Initial release
* Pre-configured with vendor ID and API key
* Automatic user detection
* WordPress REST API integration

== Upgrade Notice ==

= 1.0.0 =
Initial release.
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

