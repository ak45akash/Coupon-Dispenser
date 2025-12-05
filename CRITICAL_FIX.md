# 🚨 CRITICAL: Fix Internal Server Error

## The Problem

The internal server error is happening because the `api_key` column doesn't exist in your database yet. The code I added tries to access this column, causing the error.

## Immediate Fix (2 Steps - Takes 2 Minutes)

### Step 1: Run Database Migration ⚠️ REQUIRED

**In Supabase Dashboard:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy and paste this SQL:

```sql
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS api_key TEXT;

CREATE INDEX IF NOT EXISTS idx_vendors_api_key 
  ON public.vendors(api_key) 
  WHERE api_key IS NOT NULL;
```

6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for ✅ **Success** message

### Step 2: Restart Dev Server

```bash
# In your terminal, stop the server (Ctrl+C or Cmd+C)
# Then restart:
npm run dev
```

---

## That's It!

After these 2 steps:
- ✅ Internal server error will be fixed
- ✅ App will work normally
- ✅ New features will be available

---

## Why This Happened

I added new code that uses the `api_key` column, but the column doesn't exist in your database yet. Running the migration adds it.

---

## Verify It Worked

After running the migration, test in Supabase SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
AND column_name = 'api_key';
```

Should return: `api_key | text`

---

**Please run the migration now, then restart your server. The error will be fixed!** ✅

