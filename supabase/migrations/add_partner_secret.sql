-- Migration: Add partner_secret column to vendors table
-- This enables partner-signed JWT tokens for widget authentication

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS partner_secret TEXT;

-- Add comment
COMMENT ON COLUMN public.vendors.partner_secret IS 'Secret key for signing partner JWT tokens (HS256). Should be unique per vendor and stored securely.';

