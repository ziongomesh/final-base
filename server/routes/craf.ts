import { Router } from 'express';
import { query } from '../db';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.ts';
import { stripImageMetadata } from '../utils/sanitize.ts';
import { isFreeMode } from '../utils/free-mode';

const router = Router();

const uploadsDir = path.resolve(process.cwd(), '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

function saveBase64(base64: string | undefined | null, name: string, ext = 'png'): string | null {
  if (!base64) return null;
  const clean = base64.replace(/^data:[^;]+;base64,/, '');
  if (!clean) return null;
  const raw = Buffer.from(clean, 'base64');
  if (!raw.length) return null;
  const filename = `${name}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  const sanitized = stripImageMetadata(raw);
  fs.writeFileSync(filepath, sanitized);
  return `/uploads/${filename}`;
}

// POST /api/craf/save
router.post('/save', async (req, res) => {
  try {
    const {
      admin_id, session_token,
      cpf, nome, rg, sfpc_vinculacao, amparo_legal, registro,
      tipo, marca, calibre, n_serie, n_sigma, data_expedicao,
      gac_emissora, cidade_uf, validade,
      fotoBase64, qrcodeBase64, imagemBase64,
    } = req.body;

    const sessions = await query<any[]>(
      'SELECT id, creditos, `rank` FROM admins WHERE id = ? AND session_token = ?',
      [admin_id, session_token]
    );
    if (!sessions || sessions.length === 0) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }
    const admin = sessions[0];
    const freeMode = await isFreeMode();
    const isUnlimited = admin.rank === 'dono' || admin.rank === 'sub' || freeMode;
    if (!isUnlimited && admin.creditos <= 0) {
      return res.status(400).json({ error: 'Créditos insuficientes' });
    }

    const cleanCpf = String(cpf || '').replace(/\D/g, '');
    if (cleanCpf.length < 11) return res.status(400).json({ error: 'CPF inválido' });

    const fotoUrl = saveBase64(fotoBase64, `${cleanCpf}img8`);
    const qrcodeUrl = saveBase64(qrcodeBase64, `${cleanCpf}qrimg8`);
    const imagemUrl = saveBase64(imagemBase64, `${cleanCpf}craf8`);

    const result = await query<any>(
      `INSERT INTO craf (
        admin_id, cpf, nome, rg, sfpc_vinculacao, amparo_legal, registro,
        tipo, marca, calibre, n_serie, n_sigma, data_expedicao,
        gac_emissora, cidade_uf, validade,
        foto_url, qrcode_url, imagem_url, data_expiracao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 45 DAY))`,
      [
        admin_id, cleanCpf, nome, rg, sfpc_vinculacao, amparo_legal, registro,
        tipo, marca, calibre, n_serie, n_sigma, data_expedicao,
        gac_emissora, cidade_uf, validade,
        fotoUrl, qrcodeUrl, imagemUrl,
      ]
    );

    if (!isUnlimited) {
      await query('UPDATE admins SET creditos = creditos - 1 WHERE id = ?', [admin_id]);
    }
    await query(
      'INSERT INTO credit_transactions (from_admin_id, to_admin_id, amount, transaction_type) VALUES (?, ?, 1, ?)',
      [admin_id, admin_id, 'craf_creation']
    );

    logger.action('CRAF', `Gerado para CPF ${cleanCpf} por admin ${admin_id}`);
    res.json({ success: true, id: result.insertId, imagem: imagemUrl, foto: fotoUrl, qrcode: qrcodeUrl });
  } catch (error: any) {
    logger.error('[CRAF] Erro ao salvar:', error);
    res.status(500).json({ error: 'Erro interno ao gerar CRAF' });
  }
});

// POST /api/craf/list
router.post('/list', async (req, res) => {
  try {
    const { admin_id, session_token } = req.body;
    const sessions = await query<any[]>(
      'SELECT id FROM admins WHERE id = ? AND session_token = ?',
      [admin_id, session_token]
    );
    if (!sessions || sessions.length === 0) return res.status(401).json({ error: 'Sessão inválida' });
    const records = await query<any[]>(
      'SELECT * FROM craf WHERE admin_id = ? ORDER BY created_at DESC',
      [admin_id]
    );
    res.json(records || []);
  } catch (error: any) {
    logger.error('[CRAF] list error:', error);
    res.status(500).json({ error: 'Erro' });
  }
});

// POST /api/craf/delete
router.post('/delete', async (req, res) => {
  try {
    const { admin_id, session_token, craf_id } = req.body;
    const sessions = await query<any[]>(
      'SELECT id FROM admins WHERE id = ? AND session_token = ?',
      [admin_id, session_token]
    );
    if (!sessions || sessions.length === 0) return res.status(401).json({ error: 'Sessão inválida' });
    const records = await query<any[]>('SELECT foto_url, qrcode_url, imagem_url FROM craf WHERE id = ? AND admin_id = ?', [craf_id, admin_id]);
    if (records?.length) {
      const r = records[0];
      for (const u of [r.foto_url, r.qrcode_url, r.imagem_url]) {
        if (u) {
          const fp = path.resolve(process.cwd(), '..', 'public', u.replace(/^\//, ''));
          if (fs.existsSync(fp)) fs.unlinkSync(fp);
        }
      }
    }
    await query('DELETE FROM craf WHERE id = ? AND admin_id = ?', [craf_id, admin_id]);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('[CRAF] delete error:', error);
    res.status(500).json({ error: 'Erro' });
  }
});

export default router;
