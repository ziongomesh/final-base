import { Router } from 'express';
import { pool } from '../db/index';

const router = Router();

// GET /api/verify-cnh?id=123
router.get('/', async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID não informado' });
    }

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
