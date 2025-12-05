# Database Migration Instructions

## Run the API Key Migration

The new API key feature requires a database migration. Please run this SQL in your Supabase SQL Editor:

### Steps:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- Migration: Add api_key column to vendors table
-- This enables simple API key authentication for widget integration
-- Partners can use API key instead of signing JWT tokens

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS api_key TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendors_api_key 
  ON public.vendors(api_key) 
  WHERE api_key IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.vendors.api_key IS 'API key for simple widget authentication. Partners can use this instead of signing JWT tokens. Should be unique per vendor and stored securely.';
```

5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Wait for success message

✅ Migration complete! The `api_key` column is now available in the vendors table.

---

## Verify Migration

To verify the migration was successful, run this query:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
AND column_name = 'api_key';
```

You should see:
```
column_name | data_type
------------|----------
api_key     | text
```

---

## If You Get Errors

If you see errors like "column already exists", that's okay - it means the migration already ran.

After running the migration, restart your Next.js dev server:

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

