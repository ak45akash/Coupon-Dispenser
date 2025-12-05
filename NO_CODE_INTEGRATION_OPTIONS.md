# Zero-Code Integration Options

## Current Challenge
Partners need to:
- Install packages (PyJWT, jsonwebtoken, etc.)
- Write backend code to generate JWT tokens
- Configure authentication
- Understand technical concepts

**Question:** Can we eliminate ALL of these requirements?

---

## Alternative Solutions (No Backend Code Required)

### Option 1: API Key + Email Authentication ✅ RECOMMENDED

**How it works:**
- Partners get an **API Key** from dashboard (instead of partner_secret)
- Widget accepts `api_key` and `user_email` (or `user_id`) as parameters
- Your backend validates API key and creates session automatically
- No partner backend code needed - widget handles everything

**Partner Integration:**
```html
<!-- That's it! No backend code needed -->
<script src="https://your-domain.com/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="VENDOR_ID"
     data-api-key="API_KEY_FROM_DASHBOARD"
     data-user-email="user@example.com">
</div>
```

**Pros:**
- ✅ **Zero backend code** - partners just embed widget
- ✅ **No packages to install** - everything in widget script
- ✅ **No authentication setup** - API key is just a string
- ✅ **Simple for non-technical partners** - copy-paste HTML
- ✅ **Can identify users by email** - no need for user IDs
- ✅ **Works with any platform** - HTML, WordPress, Shopify, etc.
- ✅ **Easy to revoke** - just invalidate API key in dashboard

**Cons:**
- ❌ **Less secure** - API key exposed in HTML (though acceptable for this use case)
- ❌ **Email must be accurate** - relies on partner providing correct email
- ❌ **Rate limiting needed** - API keys can be abused
- ❌ **No user verification** - can't verify user actually owns email

**Implementation Complexity:** Medium
**User Friendliness:** Very High
**Security Level:** Medium (acceptable for coupon claims)

---

### Option 2: OAuth-Style Redirect Flow

**How it works:**
1. User clicks "Claim Coupon" on partner site
2. Partner redirects to your site: `https://your-domain.com/auth?vendor_id=xxx&redirect_uri=partner-site.com`
3. User authenticates (optional) or just claims on your site
4. After claim, redirect back to partner site with coupon code

**Partner Integration:**
```html
<!-- Just a link/button - no widget needed -->
<a href="https://your-domain.com/claim?vendor_id=XXX&redirect_uri=partner-site.com">
  Claim Your Coupon
</a>
```

**Pros:**
- ✅ **Zero code required** - just a link
- ✅ **Full control over user experience** - happens on your site
- ✅ **Can implement proper authentication** - users log in on your site
- ✅ **Secure** - no keys exposed
- ✅ **Works on any platform** - even static HTML sites

**Cons:**
- ❌ **User leaves partner site** - poor UX, breaks flow
- ❌ **Not embedded widget** - defeats purpose of widget
- ❌ **Requires redirect handling** - partners need to handle return URL
- ❌ **Less seamless** - user experience is broken

**Implementation Complexity:** Medium
**User Friendliness:** Low (poor UX)
**Security Level:** High

---

### Option 3: Hosted Serverless Proxy Function

**How it works:**
- You host a serverless function (Vercel/Netlify Function)
- Partners just configure API key in your dashboard
- Function URL: `https://proxy.your-domain.com/token?api_key=XXX&user_id=123`
- Partner calls your function, gets token, passes to widget

**Partner Integration:**
```javascript
// Simple fetch call - no packages needed
fetch(`https://proxy.your-domain.com/token?api_key=${API_KEY}&user_id=${USER_ID}`)
  .then(res => res.json())
  .then(data => {
    window.sendCouponToken(data.token)
  })
```

**Pros:**
- ✅ **No packages to install** - just browser fetch API
- ✅ **Minimal code** - one fetch call
- ✅ **You control security** - token generation on your side
- ✅ **Easy to update** - update function, all partners benefit

**Cons:**
- ❌ **Still requires JavaScript** - not pure HTML
- ❌ **CORS configuration needed** - must allow partner domains
- ❌ **Rate limiting complexity** - per-partner limits
- ❌ **Still need to identify user** - partner must provide user_id/email

**Implementation Complexity:** Medium-High
**User Friendliness:** High
**Security Level:** Medium-High

---

### Option 4: Magic Link / One-Time Tokens

**How it works:**
- Partner requests a token from your API (using API key)
- You generate time-limited token
- Partner embeds token in widget
- Widget uses token directly (no conversion needed)

**Partner Flow:**
1. Partner makes one API call: `GET /api/token?api_key=XXX&user_id=123`
2. Gets back: `{ token: "one-time-token-xyz", expires_in: 180 }`
3. Embeds token in widget HTML
4. Widget uses token directly

**Pros:**
- ✅ **One API call** - partner makes request when page loads
- ✅ **No JWT signing** - you generate token on your side
- ✅ **Time-limited** - tokens expire automatically
- ✅ **Simple for partners** - just fetch and embed

**Cons:**
- ❌ **Still requires API call** - partner needs to make request
- ❌ **Token exposure** - tokens visible in HTML
- ❌ **More API calls** - one per page load
- ❌ **Rate limiting needed** - prevent abuse

**Implementation Complexity:** Medium
**User Friendliness:** Medium-High
**Security Level:** Medium

---

### Option 5: Platform-Specific Plugins/Apps

**How it works:**
- WordPress Plugin: Partners install plugin, configure in WordPress admin
- Shopify App: Partners install from Shopify App Store
- Wix App: Partners install from Wix App Market
- No code needed - everything in plugin/app

**Pros:**
- ✅ **Zero code** - install and configure
- ✅ **Native integration** - works with platform features
- ✅ **User-friendly** - familiar plugin/app experience
- ✅ **Auto-updates** - you update plugin, partners benefit

**Cons:**
- ❌ **Platform-specific** - need separate plugin for each platform
- ❌ **Development cost** - must build and maintain each plugin
- ❌ **Approval process** - app stores have review processes
- ❌ **Only helps those platforms** - doesn't help custom sites

**Implementation Complexity:** Very High (per platform)
**User Friendliness:** Very High (for those platforms)
**Security Level:** High

---

### Option 6: Email-Only Authentication (Simplest)

**How it works:**
- Widget accepts `vendor_id` and `user_email`
- Your backend validates email format
- Creates anonymous/guest user if email not in system
- No authentication needed - email is identifier

**Partner Integration:**
```html
<script src="https://your-domain.com/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="VENDOR_ID"
     data-user-email="user@example.com">
</div>
```

**Pros:**
- ✅ **Simplest possible** - just HTML attributes
- ✅ **No backend code** - widget handles everything
- ✅ **No packages** - pure HTML/JavaScript
- ✅ **Works everywhere** - any platform that supports HTML

**Cons:**
- ❌ **Email verification needed** - can't trust email without verification
- ❌ **Security concerns** - anyone can use any email
- ❌ **No user authentication** - can't verify user identity
- ❌ **Abuse potential** - users can claim multiple times with different emails

**Implementation Complexity:** Low
**User Friendliness:** Very High
**Security Level:** Low (not suitable for production)

---

### Option 7: API Key + User ID (Recommended Alternative)

**How it works:**
- Similar to Option 1, but uses `user_id` instead of email
- Partner gets API key from dashboard
- Partner provides their internal user_id
- Your system maps `(vendor_id, external_user_id)` to internal user
- No JWT signing needed - API key is enough

**Partner Integration:**
```html
<script src="https://your-domain.com/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="VENDOR_ID"
     data-api-key="API_KEY"
     data-user-id="PARTNER_USER_ID">
</div>
```

**Pros:**
- ✅ **Zero backend code** - just HTML attributes
- ✅ **No packages** - widget handles authentication
- ✅ **Simple** - partners just need user ID from their system
- ✅ **Secure enough** - API key + user_id mapping
- ✅ **Works everywhere** - pure HTML

**Cons:**
- ❌ **API key in HTML** - exposed in source code (but acceptable)
- ❌ **Rate limiting needed** - prevent API key abuse
- ❌ **User ID must be consistent** - partner must use same ID

**Implementation Complexity:** Medium
**User Friendliness:** Very High
**Security Level:** Medium (acceptable)

---

### Option 8: Hybrid - Email Verification Flow

**How it works:**
1. Partner embeds widget with `user_email`
2. User sees coupon widget
3. User clicks "Claim" - widget prompts for email confirmation
4. User enters/confirms email
5. Your backend sends verification email
6. User clicks link in email → coupon claimed

**Pros:**
- ✅ **Email verification** - ensures user owns email
- ✅ **No backend code** - widget handles flow
- ✅ **More secure** - verified email ownership
- ✅ **Better UX than redirect** - happens in widget/modal

**Cons:**
- ❌ **Email verification step** - adds friction
- ❌ **Not instant** - user must check email
- ❌ **Requires email service** - SendGrid, Resend, etc.
- ❌ **More complex widget** - needs email verification UI

**Implementation Complexity:** High
**User Friendliness:** Medium (email verification adds step)
**Security Level:** High

---

## Comparison Matrix

| Option | Backend Code Required | Packages to Install | Technical Knowledge | Best For |
|--------|---------------------|-------------------|-------------------|----------|
| **API Key + Email** | ❌ None | ❌ None | ⭐ Very Low | Most partners |
| **API Key + User ID** | ❌ None | ❌ None | ⭐ Very Low | Partners with user IDs |
| **OAuth Redirect** | ❌ None | ❌ None | ⭐ Very Low | Static sites |
| **Magic Link Token** | ⚠️ One API call | ❌ None | ⭐⭐ Low | Partners comfortable with JS |
| **Serverless Proxy** | ⚠️ One fetch call | ❌ None | ⭐⭐ Low | Technical partners |
| **Platform Plugins** | ❌ None | ❌ None | ⭐ Very Low | WordPress/Shopify users |
| **Email Only** | ❌ None | ❌ None | ⭐ Very Low | Low-security scenarios |
| **Email Verification** | ❌ None | ❌ None | ⭐⭐ Low | High-security scenarios |

---

## My Recommendation: **API Key + User Identifier**

### Why This Is Best:

1. **Zero Backend Code** - Partners just add HTML attributes
2. **No Packages** - Everything in widget script
3. **Works Everywhere** - HTML, WordPress, Shopify, any platform
4. **Simple Configuration** - Just API key from dashboard
5. **Flexible User ID** - Can use email OR user_id (partner's choice)

### How It Works:

**Step 1: Partner gets API Key from Dashboard**
- Already have partner_secret generation
- Also generate API key (or use partner_secret as API key)
- Display in vendor dashboard

**Step 2: Partner Embeds Widget**
```html
<script src="https://your-domain.com/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="YOUR_VENDOR_ID"
     data-api-key="YOUR_API_KEY"
     data-user-email="user@example.com">
</div>
```

**Step 3: Widget Handles Everything**
- Widget calls your API with API key + user identifier
- Your backend validates API key
- Creates/updates user mapping
- Returns widget session token
- Widget continues with claim flow

**Step 4: No Partner Backend Needed**
- All authentication happens in widget/your backend
- Partners never touch JWT tokens
- Partners never install packages
- Partners never write backend code

---

## Implementation Details

### Option A: Use Partner Secret as API Key (Simplest)

**Change:**
- Instead of partners signing JWT with partner_secret
- Partners just pass partner_secret as API key
- Your backend validates and creates session

**Pros:**
- ✅ Minimal code changes
- ✅ Reuse existing partner_secret infrastructure
- ✅ Same security level

**Cons:**
- ❌ Partner secret exposed in HTML (same as current JWT approach)
- ❌ Need to rename "partner_secret" to "api_key" for clarity

### Option B: Separate API Key (More Secure)

**Change:**
- Generate separate API key (different from partner_secret)
- Partners use API key for widget
- Keep partner_secret for advanced use cases (if needed later)

**Pros:**
- ✅ Can revoke API key independently
- ✅ Clearer naming ("API Key" vs "Partner Secret")
- ✅ Can have different scopes/permissions

**Cons:**
- ❌ Need to add new field to vendors table
- ❌ More complex to manage

---

## Security Considerations

### API Key in HTML (Is This Safe?)

**Concerns:**
- API key visible in page source
- Anyone can view HTML and see API key
- Could be abused

**Mitigations:**
1. **Rate Limiting** - Limit requests per API key
2. **Domain Whitelisting** - Only allow requests from registered domains
3. **IP Restrictions** - Limit to partner's IP range (if static)
4. **Usage Monitoring** - Alert on unusual activity
5. **Key Rotation** - Allow partners to regenerate keys

**Is it acceptable?**
- ✅ **YES** for coupon claims (not financial transactions)
- ✅ Similar to Google Analytics, Stripe public keys, etc.
- ✅ Rate limiting prevents abuse
- ✅ Domain whitelisting adds security layer

---

## Recommended Implementation Plan

### Phase 1: API Key Authentication (Quick Win)

1. **Add API Key to Vendors**
   - Generate API key alongside partner_secret
   - Display in dashboard (like partner_secret)

2. **Update Widget to Accept API Key**
   - Add `data-api-key` attribute
   - Add `data-user-email` or `data-user-id` attribute
   - Widget calls new endpoint with API key

3. **Create New Endpoint**
   - `POST /api/widget-session` (or extend existing)
   - Accepts: `api_key`, `vendor_id`, `user_email` or `user_id`
   - Validates API key
   - Creates widget session
   - Returns session token

4. **Update Documentation**
   - Show API key method as "Simple Integration"
   - Keep JWT method as "Advanced Integration"

### Phase 2: Enhanced Security (Optional)

1. **Domain Whitelisting**
   - Partners register allowed domains in dashboard
   - Backend checks `Origin` header against whitelist

2. **Rate Limiting**
   - Per-API-key rate limits
   - Alert on abuse

3. **Usage Dashboard**
   - Show API key usage in vendor dashboard
   - Allow key rotation

---

## Code Changes Required (Minimal)

### 1. Add API Key Field (if separate from partner_secret)
```sql
ALTER TABLE vendors ADD COLUMN api_key TEXT;
```

### 2. Generate API Key in Dashboard
- Already have partner_secret generation
- Generate API key similarly (or use partner_secret)

### 3. New API Endpoint (Simple)
```typescript
POST /api/widget-session
Body: { api_key, vendor_id, user_email? or user_id? }
- Validate API key
- Create/update user mapping
- Return widget session token
```

### 4. Update Widget JavaScript
- Accept `data-api-key` attribute
- Call new endpoint instead of requiring partner token
- Fallback to partner token method (for advanced users)

---

## Pros & Cons Summary

### ✅ Pros of API Key Approach:
- **Zero installation** - no packages, no code
- **Universal compatibility** - works on any platform
- **Simple for partners** - just HTML attributes
- **Easy to understand** - "API Key" is familiar concept
- **Can add security layers** - domain whitelisting, rate limiting
- **Quick to implement** - minimal code changes

### ❌ Cons of API Key Approach:
- **Less secure than JWT** - but acceptable for coupon claims
- **API key exposure** - visible in HTML (mitigated by rate limiting)
- **Rate limiting needed** - adds complexity
- **Domain validation needed** - for better security

---

## Final Recommendation

**Implement API Key Authentication** as the default simple method, with JWT method available for advanced users who want more control.

**Two Integration Tiers:**
1. **Simple (API Key)** - For non-technical partners
   - Just HTML attributes
   - Zero code
   - Works everywhere

2. **Advanced (JWT)** - For technical partners
   - More secure
   - More control
   - For partners with existing auth systems

This gives you the best of both worlds - simplicity for most partners, flexibility for technical ones.

