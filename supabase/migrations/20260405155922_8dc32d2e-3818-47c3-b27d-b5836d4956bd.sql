
CREATE TABLE public.announcements (
  id serial PRIMARY KEY,
  admin_id integer NOT NULL,
  title text NOT NULL,
  content text,
  type text NOT NULL DEFAULT 'news' CHECK (type IN ('news', 'recharge')),
  is_highlight boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_all" ON public.announcements
  FOR SELECT USING (true);

CREATE POLICY "announcements_insert_service" ON public.announcements
  FOR INSERT WITH CHECK (false);

CREATE POLICY "announcements_update_service" ON public.announcements
  FOR UPDATE USING (false);

CREATE POLICY "announcements_delete_service" ON public.announcements
  FOR DELETE USING (false);

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
