# Integration Guides

Choose the integration method that best fits your technical capabilities and platform.

---

## 🚀 Quick Comparison

| Method | Platform | Technical Level | Setup Time | Best For |
|--------|----------|----------------|------------|----------|
| **WordPress Plugin** | WordPress | None (Zero Code) | 2 minutes | WordPress users |
| **API Key Method** | Any Platform | Low (Simple API call) | 15 minutes | Non-technical partners |
| **JWT Method** | Any Platform | Medium (JWT signing) | 30 minutes | Technical partners |

---

## 📦 Method 1: WordPress Plugin (Coming Soon)

**Perfect for:** WordPress users who want zero-code integration

### Features:
- ✅ One-click installation
- ✅ Automatic user detection
- ✅ No coding required
- ✅ Works with any WordPress theme

### Installation Steps:
1. Download plugin ZIP from vendor dashboard
2. Upload to WordPress: Plugins → Add New → Upload Plugin
3. Activate plugin
4. Configure vendor ID and API key in plugin settings
5. Use shortcode: `[coupon_widget vendor_id="YOUR_VENDOR_ID"]`

**Status:** Coming Soon - Plugin download will be available in the dashboard.

---

## 🔑 Method 2: API Key Method (Simple)

**Perfect for:** Partners who want a simple backend integration without JWT complexity

### Features:
- ✅ Simple backend API call (no JWT signing)
- ✅ Works with any programming language
- ✅ User identification on your backend
- ✅ Same security as JWT method

### Setup Time: ~15 minutes

### Step-by-Step Guide:

#### Step 1: Generate API Key
1. Go to your vendor dashboard
2. Navigate to the "API Key Method" tab
3. Click "Generate API Key"
4. **Important:** Copy the API key immediately - it won't be shown again!

#### Step 2: Create Backend Endpoint
Create a backend endpoint that:
1. Authenticates your user
2. Gets your user's ID or email
3. Calls our API to get a widget session token
4. Returns the token to your frontend

**Example endpoints shown in dashboard code examples:**
- Node.js / Express
- Python / Flask
- WordPress (PHP)

#### Step 3: Embed Widget
Add this to your HTML pages:

```html
<script src="https://your-domain.com/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="YOUR_VENDOR_ID"
     data-api-key-endpoint="https://your-site.com/api/coupon-token">
</div>
```

Replace:
- `YOUR_VENDOR_ID` with your vendor ID from the dashboard
- `https://your-site.com/api/coupon-token` with your backend endpoint URL

#### Step 4: Widget Automatically Authenticates
The widget will:
1. Call your backend endpoint automatically
2. Receive the widget session token
3. Authenticate all API calls with the token

### How It Works:

```
User visits page
    ↓
Widget loads → Calls your backend endpoint
    ↓
Your backend:
  - Authenticates user
  - Calls our /api/widget-session with API key + user_id
  - Returns widget session token
    ↓
Widget receives token → Authenticates → Shows coupons
```

### Security:
- ✅ API key is kept on your backend (never exposed to frontend)
- ✅ User identification happens on your backend
- ✅ Widget session tokens expire after 7 days
- ✅ Same monthly limit enforcement as JWT method

### Code Examples:
See the vendor dashboard for complete code examples in:
- Node.js / Express
- Python / Flask
- WordPress (PHP)

---

## 🔐 Method 3: JWT Method (Advanced)

**Perfect for:** Technical partners who want full control over token signing

### Features:
- ✅ Full control over JWT signing
- ✅ Works with any programming language that supports JWT
- ✅ Custom token expiration (3 minutes)
- ✅ Replay protection via `jti`

### Setup Time: ~30 minutes

### Step-by-Step Guide:

#### Step 1: Generate Partner Secret
1. Go to your vendor dashboard
2. Navigate to the "JWT Method" tab
3. Click "Generate Partner Secret"
4. **Important:** Copy the secret immediately - it won't be shown again!

#### Step 2: Install JWT Library
Install a JWT library for your programming language:
- **Node.js:** `npm install jsonwebtoken`
- **Python:** `pip install PyJWT`
- **PHP:** `composer require firebase/php-jwt`

#### Step 3: Create Backend Endpoint
Create a backend endpoint that:
1. Authenticates your user
2. Gets your user's ID
3. Signs a JWT token with the Partner Secret
4. Returns the token to your frontend

**Example endpoints shown in dashboard code examples:**
- Node.js / Express
- Python / Flask
- WordPress (PHP)

#### Step 4: Embed Widget and Send Token
Add this to your HTML pages:

```html
<script src="https://your-domain.com/widget-embed.js"></script>
<div id="coupon-widget" data-vendor-id="YOUR_VENDOR_ID"></div>

<script>
  // Fetch JWT token from your backend
  fetch('/api/coupon-token')
    .then(response => response.json())
    .then(data => {
      if (data.token) {
        window.sendCouponToken(data.token);
      }
    });
</script>
```

#### Step 5: Widget Exchanges Token
The widget will:
1. Receive your JWT token via `window.sendCouponToken()`
2. Exchange it for a widget session token
3. Authenticate all API calls with the session token

### JWT Token Requirements:

Your JWT token must include:
```json
{
  "vendor": "YOUR_VENDOR_ID",
  "external_user_id": "USER_ID_FROM_YOUR_SYSTEM",
  "jti": "unique-request-id",
  "iat": 1234567890,
  "exp": 1234568070
}
```

- `vendor`: Your vendor ID (UUID)
- `external_user_id`: Your system's user ID (string)
- `jti`: Unique request ID (prevents replay attacks)
- `iat`: Issued at time (Unix timestamp)
- `exp`: Expiration time (Unix timestamp, must be within 3 minutes)

### How It Works:

```
User visits page
    ↓
Your frontend → Calls your backend endpoint
    ↓
Your backend:
  - Authenticates user
  - Signs JWT with Partner Secret
  - Returns JWT token
    ↓
Frontend receives JWT → Calls window.sendCouponToken(jwtToken)
    ↓
Widget exchanges JWT → Gets widget session token
    ↓
Widget authenticates → Shows coupons
```

### Security:
- ✅ Partner Secret is kept on your backend (never exposed)
- ✅ JWT tokens expire after 3 minutes
- ✅ Replay protection via `jti` (Redis)
- ✅ User identification via `external_user_id`
- ✅ Widget session tokens expire after 7 days

### Code Examples:
See the vendor dashboard for complete code examples in:
- Node.js / Express
- Python / Flask
- WordPress (PHP)

---

## 🔍 Choosing the Right Method

### Choose WordPress Plugin if:
- ✅ You're using WordPress
- ✅ You want zero-code integration
- ✅ You want the simplest setup

### Choose API Key Method if:
- ✅ You want simple backend integration
- ✅ You don't want to deal with JWT signing
- ✅ You're comfortable making API calls
- ✅ You want quick setup (~15 minutes)

### Choose JWT Method if:
- ✅ You want full control over token signing
- ✅ You're comfortable with JWT libraries
- ✅ You need custom token expiration
- ✅ You want advanced security features

---

## 📊 Feature Comparison

| Feature | WordPress Plugin | API Key Method | JWT Method |
|---------|-----------------|----------------|------------|
| Setup Complexity | ⭐ Very Easy | ⭐⭐ Easy | ⭐⭐⭐ Medium |
| Code Required | None | Backend endpoint | Backend endpoint + JWT |
| User Detection | Automatic | Your backend | Your backend |
| Security | High | High | Very High |
| Customization | Limited | Medium | High |
| Token Expiration | Managed | 7 days | 3 min (JWT) + 7 days (session) |

---

## 🆘 Troubleshooting

### Widget Not Loading?
- ✅ Check that vendor ID is correct (UUID format)
- ✅ Check browser console for errors
- ✅ Verify widget script URL is correct

### Authentication Failing?
- ✅ Verify API key or Partner Secret is correct
- ✅ Check that your backend endpoint is accessible
- ✅ Verify user identification is working
- ✅ Check browser console for error messages

### No Coupons Showing?
- ✅ Check that vendor has active coupons
- ✅ Verify user is authenticated correctly
- ✅ Check that coupons haven't been permanently claimed
- ✅ Verify monthly limit hasn't been reached

### Need Help?
Contact support through your vendor dashboard or refer to the detailed error messages in the browser console.

---

## 📚 Additional Resources

- **Vendor Dashboard:** Complete code examples for all platforms
- **API Documentation:** Available in dashboard for each method
- **Widget Documentation:** See widget file comments for advanced usage

---

**Last Updated:** [Current Date]
**Version:** 1.0

