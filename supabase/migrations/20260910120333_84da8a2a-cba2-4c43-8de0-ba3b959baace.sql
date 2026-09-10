ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS online_price numeric NOT NULL DEFAULT 6700,
  ADD COLUMN IF NOT EXISTS offline_price numeric NOT NULL DEFAULT 8700,
  ADD COLUMN IF NOT EXISTS activation_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS activation_link text NOT NULL DEFAULT 'https://v0-red-pay-activation-app-tr.vercel.app/',
  ADD COLUMN IF NOT EXISTS online_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS offline_enabled boolean NOT NULL DEFAULT true;