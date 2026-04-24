import { Router } from 'express';
import { query } from '../db';
import { requireSession, requireDono } from '../middleware/auth';
import { cleanupExpiredRecords } from '../utils/cleanup-expired';

const router = Router();

// POST /api/maintenance/cleanup-expired - apaga TODOS registros vencidos (Dono only)
router.post('/cleanup-expired', requireSession, requireDono, async (_req, res) => {
  try {
    const results = await cleanupExpiredRecords();
    const totalDeleted = results.reduce((s, r) => s + r.deleted, 0);
    const totalFiles = results.reduce((s, r) => s + r.filesDeleted, 0);
    res.json({ success: true, totalDeleted, totalFiles, results });
  } catch (error: any) {
    console.error('Erro no cleanup manual:', error);
    res.status(500).json({ error: error.message || 'Erro interno' });
  }
});

// GET /api/maintenance/expired-counts - conta registros vencidos por tabela (Dono only)
router.get('/expired-counts', requireSession, requireDono, async (_req, res) => {
  try {
    const tables = [
      { name: 'usuarios', col: 'data_expiracao', label: 'CNH' },
      { name: 'usuarios_rg', col: 'data_expiracao', label: 'RG' },
      { name: 'usuarios_crlv', col: 'data_expiracao', label: 'CRLV' },
      { name: 'chas', col: 'expires_at', label: 'CHA Náutica' },
      { name: 'carteira_estudante', col: 'data_expiracao', label: 'Estudante' },
      { name: 'hapvida_atestados', col: 'data_expiracao', label: 'Hapvida' },
    ];
    const counts: any[] = [];
    for (const t of tables) {
      try {
        const r = await query<any[]>(
          `SELECT COUNT(*) AS expired FROM \`${t.name}\` WHERE \`${t.col}\` IS NOT NULL AND \`${t.col}\` < NOW()`
        );
        counts.push({ table: t.name, label: t.label, expired: r[0]?.expired || 0 });
      } catch {
        counts.push({ table: t.name, label: t.label, expired: 0 });
      }
    }
    res.json({ counts });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro interno' });
  }
});

// GET /api/maintenance - listar módulos em manutenção (todos autenticados)
router.get('/', requireSession, async (_req, res) => {
  try {
    const rows = await query<any[]>('SELECT module_id, is_maintenance FROM module_maintenance');
    const map: Record<string, boolean> = {};
    for (const r of rows) {
      map[r.module_id] = !!r.is_maintenance;
    }
    res.json(map);
  } catch (error) {
    console.error('Erro ao buscar manutenção:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PUT /api/maintenance - atualizar status de manutenção (dono only)
router.put('/', requireSession, requireDono, async (req, res) => {
  try {
    const { module_id, is_maintenance } = req.body;

    if (!module_id) {
      return res.status(400).json({ error: 'module_id obrigatório' });
    }

    await query(
      `INSERT INTO module_maintenance (module_id, is_maintenance) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE is_maintenance = ?`,
      [module_id, is_maintenance ? 1 : 0, is_maintenance ? 1 : 0]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar manutenção:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
