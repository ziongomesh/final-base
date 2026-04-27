-- ============================================================
--  Auditoria completa do bônus de Meta Semanal
--  Aplicar no MySQL de produção
-- ============================================================

-- 1) Garantir colunas de auditoria na tabela weekly_goal_claims
ALTER TABLE weekly_goal_claims
  ADD COLUMN IF NOT EXISTS admin_name      VARCHAR(255)  NULL          AFTER admin_id,
  ADD COLUMN IF NOT EXISTS admin_rank      VARCHAR(20)   NULL          AFTER admin_name,
  ADD COLUMN IF NOT EXISTS tier_label      VARCHAR(20)   NULL          AFTER tier_target,
  ADD COLUMN IF NOT EXISTS bonus_credits   INT           NOT NULL DEFAULT 0 AFTER tier_label,
  ADD COLUMN IF NOT EXISTS recharges_count INT           NOT NULL DEFAULT 0 AFTER bonus_credits,
  ADD COLUMN IF NOT EXISTS claimed_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER recharges_count;

-- Índices úteis para o painel de histórico
CREATE INDEX IF NOT EXISTS idx_wgc_admin_week  ON weekly_goal_claims (admin_id, week_key);
CREATE INDEX IF NOT EXISTS idx_wgc_claimed_at  ON weekly_goal_claims (claimed_at);

-- 2) Backfill: preenche admin_name e admin_rank em registros antigos
UPDATE weekly_goal_claims wgc
JOIN admins a ON a.id = wgc.admin_id
SET
  wgc.admin_name = COALESCE(NULLIF(wgc.admin_name, ''), a.nome),
  wgc.admin_rank = COALESCE(NULLIF(wgc.admin_rank, ''), a.`rank`)
WHERE wgc.admin_name IS NULL
   OR wgc.admin_name = ''
   OR wgc.admin_rank IS NULL;

-- ============================================================
--  3) DIAGNÓSTICO: quem deveria ter recebido bônus e não recebeu?
--     (rode o SELECT abaixo antes de creditar — só pra conferir)
-- ============================================================
-- Recargas pagas na SEMANA CORRENTE por admin (domingo 00:00 local)
-- SET @ini := DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE())-1 DAY);
-- SELECT a.id, a.nome, a.`rank`, COUNT(p.id) AS recargas_semana
--   FROM admins a
--   JOIN pix_payments p ON p.admin_id = a.id
--  WHERE a.`rank` IN ('revendedor','master')
--    AND p.status = 'PAID'
--    AND p.paid_at >= @ini
--  GROUP BY a.id
-- HAVING recargas_semana >= 2
--  ORDER BY recargas_semana DESC;

-- ============================================================
--  4) PAGAMENTO RETROATIVO da semana corrente
--     Credita Bronze/Prata/Ouro para quem bateu meta e ainda
--     não recebeu o bônus daquela tier nesta semana.
-- ============================================================
SET @ini := DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE())-1 DAY);
SET @week_key := DATE_FORMAT(@ini, '%Y-%m-%d');

-- Subquery temporária com a contagem da semana
DROP TEMPORARY TABLE IF EXISTS tmp_week_recharges;
CREATE TEMPORARY TABLE tmp_week_recharges AS
SELECT a.id AS admin_id, a.nome AS admin_name, a.`rank` AS admin_rank,
       COUNT(p.id) AS recargas
  FROM admins a
  JOIN pix_payments p ON p.admin_id = a.id
 WHERE a.`rank` IN ('revendedor','master')
   AND p.status = 'PAID'
   AND p.paid_at >= @ini
 GROUP BY a.id;

-- BRONZE (>=2 recargas → +1 crédito)
INSERT INTO weekly_goal_claims
  (admin_id, admin_name, admin_rank, week_key, tier_target, tier_label, bonus_credits, recharges_count, claimed_at)
SELECT t.admin_id, t.admin_name, t.admin_rank, @week_key, 2, 'Bronze', 1, t.recargas, NOW()
  FROM tmp_week_recharges t
 WHERE t.recargas >= 2
   AND NOT EXISTS (
     SELECT 1 FROM weekly_goal_claims w
      WHERE w.admin_id = t.admin_id AND w.week_key = @week_key AND w.tier_target = 2
   );
UPDATE admins a
  JOIN tmp_week_recharges t ON t.admin_id = a.id
   SET a.creditos = a.creditos + 1
 WHERE t.recargas >= 2
   AND EXISTS (SELECT 1 FROM weekly_goal_claims w
                WHERE w.admin_id = a.id AND w.week_key = @week_key
                  AND w.tier_target = 2 AND w.claimed_at >= NOW() - INTERVAL 5 SECOND);

-- PRATA (>=4 → +3)
INSERT INTO weekly_goal_claims
  (admin_id, admin_name, admin_rank, week_key, tier_target, tier_label, bonus_credits, recharges_count, claimed_at)
SELECT t.admin_id, t.admin_name, t.admin_rank, @week_key, 4, 'Prata', 3, t.recargas, NOW()
  FROM tmp_week_recharges t
 WHERE t.recargas >= 4
   AND NOT EXISTS (
     SELECT 1 FROM weekly_goal_claims w
      WHERE w.admin_id = t.admin_id AND w.week_key = @week_key AND w.tier_target = 4
   );
UPDATE admins a
  JOIN tmp_week_recharges t ON t.admin_id = a.id
   SET a.creditos = a.creditos + 3
 WHERE t.recargas >= 4
   AND EXISTS (SELECT 1 FROM weekly_goal_claims w
                WHERE w.admin_id = a.id AND w.week_key = @week_key
                  AND w.tier_target = 4 AND w.claimed_at >= NOW() - INTERVAL 5 SECOND);

-- OURO (>=6 → +5)
INSERT INTO weekly_goal_claims
  (admin_id, admin_name, admin_rank, week_key, tier_target, tier_label, bonus_credits, recharges_count, claimed_at)
SELECT t.admin_id, t.admin_name, t.admin_rank, @week_key, 6, 'Ouro', 5, t.recargas, NOW()
  FROM tmp_week_recharges t
 WHERE t.recargas >= 6
   AND NOT EXISTS (
     SELECT 1 FROM weekly_goal_claims w
      WHERE w.admin_id = t.admin_id AND w.week_key = @week_key AND w.tier_target = 6
   );
UPDATE admins a
  JOIN tmp_week_recharges t ON t.admin_id = a.id
   SET a.creditos = a.creditos + 5
 WHERE t.recargas >= 6
   AND EXISTS (SELECT 1 FROM weekly_goal_claims w
                WHERE w.admin_id = a.id AND w.week_key = @week_key
                  AND w.tier_target = 6 AND w.claimed_at >= NOW() - INTERVAL 5 SECOND);

-- Registra transações dos bônus pagos retroativamente
INSERT INTO credit_transactions (to_admin_id, amount, transaction_type)
SELECT w.admin_id, w.bonus_credits, 'weekly_goal_bonus'
  FROM weekly_goal_claims w
 WHERE w.week_key = @week_key
   AND w.claimed_at >= NOW() - INTERVAL 30 SECOND;

DROP TEMPORARY TABLE IF EXISTS tmp_week_recharges;

-- ============================================================
--  5) Conferência final
-- ============================================================
SELECT admin_id, admin_name, admin_rank, week_key, tier_label,
       bonus_credits, recharges_count, claimed_at
  FROM weekly_goal_claims
 WHERE week_key = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL DAYOFWEEK(CURDATE())-1 DAY), '%Y-%m-%d')
 ORDER BY claimed_at DESC;
