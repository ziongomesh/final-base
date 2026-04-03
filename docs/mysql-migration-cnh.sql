-- =====================================================
-- MIGRAÇÃO: Adaptar tabela `usuarios` para compatibilidade
-- com o schema do Supabase (CNH Digital 2026)
-- =====================================================
-- Execute este script no MySQL ANTES de usar o backend Node.js
-- para o módulo CNH Digital.
-- =====================================================

-- Adicionar colunas que existem no Supabase mas não no MySQL original
-- (usando IF NOT EXISTS via procedimento)

-- Coluna: nacionalidade
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'nacionalidade') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `nacionalidade` VARCHAR(100) DEFAULT NULL AFTER `sexo`',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coluna: local_emissao
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'local_emissao') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `local_emissao` VARCHAR(255) DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coluna: estado_extenso
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'estado_extenso') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `estado_extenso` VARCHAR(100) DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coluna: espelho
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'espelho') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `espelho` VARCHAR(50) DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coluna: matriz_final
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'matriz_final') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `matriz_final` TEXT DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coluna: cnh_definitiva
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'cnh_definitiva') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `cnh_definitiva` VARCHAR(10) DEFAULT ''sim''',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coluna: cnh_frente_url (substituir foto1)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'cnh_frente_url') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `cnh_frente_url` TEXT DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coluna: cnh_meio_url (substituir foto2)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'cnh_meio_url') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `cnh_meio_url` TEXT DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coluna: cnh_verso_url (substituir foto3)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'cnh_verso_url') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `cnh_verso_url` TEXT DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coluna: foto_url (foto do perfil/3x4)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'foto_url') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `foto_url` TEXT DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coluna: pdf_url
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'pdf_url') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `pdf_url` TEXT DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coluna: qrcode_url
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'qrcode_url') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `qrcode_url` TEXT DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coluna: updated_at
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'updated_at') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coluna: pai (se não existir como TEXT)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'pai') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `pai` TEXT DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Coluna: mae (se não existir como TEXT)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'mae') = 0,
  'ALTER TABLE `usuarios` ADD COLUMN `mae` TEXT DEFAULT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Migrar dados antigos: copiar foto1→cnh_frente_url, foto2→cnh_meio_url, foto3→cnh_verso_url, foto→foto_url
UPDATE `usuarios` SET 
  cnh_frente_url = COALESCE(cnh_frente_url, foto1),
  cnh_meio_url = COALESCE(cnh_meio_url, foto2),
  cnh_verso_url = COALESCE(cnh_verso_url, foto3),
  foto_url = COALESCE(foto_url, foto)
WHERE cnh_frente_url IS NULL AND foto1 IS NOT NULL;

-- =====================================================
-- PRONTO! Tabela usuarios atualizada.
-- Agora o backend Node.js pode usar as mesmas colunas
-- que o Supabase usa.
-- =====================================================
