CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: can_view_admin(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_admin(viewer_id integer, target_id integer) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT CASE
    -- Dono pode ver todos
    WHEN (SELECT rank FROM public.admins WHERE id = viewer_id) = 'dono' THEN true
    -- Admin pode ver a si mesmo
    WHEN viewer_id = target_id THEN true
    -- Master pode ver seus revendedores
    WHEN (SELECT rank FROM public.admins WHERE id = viewer_id) = 'master' 
      AND (SELECT criado_por FROM public.admins WHERE id = target_id) = viewer_id THEN true
    ELSE false
  END
$$;


--
-- Name: create_master(integer, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_master(p_creator_id integer, p_session_token text, p_nome text, p_email text, p_key text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_rank text;
  v_new_id integer;
  v_hashed_key text;
BEGIN
  -- Validar sessão
  IF NOT public.is_valid_admin(p_creator_id, p_session_token) THEN
    RAISE EXCEPTION 'Sessão inválida';
  END IF;
  
  -- Verificar se é dono
  SELECT rank INTO v_rank FROM public.admins WHERE id = p_creator_id;
  IF v_rank != 'dono' THEN
    RAISE EXCEPTION 'Apenas donos podem criar masters';
  END IF;
  
  -- Verificar se email já existe
  IF EXISTS(SELECT 1 FROM public.admins WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já cadastrado';
  END IF;
  
  -- Hash da senha
  v_hashed_key := public.hash_password(p_key);
  
  -- Criar master
  INSERT INTO public.admins (nome, email, key, rank, criado_por, creditos)
  VALUES (p_nome, p_email, v_hashed_key, 'master', p_creator_id, 0)
  RETURNING admins.id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$;


--
-- Name: create_reseller(integer, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_reseller(p_creator_id integer, p_session_token text, p_nome text, p_email text, p_key text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_rank text;
  v_new_id integer;
  v_hashed_key text;
BEGIN
  -- Validar sessão
  IF NOT public.is_valid_admin(p_creator_id, p_session_token) THEN
    RAISE EXCEPTION 'Sessão inválida';
  END IF;
  
  -- Verificar se é master
  SELECT rank INTO v_rank FROM public.admins WHERE id = p_creator_id;
  IF v_rank != 'master' THEN
    RAISE EXCEPTION 'Apenas masters podem criar revendedores';
  END IF;
  
  -- Verificar se email já existe
  IF EXISTS(SELECT 1 FROM public.admins WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email já cadastrado';
  END IF;
  
  -- Hash da senha
  v_hashed_key := public.hash_password(p_key);
  
  -- Criar revendedor
  INSERT INTO public.admins (nome, email, key, rank, criado_por, creditos)
  VALUES (p_nome, p_email, v_hashed_key, 'revendedor', p_creator_id, 0)
  RETURNING admins.id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$;


--
-- Name: get_admin_balance(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_admin_balance(p_admin_id integer, p_session_token text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_credits integer;
BEGIN
  -- Validar sessão
  IF NOT public.is_valid_admin(p_admin_id, p_session_token) THEN
    RETURN NULL;
  END IF;
  
  SELECT creditos INTO v_credits FROM public.admins WHERE id = p_admin_id;
  RETURN v_credits;
END;
$$;


--
-- Name: get_admin_by_id(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_admin_by_id(p_admin_id integer, p_session_token text) RETURNS TABLE(id integer, nome character varying, email character varying, creditos integer, rank text, profile_photo text, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Validar sessão primeiro
  IF NOT public.is_valid_admin(p_admin_id, p_session_token) THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    a.id, a.nome, a.email, a.creditos, a.rank, a.profile_photo, a.created_at
  FROM public.admins a
  WHERE a.id = p_admin_id;
END;
$$;


--
-- Name: get_admin_rank(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_admin_rank(p_admin_id integer) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT rank FROM public.admins WHERE id = p_admin_id
$$;


--
-- Name: get_all_masters(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_all_masters(p_admin_id integer, p_session_token text) RETURNS TABLE(id integer, nome character varying, email character varying, creditos integer, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_rank text;
BEGIN
  -- Validar sessão
  IF NOT public.is_valid_admin(p_admin_id, p_session_token) THEN
    RETURN;
  END IF;
  
  -- Verificar se é dono
  SELECT rank INTO v_rank FROM public.admins WHERE admins.id = p_admin_id;
  IF v_rank != 'dono' THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    a.id, a.nome, a.email, a.creditos, a.created_at
  FROM public.admins a
  WHERE a.rank = 'master'
  ORDER BY a.created_at DESC;
END;
$$;


--
-- Name: get_dashboard_stats(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_dashboard_stats(p_admin_id integer, p_session_token text) RETURNS TABLE(total_masters bigint, total_resellers bigint, total_credits bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_rank text;
BEGIN
  -- Validar sessão
  IF NOT public.is_valid_admin(p_admin_id, p_session_token) THEN
    RETURN;
  END IF;
  
  -- Verificar se é dono
  SELECT rank INTO v_rank FROM public.admins WHERE id = p_admin_id;
  IF v_rank != 'dono' THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    (SELECT COUNT(*) FROM public.admins WHERE rank = 'master'),
    (SELECT COUNT(*) FROM public.admins WHERE rank = 'revendedor'),
    (SELECT COALESCE(SUM(creditos), 0) FROM public.admins);
END;
$$;


--
-- Name: get_price_tiers(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_price_tiers(p_admin_id integer, p_session_token text) RETURNS TABLE(id integer, min_qty integer, max_qty integer, price numeric, is_active boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Validar sessão
  IF NOT public.is_valid_admin(p_admin_id, p_session_token) THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    pt.id, pt.min_qty, pt.max_qty, pt.price, pt.is_active
  FROM public.price_tiers pt
  WHERE pt.is_active = true
  ORDER BY pt.min_qty;
END;
$$;


--
-- Name: get_resellers_by_master(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_resellers_by_master(p_master_id integer, p_session_token text) RETURNS TABLE(id integer, nome character varying, email character varying, creditos integer, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Validar sessão
  IF NOT public.is_valid_admin(p_master_id, p_session_token) THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    a.id, a.nome, a.email, a.creditos, a.created_at
  FROM public.admins a
  WHERE a.criado_por = p_master_id AND a.rank = 'revendedor'
  ORDER BY a.created_at DESC;
END;
$$;


--
-- Name: hash_password(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.hash_password(p_password text) RETURNS text
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
  SELECT crypt(p_password, gen_salt('bf', 10));
$$;


--
-- Name: is_valid_admin(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_valid_admin(p_admin_id integer, p_session_token text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_valid boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.admins
    WHERE id = p_admin_id AND session_token = p_session_token
  ) INTO v_valid;
  
  IF v_valid THEN
    UPDATE public.admins SET last_active = now() WHERE id = p_admin_id;
  END IF;
  
  RETURN v_valid;
END;
$$;


--
-- Name: logout_admin(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.logout_admin(p_admin_id integer) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.admins
  SET session_token = NULL
  WHERE id = p_admin_id;
  
  RETURN FOUND;
END;
$$;


--
-- Name: recharge_credits(integer, integer, numeric, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recharge_credits(p_admin_id integer, p_amount integer, p_unit_price numeric, p_total_price numeric) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.admins SET creditos = creditos + p_amount, last_active = NOW() WHERE id = p_admin_id;
  
  INSERT INTO public.credit_transactions (to_admin_id, amount, unit_price, total_price, transaction_type)
  VALUES (p_admin_id, p_amount, p_unit_price, p_total_price, 'recharge');
  
  RETURN TRUE;
END;
$$;


--
-- Name: search_admins(integer, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_admins(p_admin_id integer, p_session_token text, p_query text) RETURNS TABLE(id integer, nome character varying, email character varying, creditos integer, rank text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Validar sessão
  IF NOT public.is_valid_admin(p_admin_id, p_session_token) THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    a.id, a.nome, a.email, a.creditos, a.rank
  FROM public.admins a
  WHERE a.nome ILIKE '%' || p_query || '%' 
     OR a.email ILIKE '%' || p_query || '%'
  LIMIT 20;
END;
$$;


--
-- Name: set_admin_pin(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_admin_pin(p_admin_id integer, p_pin text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_hashed_pin text;
BEGIN
  -- Hash do PIN
  v_hashed_pin := public.hash_password(p_pin);
  
  UPDATE public.admins
  SET pin = v_hashed_pin
  WHERE id = p_admin_id;
  
  RETURN FOUND;
END;
$$;


--
-- Name: transfer_credits(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.transfer_credits(p_from_admin_id integer, p_to_admin_id integer, p_amount integer) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_from_balance INTEGER;
  v_from_rank TEXT;
  v_to_criado_por INTEGER;
BEGIN
  -- Validar quantidade mínima de 3 créditos
  IF p_amount < 3 THEN
    RAISE EXCEPTION 'Quantidade mínima para transferência é 3 créditos';
  END IF;

  -- Verificar se o admin de origem existe e obter seu rank
  SELECT creditos, rank INTO v_from_balance, v_from_rank
  FROM public.admins 
  WHERE id = p_from_admin_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin de origem não encontrado';
  END IF;
  
  -- Verificar se o admin de destino existe e foi criado pelo remetente (para master->revendedor)
  SELECT criado_por INTO v_to_criado_por
  FROM public.admins 
  WHERE id = p_to_admin_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin de destino não encontrado';
  END IF;
  
  -- Verificar permissão: master só pode transferir para seus revendedores
  IF v_from_rank = 'master' AND v_to_criado_por != p_from_admin_id THEN
    RAISE EXCEPTION 'Você só pode transferir para seus próprios revendedores';
  END IF;
  
  -- Verificar saldo suficiente
  IF v_from_balance < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;
  
  -- Debitar do remetente
  UPDATE public.admins 
  SET creditos = creditos - p_amount, last_active = NOW() 
  WHERE id = p_from_admin_id;
  
  -- Creditar ao destinatário
  UPDATE public.admins 
  SET creditos = creditos + p_amount, last_active = NOW() 
  WHERE id = p_to_admin_id;
  
  -- Registrar transação
  INSERT INTO public.credit_transactions (from_admin_id, to_admin_id, amount, transaction_type)
  VALUES (p_from_admin_id, p_to_admin_id, p_amount, 'transfer');
  
  RETURN TRUE;
END;
$$;


--
-- Name: validate_login(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_login(p_email text, p_key text) RETURNS TABLE(id integer, nome character varying, email character varying, creditos integer, rank text, profile_photo text, has_pin boolean, session_token text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_admin record;
  v_new_token text;
BEGIN
  -- Buscar admin por email
  SELECT a.id, a.nome, a.email, a.creditos, a.rank, a.profile_photo, a.key,
         (a.pin IS NOT NULL AND a.pin != '') as has_pin
  INTO v_admin
  FROM public.admins a
  WHERE a.email = p_email;
  
  IF v_admin IS NULL THEN
    RETURN;
  END IF;
  
  -- Verificar senha: suporta tanto hash bcrypt quanto texto plano (para migração)
  IF NOT (
    -- Verificar como hash bcrypt (senhas já migradas)
    (v_admin.key LIKE '$2a$%' OR v_admin.key LIKE '$2b$%') AND public.verify_password(p_key, v_admin.key)
    OR
    -- Verificar como texto plano (senhas antigas - será migrado automaticamente)
    (NOT (v_admin.key LIKE '$2a$%' OR v_admin.key LIKE '$2b$%') AND v_admin.key = p_key)
  ) THEN
    RETURN;
  END IF;
  
  -- Se senha está em texto plano, migrar para hash automaticamente
  IF NOT (v_admin.key LIKE '$2a$%' OR v_admin.key LIKE '$2b$%') THEN
    UPDATE public.admins 
    SET key = public.hash_password(p_key)
    WHERE admins.id = v_admin.id;
  END IF;
  
  -- Gerar novo token de sessão usando gen_random_uuid (nativo)
  v_new_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  
  -- Atualizar token de sessão e last_active
  UPDATE public.admins 
  SET session_token = v_new_token, last_active = now()
  WHERE admins.id = v_admin.id;
  
  -- Retornar dados
  RETURN QUERY SELECT 
    v_admin.id,
    v_admin.nome,
    v_admin.email,
    v_admin.creditos,
    v_admin.rank,
    v_admin.profile_photo,
    v_admin.has_pin,
    v_new_token;
END;
$_$;


--
-- Name: validate_pin(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_pin(p_admin_id integer, p_pin text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_stored_pin text;
BEGIN
  SELECT pin INTO v_stored_pin
  FROM public.admins
  WHERE id = p_admin_id;
  
  IF v_stored_pin IS NULL OR v_stored_pin = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar: suporta hash bcrypt e texto plano (para migração)
  IF v_stored_pin LIKE '$2a$%' OR v_stored_pin LIKE '$2b$%' THEN
    -- PIN com hash
    RETURN public.verify_password(p_pin, v_stored_pin);
  ELSE
    -- PIN em texto plano (legado)
    IF v_stored_pin = p_pin THEN
      -- Migrar para hash
      UPDATE public.admins 
      SET pin = public.hash_password(p_pin)
      WHERE id = p_admin_id;
      RETURN TRUE;
    END IF;
    RETURN FALSE;
  END IF;
END;
$_$;


--
-- Name: verify_password(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_password(p_password text, p_hash text) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
  SELECT p_hash = crypt(p_password, p_hash);
$$;


SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    key character varying(255) NOT NULL,
    creditos integer DEFAULT 0 NOT NULL,
    rank text DEFAULT 'revendedor'::text,
    session_token text,
    last_active timestamp with time zone DEFAULT now(),
    ip_address text,
    profile_photo text,
    created_at timestamp with time zone DEFAULT now(),
    criado_por integer,
    pin text
);


--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: credit_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_transactions (
    id integer NOT NULL,
    from_admin_id integer,
    to_admin_id integer NOT NULL,
    amount integer NOT NULL,
    unit_price numeric(10,2),
    total_price numeric(10,2),
    transaction_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.credit_transactions REPLICA IDENTITY FULL;


--
-- Name: credit_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.credit_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: credit_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.credit_transactions_id_seq OWNED BY public.credit_transactions.id;


--
-- Name: monthly_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_goals (
    id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    target_revenue numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: monthly_goals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.monthly_goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: monthly_goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.monthly_goals_id_seq OWNED BY public.monthly_goals.id;


--
-- Name: pix_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pix_payments (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    admin_name text NOT NULL,
    transaction_id text NOT NULL,
    amount numeric(10,2) NOT NULL,
    credits integer NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    paid_at timestamp with time zone
);


--
-- Name: pix_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pix_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pix_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pix_payments_id_seq OWNED BY public.pix_payments.id;


--
-- Name: price_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_tiers (
    id integer NOT NULL,
    min_qty integer NOT NULL,
    max_qty integer,
    price numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: price_tiers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.price_tiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: price_tiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.price_tiers_id_seq OWNED BY public.price_tiers.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: credit_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_transactions ALTER COLUMN id SET DEFAULT nextval('public.credit_transactions_id_seq'::regclass);


--
-- Name: monthly_goals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_goals ALTER COLUMN id SET DEFAULT nextval('public.monthly_goals_id_seq'::regclass);


--
-- Name: pix_payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pix_payments ALTER COLUMN id SET DEFAULT nextval('public.pix_payments_id_seq'::regclass);


--
-- Name: price_tiers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_tiers ALTER COLUMN id SET DEFAULT nextval('public.price_tiers_id_seq'::regclass);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: credit_transactions credit_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT credit_transactions_pkey PRIMARY KEY (id);


--
-- Name: monthly_goals monthly_goals_month_year_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_goals
    ADD CONSTRAINT monthly_goals_month_year_unique UNIQUE (month, year);


--
-- Name: monthly_goals monthly_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_goals
    ADD CONSTRAINT monthly_goals_pkey PRIMARY KEY (id);


--
-- Name: monthly_goals monthly_goals_year_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_goals
    ADD CONSTRAINT monthly_goals_year_month_key UNIQUE (year, month);


--
-- Name: pix_payments pix_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pix_payments
    ADD CONSTRAINT pix_payments_pkey PRIMARY KEY (id);


--
-- Name: pix_payments pix_payments_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pix_payments
    ADD CONSTRAINT pix_payments_transaction_id_key UNIQUE (transaction_id);


--
-- Name: price_tiers price_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_tiers
    ADD CONSTRAINT price_tiers_pkey PRIMARY KEY (id);


--
-- Name: idx_pix_payments_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pix_payments_admin_id ON public.pix_payments USING btree (admin_id);


--
-- Name: idx_pix_payments_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pix_payments_transaction_id ON public.pix_payments USING btree (transaction_id);


--
-- Name: admins admins_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.admins(id) ON DELETE SET NULL;


--
-- Name: credit_transactions credit_transactions_from_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT credit_transactions_from_admin_id_fkey FOREIGN KEY (from_admin_id) REFERENCES public.admins(id) ON DELETE SET NULL;


--
-- Name: credit_transactions credit_transactions_to_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT credit_transactions_to_admin_id_fkey FOREIGN KEY (to_admin_id) REFERENCES public.admins(id) ON DELETE CASCADE;


--
-- Name: pix_payments pix_payments_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pix_payments
    ADD CONSTRAINT pix_payments_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE;


--
-- Name: admins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

--
-- Name: admins admins_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_delete_policy ON public.admins FOR DELETE USING (false);


--
-- Name: admins admins_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_insert_policy ON public.admins FOR INSERT WITH CHECK (false);


--
-- Name: admins admins_select_service_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_select_service_only ON public.admins FOR SELECT USING (false);


--
-- Name: admins admins_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_update_policy ON public.admins FOR UPDATE USING (false);


--
-- Name: credit_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: monthly_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: monthly_goals monthly_goals_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY monthly_goals_insert_policy ON public.monthly_goals FOR INSERT WITH CHECK (false);


--
-- Name: monthly_goals monthly_goals_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY monthly_goals_select_policy ON public.monthly_goals FOR SELECT USING (false);


--
-- Name: monthly_goals monthly_goals_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY monthly_goals_update_policy ON public.monthly_goals FOR UPDATE USING (false);


--
-- Name: pix_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pix_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: pix_payments pix_payments_insert_service; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pix_payments_insert_service ON public.pix_payments FOR INSERT WITH CHECK (true);


--
-- Name: pix_payments pix_payments_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pix_payments_select_all ON public.pix_payments FOR SELECT USING (true);


--
-- Name: pix_payments pix_payments_update_service; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pix_payments_update_service ON public.pix_payments FOR UPDATE USING (true);


--
-- Name: price_tiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;

--
-- Name: price_tiers price_tiers_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY price_tiers_delete_policy ON public.price_tiers FOR DELETE USING (false);


--
-- Name: price_tiers price_tiers_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY price_tiers_insert_policy ON public.price_tiers FOR INSERT WITH CHECK (false);


--
-- Name: price_tiers price_tiers_select_service_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY price_tiers_select_service_only ON public.price_tiers FOR SELECT USING (false);


--
-- Name: price_tiers price_tiers_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY price_tiers_update_policy ON public.price_tiers FOR UPDATE USING (false);


--
-- Name: credit_transactions transactions_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY transactions_insert_policy ON public.credit_transactions FOR INSERT WITH CHECK (false);


--
-- Name: credit_transactions transactions_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY transactions_select_policy ON public.credit_transactions FOR SELECT USING (false);


--
-- PostgreSQL database dump complete
--




COMMIT;