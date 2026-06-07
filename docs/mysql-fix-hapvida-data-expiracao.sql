-- Corrige o erro: Unknown column 'data_expiracao' in 'field list'
-- Rode este SQL no banco MySQL local.

ALTER TABLE hapvida_atestados
  ADD COLUMN IF NOT EXISTS data_expiracao DATE NULL AFTER data_emissao;
