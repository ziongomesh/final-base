-- ============================================================
-- Migration: Visibilidade Total (Revendedor / Master / Dono)
-- Data: 2026-06-19
-- ============================================================
-- Adiciona snapshot de saldo no momento que cada documento foi
-- criado, e cria tabela de histórico de logins para métricas de
-- frequência / atividade.
-- ============================================================

-- 1) Snapshot de saldo no momento da criação de cada documento
ALTER TABLE `usuarios`            ADD COLUMN `creditos_no_momento` INT NULL AFTER `admin_id`;
ALTER TABLE `rgs`                 ADD COLUMN `creditos_no_momento` INT NULL AFTER `admin_id`;
ALTER TABLE `usuarios_crlv`       ADD COLUMN `creditos_no_momento` INT NULL AFTER `admin_id`;
ALTER TABLE `chas`                ADD COLUMN `creditos_no_momento` INT NULL AFTER `admin_id`;
ALTER TABLE `carteira_estudante`  ADD COLUMN `creditos_no_momento` INT NULL AFTER `admin_id`;
ALTER TABLE `hapvida_atestados`   ADD COLUMN `creditos_no_momento` INT NULL AFTER `admin_id`;

-- 2) Histórico de logins (frequência de acesso, heatmap de atividade)
CREATE TABLE IF NOT EXISTS `admin_login_history` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `admin_id` INT(11) NOT NULL,
  `login_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_admin_login` (`admin_id`, `login_at`),
  KEY `idx_login_at` (`login_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Notas:
-- - Registros existentes de documentos terão `creditos_no_momento`
--   = NULL (UI mostra "—"). Não é possível fazer backfill com
--   precisão pois o saldo histórico não foi gravado.
-- - admin_login_history começa vazia; a partir do próximo deploy,
--   cada login bem-sucedido grava uma linha automaticamente.
-- ============================================================
