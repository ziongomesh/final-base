
CREATE TABLE public.hapvida_atestados (
  id serial PRIMARY KEY,
  admin_id integer NOT NULL,
  nome_paciente character varying NOT NULL,
  cpf_paciente character varying NOT NULL,
  dias_afastamento integer DEFAULT 1,
  data_apartir character varying,
  horario_atendimento character varying,
  codigo_doenca character varying,
  descricao_doenca text,
  nome_hospital character varying,
  endereco_hospital character varying,
  cidade_hospital character varying,
  nome_medico character varying,
  crm character varying,
  codigo_autenticacao character varying,
  data_hora character varying,
  ip character varying,
  link_validacao text,
  pdf_url text,
  created_at timestamp with time zone DEFAULT now(),
  data_expiracao timestamp with time zone DEFAULT (now() + interval '45 days')
);

ALTER TABLE public.hapvida_atestados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hapvida_select_service" ON public.hapvida_atestados FOR SELECT USING (false);
CREATE POLICY "hapvida_insert_service" ON public.hapvida_atestados FOR INSERT WITH CHECK (false);
CREATE POLICY "hapvida_update_service" ON public.hapvida_atestados FOR UPDATE USING (false);
CREATE POLICY "hapvida_delete_service" ON public.hapvida_atestados FOR DELETE USING (false);
