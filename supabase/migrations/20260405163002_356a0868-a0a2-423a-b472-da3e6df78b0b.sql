
CREATE OR REPLACE FUNCTION public.create_reseller(
  p_creator_id integer, 
  p_session_token text, 
  p_nome text, 
  p_email text, 
  p_key text,
  p_creditos integer DEFAULT 0
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rank text;
  v_new_id integer;
  v_hashed_key text;
  v_creator_balance integer;
BEGIN
  IF NOT public.is_valid_admin(p_creator_id, p_session_token) THEN
    RAISE EXCEPTION 'Sessão inválida';
  END IF;
  
  SELECT rank INTO v_rank FROM public.admins WHERE id = p_creator_id;
  IF v_rank NOT IN ('master', 'dono', 'sub') THEN
    RAISE EXCEPTION 'Sem permissão para criar revendedores';
  END IF;
  
  IF EXISTS(SELECT 1 FROM public.admins WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já cadastrado';
  END IF;
  
  -- Validar e debitar créditos do criador se necessário
  IF p_creditos > 0 THEN
    IF v_rank = 'dono' OR v_rank = 'sub' THEN
      SELECT creditos INTO v_creator_balance FROM public.admins WHERE id = p_creator_id FOR UPDATE;
      -- Dono/sub tem créditos ilimitados, não debitar
    ELSE
      -- Master debita de creditos_transf
      SELECT creditos_transf INTO v_creator_balance FROM public.admins WHERE id = p_creator_id FOR UPDATE;
      IF v_creator_balance < p_creditos THEN
        RAISE EXCEPTION 'Saldo insuficiente para dar créditos iniciais';
      END IF;
      UPDATE public.admins SET creditos_transf = creditos_transf - p_creditos WHERE id = p_creator_id;
    END IF;
  END IF;
  
  v_hashed_key := public.hash_password(p_key);
  
  INSERT INTO public.admins (nome, email, key, rank, criado_por, creditos)
  VALUES (p_nome, p_email, v_hashed_key, 'revendedor', p_creator_id, p_creditos)
  RETURNING admins.id INTO v_new_id;
  
  -- Registrar transação se houve créditos
  IF p_creditos > 0 AND v_rank NOT IN ('dono', 'sub') THEN
    INSERT INTO public.credit_transactions (from_admin_id, to_admin_id, amount, transaction_type)
    VALUES (p_creator_id, v_new_id, p_creditos, 'transfer');
  END IF;
  
  RETURN v_new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_master(
  p_creator_id integer, 
  p_session_token text, 
  p_nome text, 
  p_email text, 
  p_key text,
  p_creditos integer DEFAULT 0
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rank text;
  v_new_id integer;
  v_hashed_key text;
BEGIN
  IF NOT public.is_valid_admin(p_creator_id, p_session_token) THEN
    RAISE EXCEPTION 'Sessão inválida';
  END IF;
  
  SELECT rank INTO v_rank FROM public.admins WHERE id = p_creator_id;
  IF v_rank != 'dono' THEN
    RAISE EXCEPTION 'Apenas donos podem criar masters';
  END IF;
  
  IF EXISTS(SELECT 1 FROM public.admins WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já cadastrado';
  END IF;
  
  v_hashed_key := public.hash_password(p_key);
  
  -- Dono tem créditos ilimitados, não debitar
  INSERT INTO public.admins (nome, email, key, rank, criado_por, creditos)
  VALUES (p_nome, p_email, v_hashed_key, 'master', p_creator_id, p_creditos)
  RETURNING admins.id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$;
