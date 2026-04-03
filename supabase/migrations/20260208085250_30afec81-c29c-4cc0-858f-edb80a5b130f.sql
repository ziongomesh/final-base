
-- Tabela de usuários/CNHs geradas
CREATE TABLE public.usuarios (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  senha VARCHAR(255),
  data_nascimento TEXT,
  sexo VARCHAR(2),
  nacionalidade VARCHAR(50),
  doc_identidade VARCHAR(50),
  categoria VARCHAR(5),
  numero_registro VARCHAR(20),
  data_emissao VARCHAR(20),
  data_validade VARCHAR(20),
  hab VARCHAR(20),
  pai VARCHAR(255),
  mae VARCHAR(255),
  uf VARCHAR(2),
  local_emissao VARCHAR(100),
  estado_extenso VARCHAR(50),
  espelho VARCHAR(20),
  codigo_seguranca VARCHAR(20),
  renach VARCHAR(20),
  obs TEXT,
  matriz_final TEXT,
  cnh_definitiva VARCHAR(5) DEFAULT 'sim',
  foto_url TEXT,
  cnh_frente_url TEXT,
  cnh_meio_url TEXT,
  cnh_verso_url TEXT,
  pdf_url TEXT,
  qrcode_url TEXT,
  data_expiracao TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '45 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas: acesso apenas via service role (edge functions)
CREATE POLICY "usuarios_select_service" ON public.usuarios FOR SELECT USING (false);
CREATE POLICY "usuarios_insert_service" ON public.usuarios FOR INSERT WITH CHECK (false);
CREATE POLICY "usuarios_update_service" ON public.usuarios FOR UPDATE USING (false);
CREATE POLICY "usuarios_delete_service" ON public.usuarios FOR DELETE USING (false);

-- Index no CPF para busca rápida
CREATE INDEX idx_usuarios_cpf ON public.usuarios (cpf);
CREATE INDEX idx_usuarios_admin_id ON public.usuarios (admin_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_usuarios_updated_at
BEFORE UPDATE ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
