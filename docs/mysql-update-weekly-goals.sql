-- ============================================
-- Adiciona campos de auditoria em weekly_goal_claims
-- Rode no MySQL local antes de subir o backend novo
-- ============================================

ALTER TABLE weekly_goal_claims
  ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255) NULL AFTER admin_id,
  ADD COLUMN IF NOT EXISTS tier_label VARCHAR(50) NULL AFTER tier_target;

-- Backfill admin_name nos registros antigos
UPDATE weekly_goal_claims wgc
JOIN admins a ON a.id = wgc.admin_id
SET wgc.admin_name = a.nome
WHERE wgc.admin_name IS NULL OR wgc.admin_name = '';

-- Backfill tier_label baseado no tier_target
UPDATE weekly_goal_claims SET tier_label = 'Bronze' WHERE tier_target = 2 AND (tier_label IS NULL OR tier_label = '');
UPDATE weekly_goal_claims SET tier_label = 'Prata'  WHERE tier_target = 4 AND (tier_label IS NULL OR tier_label = '');
UPDATE weekly_goal_claims SET tier_label = 'Ouro'   WHERE tier_target = 6 AND (tier_label IS NULL OR tier_label = '');

-- Index para consultas por data
CREATE INDEX IF NOT EXISTS idx_wgc_claimed_at ON weekly_goal_claims(claimed_at DESC);
