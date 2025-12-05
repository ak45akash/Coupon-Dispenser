# Integration Methods Comparison & Monthly Limit Logic

## Two Integration Methods Overview

### Method 1: Simple (API Key) - For Non-Technical Partners
**Partner does:**
- Get API key from dashboard
- Add HTML attributes: `data-api-key`, `data-user-email` (or `data-user-id`)
- Done!

**No backend code, no packages, no installation**

### Method 2: Advanced (JWT) - For Technical Partners
**Partner does:**
- Generate partner_secret
- Install JWT library (PyJWT, jsonwebtoken, etc.)
- Write backend code to sign JWT tokens
- Pass tokens to widget

**Full control, more secure, requires technical knowledge**

---

## Monthly Claim Limit Logic - Will It Work?

### ✅ YES - Both Methods Work Identically!

### Current Implementation (JWT Method):

**Flow:**
1. Partner generates JWT with `external_user_id` (their user ID)
2. Widget calls `/api/session-from-token` with JWT
3. System maps: `(vendor_id, external_user_id)` → `internal user_id`
4. System returns widget session token with `internal user_id`
5. Claims tracked by: `internal user_id` + `vendor_id` + `claim_month`
6. Monthly limit enforced: **UNIQUE constraint** on `(vendor_id, user_id, claim_month)`

**Key Point:** The monthly limit is enforced by the **internal user_id**, which is deterministically created from `(vendor_id, external_user_id)`.

### Simple Method (API Key):

**Flow:**
1. Partner provides: `api_key` + `user_email` (or `user_id`)
2. Widget calls `/api/widget-session` with API key + user identifier
3. System maps: `(vendor_id, external_user_id)` → `internal user_id`
   - If `user_email`: Create deterministic email → map to internal user
   - If `user_id`: Use same mapping logic as JWT method
4. System returns widget session token with `internal user_id`
5. Claims tracked by: `internal user_id` + `vendor_id` + `claim_month` (SAME!)
6. Monthly limit enforced: **SAME UNIQUE CONSTRAINT**

### The Mapping Logic (Critical):

Both methods use the **same user mapping function**:

```typescript
// lib/db/users.ts - upsertUserFromExternalId()
// Creates deterministic mapping:
email = `external_${vendorId}_${externalUserId}@coupon-dispenser.local`
// Always maps to same internal user_id for same (vendor, external_user_id)
```

**This ensures:**
- Same user (same `external_user_id` from same vendor) always gets same `internal user_id`
- Monthly limit works because claims are tracked by `internal user_id`
- Works across sessions, browsers, devices (because mapping is deterministic)

---

## Monthly Limit Enforcement - Technical Details

### Database Constraint:
```sql
UNIQUE (vendor_id, user_id, claim_month)
```

This means:
- One row per `(vendor_id, user_id, claim_month)` combination
- Database prevents duplicate claims automatically
- Works regardless of how user was authenticated (JWT or API key)

### Claim Process:
1. User tries to claim coupon
2. System gets `internal user_id` from widget session
3. System calculates `claim_month` (YYYYMM format)
4. System tries to INSERT into `claim_history`
5. If user already claimed this month → **UNIQUE constraint violation** → Error: `USER_ALREADY_CLAIMED`
6. If user hasn't claimed → Insert succeeds → Coupon claimed

### Why Both Methods Work:

**JWT Method:**
- `external_user_id` from JWT → mapped to `internal user_id` → tracked in claims

**API Key Method:**
- `user_email` or `user_id` from HTML → mapped to `internal user_id` → tracked in claims

**The mapping is the same!** So monthly limits work identically.

---

## User Identification Options (Simple Method)

### Option A: Email-Based
```html
<div id="coupon-widget" 
     data-vendor-id="XXX"
     data-api-key="XXX"
     data-user-email="user@example.com">
</div>
```

**How it works:**
- Partner provides user's email
- System creates/updates user with email
- Email becomes the identifier
- Monthly limit enforced per email per vendor

**Pros:**
- Simple - partners just need email
- Human-readable identifier
- Easy to understand

**Cons:**
- Email might change
- Privacy concerns (email exposure)
- Can't verify email ownership without verification step

### Option B: User ID-Based
```html
<div id="coupon-widget" 
     data-vendor-id="XXX"
     data-api-key="XXX"
     data-user-id="12345">
</div>
```

**How it works:**
- Partner provides their internal user ID
- System maps: `(vendor_id, user_id)` → internal user
- Same mapping as JWT method's `external_user_id`
- Monthly limit enforced per user_id per vendor

**Pros:**
- Consistent with JWT method
- More stable (user IDs don't change)
- Better for privacy (IDs not personally identifiable)

**Cons:**
- Partners need to provide user ID
- Need to ensure consistency (same user = same ID)

### Option C: Both (Recommended)
```html
<!-- Partner can use either -->
<div data-user-email="user@example.com">  <!-- OR -->
<div data-user-id="12345">                <!-- OR -->
<div data-user-email="user@example.com" data-user-id="12345"> <!-- Preferred -->
</div>
```

**Priority:** If both provided, use `user_id` (more stable). Fallback to email.

---

## WordPress Plugin Approach

### Option 1: WordPress Plugin from WordPress.org

**What it does:**
- Partners install from WordPress plugin directory
- Configure in WordPress admin (vendor_id, API key)
- Plugin automatically:
  - Detects logged-in user
  - Generates widget code
  - Handles user identification
  - Embeds widget on pages/posts

**Pros:**
- ✅ Zero code - install and configure
- ✅ Automatic user detection (WordPress user ID/email)
- ✅ Admin interface for configuration
- ✅ Can add shortcode: `[coupon_widget]`
- ✅ Auto-updates from WordPress.org
- ✅ Trusted by WordPress community

**Cons:**
- ❌ Need to submit to WordPress.org (review process)
- ❌ Must follow WordPress coding standards
- ❌ Plugin approval can take time
- ❌ Need to maintain plugin separately

**Implementation:**
- PHP plugin file
- WordPress admin settings page
- Shortcode handler
- Widget block (Gutenberg)
- Automatic user ID detection

### Option 2: WordPress Plugin as Download

**What it does:**
- Provide plugin ZIP file for download from your dashboard
- Partners upload via WordPress admin
- Configure in WordPress admin

**Pros:**
- ✅ Faster to implement (no review process)
- ✅ Can update quickly
- ✅ Full control over features
- ✅ Can include partner-specific config (vendor_id, API key pre-filled)

**Cons:**
- ❌ Partners need to download and upload
- ❌ Less discoverable (not in WordPress.org)
- ❌ Need to host plugin file

**Implementation:**
- Generate plugin ZIP on-demand in dashboard
- Include vendor_id and API key pre-configured
- Partners download, upload to WordPress

### Option 3: WordPress Plugin with Auto-Configuration

**What it does:**
- Partners install plugin from your dashboard
- Plugin automatically fetches configuration from your API
- No manual configuration needed

**Pros:**
- ✅ Easiest for partners
- ✅ Can update config remotely
- ✅ Pre-configured with their vendor_id

**Cons:**
- ❌ Need API endpoint for plugin config
- ❌ Plugin needs to authenticate with your system

---

## Monthly Limit Verification - Example Scenarios

### Scenario 1: User Claims with JWT Method

**Day 1:**
- User A (external_user_id: "123") claims coupon via JWT
- System maps: `(vendor_1, "123")` → `internal_user_abc`
- Claim inserted: `(vendor_1, internal_user_abc, "202412")`
- ✅ Success

**Day 5:**
- Same user (external_user_id: "123") tries to claim again
- System maps to same: `internal_user_abc`
- System tries to insert: `(vendor_1, internal_user_abc, "202412")`
- ❌ **UNIQUE constraint violation** → `USER_ALREADY_CLAIMED`

### Scenario 2: User Claims with API Key Method

**Day 1:**
- User A (user_id: "123" or email: "user@example.com") claims via API key
- System maps: `(vendor_1, "123")` → `internal_user_abc` (SAME mapping!)
- Claim inserted: `(vendor_1, internal_user_abc, "202412")`
- ✅ Success

**Day 5:**
- Same user tries to claim again with API key
- System maps to same: `internal_user_abc`
- System tries to insert: `(vendor_1, internal_user_abc, "202412")`
- ❌ **UNIQUE constraint violation** → `USER_ALREADY_CLAIMED`

### Scenario 3: User Switches Methods

**Day 1:**
- User A claims via JWT (external_user_id: "123")
- Mapped to: `internal_user_abc`
- Claim inserted

**Day 5:**
- Same user claims via API key (user_id: "123")
- Mapped to: **SAME** `internal_user_abc` (same mapping function!)
- System tries to insert
- ❌ **UNIQUE constraint violation** → `USER_ALREADY_CLAIMED`

**✅ Monthly limit works across methods!**

### Scenario 4: Different Browsers/Devices

**Day 1:**
- User A claims on Chrome (user_id: "123")
- Mapped to: `internal_user_abc`
- Claim inserted

**Day 5:**
- Same user tries on Safari (user_id: "123")
- Mapped to: **SAME** `internal_user_abc`
- System tries to insert
- ❌ **UNIQUE constraint violation**

**✅ Monthly limit works across browsers/devices!**

---

## WordPress Plugin - Detailed Analysis

### Plugin Architecture

**What the plugin would do:**

1. **Installation:**
   - Partner downloads plugin ZIP from your dashboard
   - Uploads via WordPress: Plugins → Add New → Upload Plugin
   - Activates plugin

2. **Configuration (One-Time Setup):**
   - Go to Settings → Coupon Widget
   - Enter Vendor ID (pre-filled from download)
   - Enter API Key (pre-filled from download)
   - Or: Plugin auto-fetches from your API using vendor ID

3. **Usage:**
   - **Option A:** Shortcode - Add `[coupon_widget]` to any page/post
   - **Option B:** Widget Block - Drag "Coupon Widget" block in Gutenberg
   - **Option C:** PHP Function - `<?php coupon_widget(); ?>` in theme

4. **Automatic Features:**
   - Detects logged-in WordPress user
   - Automatically gets user ID or email
   - Passes to widget automatically
   - No manual user identification needed

### Plugin Code Structure

```
coupon-dispenser-widget/
├── coupon-dispenser-widget.php  (Main plugin file)
├── includes/
│   ├── class-settings.php       (Admin settings page)
│   ├── class-shortcode.php      (Shortcode handler)
│   ├── class-widget-block.php   (Gutenberg block)
│   └── class-widget-render.php  (Widget rendering)
├── admin/
│   └── settings-page.php        (Settings UI)
└── assets/
    └── admin.css                (Admin styling)
```

### WordPress Plugin - Pros & Cons

**Pros:**
- ✅ **True zero-code** - install and use
- ✅ **Automatic user detection** - uses WordPress user system
- ✅ **WordPress-native** - shortcodes, blocks, widgets
- ✅ **Easy updates** - WordPress handles updates
- ✅ **Familiar interface** - partners know WordPress
- ✅ **No HTML knowledge needed** - just use shortcode

**Cons:**
- ❌ **WordPress-only** - doesn't help other platforms
- ❌ **Development effort** - need to build plugin
- ❌ **Maintenance** - keep plugin updated
- ❌ **Approval process** - if submitting to WordPress.org
- ❌ **WordPress version compatibility** - test on multiple versions

**Implementation Complexity:** High (but one-time investment)
**User Friendliness:** Very High (for WordPress users)
**Maintenance Burden:** Medium

---

## Complete Integration Strategy

### Three Tiers for Partners:

#### Tier 1: WordPress Users (Plugin)
- Install WordPress plugin
- Configure in WordPress admin
- Use shortcode: `[coupon_widget]`
- **Zero code, zero HTML knowledge**

#### Tier 2: Non-Technical Partners (API Key)
- Get API key from dashboard
- Copy HTML snippet
- Paste in their website
- **Zero backend code, minimal HTML**

#### Tier 3: Technical Partners (JWT)
- Generate partner_secret
- Write backend code
- Sign JWT tokens
- **Full control, maximum security**

---

## Monthly Limit - Final Answer

### ✅ YES - Monthly limits work perfectly with both methods!

**Why:**
1. Both methods use the **same user mapping function**
2. Both create the **same internal user_id** for same user
3. Claims are tracked by **internal user_id** (not authentication method)
4. Monthly limit constraint is **database-level** (works regardless of auth method)
5. **Deterministic mapping** ensures consistency across:
   - Different browsers
   - Different devices
   - Different sessions
   - Different authentication methods

**Example Proof:**

```
User: John (Partner's user_id: "123")

JWT Method:
  external_user_id: "123"
  → Maps to: internal_user_abc
  → Claim tracked: (vendor_1, internal_user_abc, "202412")

API Key Method:
  user_id: "123" (or email: "john@partner.com")
  → Maps to: internal_user_abc (SAME!)
  → Claim tracked: (vendor_1, internal_user_abc, "202412")

Same internal user = Same monthly limit!
```

---

## Recommendations

### 1. Implement Both Methods ✅

**Simple (API Key):**
- Default option for most partners
- HTML attributes only
- Works everywhere

**Advanced (JWT):**
- For technical partners
- More secure
- More control

### 2. WordPress Plugin ✅

**Best approach:**
- Download from your dashboard (fastest to implement)
- Pre-configured with vendor_id and API key
- Automatic user detection
- Shortcode support

**Future enhancement:**
- Submit to WordPress.org (for discoverability)
- But start with dashboard download

### 3. User Identification (API Key Method)

**Support both:**
- `data-user-id` - Preferred (stable, private)
- `data-user-email` - Fallback (simple, human-readable)

**Priority:** Use `user_id` if provided, fallback to email.

---

## Implementation Checklist

### Phase 1: API Key Method (Simple)
- [ ] Add API key generation to vendor dashboard
- [ ] Create `POST /api/widget-session` endpoint (API key auth)
- [ ] Update widget to accept `data-api-key` attribute
- [ ] Support `data-user-id` and `data-user-email`
- [ ] Update documentation

### Phase 2: WordPress Plugin
- [ ] Create plugin structure
- [ ] Build admin settings page
- [ ] Implement shortcode handler
- [ ] Auto-detect WordPress user
- [ ] Generate plugin ZIP in dashboard (pre-configured)
- [ ] Create installation guide

### Phase 3: Enhanced Security (Optional)
- [ ] Domain whitelisting for API keys
- [ ] Rate limiting per API key
- [ ] Usage monitoring dashboard
- [ ] Key rotation feature

---

## Summary

**Monthly Limit Logic:** ✅ Works identically with both methods because:
- Same user mapping function
- Same internal user_id creation
- Same database constraints
- Deterministic mapping ensures consistency

**WordPress Plugin:** ✅ Excellent idea because:
- True zero-code for WordPress users
- Automatic user detection
- Familiar WordPress interface
- Can start with dashboard download (no approval needed)

**Both Methods:** ✅ Perfect strategy because:
- Simple method for non-technical partners
- Advanced method for technical partners
- WordPress plugin for WordPress users
- Maximum flexibility and adoption

