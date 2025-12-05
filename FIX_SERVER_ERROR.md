# Fixing Internal Server Error

## Issue
You're getting an internal server error after adding new API key features.

## Root Causes

### 1. Database Migration Not Run
The `api_key` column doesn't exist in the vendors table yet. You need to run the migration.

### 2. Missing Type Definition
The `api_key` field needs to be added to the Vendor type (already fixed).

## Solutions

### Step 1: Run Database Migration

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS api_key TEXT;

CREATE INDEX IF NOT EXISTS idx_vendors_api_key 
  ON public.vendors(api_key) 
  WHERE api_key IS NOT NULL;
```

### Step 2: Restart Dev Server

After running the migration:

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

### Step 3: Clear Cache (if needed)

```bash
rm -rf .next
npm run dev
```

---

## Quick Fix Script

If you want to check if the column exists:

```sql
-- Check if api_key column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
AND column_name = 'api_key';
```

If this returns nothing, run the migration above.

---

## After Migration

Once the migration is run:
1. Restart your dev server
2. The internal server error should be fixed
3. You can then generate API keys from the vendor dashboard

---

## Need Help?

Check:
- Browser console for specific error messages
- Terminal/console for server error logs
- Supabase logs for database errors

