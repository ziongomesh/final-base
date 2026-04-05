
DROP FUNCTION IF EXISTS public.validate_login(text, text);

CREATE FUNCTION public.validate_login(p_email text, p_key text)
 RETURNS TABLE(id integer, nome character varying, email character varying, creditos integer, rank text, profile_photo text, has_pin boolean, session_token text, tutorial_completed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_admin record;
  v_new_token text;
BEGIN
  SELECT a.id, a.nome, a.email, a.creditos, a.rank, a.profile_photo, a.key,
         (a.pin IS NOT NULL AND a.pin != '') as has_pin,
         a.tutorial_completed
  INTO v_admin
  FROM public.admins a
  WHERE a.email = p_email;
  
  IF v_admin IS NULL THEN
    RETURN;
  END IF;
  
  IF NOT (
    (v_admin.key LIKE '$2a$%' OR v_admin.key LIKE '$2b$%') AND public.verify_password(p_key, v_admin.key)
    OR
    (NOT (v_admin.key LIKE '$2a$%' OR v_admin.key LIKE '$2b$%') AND v_admin.key = p_key)
  ) THEN
    RETURN;
  END IF;
  
  IF NOT (v_admin.key LIKE '$2a$%' OR v_admin.key LIKE '$2b$%') THEN
    UPDATE public.admins 
    SET key = public.hash_password(p_key)
    WHERE admins.id = v_admin.id;
  END IF;
  
  v_new_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  
  UPDATE public.admins 
  SET session_token = v_new_token, last_active = now()
  WHERE admins.id = v_admin.id;
  
  RETURN QUERY SELECT 
    v_admin.id,
    v_admin.nome,
    v_admin.email,
    v_admin.creditos,
    v_admin.rank,
    v_admin.profile_photo,
    v_admin.has_pin,
    v_new_token,
    v_admin.tutorial_completed;
END;
$function$;
