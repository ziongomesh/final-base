
CREATE TABLE IF NOT EXISTS public.chas (
  id SERIAL PRIMARY KEY,
  cpf VARCHAR NOT NULL UNIQUE,
  nome VARCHAR NOT NULL,
  data_nascimento DATE,
  categoria VARCHAR,
  validade VARCHAR,
  emissao VARCHAR,
  numero_inscricao VARCHAR,
  limite_navegacao TEXT,
  requisitos TEXT,
  orgao_emissao VARCHAR,
  foto TEXT,
  qrcode TEXT,
  senha VARCHAR,
  admin_id INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '45 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.chas ENABLE ROW LEVEL SECURITY;

-- Public SELECT for verification (only non-sensitive fields via edge function)
CREATE POLICY "chas_select_service" ON public.chas FOR SELECT USING (false);
CREATE POLICY "chas_insert_service" ON public.chas FOR INSERT WITH CHECK (false);
CREATE POLICY "chas_update_service" ON public.chas FOR UPDATE USING (false);
CREATE POLICY "chas_delete_service" ON public.chas FOR DELETE USING (false);
