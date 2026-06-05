-- Adiciona coluna `tutorial` na tabela admins
-- 1 = já completou/pulou o tutorial (não exibir mais)
-- 0 = ainda não viu o tutorial (exibir no próximo login)

ALTER TABLE admins
  ADD COLUMN tutorial TINYINT(1) NOT NULL DEFAULT 0 AFTER profile_photo;

-- Opcional: marcar todos os admins existentes como "já viram" para não receber tutorial
-- UPDATE admins SET tutorial = 1;
