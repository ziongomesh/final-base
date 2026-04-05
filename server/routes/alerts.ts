import { Router } from 'express';
import { pool } from '../db';
import { requireSession } from '../middleware/auth';

const router = Router();

// Middleware de sessão em todas as rotas
router.use(requireSession);

// Enviar alerta para um usuário
router.post('/send', async (req: any, res) => {
  try {
    const { adminId: senderId, adminRank } = req;
    const { targetAdminId, message } = req.body;

    if (!targetAdminId || !message) {
      return res.status(400).json({ error: 'targetAdminId e message são obrigatórios' });
    }

    // Apenas master, dono, sub podem enviar alertas
    if (!['dono', 'sub', 'master'].includes(adminRank)) {
      return res.status(403).json({ error: 'Sem permissão para enviar alertas' });
    }

    // Se master, só pode enviar para seus revendedores
    if (adminRank === 'master') {
      const [check] = await pool.execute(
        'SELECT id FROM admins WHERE id = ? AND criado_por = ?',
        [targetAdminId, senderId]
      );
      if (!(check as any[]).length) {
        return res.status(403).json({ error: 'Só pode enviar alertas para seus revendedores' });
      }
    }

    await pool.execute(
      'INSERT INTO admin_alerts (from_admin_id, to_admin_id, message) VALUES (?, ?, ?)',
      [senderId, targetAdminId, message]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('[ALERTS] Erro ao enviar alerta:', error);
    res.status(500).json({ error: 'Erro ao enviar alerta' });
  }
});

// Buscar alertas não lidos do usuário logado
router.get('/unread', async (req: any, res) => {
  try {
    const { adminId } = req;

    const [rows] = await pool.execute(
      `SELECT a.*, adm.nome as from_name 
       FROM admin_alerts a 
       LEFT JOIN admins adm ON adm.id = a.from_admin_id 
       WHERE a.to_admin_id = ? AND a.is_read = FALSE 
       ORDER BY a.created_at DESC LIMIT 10`,
      [adminId]
    );

    res.json(rows);
  } catch (error: any) {
    console.error('[ALERTS] Erro ao buscar alertas:', error);
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

// Marcar alertas como lidos
router.put('/read', async (req: any, res) => {
  try {
    const { adminId } = req;
    const { alertIds } = req.body;

    if (alertIds && alertIds.length > 0) {
      const placeholders = alertIds.map(() => '?').join(',');
      await pool.execute(
        `UPDATE admin_alerts SET is_read = TRUE WHERE id IN (${placeholders}) AND to_admin_id = ?`,
        [...alertIds, adminId]
      );
    } else {
      await pool.execute(
        'UPDATE admin_alerts SET is_read = TRUE WHERE to_admin_id = ?',
        [adminId]
      );
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[ALERTS] Erro ao marcar como lido:', error);
    res.status(500).json({ error: 'Erro ao marcar alertas' });
  }
});

export default router;
