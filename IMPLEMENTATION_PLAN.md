# Three Integration Methods - Implementation Plan

## Overview
Implementing three integration methods for partners:
1. **WordPress Plugin** - Zero code installation
2. **API Key Method** - Simple backend token generation (non-technical partners)
3. **JWT Method** - Advanced token signing (technical partners)

---

## Phase 1: API Key Method ✅ (In Progress)

### Database Changes
- [x] Create migration: `add_api_key.sql` - Add `api_key` column to vendors table
- [x] Add index on `api_key` for faster lookups

### API Endpoints
- [x] Create `POST /api/widget-session` - Accepts API key + user_id, returns widget session token
- [x] Create `GET /api/vendors/[id]/api-key` - Get masked API key status
- [x] Create `POST /api/vendors/[id]/api-key` - Generate/regenerate API key

### Frontend Changes
- [ ] Update vendor dashboard to show API key management (similar to partner_secret)
- [ ] Add code examples for API key method (Node.js, Python, WordPress)
- [ ] Update widget to support API key auto-fetch from backend endpoint

---

## Phase 2: WordPress Plugin

### Plugin Structure
- [ ] Create plugin directory structure:
  ```
  wordpress-plugin/
  ├── coupon-dispenser-widget.php (Main plugin file)
  ├── includes/
  │   ├── class-settings.php (Admin settings)
  │   ├── class-shortcode.php (Shortcode handler)
  │   └── class-widget-render.php (Widget rendering)
  ├── admin/
  │   └── settings-page.php (Settings UI)
  └── assets/
      └── admin.css
  ```

### Plugin Features
- [ ] Admin settings page (vendor_id, api_key configuration)
- [ ] Automatic WordPress user detection
- [ ] Shortcode: `[coupon_widget]`
- [ ] Gutenberg block (optional)
- [ ] Backend endpoint to generate widget session token
- [ ] Auto-embed widget script

### Plugin Generation
- [ ] Create API endpoint: `POST /api/vendors/[id]/wordpress-plugin`
- [ ] Generate plugin ZIP file with vendor_id and API key pre-configured
- [ ] Download link in vendor dashboard

---

## Phase 3: Vendor Dashboard UI Updates

### Integration Methods Tabs
- [ ] Create tabs component showing:
  - Tab 1: WordPress Plugin (Download & Install)
  - Tab 2: API Key Method (Simple - Backend Token)
  - Tab 3: JWT Method (Advanced - Token Signing)

### WordPress Plugin Tab
- [ ] Show plugin download button
- [ ] Installation instructions
- [ ] Shortcode examples

### API Key Method Tab
- [ ] API key generation/management (similar to partner_secret)
- [ ] Code examples for Node.js, Python, WordPress
- [ ] Backend endpoint examples
- [ ] Frontend widget integration examples

### JWT Method Tab
- [ ] Partner secret generation/management (already exists)
- [ ] Code examples for Node.js, Python, WordPress (already exists)
- [ ] JWT signing examples

---

## Phase 4: Widget Updates

### Widget Enhancement
- [ ] Support `data-token-endpoint` attribute for auto token fetch
- [ ] Support `data-api-key` attribute (for direct API key method)
- [ ] Auto-fetch token from partner's backend endpoint
- [ ] Fallback to manual token passing

---

## Phase 5: Documentation

### User Guides
- [ ] WordPress Plugin Installation Guide
- [ ] API Key Method Integration Guide
- [ ] JWT Method Integration Guide (already exists)
- [ ] Comparison table showing which method to use

---

## Implementation Order

1. ✅ **API Key Infrastructure** (Database, API endpoints)
2. **Vendor Dashboard UI** (API key management, code examples)
3. **WordPress Plugin** (Create plugin, ZIP generation)
4. **Widget Updates** (Support new methods)
5. **Documentation** (User guides)

---

## Current Status

### Completed ✅
- Database migration for API key
- API endpoint `/api/widget-session`
- API endpoint `/api/vendors/[id]/api-key` (GET/POST)

### In Progress 🔄
- Vendor dashboard UI updates

### Pending ⏳
- WordPress plugin development
- Widget enhancements
- Documentation

