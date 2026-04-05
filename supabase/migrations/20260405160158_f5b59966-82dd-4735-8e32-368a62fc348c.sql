
DROP POLICY IF EXISTS "announcements_insert_service" ON public.announcements;
DROP POLICY IF EXISTS "announcements_update_service" ON public.announcements;
DROP POLICY IF EXISTS "announcements_delete_service" ON public.announcements;

CREATE POLICY "announcements_insert_service" ON public.announcements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "announcements_update_service" ON public.announcements
  FOR UPDATE USING (true);

CREATE POLICY "announcements_delete_service" ON public.announcements
  FOR DELETE USING (true);
