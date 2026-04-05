import { Router } from 'express';
import { pool } from '../db/index';

const router = Router();

// GET /api/verify-hapvida?codigo=XXXXXXXXXXX
router.get('/', async (req, res) => {
  try {
    const { codigo } = req.query;

    if (!codigo) {
      return res.status(400).json({ error: 'Código não informado' });
    }

    const [rows]: any = await pool.query(
      `SELECT h.*, a.nome AS admin_nome FROM hapvida_atestados h
       LEFT JOIN admins a ON a.id = h.admin_id
       WHERE h.codigo_autenticacao = ? LIMIT 1`,
      [codigo]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Atestado não encontrado' });
    }

    const r = rows[0];
    res.json(r);
  } catch (error) {
    console.error('Erro ao verificar hapvida:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
