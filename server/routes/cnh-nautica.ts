import { Router } from 'express';
import { query } from '../db';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.ts';

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
  fs.writeFileSync(filepath, Buffer.from(clean, 'base64'));
  return `/uploads/${filename}`;
}

function saveBuffer(buffer: Buffer | Uint8Array, name: string, ext: string = 'png'): string {
  const uploadsDir = path.resolve(process.cwd(), '..', 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `${name}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, buffer);
  return `/uploads/${filename}`;
}

function generateSenha(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ========== SAVE CHAS ==========
router.post('/save', async (req, res) => {
  try {
    const {
      admin_id, session_token,
      nome, cpf, data_nascimento, categoria, validade, emissao,
      numero_inscricao, limite_navegacao, requisitos, orgao_emissao,
      fotoBase64, matrizFrenteBase64, matrizVersoBase64,
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
    const existing = await query<any[]>('SELECT id, nome, admin_id FROM chas WHERE cpf = ?', [cleanCpf]);
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

    // Save photo as {cpf}img7.png
    const fotoUrl = saveFile(fotoBase64, `${cleanCpf}img7`);
    const matrizFrenteUrl = saveFile(matrizFrenteBase64, `${cleanCpf}matrizcha`);
    const matrizVersoUrl = saveFile(matrizVersoBase64, `${cleanCpf}matrizcha2`);
    // Generate QR code denso
    const densePad = '#MARINHA.DO.BRASIL//CARTEIRA.DE.HABILITACAO.DE.AMADOR//NORMAM-03//DIRETORIA.DE.PORTOS.E.COSTAS//v1=CERTIFICADO.DIGITAL//v2=HABILITACAO.AMADOR//v3=REGISTRO.MARITIMO//v4=CAPITANIA.PORTOS//v5=NAVEGACAO.INTERIOR//v6=NAVEGACAO.COSTEIRA//v7=COMANDO.MARINHA//v8=MINISTERIO.DEFESA//v9=TRIBUNAL.MARITIMO//v10=SERPRO';
    const chaQrBaseUrl = process.env.CNH_NAUTICA_QR_URL || 'https://certificado-marinha-vio.info/verificar-cha?cpf=';
    const qrData = `${chaQrBaseUrl}${cleanCpf}${densePad}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrData)}&format=png&ecc=M`;

    let qrcodeUrl: string | null = null;
    try {
      const qrResp = await fetch(qrApiUrl);
      if (qrResp.ok) {
        const qrPngBytes = new Uint8Array(await qrResp.arrayBuffer());
        qrcodeUrl = saveBuffer(Buffer.from(qrPngBytes), `${cleanCpf}qrcodeimg7`);
      }
    } catch (e) {
      logger.error('CNH Náutica QR code error:', e);
    }

    // Convert date dd/mm/yyyy -> yyyy-mm-dd
    const convertDate = (d: string | undefined) => {
      if (!d) return null;
      if (d.includes('/')) {
        const parts = d.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return d;
    };

    const expiresAt = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);

    const result = await query<any>(
      `INSERT INTO chas (cpf, nome, data_nascimento, categoria, validade, emissao, numero_inscricao, limite_navegacao, requisitos, orgao_emissao, foto, qrcode, senha, admin_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanCpf, nome, convertDate(data_nascimento), categoria, validade, emissao,
        numero_inscricao, limite_navegacao, requisitos, orgao_emissao,
        fotoUrl, qrcodeUrl, senha, admin_id, expiresAt,
      ]
    );

    // Debit 1 credit
    if (!isUnlimited) {
      await query('UPDATE admins SET creditos = creditos - 1 WHERE id = ?', [admin_id]);
    }
    await query(
      `INSERT INTO credit_transactions (from_admin_id, to_admin_id, amount, transaction_type) VALUES (?, ?, 1, 'nautica_creation')`,
      [admin_id, admin_id]
    );

    res.json({
      success: true,
      id: result.insertId,
      senha,
      foto: fotoUrl,
      qrcode: qrcodeUrl,
    });
  } catch (error: any) {
    logger.error('CNH Náutica save error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// ========== LIST CHAS ==========
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
      registros = await query<any[]>('SELECT * FROM chas ORDER BY created_at DESC LIMIT 200');
    } else {
      registros = await query<any[]>('SELECT * FROM chas WHERE admin_id = ? ORDER BY created_at DESC LIMIT 200', [admin_id]);
    }

    // Filtrar registros cujos arquivos não existem mais no uploads
    const uploadsDir = process.env.UPLOADS_PATH || path.resolve(process.cwd(), '..', 'public', 'uploads');
    registros = registros.filter((r: any) => {
      const cpf = (r.cpf || '').replace(/\D/g, '');
      if (!cpf) return false;
      if (r.foto && fs.existsSync(path.join(uploadsDir, path.basename(r.foto)))) return true;
      if (fs.existsSync(path.join(uploadsDir, `CHA_${cpf}.pdf`))) return true;
      return false;
    });

    res.json({ registros });
  } catch (error: any) {
    logger.error('CNH Náutica list error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// ========== DELETE CHAS ==========
router.post('/delete', async (req, res) => {
  try {
    const { admin_id, session_token, nautica_id } = req.body;

    if (!await validateSession(admin_id, session_token)) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const existing = await query<any[]>('SELECT * FROM chas WHERE id = ?', [nautica_id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const record = existing[0];
    const adminResult = await query<any[]>('SELECT `rank` FROM admins WHERE id = ?', [admin_id]);
    const rank = adminResult[0]?.rank;

    if (rank !== 'dono' && record.admin_id !== admin_id) {
      return res.status(403).json({ error: 'Sem permissão para excluir este registro' });
    }

    // Delete files
    const uploadsDir = path.resolve(process.cwd(), '..', 'public');
    const filesToDelete = [record.foto, record.qrcode].filter(Boolean);
    for (const fileUrl of filesToDelete) {
      const filePath = path.join(uploadsDir, fileUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }

    await query('DELETE FROM chas WHERE id = ?', [nautica_id]);

    res.json({ success: true });
  } catch (error: any) {
    logger.error('CNH Náutica delete error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// ========== UPDATE CHAS ==========
router.post('/update', async (req, res) => {
  try {
    const {
      admin_id, session_token, nautica_id,
      nome, data_nascimento, categoria, validade, emissao,
      numero_inscricao, limite_navegacao, requisitos, orgao_emissao,
      fotoBase64, matrizFrenteBase64, matrizVersoBase64,
    } = req.body;

    if (!await validateSession(admin_id, session_token)) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const existing = await query<any[]>('SELECT * FROM chas WHERE id = ?', [nautica_id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const record = existing[0];
    const cleanCpf = record.cpf;

    // Update photo if provided
    if (fotoBase64) {
      saveFile(fotoBase64, `${cleanCpf}img7`);
    }
    if (matrizFrenteBase64) {
      saveFile(matrizFrenteBase64, `${cleanCpf}matrizcha`);
    }
    if (matrizVersoBase64) {
      saveFile(matrizVersoBase64, `${cleanCpf}matrizcha2`);
    }

    // Regenerate QR code denso
    const densePadUpdate = '#MARINHA.DO.BRASIL//CARTEIRA.DE.HABILITACAO.DE.AMADOR//NORMAM-03//DIRETORIA.DE.PORTOS.E.COSTAS//v1=CERTIFICADO.DIGITAL//v2=HABILITACAO.AMADOR//v3=REGISTRO.MARITIMO//v4=CAPITANIA.PORTOS//v5=NAVEGACAO.INTERIOR//v6=NAVEGACAO.COSTEIRA//v7=COMANDO.MARINHA//v8=MINISTERIO.DEFESA//v9=TRIBUNAL.MARITIMO//v10=SERPRO';
    const chaQrBaseUrl = process.env.CNH_NAUTICA_QR_URL || 'https://certificado-marinha-vio.info/verificar-cha?cpf=';
    const qrData = `${chaQrBaseUrl}${cleanCpf}${densePadUpdate}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrData)}&format=png&ecc=M`;

    let qrcodeUrl = record.qrcode;
    try {
      const qrResp = await fetch(qrApiUrl);
      if (qrResp.ok) {
        const qrPngBytes = new Uint8Array(await qrResp.arrayBuffer());
        qrcodeUrl = saveBuffer(Buffer.from(qrPngBytes), `${cleanCpf}qrcodeimg7`);
      }
    } catch (e) {
      logger.error('CNH Náutica QR update error:', e);
    }

    const convertDate = (d: string | undefined) => {
      if (!d) return null;
      if (d.includes('/')) {
        const parts = d.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return d;
    };

    await query(
      `UPDATE chas SET nome = ?, data_nascimento = ?, categoria = ?, validade = ?, emissao = ?,
       numero_inscricao = ?, limite_navegacao = ?, requisitos = ?, orgao_emissao = ?, qrcode = ?
       WHERE id = ?`,
      [
        nome || record.nome, convertDate(data_nascimento) || record.data_nascimento,
        categoria || record.categoria, validade || record.validade, emissao || record.emissao,
        numero_inscricao || record.numero_inscricao, limite_navegacao || record.limite_navegacao,
        requisitos || record.requisitos, orgao_emissao || record.orgao_emissao, qrcodeUrl, nautica_id,
      ]
    );

    if (fotoBase64) {
      await query('UPDATE chas SET foto = ? WHERE id = ?', [`/uploads/${cleanCpf}img7.png`, nautica_id]);
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error('CNH Náutica update error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// ========== VERIFICAR CHA (público) ==========
router.post('/verificar', async (req, res) => {
  try {
    const { cpf } = req.body;
    if (!cpf) return res.status(400).json({ error: 'CPF não fornecido' });

    const cleanCpf = cpf.replace(/\D/g, '');
    const records = await query<any[]>('SELECT * FROM chas WHERE cpf = ? LIMIT 1', [cleanCpf]);
    if (!records.length) return res.status(404).json({ error: 'Não encontrado' });

    const r = records[0];

    // Format CPF
    const fmtCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

    // Convert date yyyy-mm-dd to dd/mm/yyyy
    const fmtDate = (d: string | null) => {
      if (!d) return null;
      const s = String(d).substring(0, 10);
      if (s.includes('-')) {
        const [y, m, day] = s.split('-');
        return `${day}/${m}/${y}`;
      }
      return s;
    };

    // Generate hash from cpf + senha
    const hashStr = (r.senha || '') + cleanCpf + (r.numero_inscricao || '');
    let hash = '';
    for (let i = 0; i < hashStr.length; i++) {
      hash += hashStr.charCodeAt(i).toString(16).toUpperCase();
    }
    hash = hash.substring(0, 40);

    res.json({
      nome: r.nome,
      cpf: fmtCpf,
      data_nascimento: fmtDate(r.data_nascimento),
      categoria: r.categoria,
      validade: r.validade,
      emissao: r.emissao,
      numero_inscricao: r.numero_inscricao,
      limite_navegacao: r.limite_navegacao,
      orgao_emissao: r.orgao_emissao,
      foto: r.foto,
      hash,
    });
  } catch (error: any) {
    logger.error('CNH Náutica verificar error:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ========== RENEW CHAS ==========
router.post('/renew', async (req, res) => {
  try {
    const { admin_id, session_token, record_id } = req.body;

    if (!admin_id || !session_token || !record_id) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios faltando' });
    }

    const admins = await query<any[]>('SELECT id, creditos, session_token, `rank` FROM admins WHERE id = ? AND session_token = ?', [admin_id, session_token]);
    if (!admins.length) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const admin = admins[0];
    const isUnlimitedRenew = admin.rank === 'dono' || admin.rank === 'sub';
    if (!isUnlimitedRenew && admin.creditos < 1) {
      return res.status(400).json({ error: 'Créditos insuficientes' });
    }

    const records = await query<any[]>('SELECT id, admin_id, expires_at FROM chas WHERE id = ? AND admin_id = ?', [record_id, admin_id]);
    if (!records.length) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const now = new Date();
    const currentExpiration = records[0].expires_at ? new Date(records[0].expires_at) : now;
    const baseDate = currentExpiration > now ? currentExpiration : now;
    const newExpiration = new Date(baseDate.getTime() + 45 * 24 * 60 * 60 * 1000);

    await query('UPDATE chas SET expires_at = ? WHERE id = ?', [newExpiration, record_id]);
    if (!isUnlimitedRenew) {
      await query('UPDATE admins SET creditos = creditos - 1 WHERE id = ?', [admin_id]);
    }

    logger.action('CNH NAUTICA RENOVADA', `record_id=${record_id}, nova_expiracao=${newExpiration.toISOString()}, admin_id=${admin_id}`);

    res.json({
      success: true,
      newExpiration: newExpiration.toISOString(),
      creditsRemaining: admin.creditos - 1,
    });
  } catch (error: any) {
    logger.error('CNH Náutica renew error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

export default router;
