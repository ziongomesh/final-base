import { Router } from 'express';
import { pool } from '../db/index';

const router = Router();

// GET /api/verify-craf?cpf=00000000000
router.get('/', async (req, res) => {
  try {
    const { cpf } = req.query;
    if (!cpf) return res.status(400).json({ error: 'CPF não informado' });
    const cleanCpf = String(cpf).replace(/\D/g, '');
    if (cleanCpf.length < 11) return res.status(400).json({ error: 'CPF inválido' });

    const [rows]: any = await pool.query(
      `SELECT * FROM craf WHERE cpf = ? ORDER BY created_at DESC LIMIT 1`,
      [cleanCpf]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'CRAF não encontrado' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao verificar CRAF:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
