
-- Create carteira_estudante table (mirrors MySQL structure)
CREATE TABLE IF NOT EXISTS public.carteira_estudante (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  senha TEXT NOT NULL,
  rg TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  faculdade TEXT NOT NULL,
  graduacao TEXT NOT NULL,
  perfil_imagem TEXT DEFAULT NULL,
  admin_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  qrcode VARCHAR(255) DEFAULT NULL,
  data_expiracao TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '45 days')
);

-- Enable RLS
ALTER TABLE public.carteira_estudante ENABLE ROW LEVEL SECURITY;

-- RLS policies (service-role only, same pattern as other tables)
CREATE POLICY "carteira_estudante_select_service" ON public.carteira_estudante
  FOR SELECT USING (false);

CREATE POLICY "carteira_estudante_insert_service" ON public.carteira_estudante
  FOR INSERT WITH CHECK (false);

CREATE POLICY "carteira_estudante_update_service" ON public.carteira_estudante
  FOR UPDATE USING (false);

CREATE POLICY "carteira_estudante_delete_service" ON public.carteira_estudante
  FOR DELETE USING (false);
