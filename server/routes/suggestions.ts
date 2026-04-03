import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireSession, requireDonoOrSub } from '../middleware/auth';

const router = Router();

// POST /api/suggestions - qualquer admin pode enviar
router.post('/', requireSession, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    // Buscar nome do admin
    const [admin] = await query<any[]>('SELECT nome FROM admins WHERE id = ?', [adminId]);
    const adminName = admin?.nome || 'Desconhecido';

    await query(
      'INSERT INTO suggestions (admin_id, admin_name, message) VALUES (?, ?, ?)',
      [adminId, adminName, message.trim()]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('[SUGGESTIONS] Erro ao salvar:', error);
    res.status(500).json({ error: 'Erro ao salvar sugestão' });
  }
});

// GET /api/suggestions - apenas dono/sub podem ver
router.get('/', requireSession, requireDonoOrSub, async (req: Request, res: Response) => {
  try {
    const rows = await query<any[]>(
      'SELECT * FROM suggestions ORDER BY created_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (error: any) {
    console.error('[SUGGESTIONS] Erro ao listar:', error);
    res.status(500).json({ error: 'Erro ao listar sugestões' });
  }
});

// PUT /api/suggestions/:id/read - marcar como lida
router.put('/:id/read', requireSession, requireDonoOrSub, async (req: Request, res: Response) => {
  try {
    await query('UPDATE suggestions SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

export default router;
