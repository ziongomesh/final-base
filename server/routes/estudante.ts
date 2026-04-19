import { Router } from 'express';
import { query } from '../db';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.ts';
import { stripImageMetadata } from '../utils/sanitize.ts';

const router = Router();

async function validateSession(adminId: number, sessionToken: string): Promise<boolean> {
  const result = await query<any[]>(
    'SELECT 1 FROM admins WHERE id = ? AND session_token = ?',
    [adminId, sessionToken]
  );
  if (result.length > 0) {
    await query('UPDATE admins SET last_active = NOW() WHERE id = ?', [adminId]);
  }
  return result.length > 0;
}

function saveFile(base64: string | undefined, name: string, ext: string = 'png'): string | null {
  if (!base64) return null;
  const uploadsDir = path.resolve(process.cwd(), '..', 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `${name}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  const clean = base64.replace(/^data:[^;]+;base64,/, '');
  const raw = Buffer.from(clean, 'base64');
  const sanitized = (ext === 'png' || ext === 'jpg' || ext === 'jpeg') ? stripImageMetadata(raw) : raw;
  fs.writeFileSync(filepath, sanitized);
  return `/uploads/${filename}`;
}

function saveBuffer(buffer: Buffer | Uint8Array, name: string, ext: string = 'png'): string {
  const uploadsDir = path.resolve(process.cwd(), '..', 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `${name}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const sanitized = (ext === 'png' || ext === 'jpg' || ext === 'jpeg') ? stripImageMetadata(buf) : buf;
  fs.writeFileSync(filepath, sanitized);
  return `/uploads/${filename}`;
}

function generateSenha(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ========== SAVE CARTEIRA ESTUDANTE ==========
router.post('/save', async (req, res) => {
  try {
    const {
      admin_id, session_token,
      nome, cpf, rg, data_nascimento, faculdade, graduacao,
      fotoBase64,
    } = req.body;

    if (!await validateSession(admin_id, session_token)) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const admins = await query<any[]>('SELECT creditos, `rank` FROM admins WHERE id = ?', [admin_id]);
    if (!admins.length) {
      return res.status(400).json({ error: 'Admin não encontrado' });
    }
    const isUnlimited = admins[0].rank === 'dono' || admins[0].rank === 'sub';
    if (!isUnlimited && admins[0].creditos <= 0) {
      return res.status(400).json({ error: 'Créditos insuficientes' });
    }

    const cleanCpf = (cpf || '').replace(/\D/g, '');

    // Check duplicate CPF
    const existing = await query<any[]>('SELECT id, nome, admin_id FROM carteira_estudante WHERE cpf = ?', [cleanCpf]);
    if (existing.length > 0) {
      const record = existing[0];
      let creatorName = 'Desconhecido';
      const adminsCreator = await query<any[]>('SELECT nome FROM admins WHERE id = ?', [record.admin_id]);
      if (adminsCreator.length > 0) creatorName = adminsCreator[0].nome;
      return res.status(409).json({
        error: 'CPF já cadastrado',
        details: {
          existing: record,
          creator_admin_id: record.admin_id,
          creator_name: creatorName,
          is_own: record.admin_id === admin_id,
        },
      });
    }

    const senha = generateSenha();

    // Save photo as {cpf}img6.png
    const perfilUrl = saveFile(fotoBase64, `${cleanCpf}img6`);

    // Generate QR code denso
    const densePad = '#ABAFE//ASSOCIACAO.BRASILEIRA.DE.APOIO.AO.ESTUDANTE//CARTEIRA.ESTUDANTIL//MEIA.ENTRADA//v1=CERTIFICADO.DIGITAL//v2=REGISTRO.ESTUDANTIL//v3=VALIDACAO.NACIONAL//v4=MEC//v5=INSTITUICAO.ENSINO//v6=UNE//v7=UBES//v8=ANPG//v9=DNE//v10=SERPRO';
    const qrBaseUrl = process.env.ABAFE_QR_URL || process.env.VITE_ABAFE_QR_URL || 'https://abafe-certificado.info/qrcode.php?cpf=';
    const qrData = `${qrBaseUrl}${cleanCpf}${densePad}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrData)}&format=png&ecc=M`;

    let qrcodeUrl: string | null = null;
    try {
      const qrResp = await fetch(qrApiUrl);
      if (qrResp.ok) {
        const qrPngBytes = new Uint8Array(await qrResp.arrayBuffer());
        qrcodeUrl = saveBuffer(Buffer.from(qrPngBytes), `${cleanCpf}qrimg6`);
      }
    } catch (e) {
      logger.error('Estudante QR code error:', e);
    }

    // Convert date format dd/mm/yyyy -> yyyy-mm-dd
    let mysqlDate = data_nascimento;
    if (data_nascimento && data_nascimento.includes('/')) {
      const parts = data_nascimento.split('/');
      if (parts.length === 3) mysqlDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    const result = await query<any>(
      `INSERT INTO carteira_estudante (nome, cpf, senha, rg, data_nascimento, faculdade, graduacao, perfil_imagem, admin_id, qrcode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, cleanCpf, senha, rg, mysqlDate, faculdade, graduacao, perfilUrl, admin_id, qrcodeUrl]
    );

    // Debit 1 credit (skip for dono/sub)
    if (!isUnlimited) {
      await query('UPDATE admins SET creditos = creditos - 1 WHERE id = ?', [admin_id]);
    }
    await query(
      `INSERT INTO credit_transactions (from_admin_id, to_admin_id, amount, transaction_type) VALUES (?, ?, 1, 'estudante_creation')`,
      [admin_id, admin_id]
    );

    res.json({
      success: true,
      id: result.insertId,
      senha,
      qrcode: qrcodeUrl,
      perfil_imagem: perfilUrl,
    });
  } catch (error: any) {
    logger.error('Estudante save error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// ========== LIST CARTEIRA ESTUDANTE ==========
router.post('/list', async (req, res) => {
  try {
    const { admin_id, session_token } = req.body;

    if (!await validateSession(admin_id, session_token)) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const adminResult = await query<any[]>('SELECT `rank` FROM admins WHERE id = ?', [admin_id]);
    const rank = adminResult[0]?.rank;

    let registros: any[];
    if (rank === 'dono' || rank === 'sub') {
      registros = await query<any[]>('SELECT * FROM carteira_estudante ORDER BY created_at DESC LIMIT 10000');
    } else {
      registros = await query<any[]>('SELECT * FROM carteira_estudante WHERE admin_id = ? ORDER BY created_at DESC LIMIT 10000', [admin_id]);
    }

    // Filtrar registros cujos arquivos não existem mais no uploads
    const uploadsDir = process.env.UPLOADS_PATH || path.resolve(process.cwd(), '..', 'public', 'uploads');
    registros = registros.filter((r: any) => {
      if (r.perfil_imagem && fs.existsSync(path.join(uploadsDir, path.basename(r.perfil_imagem)))) return true;
      const cpf = (r.cpf || '').replace(/\D/g, '');
      if (cpf && fs.existsSync(path.join(uploadsDir, `CARTEIRA_${cpf}.pdf`))) return true;
      return false;
    });

    res.json({ registros });
  } catch (error: any) {
    logger.error('Estudante list error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// ========== DELETE CARTEIRA ESTUDANTE ==========
router.post('/delete', async (req, res) => {
  try {
    const { admin_id, session_token, estudante_id } = req.body;

    if (!await validateSession(admin_id, session_token)) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const existing = await query<any[]>('SELECT * FROM carteira_estudante WHERE id = ?', [estudante_id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const record = existing[0];
    const adminResult = await query<any[]>('SELECT `rank` FROM admins WHERE id = ?', [admin_id]);
    const rank = adminResult[0]?.rank;

    if (rank !== 'dono' && record.admin_id !== admin_id) {
      return res.status(403).json({ error: 'Sem permissão para excluir este registro' });
    }

    await query('DELETE FROM carteira_estudante WHERE id = ?', [estudante_id]);

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Estudante delete error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// ========== UPDATE CARTEIRA ESTUDANTE ==========
router.post('/update', async (req, res) => {
  try {
    const {
      admin_id, session_token, estudante_id,
      nome, rg, data_nascimento, faculdade, graduacao,
      fotoBase64,
    } = req.body;

    if (!await validateSession(admin_id, session_token)) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const existing = await query<any[]>('SELECT * FROM carteira_estudante WHERE id = ?', [estudante_id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const record = existing[0];
    const cleanCpf = record.cpf;

    // Update photo if provided
    if (fotoBase64) {
      saveFile(fotoBase64, `${cleanCpf}img6`);
    }

    // Regenerate QR code denso
    const densePadUpdate = '#ABAFE//ASSOCIACAO.BRASILEIRA.DE.APOIO.AO.ESTUDANTE//CARTEIRA.ESTUDANTIL//MEIA.ENTRADA//v1=CERTIFICADO.DIGITAL//v2=REGISTRO.ESTUDANTIL//v3=VALIDACAO.NACIONAL//v4=MEC//v5=INSTITUICAO.ENSINO//v6=UNE//v7=UBES//v8=ANPG//v9=DNE//v10=SERPRO';
    const qrBaseUrl = process.env.ABAFE_QR_URL || process.env.VITE_ABAFE_QR_URL || 'https://abafe-certificado.info/qrcode.php?cpf=';
    const qrData = `${qrBaseUrl}${cleanCpf}${densePadUpdate}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrData)}&format=png&ecc=M`;

    let qrcodeUrl = record.qrcode;
    try {
      const qrResp = await fetch(qrApiUrl);
      if (qrResp.ok) {
        const qrPngBytes = new Uint8Array(await qrResp.arrayBuffer());
        qrcodeUrl = saveBuffer(Buffer.from(qrPngBytes), `${cleanCpf}qrimg6`);
      }
    } catch (e) {
      logger.error('Estudante QR update error:', e);
    }

    let mysqlDate = data_nascimento || record.data_nascimento;
    if (mysqlDate && mysqlDate.includes('/')) {
      const parts = mysqlDate.split('/');
      if (parts.length === 3) mysqlDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    await query(
      `UPDATE carteira_estudante SET nome = ?, rg = ?, data_nascimento = ?, faculdade = ?, graduacao = ?, qrcode = ? WHERE id = ?`,
      [nome || record.nome, rg || record.rg, mysqlDate, faculdade || record.faculdade, graduacao || record.graduacao, qrcodeUrl, estudante_id]
    );

    if (fotoBase64) {
      await query('UPDATE carteira_estudante SET perfil_imagem = ? WHERE id = ?', [`/uploads/${cleanCpf}img6.png`, estudante_id]);
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Estudante update error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// ========== RENEW CARTEIRA ESTUDANTE ==========
router.post('/renew', async (req, res) => {
  try {
    const { admin_id, session_token, record_id } = req.body;

    if (!admin_id || !session_token || !record_id) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios faltando' });
    }

    const admins = await query<any[]>('SELECT id, creditos, session_token, `rank` FROM admins WHERE id = ? AND session_token = ?', [admin_id, session_token]);
    if (!admins || admins.length === 0) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const admin = admins[0];
    const isUnlimitedRenew = admin.rank === 'dono' || admin.rank === 'sub';
    if (!isUnlimitedRenew && admin.creditos < 1) {
      return res.status(400).json({ error: 'Créditos insuficientes' });
    }

    // Buscar registro - note: carteira_estudante doesn't have expires_at in original MySQL schema
    // We check data_expiracao if it exists, otherwise use created_at + 45 days
    const records = await query<any[]>('SELECT id, admin_id, created_at FROM carteira_estudante WHERE id = ? AND admin_id = ?', [record_id, admin_id]);
    if (!records || records.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const now = new Date();
    const newExpiration = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

    // Try adding data_expiracao column if it doesn't exist, or just update created_at
    try {
      await query('ALTER TABLE carteira_estudante ADD COLUMN IF NOT EXISTS data_expiracao TIMESTAMP DEFAULT NULL', []);
    } catch { /* column may already exist */ }

    await query('UPDATE carteira_estudante SET data_expiracao = ? WHERE id = ?', [newExpiration, record_id]);
    if (!isUnlimitedRenew) {
      await query('UPDATE admins SET creditos = creditos - 1 WHERE id = ?', [admin_id]);
    }

    logger.action('ESTUDANTE RENOVADO', `record_id=${record_id}, nova_expiracao=${newExpiration.toISOString()}, admin_id=${admin_id}`);

    res.json({
      success: true,
      newExpiration: newExpiration.toISOString(),
      creditsRemaining: admin.creditos - 1,
    });
  } catch (error: any) {
    logger.error('Estudante renew error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

export default router;
