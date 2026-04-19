import { Router } from 'express';
import { query } from '../db';
import logger from '../utils/logger.ts';
import * as fs from 'fs';
import * as path from 'path';
import { stripPdfMetadata } from '../utils/sanitize.ts';

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

// ========== SALVAR ATESTADO ==========
router.post('/save', async (req, res) => {
  try {
    const {
      admin_id, session_token,
      nome_paciente, cpf_paciente, dias_afastamento, data_apartir, horario_atendimento,
      codigo_doenca, descricao_doenca,
      nome_hospital, endereco_hospital, cidade_hospital,
      nome_medico, crm,
      codigo_autenticacao, data_hora, ip,
      link_validacao,
      pdf_base64,
    } = req.body;

    if (!await validateSession(admin_id, session_token)) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    // Verifica créditos
    const admins = await query<any[]>('SELECT creditos, `rank` FROM admins WHERE id = ?', [admin_id]);
    if (!admins.length) {
      return res.status(400).json({ error: 'Admin não encontrado' });
    }
    const isUnlimited = admins[0].rank === 'dono' || admins[0].rank === 'sub';
    if (!isUnlimited && admins[0].creditos <= 0) {
      return res.status(400).json({ error: 'Créditos insuficientes' });
    }

    // Salvar PDF se enviado
    let pdfUrl: string | null = null;
    if (pdf_base64) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const cpfClean = (cpf_paciente || '').replace(/\D/g, '');
        const fileName = `hapvida_${cpfClean}_${Date.now()}.pdf`;
        const filePath = path.join(uploadsDir, fileName);

        const match = pdf_base64.match(/^data:[^;]+;base64,(.+)$/s);
        const base64Data = match ? match[1] : pdf_base64;
        const rawBuf = Buffer.from(base64Data.replace(/\s/g, ''), 'base64');

        // Re-processa o PDF para remover metadados identificadores
        let finalBuf: Buffer = rawBuf;
        try {
          const { PDFDocument } = await import('pdf-lib');
          const doc = await PDFDocument.load(rawBuf);
          stripPdfMetadata(doc);
          finalBuf = Buffer.from(await doc.save());
        } catch {
          // Se falhar o reload, usa o original
        }

        fs.writeFileSync(filePath, finalBuf);

        pdfUrl = `/uploads/${fileName}`;
      } catch (pdfErr: any) {
        logger.error('Hapvida PDF save error:', pdfErr);
      }
    }

    const result = await query<any>(
      `INSERT INTO hapvida_atestados (
        admin_id, nome_paciente, cpf_paciente, dias_afastamento, data_apartir, horario_atendimento,
        codigo_doenca, descricao_doenca,
        nome_hospital, endereco_hospital, cidade_hospital,
        nome_medico, crm,
        codigo_autenticacao, data_hora, ip, link_validacao, pdf_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        admin_id, nome_paciente, cpf_paciente?.replace(/\D/g, ''), dias_afastamento,
        data_apartir, horario_atendimento,
        codigo_doenca, descricao_doenca || null,
        nome_hospital, endereco_hospital || null, cidade_hospital || null,
        nome_medico, crm || null,
        codigo_autenticacao || null, data_hora || null, ip || null, link_validacao || null,
        pdfUrl,
      ]
    );

    // Debitar 1 crédito
    if (!isUnlimited) {
      await query('UPDATE admins SET creditos = creditos - 1 WHERE id = ?', [admin_id]);
    }

    // Log transação
    await query(
      `INSERT INTO credit_transactions (from_admin_id, to_admin_id, amount, transaction_type) VALUES (?, ?, 1, 'hapvida')`,
      [admin_id, admin_id]
    );

    logger.action('HAPVIDA_ATESTADO', `admin_id=${admin_id} paciente=${nome_paciente}`);

    res.json({ success: true, id: result.insertId, pdf_url: pdfUrl });
  } catch (error: any) {
    logger.error('Hapvida save error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// ========== LISTAR ATESTADOS ==========
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
      registros = await query<any[]>(
        `SELECT h.*, a.nome AS admin_nome FROM hapvida_atestados h
         LEFT JOIN admins a ON a.id = h.admin_id
         ORDER BY h.created_at DESC LIMIT 10000`
      );
    } else {
      registros = await query<any[]>(
        `SELECT h.*, a.nome AS admin_nome FROM hapvida_atestados h
         LEFT JOIN admins a ON a.id = h.admin_id
         WHERE h.admin_id = ?
         ORDER BY h.created_at DESC LIMIT 10000`,
        [admin_id]
      );
    }

    // Filtrar registros cujos arquivos não existem mais no uploads
    const uploadsDir = process.env.UPLOADS_PATH || path.resolve(process.cwd(), '..', 'public', 'uploads');
    registros = registros.filter((r: any) => {
      if (!r.pdf_url) return false;
      return fs.existsSync(path.join(uploadsDir, path.basename(r.pdf_url)));
    });

    res.json({ registros });
  } catch (error: any) {
    logger.error('Hapvida list error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// ========== DELETAR ATESTADO ==========
router.post('/delete', async (req, res) => {
  try {
    const { admin_id, session_token, atestado_id } = req.body;

    if (!await validateSession(admin_id, session_token)) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const adminResult = await query<any[]>('SELECT `rank` FROM admins WHERE id = ?', [admin_id]);
    const rank = adminResult[0]?.rank;

    // Buscar PDF para limpar arquivo do disco
    const records = await query<any[]>('SELECT pdf_url FROM hapvida_atestados WHERE id = ?', [atestado_id]);
    if (records && records.length > 0 && records[0].pdf_url) {
      const filePath = path.join(process.cwd(), 'public', records[0].pdf_url.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.action('HAPVIDA_DELETE', `Arquivo removido: ${records[0].pdf_url}`);
      }
    }

    if (rank === 'dono' || rank === 'sub') {
      await query('DELETE FROM hapvida_atestados WHERE id = ?', [atestado_id]);
    } else {
      await query('DELETE FROM hapvida_atestados WHERE id = ? AND admin_id = ?', [atestado_id, admin_id]);
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Hapvida delete error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

export default router;
