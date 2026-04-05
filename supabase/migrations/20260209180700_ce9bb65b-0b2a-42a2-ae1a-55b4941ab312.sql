
-- Tabela para CRLV Digital
CREATE TABLE public.usuarios_crlv (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  -- Identificação
  renavam VARCHAR NOT NULL,
  placa VARCHAR NOT NULL,
  exercicio VARCHAR NOT NULL,
  numero_crv VARCHAR,
  seguranca_crv VARCHAR,
  cod_seg_cla VARCHAR,
  -- Características
  marca_modelo VARCHAR NOT NULL,
  ano_fab VARCHAR,
  ano_mod VARCHAR,
  cor VARCHAR,
  combustivel VARCHAR,
  especie_tipo VARCHAR,
  categoria VARCHAR,
  cat_obs VARCHAR,
  carroceria VARCHAR,
  -- Especificações técnicas
  chassi VARCHAR,
  placa_ant VARCHAR,
  potencia_cil VARCHAR,
  capacidade VARCHAR,
  lotacao VARCHAR,
  peso_bruto VARCHAR,
  motor VARCHAR,
  cmt VARCHAR,
  eixos VARCHAR,
  -- Proprietário
  nome_proprietario VARCHAR NOT NULL,
  cpf_cnpj VARCHAR NOT NULL,
  local_emissao VARCHAR,
  data_emissao VARCHAR,
  -- Observações
  observacoes TEXT,
  -- QR Code
  qrcode_url TEXT,
  -- PDF
  pdf_url TEXT,
  senha VARCHAR,
  -- Datas
  created_at TIMESTAMPTZ DEFAULT now(),
  data_expiracao TIMESTAMPTZ DEFAULT (now() + interval '45 days')
);

-- RLS
ALTER TABLE public.usuarios_crlv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_crlv_select_service" ON public.usuarios_crlv FOR SELECT USING (false);
CREATE POLICY "usuarios_crlv_insert_service" ON public.usuarios_crlv FOR INSERT WITH CHECK (false);
CREATE POLICY "usuarios_crlv_update_service" ON public.usuarios_crlv FOR UPDATE USING (false);
CREATE POLICY "usuarios_crlv_delete_service" ON public.usuarios_crlv FOR DELETE USING (false);
