# Simple Method - User Identification Options

## Current Approaches Comparison

### Method 1: HTML Attributes (What I Initially Suggested)

**Partner Integration:**
```html
<div id="coupon-widget" 
     data-vendor-id="XXX"
     data-api-key="XXX"
     data-user-email="user@example.com">  <!-- User details in HTML -->
</div>
```

**How it works:**
- User details (email/ID) exposed in HTML
- Widget reads attributes and calls your API
- Your API creates session based on user details

**Pros:**
- Simple HTML only
- No backend code needed

**Cons:**
- ❌ User details visible in HTML source
- ❌ Requires partner to know user on frontend
- ❌ Privacy concerns (email exposure)
- ❌ Less secure

---

### Method 2: Backend Token Generation (Like JWT, But Simpler!)

**Partner Integration:**

**Backend (One Simple API Call):**
```javascript
// Partner's backend (Node.js/Express example)
app.get('/api/coupon-widget-token', authenticateUser, async (req, res) => {
  const response = await fetch('https://your-domain.com/api/widget-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: 'PARTNER_API_KEY',
      vendor_id: 'VENDOR_ID',
      user_id: req.user.id  // Partner's user ID
    })
  });
  const data = await response.json();
  res.json({ token: data.session_token });
});
```

**Frontend (Just Pass Token to Widget):**
```html
<script src="https://your-domain.com/widget-embed.js"></script>
<div id="coupon-widget" data-vendor-id="XXX"></div>
<script>
  // Partner's frontend - just fetch token and pass to widget
  fetch('/api/coupon-widget-token')
    .then(res => res.json())
    .then(data => {
      window.sendCouponToken(data.token);  // Widget handles the rest
    });
</script>
```

**How it works:**
1. Partner's backend identifies user (same as JWT method)
2. Partner's backend makes ONE simple API call to your system
3. Your system returns widget session token
4. Partner's frontend passes token to widget
5. Widget uses token (already authenticated)

**Pros:**
- ✅ User details stay on backend (more secure)
- ✅ No user info in HTML source
- ✅ Similar to JWT flow (familiar pattern)
- ✅ No JWT signing needed (you handle token generation)
- ✅ One simple API call (no complex JWT logic)

**Cons:**
- ⚠️ Requires one backend endpoint (but very simple)
- ⚠️ Still need to make API call

---

### Method 3: Hybrid - Backend Token with Auto-Detection

**Partner Integration:**

**Backend (Same as Method 2):**
```javascript
// Same backend endpoint as Method 2
app.get('/api/coupon-widget-token', authenticateUser, async (req, res) => {
  // ... same as Method 2
});
```

**Frontend (Automatic - Widget Handles Everything):**
```html
<!-- Widget automatically fetches token from partner's backend -->
<script src="https://your-domain.com/widget-embed.js" 
        data-token-endpoint="/api/coupon-widget-token"></script>
<div id="coupon-widget" 
     data-vendor-id="XXX"
     data-api-key="XXX">
</div>
```

**How it works:**
1. Widget sees `data-token-endpoint` attribute
2. Widget automatically calls partner's endpoint
3. Partner's backend returns token
4. Widget uses token automatically
5. Partner just embeds widget - no JavaScript needed!

**Pros:**
- ✅ Fully automatic - widget handles everything
- ✅ No frontend JavaScript needed
- ✅ User details stay on backend
- ✅ Clean HTML integration

**Cons:**
- ⚠️ Widget needs to call partner's backend (CORS considerations)

---

## Comparison Table

| Feature | HTML Attributes | Backend Token (Manual) | Backend Token (Auto) |
|---------|----------------|------------------------|---------------------|
| **Backend Code** | ❌ None | ⚠️ One endpoint | ⚠️ One endpoint |
| **Frontend Code** | ❌ None | ⚠️ One fetch call | ❌ None (auto) |
| **User Privacy** | ❌ Exposed in HTML | ✅ On backend | ✅ On backend |
| **Security** | ⚠️ Medium | ✅ High | ✅ High |
| **Complexity** | ⭐ Very Low | ⭐⭐ Low | ⭐ Low |
| **Similar to JWT?** | ❌ No | ✅ Yes | ✅ Yes |

---

## Recommended: Backend Token Method (Hybrid - Auto)

### Why This Is Best:

1. **Similar to JWT Method** - Partners already understand this pattern
2. **More Secure** - User details stay on backend
3. **Still Simple** - Just one backend endpoint (simpler than JWT signing)
4. **Auto Widget** - Widget can fetch token automatically
5. **Privacy Friendly** - No user details in HTML

### How It Works:

#### Step 1: Partner Creates Simple Backend Endpoint

**Node.js/Express:**
```javascript
app.get('/api/coupon-widget-token', authenticateUser, async (req, res) => {
  const response = await fetch('https://your-domain.com/api/widget-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.COUPON_API_KEY,
      vendor_id: process.env.COUPON_VENDOR_ID,
      user_id: req.user.id.toString()  // Partner's user ID
    })
  });
  
  if (!response.ok) {
    return res.status(500).json({ error: 'Failed to get widget token' });
  }
  
  const data = await response.json();
  res.json({ token: data.session_token });
});
```

**Python/Flask:**
```python
@app.route('/api/coupon-widget-token', methods=['GET'])
@require_auth  # Your auth decorator
def get_coupon_widget_token():
    user_id = str(get_current_user().id)
    
    response = requests.post(
        'https://your-domain.com/api/widget-session',
        json={
            'api_key': os.getenv('COUPON_API_KEY'),
            'vendor_id': os.getenv('COUPON_VENDOR_ID'),
            'user_id': user_id
        }
    )
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to get widget token'}), 500
    
    data = response.json()
    return jsonify({'token': data['session_token']})
```

**WordPress (PHP):**
```php
add_action('wp_ajax_get_coupon_widget_token', 'get_coupon_widget_token_callback');
add_action('wp_ajax_nopriv_get_coupon_widget_token', 'get_coupon_widget_token_callback');

function get_coupon_widget_token_callback() {
    if (!is_user_logged_in()) {
        wp_send_json_error('Unauthorized', 401);
    }
    
    $user_id = get_current_user_id();
    $api_key = get_option('coupon_api_key');
    $vendor_id = get_option('coupon_vendor_id');
    
    $response = wp_remote_post('https://your-domain.com/api/widget-session', [
        'body' => json_encode([
            'api_key' => $api_key,
            'vendor_id' => $vendor_id,
            'user_id' => (string)$user_id
        ]),
        'headers' => ['Content-Type' => 'application/json']
    ]);
    
    if (is_wp_error($response)) {
        wp_send_json_error('Failed to get widget token', 500);
    }
    
    $data = json_decode(wp_remote_retrieve_body($response), true);
    wp_send_json_success(['token' => $data['session_token']]);
}
```

#### Step 2: Partner Embeds Widget (Auto Token Fetch)

**Option A: Widget Auto-Fetches (Zero Frontend Code)**
```html
<!-- Widget automatically calls partner's endpoint -->
<script src="https://your-domain.com/widget-embed.js" 
        data-token-endpoint="/api/coupon-widget-token"></script>
<div id="coupon-widget" data-vendor-id="XXX"></div>
```

**Option B: Manual Token Pass (One Line of Code)**
```html
<script src="https://your-domain.com/widget-embed.js"></script>
<div id="coupon-widget" data-vendor-id="XXX"></div>
<script>
  fetch('/api/coupon-widget-token')
    .then(r => r.json())
    .then(d => window.sendCouponToken(d.token));
</script>
```

---

## Comparison with JWT Method

### JWT Method (Complex):
```
Partner Backend:
1. Install JWT library (PyJWT, jsonwebtoken, etc.)
2. Write code to sign JWT with partner_secret
3. Include vendor_id, external_user_id, jti, iat, exp
4. Pass token to frontend

Partner Frontend:
1. Receive token from backend
2. Pass to widget via window.sendCouponToken(token)

Your System:
1. Verify JWT signature
2. Check jti replay protection (Redis)
3. Create widget session
```

### Simple API Key Method (Recommended):
```
Partner Backend:
1. Make one API call to your endpoint
2. Pass: api_key, vendor_id, user_id
3. Receive widget session token
4. Pass token to frontend

Partner Frontend:
1. Receive token from backend
2. Pass to widget via window.sendCouponToken(token)

Your System:
1. Validate API key
2. Create widget session (no JWT verification needed)
3. Return widget session token
```

**Key Difference:**
- **JWT:** Partner signs tokens (complex, needs library)
- **Simple:** You generate tokens (simple, no library needed)

**Similarity:**
- Both: User identification happens on backend
- Both: Token passed to widget via frontend
- Both: Widget uses token for authentication

---

## Your API Endpoint (New)

### `POST /api/widget-session`

**Request:**
```json
{
  "api_key": "partner-api-key",
  "vendor_id": "vendor-uuid",
  "user_id": "partner-user-id"  // OR "user_email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_token": "widget-session-jwt",
    "user_id": "internal-user-uuid",
    "vendor_id": "vendor-uuid"
  }
}
```

**What It Does:**
1. Validates API key against vendor
2. Maps partner's user_id to internal user_id (same mapping as JWT method)
3. Creates widget session token
4. Returns token to partner

**No JWT Verification Needed:**
- Partner doesn't sign tokens
- You generate widget session token directly
- Simpler than JWT method

---

## User Identification Flow

### Current JWT Method:
```
Partner Backend → Generates JWT with external_user_id
                → Passes to Frontend
                → Frontend sends to Widget
                → Widget calls /api/session-from-token
                → Your system verifies JWT, maps user, creates session
```

### Proposed Simple Method:
```
Partner Backend → Calls /api/widget-session with user_id
                → Your system validates API key, maps user, creates session
                → Returns widget session token
                → Passes token to Frontend
                → Frontend sends to Widget
                → Widget uses token directly (already authenticated)
```

**Key Point:** Both methods:
- Identify user on backend ✅
- Map to internal user_id ✅
- Create widget session ✅
- Pass token to widget ✅

**Difference:** Simple method doesn't require JWT signing!

---

## Monthly Limit Logic - Still Works!

### Why Monthly Limits Work:

**JWT Method:**
- Partner provides `external_user_id` in JWT
- System maps: `(vendor_id, external_user_id)` → `internal user_id`
- Claims tracked by: `internal user_id`

**Simple Method:**
- Partner provides `user_id` (their internal user ID)
- System maps: `(vendor_id, user_id)` → `internal user_id` (SAME mapping!)
- Claims tracked by: `internal user_id` (SAME!)

**Same mapping function = Same monthly limits!**

---

## Recommendation

### ✅ Use Backend Token Method (Not HTML Attributes)

**Why:**
1. **Similar to JWT** - Partners understand backend authentication
2. **More Secure** - User details stay on backend
3. **Still Simple** - Just one API call (no JWT signing needed)
4. **Privacy Friendly** - No user info in HTML source
5. **Consistent** - Same pattern as JWT, just simpler

**Partner Experience:**

**Simple Backend Endpoint (One-time setup):**
```javascript
// Very simple - just one API call
app.get('/api/coupon-widget-token', auth, async (req, res) => {
  const token = await getWidgetToken(req.user.id);
  res.json({ token });
});
```

**Simple Frontend (One line or auto):**
```html
<!-- Option 1: Auto (widget fetches token) -->
<script src="widget.js" data-token-endpoint="/api/coupon-widget-token"></script>

<!-- Option 2: Manual (one fetch call) -->
<script>
  fetch('/api/coupon-widget-token').then(r => r.json()).then(d => 
    window.sendCouponToken(d.token)
  );
</script>
```

**Much simpler than JWT, but same security benefits!**

---

## Final Answer

### Question: Does partner need to supply user details in HTML?

**Answer: NO!** We can use the same approach as JWT method:

1. **Partner's backend identifies user** (same as JWT)
2. **Partner's backend makes one simple API call** (instead of signing JWT)
3. **Your system returns widget session token**
4. **Partner's frontend passes token to widget** (same as JWT)

**Difference from JWT:**
- ❌ No JWT library needed
- ❌ No JWT signing needed
- ❌ No jti replay protection needed (handled by your API)
- ✅ Just one simple API call

**Similarity to JWT:**
- ✅ User identification on backend
- ✅ Token passed to widget
- ✅ Same security model
- ✅ Same monthly limit logic

**This is the "Simple Method" - simpler than JWT, but same benefits!**

