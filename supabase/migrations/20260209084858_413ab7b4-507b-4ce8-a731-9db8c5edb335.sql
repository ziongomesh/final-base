
CREATE OR REPLACE FUNCTION public.get_creator_name(p_admin_id integer, p_session_token text)
RETURNS TABLE(creator_name varchar, creator_id integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_criado_por integer;
BEGIN
  -- Validar sessão
  IF NOT public.is_valid_admin(p_admin_id, p_session_token) THEN
    RETURN;
  END IF;
  
  -- Buscar criado_por
  SELECT a.criado_por INTO v_criado_por FROM public.admins a WHERE a.id = p_admin_id;
  
  IF v_criado_por IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT a.nome, a.id FROM public.admins a WHERE a.id = v_criado_por;
END;
$$;
