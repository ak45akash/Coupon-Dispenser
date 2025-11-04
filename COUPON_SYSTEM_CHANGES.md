# Coupon System Changes - One-Time Claim Model

## Overview
Changed the coupon system from monthly claim limits per user to a one-time claim model where each coupon can only be claimed once.

## Key Changes

### 1. Database Schema
- Added `is_claimed` (boolean) field to coupons table
- Added `claimed_by` (uuid) field to track who claimed the coupon
- Added `claimed_at` (timestamp) field to track when coupon was claimed
- Expiry date is now calculated when coupon is claimed: 1 month from claim date

**Migration File:** `supabase/migrations/add_coupon_claim_fields.sql`

### 2. Required Fields
- **Before:** code, description, discount_value, expiry_date (all required)
- **After:** code, description (required), discount_value, expiry_date (optional)

### 3. Claim Logic
- **Before:** Users could claim one coupon per vendor per month
- **After:** Each coupon can only be claimed once by any user
- When claimed, coupon is marked as `is_claimed = true`
- Expiry date is automatically set to 1 month from claim date

### 4. API Changes

#### Claim Endpoint (`POST /api/coupons/claim`)
- **Before:** Required `vendor_id`, would return any available coupon
- **After:** Requires `coupon_id` to claim a specific coupon
- Error responses updated:
  - `409 Conflict`: Coupon already claimed
  - `404 Not Found`: Coupon not found

#### Coupon Creation
- `discount_value` and `expiry_date` are now optional
- Validation schemas updated accordingly

### 5. Frontend Changes

#### CSV Upload Modal
- Updated template to only require `code` and `description`
- Removed `discount_value` and `expiry_date` from required fields
- Added note about one-time claim and automatic expiry

#### Coupon Modal
- Marked `discount_value` and `expiry_date` as optional in UI
- Added note that expiry is set when coupon is claimed (if not provided)

#### Widget Page
- Updated to fetch available coupons first
- Then claims the first available unclaimed coupon
- Updated error handling for new claim model

### 6. Files Modified

1. **Database:**
   - `supabase/migrations/add_coupon_claim_fields.sql` (NEW)
   - `types/database.ts` - Added claim fields to Coupon interface

2. **Validation:**
   - `lib/validators/coupon.ts` - Made discount_value and expiry_date optional

3. **Database Functions:**
   - `lib/db/coupons.ts` - Updated claimCoupon() to use coupon_id, removed monthly limit check

4. **API Routes:**
   - `app/api/coupons/claim/route.ts` - Updated to use coupon_id instead of vendor_id

5. **Frontend Components:**
   - `components/coupons/CSVUploadModal.tsx` - Updated requirements and template
   - `components/coupons/CouponModal.tsx` - Made optional fields optional in UI
   - `app/widget/page.tsx` - Updated claim flow

6. **Utilities:**
   - `lib/utils/csv.ts` - Made discount_value and expiry_date optional in parser

## Migration Instructions

1. Run the migration SQL in Supabase:
   ```sql
   -- Run supabase/migrations/add_coupon_claim_fields.sql
   ```

2. The migration will:
   - Add `is_claimed`, `claimed_by`, `claimed_at` columns to coupons table
   - Create indexes for performance
   - Update RLS policies

## Testing Checklist

- [ ] Run database migration
- [ ] Test coupon creation with only code and description
- [ ] Test CSV upload with new template
- [ ] Test claiming a coupon (should mark as claimed)
- [ ] Test claiming same coupon twice (should fail with 409)
- [ ] Verify expiry date is set to 1 month from claim date
- [ ] Test widget claim flow
- [ ] Verify unclaimed coupons are filtered correctly
- [ ] Test coupon list displays claim status

## Notes

- Existing coupons without claim status will have `is_claimed = false` by default
- Claim history is still recorded for analytics purposes
- Monthly claim limits are no longer enforced
- Each coupon is unique and can only be claimed once

