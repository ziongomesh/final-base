-- =====================================================
-- TABELA: hapvida_atestados
-- Armazena os atestados médicos Hapvida gerados
-- Execute este script no seu banco MySQL existente
-- =====================================================

CREATE TABLE IF NOT EXISTS `hapvida_atestados` (
  `id`                  INT(11) NOT NULL AUTO_INCREMENT,
  `admin_id`            INT(11) NOT NULL,
  `nome_paciente`       VARCHAR(200) NOT NULL,
  `cpf_paciente`        VARCHAR(11) NOT NULL COMMENT 'Apenas dígitos',
  `dias_afastamento`    INT(3) NOT NULL DEFAULT 1,
  `data_apartir`        VARCHAR(20) DEFAULT NULL COMMENT 'DD/MM/AAAA',
  `horario_atendimento` VARCHAR(10) DEFAULT NULL COMMENT 'HH:MM',
  `codigo_doenca`       VARCHAR(20) NOT NULL COMMENT 'Código CID-10',
  `descricao_doenca`    VARCHAR(300) DEFAULT NULL,
  `nome_hospital`       VARCHAR(200) NOT NULL,
  `endereco_hospital`   VARCHAR(300) DEFAULT NULL,
  `cidade_hospital`     VARCHAR(300) DEFAULT NULL,
  `nome_medico`         VARCHAR(200) NOT NULL,
  `crm`                 VARCHAR(50) DEFAULT NULL,
  `codigo_autenticacao` VARCHAR(20) DEFAULT NULL,
  `data_hora`           VARCHAR(30) DEFAULT NULL COMMENT 'DD/MM/AAAA HH:MM:SS',
  `ip`                  VARCHAR(50) DEFAULT NULL,
  `link_validacao`      VARCHAR(500) DEFAULT NULL,
  `pdf_url`             VARCHAR(500) DEFAULT NULL COMMENT 'Caminho do PDF gerado',
  `created_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hapvida_admin_id` (`admin_id`),
  KEY `idx_hapvida_cpf`      (`cpf_paciente`),
  KEY `idx_hapvida_created`  (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Atestados médicos Hapvida gerados pelo sistema';

-- Índice de pesquisa rápida por nome do paciente
ALTER TABLE `hapvida_atestados`
  ADD INDEX IF NOT EXISTS `idx_hapvida_nome` (`nome_paciente`(50));

-- =====================================================
-- PRONTO! Execute no banco e reinicie o servidor.
-- =====================================================
