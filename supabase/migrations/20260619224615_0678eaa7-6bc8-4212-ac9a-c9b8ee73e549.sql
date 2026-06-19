
-- ============================================================
-- LOCKDOWN: o app usa MySQL local; o backend Supabase é legado.
-- Removemos políticas permissivas e revogamos EXECUTE de RPCs.
-- ============================================================

-- ===== announcements: leitura pública, escrita só service_role =====
DROP POLICY IF EXISTS announcements_insert_service ON public.announcements;
DROP POLICY IF EXISTS announcements_update_service ON public.announcements;
DROP POLICY IF EXISTS announcements_delete_service ON public.announcements;
-- announcements_select_all (USING true) fica — feed público intencional.

-- ===== downloads: leitura pública, escrita só service_role =====
DROP POLICY IF EXISTS downloads_insert_service ON public.downloads;
DROP POLICY IF EXISTS downloads_update_service ON public.downloads;
DROP POLICY IF EXISTS downloads_delete_service ON public.downloads;
-- downloads_select_all (USING true) fica — links de download públicos intencionais.

-- ===== pix_payments: nada exposto ao anon/authenticated =====
DROP POLICY IF EXISTS pix_payments_select_all ON public.pix_payments;
DROP POLICY IF EXISTS pix_payments_insert_service ON public.pix_payments;
DROP POLICY IF EXISTS pix_payments_update_service ON public.pix_payments;
-- Sem policies = bloqueado para anon/authenticated; service_role contorna RLS.

-- ===== usuarios_rg: PII sensível, nada exposto ao anon/authenticated =====
DROP POLICY IF EXISTS "Allow all for service role" ON public.usuarios_rg;
-- Sem policies = bloqueado para anon/authenticated; service_role contorna RLS.

-- ===== Revogar EXECUTE de SECURITY DEFINER em anon e authenticated =====
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon, authenticated;',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;
