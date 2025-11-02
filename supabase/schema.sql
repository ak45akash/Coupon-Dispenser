-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('super_admin', 'partner_admin', 'user');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vendors table
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partner admins can be assigned to specific vendors
CREATE TABLE public.partner_vendor_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, vendor_id)
);

-- Coupons table
-- Note: Coupons are shared - multiple users can claim the same coupon
-- Claim tracking is handled through claim_history table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_value TEXT,
  expiry_date TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Claim history for tracking and monthly limits
CREATE TABLE public.claim_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claim_month DATE NOT NULL DEFAULT DATE_TRUNC('month', NOW())
);

-- System configuration table for claim rules
CREATE TABLE public.system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default monthly claim rule
INSERT INTO public.system_config (key, value) 
VALUES ('monthly_claim_rule', '{"enabled": true, "max_claims_per_vendor": 1}'::JSONB)
ON CONFLICT (key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_coupons_vendor_id ON public.coupons(vendor_id);
CREATE INDEX idx_claim_history_user_id ON public.claim_history(user_id);
CREATE INDEX idx_claim_history_vendor_id ON public.claim_history(vendor_id);
CREATE INDEX idx_claim_history_claim_month ON public.claim_history(claim_month);
CREATE INDEX idx_claim_history_user_vendor_month ON public.claim_history(user_id, vendor_id, claim_month);
CREATE INDEX idx_partner_vendor_access_user_id ON public.partner_vendor_access(user_id);
CREATE INDEX idx_partner_vendor_access_vendor_id ON public.partner_vendor_access(vendor_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_vendor_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Vendors policies
CREATE POLICY "Everyone can view active vendors" ON public.vendors
  FOR SELECT USING (active = true);

CREATE POLICY "Super admins can manage vendors" ON public.vendors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Partner admins can view their vendors" ON public.vendors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partner_vendor_access pva
      WHERE pva.vendor_id = vendors.id AND pva.user_id = auth.uid()
    )
  );

-- Coupons policies
CREATE POLICY "Super admins can manage all coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Partner admins can view their vendor coupons" ON public.coupons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partner_vendor_access pva
      WHERE pva.vendor_id = coupons.vendor_id AND pva.user_id = auth.uid()
    )
  );

-- All authenticated users can view all coupons (shared model)
CREATE POLICY "Everyone can view coupons" ON public.coupons
  FOR SELECT USING (true);

-- Claim history policies
CREATE POLICY "Users can view their own claim history" ON public.claim_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all claim history" ON public.claim_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Partner admins can view their vendor claim history" ON public.claim_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partner_vendor_access pva
      WHERE pva.vendor_id = claim_history.vendor_id AND pva.user_id = auth.uid()
    )
  );

-- System config policies
CREATE POLICY "Super admins can manage system config" ON public.system_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Anyone can read system config" ON public.system_config
  FOR SELECT USING (true);

-- Partner vendor access policies
CREATE POLICY "Super admins can manage partner access" ON public.partner_vendor_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Users can view their own vendor access" ON public.partner_vendor_access
  FOR SELECT USING (user_id = auth.uid());

