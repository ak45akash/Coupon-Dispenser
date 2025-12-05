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

