
CREATE TABLE public.sub_recharge_plans (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  base_credits INTEGER NOT NULL,
  bonus INTEGER NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  badge TEXT DEFAULT '',
  badge_color TEXT DEFAULT 'bg-blue-500',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sub_recharge_plans ENABLE ROW LEVEL SECURITY;

-- All access goes through edge functions / service role, block direct public access
CREATE POLICY "sub_plans_select_service" ON public.sub_recharge_plans FOR SELECT USING (false);
CREATE POLICY "sub_plans_insert_service" ON public.sub_recharge_plans FOR INSERT WITH CHECK (false);
CREATE POLICY "sub_plans_update_service" ON public.sub_recharge_plans FOR UPDATE USING (false);
CREATE POLICY "sub_plans_delete_service" ON public.sub_recharge_plans FOR DELETE USING (false);
