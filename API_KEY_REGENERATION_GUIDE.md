# API Key Regeneration - WordPress Plugin Update Guide

## Overview

When a partner/admin regenerates their API key, the WordPress plugin needs to be updated because the plugin ZIP file contains a pre-configured API key baked into the code.

## How It Works

### Initial Plugin Download
1. Partner generates an API key in the dashboard
2. Partner downloads the WordPress plugin ZIP file
3. The ZIP contains:
   - Pre-configured `vendor_id`
   - Pre-configured `api_key` 
   - Pre-configured `api_base_url`

### API Key Regeneration Scenario

**When:** Partner/admin clicks "Regenerate API Key" in the dashboard

**What Happens:**
1. A new API key is generated
2. The old API key is invalidated
3. The existing WordPress plugin continues to work with the **old** API key until it's replaced

**Required Action:**
1. Partner must download a **new plugin ZIP file** from the dashboard
2. Partner replaces the old plugin in WordPress:
   - Deactivate old plugin
   - Delete old plugin
   - Upload new plugin ZIP
   - Activate new plugin

## Dashboard Updates

### WordPress Plugin Tab
- **Download Button:** Shows "Download Plugin" when API key exists
- **Warning Notice:** Appears when API key exists, reminding users that regeneration requires a new plugin download

### Widget Embed Code Section
- **Copy Button:** One-click copy for `[coupon_widget]` shortcode
- **Visual Feedback:** Shows "Copied!" checkmark after successful copy
- **No Vendor ID Needed:** Shortcode doesn't require vendor_id as it's pre-configured in the plugin

## User Experience Flow

### First Time Setup:
1. Generate API key → Download plugin → Install in WordPress → Use shortcode

### After API Key Regeneration:
1. Regenerate API key → Download new plugin → Replace old plugin in WordPress → Continue using same shortcode

## Technical Details

### Plugin Configuration Storage
The API key is stored in:
- WordPress options table (`cdw_api_key`)
- Plugin constants (default values)
- Both can be updated via plugin settings page if needed

### API Key Format
- Format: `cdk_` prefix followed by random string
- Example: `cdk_abc123def456ghi789...`

### Security
- API keys are never exposed in frontend code
- Only shown once after generation
- Masked when displayed in dashboard
- Stored securely in database

## Important Notes

⚠️ **Critical:** If API key is regenerated:
- Old API key becomes invalid
- Existing plugin installations will fail to authenticate
- **Must** download and install new plugin ZIP

✅ **Best Practice:** 
- Keep API keys secure
- Only regenerate when necessary (security breach, key compromise, etc.)
- Notify partners when regenerating their API keys
- Document the regeneration process for partners

## Partner Documentation

Partners should be informed:
1. API key regeneration requires plugin replacement
2. The shortcode `[coupon_widget]` remains the same
3. No content changes needed - just replace the plugin
4. The process takes ~2 minutes

---

**Last Updated:** Current  
**Author:** Akash  
**Website:** https://iakash.dev

