
CREATE TABLE public.platform_settings (
  id integer PRIMARY KEY DEFAULT 1,
  recarga_em_dobro boolean NOT NULL DEFAULT false,
  reseller_price numeric NOT NULL DEFAULT 50,
  reseller_credits integer NOT NULL DEFAULT 5,
  credit_packages jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.platform_settings (id) VALUES (1);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only service role can access (via edge functions)
CREATE POLICY "platform_settings_select_service"
ON public.platform_settings FOR SELECT
TO public
USING (false);

CREATE POLICY "platform_settings_update_service"
ON public.platform_settings FOR UPDATE
TO public
USING (false);
