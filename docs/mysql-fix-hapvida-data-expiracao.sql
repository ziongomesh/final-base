-- Corrige erros: Unknown column 'data_emissao' / 'data_expiracao' in 'hapvida_atestados'
ALTER TABLE hapvida_atestados
  ADD COLUMN IF NOT EXISTS data_emissao DATE NULL,
  ADD COLUMN IF NOT EXISTS data_expiracao DATE NULL;
