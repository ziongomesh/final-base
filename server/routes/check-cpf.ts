import { Router } from 'express';
import { query } from '../db/index.ts';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { cpf, admin_id, session_token, service_type } = req.body;

    // Validar sessão
    const admins = await query<any[]>(
      'SELECT id FROM admins WHERE id = ? AND session_token = ?',
      [admin_id, session_token]
    );
    if (!admins || admins.length === 0) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const cleanCpf = (cpf || '').replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      return res.json({ exists: false });
    }

    let exists = false;
    let recordName = '';
    let creatorAdminId: number | null = null;
    let isOwn = false;

    if (service_type === 'rg') {
      const rows = await query<any[]>(
        'SELECT id, nome_completo, admin_id FROM rgs WHERE cpf = ? LIMIT 1',
        [cleanCpf]
      );
      if (rows && rows.length > 0) {
        exists = true;
        recordName = rows[0].nome_completo;
        creatorAdminId = rows[0].admin_id;
        isOwn = rows[0].admin_id === admin_id;
      }
    } else if (service_type === 'cnh') {
      const rows = await query<any[]>(
        'SELECT id, nome, admin_id FROM usuarios WHERE cpf = ? LIMIT 1',
        [cleanCpf]
      );
      if (rows && rows.length > 0) {
        exists = true;
        recordName = rows[0].nome;
        creatorAdminId = rows[0].admin_id;
        isOwn = rows[0].admin_id === admin_id;
      }
    } else if (service_type === 'estudante') {
      const rows = await query<any[]>(
        'SELECT id, nome, admin_id FROM carteira_estudante WHERE cpf = ? LIMIT 1',
        [cleanCpf]
      );
      if (rows && rows.length > 0) {
        exists = true;
        recordName = rows[0].nome;
        creatorAdminId = rows[0].admin_id;
        isOwn = rows[0].admin_id === admin_id;
      }
    } else if (service_type === 'nautica') {
      const rows = await query<any[]>(
        'SELECT id, nome, admin_id FROM chas WHERE cpf = ? LIMIT 1',
        [cleanCpf]
      );
      if (rows && rows.length > 0) {
        exists = true;
        recordName = rows[0].nome;
        creatorAdminId = rows[0].admin_id;
        isOwn = rows[0].admin_id === admin_id;
      }
    }

    let creatorName = '';
    if (exists && creatorAdminId) {
      const adminRows = await query<any[]>(
        'SELECT nome FROM admins WHERE id = ? LIMIT 1',
        [creatorAdminId]
      );
      if (adminRows && adminRows.length > 0) {
        creatorName = adminRows[0].nome;
      }
    }

    return res.json({
      exists,
      record_name: recordName,
      creator_name: creatorName,
      creator_admin_id: creatorAdminId,
      is_own: isOwn,
    });
  } catch (error: any) {
    console.error('Check CPF error:', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

export default router;
