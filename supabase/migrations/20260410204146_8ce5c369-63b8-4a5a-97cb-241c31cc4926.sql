CREATE TABLE public.recharge_receipts (
  id serial PRIMARY KEY,
  admin_id integer NOT NULL,
  plan_id integer REFERENCES public.sub_recharge_plans(id) ON DELETE SET NULL,
  plan_name text NOT NULL DEFAULT '',
  credits integer NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  receipt_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by integer
);

ALTER TABLE public.recharge_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recharge_receipts_select_service" ON public.recharge_receipts FOR SELECT TO public USING (false);
CREATE POLICY "recharge_receipts_insert_service" ON public.recharge_receipts FOR INSERT TO public WITH CHECK (false);
CREATE POLICY "recharge_receipts_update_service" ON public.recharge_receipts FOR UPDATE TO public USING (false);
CREATE POLICY "recharge_receipts_delete_service" ON public.recharge_receipts FOR DELETE TO public USING (false);

ALTER PUBLICATION supabase_realtime ADD TABLE public.recharge_receipts;