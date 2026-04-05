
-- Adicionar coluna creditos_transf na tabela admins
-- creditos = uso pessoal (gerar documentos)
-- creditos_transf = saldo para transferir aos revendedores (apenas masters)
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS creditos_transf integer NOT NULL DEFAULT 0;

-- Comentário para documentação
COMMENT ON COLUMN public.admins.creditos_transf IS 'Saldo de créditos para transferência a revendedores (usado por masters)';
