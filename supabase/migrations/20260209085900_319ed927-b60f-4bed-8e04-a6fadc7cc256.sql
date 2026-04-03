DROP FUNCTION IF EXISTS public.get_creator_name(integer, text);

CREATE FUNCTION public.get_creator_name(p_admin_id integer, p_session_token text)
 RETURNS TABLE(creator_name character varying, creator_id integer, creator_telefone text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_criado_por integer;
BEGIN
  IF NOT public.is_valid_admin(p_admin_id, p_session_token) THEN
    RETURN;
  END IF;
  
  SELECT a.criado_por INTO v_criado_por FROM public.admins a WHERE a.id = p_admin_id;
  
  IF v_criado_por IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT a.nome, a.id, a.telefone FROM public.admins a WHERE a.id = v_criado_por;
END;
$function$;