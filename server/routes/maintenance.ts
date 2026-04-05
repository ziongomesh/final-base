import { Router } from 'express';
import { query } from '../db';
import { requireSession, requireDono } from '../middleware/auth';

const router = Router();

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
