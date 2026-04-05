import { Router } from 'express';
import { pool } from '../db';
import { requireSession, requireDono } from '../middleware/auth';

const router = Router();

// GET /api/downloads - fetch download links (requer sessão)
router.get('/', requireSession, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM downloads WHERE id = 1 LIMIT 1');
    const data = (rows as any[])[0] || null;
    res.json(data);
  } catch (error: any) {
    console.error('Erro ao buscar downloads:', error);
    res.status(500).json({ error: 'Erro ao buscar downloads' });
  }
});

// PUT /api/downloads - update download links (requer sessão + dono)
router.put('/', requireSession, requireDono, async (req, res) => {
  try {
    const { cnh_iphone, cnh_apk, govbr_iphone, govbr_apk, abafe_apk, abafe_iphone } = req.body;

    await pool.execute(
      `UPDATE downloads SET 
        cnh_iphone = ?, cnh_apk = ?, 
        govbr_iphone = ?, govbr_apk = ?,
        abafe_apk = ?, abafe_iphone = ?,
        updated_at = NOW()
      WHERE id = 1`,
      [cnh_iphone || null, cnh_apk || null, govbr_iphone || null, govbr_apk || null, abafe_apk || null, abafe_iphone || null]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao atualizar downloads:', error);
    res.status(500).json({ error: 'Erro ao atualizar downloads' });
  }
});

export default router;
