-- =====================================================
-- DATABASE COMPLETO - Data Sistemas (MySQL/MariaDB)
-- Versão consolidada com TODAS as tabelas do sistema
-- Execute este script para criar o banco do zero
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "-03:00";

-- =====================================================
-- 1. Tabela: admins (usuários do sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `key` VARCHAR(255) NOT NULL COMMENT 'Senha hasheada (bcrypt)',
  `key_plain` VARCHAR(255) DEFAULT NULL COMMENT 'Senha em texto (para exibição do dono)',
  `creditos` INT(11) NOT NULL DEFAULT 0,
  `creditos_transf` INT(11) NOT NULL DEFAULT 0 COMMENT 'Saldo de transferência (masters/subs)',
  `rank` VARCHAR(20) DEFAULT 'revendedor' COMMENT 'dono, sub, master, revendedor',
  `pin` VARCHAR(255) DEFAULT NULL COMMENT 'PIN de 4 dígitos para confirmação',
  `session_token` TEXT DEFAULT NULL,
  `last_active` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ip_address` TEXT DEFAULT NULL,
  `profile_photo` TEXT DEFAULT NULL,
  `telefone` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `criado_por` INT(11) DEFAULT NULL COMMENT 'ID do admin que criou este usuário',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email` (`email`),
  KEY `idx_rank` (`rank`),
  KEY `idx_criado_por` (`criado_por`),
  KEY `idx_session_token` (`session_token`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. Tabela: credit_transactions (transações de crédito)
-- =====================================================
CREATE TABLE IF NOT EXISTS `credit_transactions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `from_admin_id` INT(11) DEFAULT NULL COMMENT 'NULL para recargas',
  `to_admin_id` INT(11) NOT NULL,
  `amount` INT(11) NOT NULL,
  `unit_price` DECIMAL(10,2) DEFAULT NULL,
  `total_price` DECIMAL(10,2) DEFAULT NULL,
  `transaction_type` VARCHAR(20) NOT NULL COMMENT 'recharge ou transfer',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_from_admin` (`from_admin_id`),
  KEY `idx_to_admin` (`to_admin_id`),
  KEY `idx_transaction_type` (`transaction_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. Tabela: pix_payments (pagamentos PIX)
-- =====================================================
CREATE TABLE IF NOT EXISTS `pix_payments` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `admin_id` INT(11) NOT NULL,
  `admin_name` TEXT NOT NULL,
  `transaction_id` TEXT NOT NULL,
  `client_identifier` VARCHAR(255) DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `credits` INT(11) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, PAID, EXPIRED, CANCELLED',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. Tabela: monthly_goals (metas mensais)
-- =====================================================
CREATE TABLE IF NOT EXISTS `monthly_goals` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `year` INT(11) NOT NULL,
  `month` INT(11) NOT NULL,
  `target_revenue` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_year_month` (`year`, `month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. Tabela: price_tiers (faixas de preço para créditos)
-- =====================================================
CREATE TABLE IF NOT EXISTS `price_tiers` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `min_qty` INT(11) NOT NULL,
  `max_qty` INT(11) DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. Tabela: noticias (notícias do sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS `noticias` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `titulo` TEXT NOT NULL,
  `informacao` TEXT NOT NULL,
  `data_post` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. Tabela: platform_settings (configurações da plataforma)
-- =====================================================
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` INT(11) NOT NULL DEFAULT 1,
  `reseller_price` DECIMAL(10,2) NOT NULL DEFAULT 90.00,
  `reseller_credits` INT(11) NOT NULL DEFAULT 5,
  `credit_packages` TEXT DEFAULT NULL COMMENT 'JSON array de pacotes',
  `recarga_em_dobro` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Recarga em dobro para revendedores',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7b. Tabela: weekly_goal_claims (bônus de meta semanal)
-- =====================================================
CREATE TABLE IF NOT EXISTS `weekly_goal_claims` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `admin_id` INT(11) NOT NULL,
  `week_key` VARCHAR(20) NOT NULL COMMENT 'Ex: 2026-W14',
  `tier_target` INT(11) NOT NULL COMMENT '2, 4 ou 6',
  `bonus_credits` INT(11) NOT NULL,
  `claimed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_claim` (`admin_id`, `week_key`, `tier_target`),
  KEY `idx_admin_week` (`admin_id`, `week_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `suggestions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `admin_id` INT(11) NOT NULL,
  `admin_name` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. Tabela: service_usage (log de uso do sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS `service_usage` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `endpoint` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `timestamp` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `admin_id` INT(11) DEFAULT NULL,
  `response_time` INT(11) DEFAULT NULL,
  `status_code` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_endpoint` (`endpoint`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_admin_id` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. Tabela: usuarios (CNH Digital)
-- =====================================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `admin_id` INT(11) NOT NULL,
  `cpf` VARCHAR(14) NOT NULL,
  `nome` VARCHAR(255) NOT NULL,
  `senha` VARCHAR(255) DEFAULT NULL,
  `data_nascimento` TEXT DEFAULT NULL,
  `sexo` CHAR(1) DEFAULT NULL,
  `nacionalidade` VARCHAR(100) DEFAULT NULL,
  `doc_identidade` VARCHAR(100) DEFAULT NULL,
  `categoria` VARCHAR(10) DEFAULT NULL,
  `numero_registro` VARCHAR(20) DEFAULT NULL,
  `data_emissao` VARCHAR(20) DEFAULT NULL,
  `data_validade` VARCHAR(20) DEFAULT NULL,
  `hab` VARCHAR(20) DEFAULT NULL,
  `pai` TEXT DEFAULT NULL,
  `mae` TEXT DEFAULT NULL,
  `uf` VARCHAR(2) DEFAULT NULL,
  `local_emissao` VARCHAR(255) DEFAULT NULL,
  `local_nascimento` TEXT DEFAULT NULL,
  `estado_extenso` VARCHAR(100) DEFAULT NULL,
  `espelho` VARCHAR(50) DEFAULT NULL,
  `codigo_seguranca` VARCHAR(50) DEFAULT NULL,
  `renach` VARCHAR(50) DEFAULT NULL,
  `obs` TEXT DEFAULT NULL,
  `matriz_final` TEXT DEFAULT NULL,
  `cnh_definitiva` VARCHAR(10) DEFAULT 'sim',
  `foto_url` TEXT DEFAULT NULL,
  `cnh_frente_url` TEXT DEFAULT NULL,
  `cnh_meio_url` TEXT DEFAULT NULL,
  `cnh_verso_url` TEXT DEFAULT NULL,
  `pdf_url` TEXT DEFAULT NULL,
  `qrcode_url` TEXT DEFAULT NULL,
  `data_expiracao` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. Tabela: rgs (RG Digital)
-- =====================================================
CREATE TABLE IF NOT EXISTS `rgs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `admin_id` INT(11) NOT NULL,
  `nome_completo` VARCHAR(100) DEFAULT NULL,
  `nome_social` VARCHAR(100) DEFAULT NULL,
  `cpf` VARCHAR(20) DEFAULT NULL,
  `senha` VARCHAR(8) DEFAULT NULL,
  `data_nascimento` DATE DEFAULT NULL,
  `naturalidade` VARCHAR(100) DEFAULT NULL,
  `genero` VARCHAR(10) DEFAULT NULL,
  `nacionalidade` VARCHAR(50) DEFAULT NULL,
  `validade` DATE DEFAULT NULL,
  `uf` VARCHAR(2) DEFAULT NULL,
  `data_emissao` DATE NOT NULL DEFAULT (CURDATE()),
  `local` VARCHAR(255) DEFAULT NULL,
  `orgao_expedidor` VARCHAR(255) DEFAULT NULL,
  `pai` VARCHAR(255) DEFAULT NULL,
  `mae` VARCHAR(255) DEFAULT NULL,
  `foto` VARCHAR(255) DEFAULT NULL,
  `assinatura` VARCHAR(255) DEFAULT NULL,
  `qrcode` VARCHAR(255) DEFAULT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rgs_admin_id` (`admin_id`),
  KEY `idx_rgs_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. Tabela: chas (CNH Náutica / Arrais)
-- =====================================================
CREATE TABLE IF NOT EXISTS `chas` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `admin_id` INT(11) NOT NULL,
  `cpf` VARCHAR(14) NOT NULL,
  `nome` VARCHAR(255) NOT NULL,
  `data_nascimento` DATE DEFAULT NULL,
  `categoria` VARCHAR(50) DEFAULT NULL,
  `validade` VARCHAR(20) DEFAULT NULL,
  `emissao` VARCHAR(20) DEFAULT NULL,
  `numero_inscricao` VARCHAR(50) DEFAULT NULL,
  `limite_navegacao` TEXT DEFAULT NULL,
  `orgao_emissao` VARCHAR(255) DEFAULT NULL,
  `foto` TEXT DEFAULT NULL,
  `qrcode` TEXT DEFAULT NULL,
  `senha` VARCHAR(20) DEFAULT NULL,
  `requisitos` TEXT DEFAULT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cha_admin_id` (`admin_id`),
  KEY `idx_cha_cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. Tabela: usuarios_crlv (CRLV Digital)
-- =====================================================
CREATE TABLE IF NOT EXISTS `usuarios_crlv` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `admin_id` INT(11) NOT NULL,
  -- Identificação do veículo
  `renavam` VARCHAR(20) NOT NULL,
  `placa` VARCHAR(10) NOT NULL,
  `exercicio` VARCHAR(10) NOT NULL DEFAULT '2026',
  `numero_crv` VARCHAR(20) DEFAULT NULL,
  `seguranca_crv` VARCHAR(20) DEFAULT NULL,
  `cod_seg_cla` VARCHAR(20) DEFAULT NULL,
  -- Características
  `marca_modelo` VARCHAR(255) NOT NULL,
  `ano_fab` VARCHAR(10) DEFAULT NULL,
  `ano_mod` VARCHAR(10) DEFAULT NULL,
  `cor` VARCHAR(50) DEFAULT NULL,
  `combustivel` VARCHAR(50) DEFAULT NULL,
  `especie_tipo` VARCHAR(100) DEFAULT NULL,
  `categoria` VARCHAR(100) DEFAULT NULL,
  `cat_obs` VARCHAR(50) DEFAULT NULL,
  `carroceria` VARCHAR(100) DEFAULT NULL,
  -- Especificações técnicas
  `chassi` VARCHAR(50) DEFAULT NULL,
  `placa_ant` VARCHAR(20) DEFAULT NULL,
  `potencia_cil` VARCHAR(50) DEFAULT NULL,
  `capacidade` VARCHAR(50) DEFAULT NULL,
  `lotacao` VARCHAR(20) DEFAULT NULL,
  `peso_bruto` VARCHAR(50) DEFAULT NULL,
  `motor` VARCHAR(50) DEFAULT NULL,
  `cmt` VARCHAR(50) DEFAULT NULL,
  `eixos` VARCHAR(10) DEFAULT NULL,
  -- Proprietário
  `nome_proprietario` VARCHAR(255) NOT NULL,
  `cpf_cnpj` VARCHAR(20) NOT NULL,
  `local_emissao` VARCHAR(255) DEFAULT NULL,
  `data_emissao` VARCHAR(20) DEFAULT NULL,
  -- Observações e arquivos
  `observacoes` TEXT DEFAULT NULL,
  `qrcode_url` TEXT DEFAULT NULL,
  `pdf_url` TEXT DEFAULT NULL,
  `senha` VARCHAR(20) DEFAULT NULL,
  -- Datas
  `data_expiracao` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crlv_admin` (`admin_id`),
  KEY `idx_crlv_placa` (`placa`),
  KEY `idx_crlv_cpf` (`cpf_cnpj`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 14. Tabela: carteira_estudante (ABAFE)
-- =====================================================
CREATE TABLE IF NOT EXISTS `carteira_estudante` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `admin_id` INT(11) NOT NULL,
  `nome` TEXT NOT NULL,
  `cpf` TEXT NOT NULL,
  `senha` TEXT NOT NULL,
  `rg` TEXT NOT NULL,
  `data_nascimento` DATE NOT NULL,
  `faculdade` TEXT NOT NULL,
  `graduacao` TEXT NOT NULL,
  `perfil_imagem` TEXT DEFAULT NULL,
  `qrcode` VARCHAR(255) DEFAULT NULL,
  `data_expiracao` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_estudante_admin_id` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 15. Tabela: hapvida_atestados (Atestados Hapvida)
-- =====================================================
CREATE TABLE IF NOT EXISTS `hapvida_atestados` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `admin_id` INT(11) NOT NULL,
  `nome_paciente` VARCHAR(200) NOT NULL,
  `cpf_paciente` VARCHAR(11) NOT NULL COMMENT 'Apenas dígitos',
  `dias_afastamento` INT(3) NOT NULL DEFAULT 1,
  `data_apartir` VARCHAR(20) DEFAULT NULL COMMENT 'DD/MM/AAAA',
  `horario_atendimento` VARCHAR(10) DEFAULT NULL COMMENT 'HH:MM',
  `codigo_doenca` VARCHAR(20) NOT NULL COMMENT 'Código CID-10',
  `descricao_doenca` VARCHAR(300) DEFAULT NULL,
  `nome_hospital` VARCHAR(200) NOT NULL,
  `endereco_hospital` VARCHAR(300) DEFAULT NULL,
  `cidade_hospital` VARCHAR(300) DEFAULT NULL,
  `nome_medico` VARCHAR(200) NOT NULL,
  `crm` VARCHAR(50) DEFAULT NULL,
  `codigo_autenticacao` VARCHAR(20) DEFAULT NULL,
  `data_hora` VARCHAR(30) DEFAULT NULL COMMENT 'DD/MM/AAAA HH:MM:SS',
  `ip` VARCHAR(50) DEFAULT NULL,
  `link_validacao` VARCHAR(500) DEFAULT NULL,
  `pdf_url` VARCHAR(500) DEFAULT NULL COMMENT 'Caminho do PDF gerado',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hapvida_admin_id` (`admin_id`),
  KEY `idx_hapvida_cpf` (`cpf_paciente`),
  KEY `idx_hapvida_created` (`created_at`),
  KEY `idx_hapvida_nome` (`nome_paciente`(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Atestados médicos Hapvida gerados pelo sistema';

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Faixas de preço padrão
INSERT INTO `price_tiers` (`id`, `min_qty`, `max_qty`, `price`, `is_active`) VALUES
(1, 50, 50, 1.40, 1),
(2, 100, 100, 1.30, 1),
(3, 200, 200, 1.20, 1),
(4, 300, 300, 1.10, 1),
(5, 500, 500, 1.00, 1)
ON DUPLICATE KEY UPDATE `price` = VALUES(`price`);

-- Configurações padrão da plataforma
INSERT INTO `platform_settings` (`id`, `reseller_price`, `reseller_credits`) VALUES
(1, 90.00, 5)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- Admin padrão (dono do sistema)
-- Senha: admin123 | Email: admin@admin.com
INSERT INTO `admins` (`id`, `nome`, `email`, `key`, `key_plain`, `creditos`, `rank`, `criado_por`) VALUES
(1, 'Administrador', 'admin@admin.com', 'admin123', 'admin123', 999999, 'dono', NULL)
ON DUPLICATE KEY UPDATE `nome` = VALUES(`nome`);

COMMIT;

-- =====================================================
-- PRONTO! Banco criado com sucesso.
-- 
-- Total: 15 tabelas
--   1.  admins              - Usuários do sistema
--   2.  credit_transactions - Transações de crédito
--   3.  pix_payments        - Pagamentos PIX
--   4.  monthly_goals       - Metas mensais
--   5.  price_tiers         - Faixas de preço
--   6.  noticias            - Notícias do sistema
--   7.  platform_settings   - Configurações da plataforma
--   8.  suggestions         - Sugestões dos usuários
--   9.  service_usage       - Log de uso
--   10. usuarios            - CNH Digital
--   11. rgs                 - RG Digital
--   12. chas                - CNH Náutica (Arrais)
--   13. usuarios_crlv       - CRLV Digital
--   14. carteira_estudante  - Carteira Estudante (ABAFE)
--   15. hapvida_atestados   - Atestados Hapvida
--
-- Login padrão:
--   Email: admin@admin.com
--   Senha: admin123
--   Rank: dono
-- =====================================================
