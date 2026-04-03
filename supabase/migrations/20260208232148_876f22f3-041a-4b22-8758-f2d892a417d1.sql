
-- Create RG Digital table
CREATE TABLE public.usuarios_rg (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  cpf VARCHAR(11) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  nome_social VARCHAR(200),
  senha VARCHAR(20),
  data_nascimento VARCHAR(20),
  naturalidade VARCHAR(100),
  genero VARCHAR(20),
  nacionalidade VARCHAR(10) DEFAULT 'BRA',
  validade VARCHAR(20),
  uf VARCHAR(2),
  data_emissao VARCHAR(20),
  local_emissao VARCHAR(100),
  orgao_expedidor VARCHAR(50),
  pai VARCHAR(200),
  mae VARCHAR(200),
  foto_url TEXT,
  assinatura_url TEXT,
  rg_frente_url TEXT,
  rg_verso_url TEXT,
  qrcode_url TEXT,
  pdf_url TEXT,
  data_expiracao TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '45 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.usuarios_rg ENABLE ROW LEVEL SECURITY;

-- Policies (same pattern as usuarios - using service role via edge functions)
CREATE POLICY "Allow all for service role" ON public.usuarios_rg
  FOR ALL USING (true) WITH CHECK (true);

-- Index on CPF
CREATE INDEX idx_usuarios_rg_cpf ON public.usuarios_rg (cpf);
CREATE INDEX idx_usuarios_rg_admin_id ON public.usuarios_rg (admin_id);

-- Trigger for updated_at
CREATE TRIGGER update_usuarios_rg_updated_at
  BEFORE UPDATE ON public.usuarios_rg
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
