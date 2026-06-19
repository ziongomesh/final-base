import { Router } from 'express';
import { pool } from '../db/index';

const router = Router();

// GET /api/verify-cnh?id=123
router.get('/', async (req, res) => {
  try {
    const rawId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    const id = String(rawId || '').match(/^\d+/)?.[0];

    if (!id) {
      return res.status(400).json({ error: 'ID não informado' });
    }

    res.set({
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    });

    const [rows]: any = await pool.query(
      `SELECT * FROM usuarios WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'CNH não encontrada' });
    }

    const user = rows[0];
    res.json(user);
  } catch (error) {
    console.error('Erro ao verificar CNH:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
