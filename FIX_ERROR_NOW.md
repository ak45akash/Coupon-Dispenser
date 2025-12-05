# 🚨 Fix Internal Server Error - Quick Steps

## The Problem

The error is happening because the `api_key` column doesn't exist in your database yet. When the code tries to access it, it fails.

## Immediate Fix (2 Minutes)

### Step 1: Run Database Migration

**In Supabase Dashboard:**

1. Open your Supabase project
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste this SQL:

```sql
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS api_key TEXT;

CREATE INDEX IF NOT EXISTS idx_vendors_api_key 
  ON public.vendors(api_key) 
  WHERE api_key IS NOT NULL;
```

5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Wait for ✅ Success message

### Step 2: Restart Dev Server

```bash
# Stop the server (Ctrl+C or Cmd+C in terminal)
# Then restart:
npm run dev
```

### Step 3: Clear Browser Cache

- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Or clear cache in browser settings

---

## What This Does

- Adds `api_key` column to vendors table
- Creates index for faster lookups
- The code will now work without errors

---

## Verify It Worked

After running migration, check in Supabase SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
AND column_name = 'api_key';
```

Should return one row with `api_key | text`

---

## Still Having Issues?

If error persists after migration:

1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Check browser console** (F12) for specific error messages

3. **Check terminal logs** for server error details

---

**Once migration is run and server restarted, the error should be fixed!** ✅

