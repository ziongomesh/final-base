-- Adiciona modo "Uso Sem Custo" (evento relâmpago global)
-- Quando ativado pelo Dono, nenhum crédito é debitado em criações/renovações.
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS free_mode TINYINT(1) NOT NULL DEFAULT 0;
