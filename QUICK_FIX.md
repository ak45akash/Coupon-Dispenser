# Quick Fix for Internal Server Error

## The Problem

The internal server error is likely because:
1. **Database migration hasn't been run** - The `api_key` column doesn't exist yet
2. **Code is trying to access a column that doesn't exist**

## Quick Fix Steps

### Step 1: Run Database Migration (REQUIRED)

**In Supabase Dashboard:**

1. Go to **SQL Editor**
2. Click **New Query**
3. Copy and paste this:

```sql
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS api_key TEXT;

CREATE INDEX IF NOT EXISTS idx_vendors_api_key 
  ON public.vendors(api_key) 
  WHERE api_key IS NOT NULL;
```

4. Click **Run**
5. Wait for success ✅

### Step 2: Restart Your Dev Server

```bash
# Stop server (Ctrl+C) then:
npm run dev
```

### Step 3: Clear Build Cache (if still having issues)

```bash
rm -rf .next
npm run dev
```

---

## What I Fixed

1. ✅ Added `api_key` to Vendor type definition
2. ✅ Made code handle missing `api_key` gracefully
3. ✅ Added `export const dynamic = 'force-dynamic'` to fix Next.js warnings
4. ✅ Created migration instructions

---

## After Migration

Once you run the migration:
- Internal server error should be fixed
- You can generate API keys from vendor dashboard
- All new features will work

**Try it now and let me know if the error is fixed!**

