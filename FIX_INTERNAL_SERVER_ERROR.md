# 🚨 Fix Internal Server Error - Quick Guide

## Root Cause

The error is happening because the `api_key` database column doesn't exist yet. I added code that uses this column, but the migration hasn't been run.

## Solution (2 Steps - 2 Minutes)

### Step 1: Run Database Migration ⚠️ REQUIRED

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste this SQL:

```sql
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS api_key TEXT;

CREATE INDEX IF NOT EXISTS idx_vendors_api_key 
  ON public.vendors(api_key) 
  WHERE api_key IS NOT NULL;
```

6. Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)
7. Wait for ✅ **Success** message

### Step 2: Restart Dev Server

In your terminal:
```bash
# Stop server (Ctrl+C or Cmd+C)
npm run dev
```

---

## ✅ That's It!

After these 2 steps, the error will be fixed.

---

## What I Already Fixed in Code

1. ✅ Added `api_key` to Vendor type definition
2. ✅ Added `export const dynamic = 'force-dynamic'` to fix Next.js warnings  
3. ✅ Made code handle missing `api_key` gracefully
4. ✅ Created better error handling

---

## Verify Migration

To check if migration worked, run this in Supabase SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
AND column_name = 'api_key';
```

Should return: `api_key | text`

---

## Next Steps After Fix

Once the error is fixed, I'll continue with:
1. Dashboard UI updates (tabs for three integration methods)
2. Widget enhancements  
3. WordPress plugin development

**Please run the migration now, then let me know when it's done!** 🚀

