# Fixing Internal Server Error - Step by Step

## Issues Found & Fixed

1. ✅ **Vendor Type Missing `api_key`** - Fixed (added to types/database.ts)
2. ✅ **Next.js Dynamic Route Warnings** - Fixed (added `export const dynamic = 'force-dynamic'`)
3. ⚠️ **Database Migration Not Run** - **YOU NEED TO DO THIS**

---

## What You Need To Do

### Step 1: Run Database Migration (CRITICAL)

The new `api_key` column doesn't exist in your database yet. Run this migration:

**In Supabase Dashboard:**

1. Go to **SQL Editor**
2. Click **New Query**
3. Copy and paste this SQL:

```sql
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS api_key TEXT;

CREATE INDEX IF NOT EXISTS idx_vendors_api_key 
  ON public.vendors(api_key) 
  WHERE api_key IS NOT NULL;
```

4. Click **Run**
5. Wait for success message ✅

### Step 2: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C or Cmd+C)
# Then restart:
npm run dev
```

### Step 3: Clear Build Cache (Optional, if still having issues)

```bash
rm -rf .next
npm run dev
```

---

## What I Fixed in the Code

1. ✅ Added `api_key?: string | null` to Vendor type
2. ✅ Added `export const dynamic = 'force-dynamic'` to dashboard pages
3. ✅ Made API key access more resilient (handles missing column)
4. ✅ Created migration file ready to run

---

## Verify Migration Worked

After running the migration, verify with this query:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
AND column_name = 'api_key';
```

Should return:
```
column_name | data_type
------------|----------
api_key     | text
```

---

## After Fixing

Once you:
1. Run the migration ✅
2. Restart dev server ✅

The internal server error should be gone, and you can continue with the implementation!

Let me know once the migration is run and the error is fixed, then I'll continue with the dashboard UI updates! 🚀

