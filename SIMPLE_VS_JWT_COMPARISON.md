# Simple Method vs JWT Method - User Identification

## Quick Answer

**Question:** Does partner need to supply user details (id, email) in HTML for simple method?

**Answer: NO!** We can use the **same approach as JWT method** - user identification on backend.

---

## How It Works

### Current JWT Method (Complex):
```
1. Partner's Backend: Identifies user (gets user ID)
2. Partner's Backend: Signs JWT with external_user_id
3. Partner's Backend: Passes JWT token to frontend
4. Partner's Frontend: Passes token to widget
5. Widget: Exchanges JWT for widget session token
```

### Simple Method (Recommended):
```
1. Partner's Backend: Identifies user (gets user ID) ← SAME
2. Partner's Backend: Makes ONE API call to your system
3. Partner's Backend: Receives widget session token
4. Partner's Frontend: Passes token to widget ← SAME
5. Widget: Uses token directly (already authenticated) ← SIMPLER
```

**Key Difference:**
- JWT: Partner signs tokens (needs JWT library)
- Simple: You generate tokens (no library needed)

**Same Pattern:**
- User identification on backend ✅
- Token passed to widget ✅
- Widget uses token ✅

---

## Side-by-Side Comparison

### JWT Method Flow:

**Backend:**
```javascript
// Partner installs: npm install jsonwebtoken

const jwt = require('jsonwebtoken');
const partnerSecret = 'secret-from-dashboard';
const vendorId = 'vendor-uuid';
const externalUserId = req.user.id;
const jti = `jti-${Date.now()}-${Math.random()}`;

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
```

**Frontend:**
```javascript
fetch('/api/coupon-token')
  .then(r => r.json())
  .then(d => window.sendCouponToken(d.token));
```

**Complexity:** ⭐⭐⭐ (Install package, sign JWT, handle jti, exp, iat)

---

### Simple Method Flow:

**Backend:**
```javascript
// NO PACKAGES NEEDED - just native fetch

const response = await fetch('https://your-domain.com/api/widget-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: 'api-key-from-dashboard',
    vendor_id: 'vendor-uuid',
    user_id: req.user.id.toString()  // Partner's user ID
  })
});

const data = await response.json();
res.json({ token: data.session_token });
```

**Frontend:**
```javascript
fetch('/api/coupon-token')
  .then(r => r.json())
  .then(d => window.sendCouponToken(d.token));
```

**Complexity:** ⭐ (Just one API call - no packages!)

---

## What Partners Need

### JWT Method:
- ✅ Install JWT library (PyJWT, jsonwebtoken, etc.)
- ✅ Get partner_secret from dashboard
- ✅ Write code to sign JWT
- ✅ Handle token expiration (3 min)
- ✅ Generate unique jti for replay protection
- ✅ Pass token to frontend

### Simple Method:
- ✅ Get API key from dashboard
- ✅ Make one API call (native fetch, no packages)
- ✅ Pass token to frontend

**Much Simpler!**

---

## User Identification - Both Methods Same

### Both Methods:
- User identified on **backend** (not frontend)
- Partner knows user ID from their auth system
- Token passed to frontend (user details never in HTML)
- Widget receives token and uses it

**NO user details in HTML for either method!**

---

## Your New API Endpoint

### `POST /api/widget-session`

**Request:**
```json
{
  "api_key": "partner-api-key",
  "vendor_id": "vendor-uuid",
  "user_id": "123"  // Partner's user ID
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

**What Happens:**
1. Validate API key
2. Map partner's user_id to internal user_id (same mapping as JWT)
3. Create widget session token
4. Return token

**No JWT verification needed - you generate token directly!**

---

## Code Examples

### WordPress (PHP)

**JWT Method:**
```php
// Need: composer require firebase/php-jwt

use Firebase\JWT\JWT;

function get_coupon_token() {
    $partner_secret = get_option('partner_secret');
    $vendor_id = get_option('vendor_id');
    $user_id = get_current_user_id();
    $jti = 'jti-' . time() . '-' . wp_generate_password(12, false);
    
    $payload = [
        'vendor' => $vendor_id,
        'external_user_id' => (string)$user_id,
        'jti' => $jti,
        'iat' => time(),
        'exp' => time() + 180,
    ];
    
    return JWT::encode($payload, $partner_secret, 'HS256');
}
```

**Simple Method:**
```php
// NO PACKAGES NEEDED - just WordPress functions

function get_coupon_token() {
    $api_key = get_option('api_key');
    $vendor_id = get_option('vendor_id');
    $user_id = get_current_user_id();
    
    $response = wp_remote_post('https://your-domain.com/api/widget-session', [
        'body' => json_encode([
            'api_key' => $api_key,
            'vendor_id' => $vendor_id,
            'user_id' => (string)$user_id
        ]),
        'headers' => ['Content-Type' => 'application/json']
    ]);
    
    $data = json_decode(wp_remote_retrieve_body($response), true);
    return $data['data']['session_token'];
}
```

**Much simpler - no JWT library needed!**

---

### Node.js/Express

**JWT Method:**
```javascript
// Need: npm install jsonwebtoken

const jwt = require('jsonwebtoken');

app.get('/api/coupon-token', auth, (req, res) => {
  const token = jwt.sign(
    {
      vendor: vendorId,
      external_user_id: req.user.id,
      jti: `jti-${Date.now()}-${Math.random()}`,
    },
    partnerSecret,
    { algorithm: 'HS256', expiresIn: '3m' }
  );
  res.json({ token });
});
```

**Simple Method:**
```javascript
// NO PACKAGES NEEDED - just native fetch

app.get('/api/coupon-token', auth, async (req, res) => {
  const response = await fetch('https://your-domain.com/api/widget-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.API_KEY,
      vendor_id: process.env.VENDOR_ID,
      user_id: req.user.id.toString()
    })
  });
  
  const data = await response.json();
  res.json({ token: data.data.session_token });
});
```

**Much simpler - no JWT library needed!**

---

### Python/Flask

**JWT Method:**
```python
# Need: pip install PyJWT

import jwt

@app.route('/api/coupon-token')
@require_auth
def get_coupon_token():
    payload = {
        'vendor': VENDOR_ID,
        'external_user_id': str(get_current_user().id),
        'jti': f'jti-{int(time.time())}-{secrets.token_urlsafe(12)}',
        'iat': int(time.time()),
        'exp': int(time.time()) + 180,
    }
    return jwt.encode(payload, PARTNER_SECRET, algorithm='HS256')
```

**Simple Method:**
```python
# NO PACKAGES NEEDED - just requests (usually already installed)

import requests

@app.route('/api/coupon-token')
@require_auth
def get_coupon_token():
    response = requests.post(
        'https://your-domain.com/api/widget-session',
        json={
            'api_key': API_KEY,
            'vendor_id': VENDOR_ID,
            'user_id': str(get_current_user().id)
        }
    )
    data = response.json()
    return data['data']['session_token']
```

**Much simpler - no JWT library needed!**

---

## Monthly Limit Logic

### Both Methods Use Same Mapping:

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

## Summary

### What's Different?

| Aspect | JWT Method | Simple Method |
|--------|-----------|---------------|
| **Package Installation** | ❌ Yes (JWT library) | ✅ No packages needed |
| **Code Complexity** | ⭐⭐⭐ Complex | ⭐ Very Simple |
| **User Identification** | ✅ Backend | ✅ Backend (same!) |
| **Token Generation** | Partner signs JWT | Your system generates |
| **Frontend Code** | Same | Same |

### What's The Same?

- ✅ User identified on backend (not frontend)
- ✅ No user details in HTML
- ✅ Token passed to widget
- ✅ Same monthly limit logic
- ✅ Same security model

### Why Simple Method Is Better?

- ✅ No JWT library to install
- ✅ No JWT signing code
- ✅ Just one API call
- ✅ Easier for partners
- ✅ Same security benefits

---

## Recommendation

**Use Simple Method** - It's like JWT method but without the complexity!

- Same pattern (backend identifies user)
- Same security (user details on backend)
- Much simpler (no JWT library needed)

Partners will love it! 🎉

