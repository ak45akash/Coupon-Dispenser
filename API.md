# API Reference

Complete API documentation for the Coupon Dispenser application.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.vercel.app/api`

## Authentication

All API endpoints (except the widget claim endpoint) require authentication via NextAuth session cookies.

### Login

**Endpoint**: `POST /api/auth/signin`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response**: Sets session cookie

## Vendors

### List Vendors

**Endpoint**: `GET /api/vendors`

**Query Parameters**:
- `stats` (optional): Set to `true` to include coupon statistics

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Vendor Name",
      "description": "Description",
      "website": "https://example.com",
      "logo_url": "https://example.com/logo.png",
      "contact_email": "contact@example.com",
      "contact_phone": "+1234567890",
      "active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "total_coupons": 100,
      "claimed_coupons": 25,
      "available_coupons": 75
    }
  ]
}
```

**Authorization**: Any authenticated user

### Get Vendor

**Endpoint**: `GET /api/vendors/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Vendor Name",
    ...
  }
}
```

**Authorization**: Any authenticated user

### Create Vendor

**Endpoint**: `POST /api/vendors`

**Request Body**:
```json
{
  "name": "Vendor Name",
  "description": "Optional description",
  "website": "https://example.com",
  "logo_url": "https://example.com/logo.png",
  "contact_email": "contact@example.com",
  "contact_phone": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Vendor Name",
    ...
  },
  "message": "Vendor created successfully"
}
```

**Authorization**: Super Admin only

**Errors**:
- `400`: Validation error
- `403`: Unauthorized
- `500`: Server error

### Update Vendor

**Endpoint**: `PUT /api/vendors/:id`

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "active": false
}
```

**Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Vendor updated successfully"
}
```

**Authorization**: Super Admin only

### Delete Vendor

**Endpoint**: `DELETE /api/vendors/:id`

**Response**:
```json
{
  "success": true,
  "message": "Vendor deleted successfully"
}
```

**Authorization**: Super Admin only

**Note**: Deleting a vendor also deletes all associated coupons (cascade).

## Coupons

### List Coupons

**Endpoint**: `GET /api/coupons`

**Query Parameters**:
- `vendor_id` (optional): Filter by vendor

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "vendor_id": "uuid",
      "code": "SAVE20",
      "description": "Get 20% off",
      "discount_value": "20% off",
      "expiry_date": "2024-12-31T23:59:59Z",
      "is_claimed": false,
      "claimed_by": null,
      "claimed_at": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Authorization**: Any authenticated user

### Get Coupon

**Endpoint**: `GET /api/coupons/:id`

**Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Authorization**: Any authenticated user

### Create Coupon

**Endpoint**: `POST /api/coupons`

**Single Coupon**:
```json
{
  "vendor_id": "uuid",
  "code": "SAVE20",
  "description": "Get 20% off",
  "discount_value": "20% off",
  "expiry_date": "2024-12-31T23:59:59Z"
}
```

**Bulk Creation**:
```json
{
  "vendor_id": "uuid",
  "coupons": [
    {
      "code": "SAVE10",
      "description": "10% off"
    },
    {
      "code": "SAVE20",
      "description": "20% off"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": { ... } | [ ... ],
  "message": "Coupon(s) created successfully"
}
```

**Authorization**: Super Admin or Partner Admin (for their vendors)

**Errors**:
- `400`: Validation error or duplicate code
- `403`: Unauthorized
- `500`: Server error

### Delete Coupon

**Endpoint**: `DELETE /api/coupons/:id`

**Response**:
```json
{
  "success": true,
  "message": "Coupon deleted successfully"
}
```

**Authorization**: Super Admin or Partner Admin (for their vendors)

**Note**: Cannot delete claimed coupons (implement soft delete if needed).

### Claim Coupon

**Endpoint**: `POST /api/coupons/claim`

**Request Body**:
```json
{
  "vendor_id": "uuid",
  "user_email": "user@example.com"  // Optional, uses session if omitted
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "SAVE20",
    "description": "Get 20% off",
    "discount_value": "20% off",
    "is_claimed": true,
    "claimed_at": "2024-01-15T10:30:00Z"
  },
  "message": "Coupon claimed successfully"
}
```

**Response (Monthly Limit)**:
```json
{
  "success": false,
  "error": "Monthly claim limit reached for this vendor"
}
```
**Status**: `429 Too Many Requests`

**Response (No Coupons)**:
```json
{
  "success": false,
  "error": "No available coupons"
}
```
**Status**: `404 Not Found`

**Authorization**: Any authenticated user or public with email

**Rate Limiting**: One claim per vendor per month per user

## Users

### List Users

**Endpoint**: `GET /api/users`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Authorization**: Super Admin only

### Update User Role

**Endpoint**: `PUT /api/users/:id/role`

**Request Body**:
```json
{
  "role": "partner_admin"
}
```

**Allowed Roles**:
- `user`
- `partner_admin`
- `super_admin`

**Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "User role updated successfully"
}
```

**Authorization**: Super Admin only

### Get Partner Vendor Access

**Endpoint**: `GET /api/users/:id/access`

**Response**:
```json
{
  "success": true,
  "data": ["vendor-uuid-1", "vendor-uuid-2"]
}
```

**Authorization**: Super Admin only

### Update Partner Vendor Access

**Endpoint**: `PUT /api/users/:id/access`

**Request Body**:
```json
{
  "vendor_ids": ["vendor-uuid-1", "vendor-uuid-2"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Vendor access updated successfully"
}
```

**Authorization**: Super Admin only

## Analytics

### Overview Statistics

**Endpoint**: `GET /api/analytics?type=overview`

**Response**:
```json
{
  "success": true,
  "data": {
    "total_vendors": 10,
    "total_coupons": 1000,
    "claimed_coupons": 250,
    "available_coupons": 750,
    "total_users": 500,
    "claims_this_month": 75
  }
}
```

**Authorization**: Super Admin or Partner Admin

### Vendor Analytics

**Endpoint**: `GET /api/analytics?type=vendors&vendor_id=uuid`

**Query Parameters**:
- `vendor_id` (optional): Filter by specific vendor

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "vendor_id": "uuid",
      "vendor_name": "Vendor Name",
      "total_coupons": 100,
      "claimed_coupons": 25,
      "available_coupons": 75,
      "claim_rate": 25.0,
      "claims_by_month": [
        {
          "month": "2024-01",
          "count": 10
        }
      ]
    }
  ]
}
```

**Authorization**: Super Admin or Partner Admin

### Claim Trends

**Endpoint**: `GET /api/analytics?type=trends&days=30`

**Query Parameters**:
- `days` (default: 30): Number of days to include

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "count": 15
    }
  ]
}
```

**Authorization**: Super Admin or Partner Admin

### Top Vendors

**Endpoint**: `GET /api/analytics?type=top-vendors&limit=10`

**Query Parameters**:
- `limit` (default: 10): Number of vendors to return

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "vendor_id": "uuid",
      "vendor_name": "Vendor Name",
      "total_claims": 150
    }
  ]
}
```

**Authorization**: Super Admin or Partner Admin

## Error Responses

All endpoints return consistent error responses:

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "path": ["name"],
      "message": "Name is required"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### Rate Limited (429)
```json
{
  "success": false,
  "error": "Monthly claim limit reached for this vendor"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Rate Limiting

- Coupon claims: 1 per vendor per month per user
- API endpoints: No hard limits (use Vercel's built-in protection)

## CORS

CORS is enabled for all origins in the API routes. Restrict this in production if needed.

## Webhooks

Currently not implemented. Future feature for:
- Claim notifications
- Vendor updates
- Low coupon alerts

## Pagination

Currently, all list endpoints return all results. For large datasets, implement pagination:

```
GET /api/coupons?page=1&limit=50
```

This is left as a future enhancement.

## Versioning

API is currently unversioned (v1 implicit). Future versions would use:
```
/api/v2/vendors
```

