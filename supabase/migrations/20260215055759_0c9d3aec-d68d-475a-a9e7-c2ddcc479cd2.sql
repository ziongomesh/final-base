-- Fix: drop restrictive SELECT policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "downloads_select_all" ON public.downloads;
CREATE POLICY "downloads_select_all" ON public.downloads FOR SELECT USING (true);

-- Also fix update policy to allow service role updates via edge function
DROP POLICY IF EXISTS "downloads_update_service" ON public.downloads;
CREATE POLICY "downloads_update_service" ON public.downloads FOR UPDATE USING (true) WITH CHECK (true);

-- Fix insert policy too
DROP POLICY IF EXISTS "downloads_insert_service" ON public.downloads;
CREATE POLICY "downloads_insert_service" ON public.downloads FOR INSERT WITH CHECK (true);