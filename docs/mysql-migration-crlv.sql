-- =====================================================
-- MIGRAÇÃO: Tabela `usuarios_crlv` para MySQL
-- CRLV Digital 2026
-- =====================================================
-- Execute este script no MySQL para criar a tabela
-- utilizada pelo módulo CRLV Digital no backend Node.js.
-- =====================================================

CREATE TABLE IF NOT EXISTS `usuarios_crlv` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `admin_id` INT NOT NULL,
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
  -- Observações
  `observacoes` TEXT DEFAULT NULL,
  -- URLs / Arquivos
  `qrcode_url` TEXT DEFAULT NULL,
  `pdf_url` TEXT DEFAULT NULL,
  `senha` VARCHAR(20) DEFAULT NULL,
  -- Datas
  `data_expiracao` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_crlv_admin` (`admin_id`),
  INDEX `idx_crlv_placa` (`placa`),
  INDEX `idx_crlv_cpf` (`cpf_cnpj`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
