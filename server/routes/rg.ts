import { Router } from 'express';
import { query } from '../db';
import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import logger from '../utils/logger.ts';

// Cache OpenSans fonts in memory
let openSansRegularBytes: Buffer | null = null;
let openSansBoldBytes: Buffer | null = null;

async function getOpenSansFonts(): Promise<{ regular: Buffer; bold: Buffer }> {
  if (openSansRegularBytes && openSansBoldBytes) {
    return { regular: openSansRegularBytes, bold: openSansBoldBytes };
  }
  // Try server/fonts/ directory first (bundled with server)
  const serverFontsDir = path.resolve(process.cwd(), 'fonts');
  const publicFontsDir = path.resolve(process.cwd(), '..', 'public', 'fonts');
  
  for (const fontsDir of [serverFontsDir, publicFontsDir]) {
    const localRegular = path.join(fontsDir, 'OpenSans-Regular.ttf');
    const localBold = path.join(fontsDir, 'OpenSans-Bold.ttf');
    if (fs.existsSync(localRegular) && fs.existsSync(localBold)) {
      openSansRegularBytes = fs.readFileSync(localRegular);
      openSansBoldBytes = fs.readFileSync(localBold);
      return { regular: openSansRegularBytes, bold: openSansBoldBytes };
    }
  }
  
  // Fallback: fetch from Google Fonts
  const [regRes, boldRes] = await Promise.all([
    fetch("https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVc.ttf"),
    fetch("https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4gaVc.ttf"),
  ]);
  openSansRegularBytes = Buffer.from(await regRes.arrayBuffer());
  openSansBoldBytes = Buffer.from(await boldRes.arrayBuffer());
  // Save locally for future use
  if (!fs.existsSync(serverFontsDir)) fs.mkdirSync(serverFontsDir, { recursive: true });
  fs.writeFileSync(path.join(serverFontsDir, 'OpenSans-Regular.ttf'), openSansRegularBytes);
  fs.writeFileSync(path.join(serverFontsDir, 'OpenSans-Bold.ttf'), openSansBoldBytes);
  return { regular: openSansRegularBytes, bold: openSansBoldBytes };
}

async function drawGovBrText(pdfDoc: any, page: any, pageHeight: number) {
  try {
    const { regular, bold } = await getOpenSansFonts();
    const regularFont = await pdfDoc.embedFont(regular);
    const boldFont = await pdfDoc.embedFont(bold);

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    const fontSize = 12;
    const textY = pageHeight - 45;
    const textX = 22;
    const textColor = rgb(0.22, 0.22, 0.22);

    const part1 = "Compartilhado pelo aplicativo ";
    const part2 = "gov.br";
    const part3 = ` em ${dateStr}`;

    const w1 = regularFont.widthOfTextAtSize(part1, fontSize);
    const w2 = boldFont.widthOfTextAtSize(part2, fontSize);

    page.drawText(part1, { x: textX, y: textY, size: fontSize, font: regularFont, color: textColor });
    page.drawText(part2, { x: textX + w1, y: textY, size: fontSize, font: boldFont, color: textColor });
    page.drawText(part3, { x: textX + w1 + w2, y: textY, size: fontSize, font: regularFont, color: textColor });
  } catch (fontErr) {
    logger.error("Gov.br text error:", fontErr);
  }
}

const router = Router();

function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function textoEstado(uf: string): string {
  const estados: Record<string, string> = {
    AC: 'Estado do Acre', AL: 'Estado de Alagoas', AP: 'Estado do Amapá',
    AM: 'Estado do Amazonas', BA: 'Estado da Bahia', CE: 'Estado do Ceará',
    DF: 'Distrito Federal', ES: 'Estado do Espírito Santo', GO: 'Estado de Goiás',
    MA: 'Estado do Maranhão', MT: 'Estado do Mato Grosso', MS: 'Estado do Mato Grosso do Sul',
    MG: 'Estado de Minas Gerais', PA: 'Estado do Pará', PB: 'Estado da Paraíba',
    PR: 'Estado do Paraná', PE: 'Estado de Pernambuco', PI: 'Estado do Piauí',
    RJ: 'Estado do Rio de Janeiro', RN: 'Estado do Rio Grande do Norte',
    RS: 'Estado do Rio Grande do Sul', RO: 'Estado de Rondônia', RR: 'Estado de Roraima',
    SC: 'Estado de Santa Catarina', SP: 'Estado de São Paulo', SE: 'Estado de Sergipe',
    TO: 'Estado do Tocantins',
  };
  return estados[uf?.toUpperCase()] || `Estado de ${uf?.toUpperCase()}`;
}

function formatarNomeMRZ(nome: string): string {
  const nomeLimpo = nome.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .trim()
    .replace(/\s+/g, '<');
  return `D<${nomeLimpo}<<<<<`.slice(0, 44);
}

function toMySQLDate(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
}

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

// ========== SAVE RG ==========
router.post('/save', async (req, res) => {
  try {
    const {
      admin_id, session_token,
      cpf, nomeCompleto, nomeSocial,
      dataNascimento, naturalidade, genero, nacionalidade, validade,
      uf, dataEmissao, local, orgaoExpedidor, pai, mae,
      rgFrenteBase64, rgVersoBase64, fotoBase64, assinaturaBase64,
      pdfPageBase64,
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

    const cleanCpf = cpf.replace(/\D/g, '');
    const existing = await query<any[]>('SELECT id, nome_completo, admin_id FROM rgs WHERE cpf = ?', [cleanCpf]);
    if (existing.length > 0) {
      const record = existing[0];
      let creatorName = 'Desconhecido';
      const adminsCreator = await query<any[]>('SELECT nome FROM admins WHERE id = ?', [record.admin_id]);
      if (adminsCreator.length > 0) creatorName = adminsCreator[0].nome;
      return res.status(409).json({
        error: 'CPF já cadastrado',
        details: {
          existingRg: record,
          creator_admin_id: record.admin_id,
          creator_name: creatorName,
          is_own: record.admin_id === admin_id,
        },
      });
    }

    const senha = cleanCpf.slice(-6);

    const saveFile = (base64: string | undefined, name: string, ext: string = 'png'): string | null => {
      if (!base64) return null;
      const uploadsDir = path.resolve(process.cwd(), '..', 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const filename = `${name}.${ext}`;
      const filepath = path.join(uploadsDir, filename);
      const clean = base64.replace(/^data:[^;]+;base64,/, '');
      fs.writeFileSync(filepath, Buffer.from(clean, 'base64'));
      return `/uploads/${filename}`;
    };

    const saveBuffer = (buffer: Buffer | Uint8Array, name: string, ext: string = 'png'): string => {
      const uploadsDir = path.resolve(process.cwd(), '..', 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const filename = `${name}.${ext}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, buffer);
      return `/uploads/${filename}`;
    };

    const fotoUrl = saveFile(fotoBase64, `${cleanCpf}_foto`);
    const assinaturaUrl = saveFile(assinaturaBase64, `${cleanCpf}_assinatura`);
    saveFile(rgFrenteBase64, `${cleanCpf}matriz`);
    saveFile(rgVersoBase64, `${cleanCpf}matriz2`);

    // Inserir na tabela rgs
    const result = await query<any>(
      `INSERT INTO rgs (
        admin_id, cpf, nome_completo, nome_social, senha,
        data_nascimento, naturalidade, genero, nacionalidade, validade,
        uf, data_emissao, \`local\`, orgao_expedidor, pai, mae,
        foto, assinatura, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 45 DAY))`,
      [
        admin_id, cleanCpf, nomeCompleto, nomeSocial || null, senha,
        toMySQLDate(dataNascimento), naturalidade, genero, nacionalidade || 'BRA', toMySQLDate(validade),
        uf, toMySQLDate(dataEmissao), local, orgaoExpedidor, pai || null, mae || null,
        fotoUrl, assinaturaUrl,
      ]
    );

    const rgId = result.insertId;

    // QR Code - link direto por CPF (denso)
    const densePad = '#REPUBLICA.FEDERATIVA.DO.BRASIL//CARTEIRA.DE.IDENTIDADE.NACIONAL//REGISTRO.GERAL//INSTITUTO.NACIONAL.DE.IDENTIFICACAO//v1=SERPRO//v2=ICP-BRASIL//v3=CERTIFICADO.DIGITAL//v4=ASSINATURA.DIGITAL//v5=VALIDACAO.BIOMETRICA//v6=SECRETARIA.SEGURANCA.PUBLICA//v7=GOV.BR//v8=DENATRAN//v9=POLICIA.FEDERAL//v10=MRZ.ICAO';
    let qrcodeUrl: string | null = null;
    let qrPngBytes: Uint8Array | null = null;
    try {
      const rgQrBaseUrl = process.env.RG_QR_URL || 'https://qrcode-validacao-vio.info/verificar-cin?cpf=';
      const qrData = `${rgQrBaseUrl}${cleanCpf}${densePad}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrData)}&format=png&ecc=M`;
      const qrResp = await fetch(qrApiUrl);
      if (qrResp.ok) {
        qrPngBytes = new Uint8Array(await qrResp.arrayBuffer());
        qrcodeUrl = saveBuffer(Buffer.from(qrPngBytes), `${cleanCpf}qrcode`);
      }
    } catch (e) {
      logger.error('RG QR code generation error:', e);
    }

    // Gerar PDF
    let pdfUrl: string | null = null;
    try {
      const pageWidth = 595.28;
      const pageHeight = 841.89;

      if (pdfPageBase64) {
        // Use client-rendered full-page image (single PNG = non-editable)
        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const cleanB64 = pdfPageBase64.replace(/^data:image\/\w+;base64,/, '');
        const imgBytes = Buffer.from(cleanB64, 'base64');
        const fullPageImg = await pdfDoc.embedPng(imgBytes);
        page.drawImage(fullPageImg, { x: 0, y: 0, width: pageWidth, height: pageHeight });
        await drawGovBrText(pdfDoc, page, pageHeight);
        const pdfBytes = await pdfDoc.save();
        pdfUrl = saveBuffer(Buffer.from(pdfBytes), `RG_DIGITAL_${cleanCpf}`, 'pdf');
      } else {
        // Fallback: server-side PDF generation
        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const ocrBPath = path.resolve(process.cwd(), 'fonts', 'OCR-B.ttf');
        const ocrBFont = fs.existsSync(ocrBPath) ? await pdfDoc.embedFont(fs.readFileSync(ocrBPath)) : await pdfDoc.embedFont(StandardFonts.Courier);
        const fontSize = 7;
        const fillColor = rgb(0, 0, 0);
        const grayColor = rgb(0.224, 0.216, 0.22);
        const ty = (pdfkitY: number, h: number = 0) => pageHeight - pdfkitY - h;

        const bgPath = path.resolve(process.cwd(), '..', 'public', 'templates', 'matrizpdf.png');
        const bgFallback = path.resolve(process.cwd(), '..', 'public', 'images', 'rg-pdf-bg.png');
        const bgFile = fs.existsSync(bgPath) ? bgPath : (fs.existsSync(bgFallback) ? bgFallback : null);
        if (bgFile) {
          const bgBytes = fs.readFileSync(bgFile);
          const bgImg = await pdfDoc.embedPng(bgBytes);
          page.drawImage(bgImg, { x: 0, y: 0, width: pageWidth, height: pageHeight });
        }

        const embedBase64 = async (b64: string) => {
          const isJpeg = b64.startsWith('data:image/jpeg') || b64.startsWith('data:image/jpg');
          const clean = b64.replace(/^data:image\/\w+;base64,/, '');
          const buf = Buffer.from(clean, 'base64');
          return isJpeg ? await pdfDoc.embedJpg(buf) : await pdfDoc.embedPng(buf);
        };

        if (qrPngBytes) {
          const qrImg = await pdfDoc.embedPng(qrPngBytes);
          const qrX = 462 * 0.85;
          const qrY_pk = 90 * 0.85;
          const qrSz = 180 * 0.85;
          page.drawImage(qrImg, { x: qrX, y: ty(qrY_pk, qrSz), width: qrSz, height: qrSz });
          page.drawImage(qrImg, { x: 39, y: ty(314, 57), width: 57, height: 57 });
        }

        if (fotoBase64) {
          try {
            const fotoImg = await embedBase64(fotoBase64);
            page.drawImage(fotoImg, { x: 35, y: ty(137.5, 86), width: 69, height: 86 });
            page.drawImage(fotoImg, { x: 297, y: ty(302.5, 32), width: 28, height: 32 });
          } catch (e) { logger.error('Erro ao embutir foto no PDF:', e); }
        }

        const fmtDate = (d: string) => {
          if (!d) return '';
          if (d.includes('/')) return d;
          const p = d.split('-');
          return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
        };
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const drawText = (text: string, x: number, pdfkitY: number, opts?: { font?: any; size?: number; color?: any }) => {
          page.drawText(text || '', {
            x, y: ty(pdfkitY, opts?.size || fontSize),
            size: opts?.size || fontSize,
            font: opts?.font || helvetica,
            color: opts?.color || fillColor,
          });
        };

        drawText(nomeCompleto, 112, 146);
        drawText(nomeSocial || '', 112, 172);
        drawText(formatCPF(cleanCpf), 112, 192);
        drawText(fmtDate(dataNascimento), 112, 212);
        drawText(naturalidade, 112, 231);
        drawText(genero, 231, 186);
        drawText(nacionalidade || 'BRA', 231, 206);
        drawText(fmtDate(validade), 231, 225);
        drawText(pai || '', 112, 308);
        drawText(mae || '', 112, 325);
        drawText(orgaoExpedidor || '', 112, 348);
        drawText(local || '', 112, 367);
        drawText(fmtDate(dataEmissao), 228, 367);
        drawText(dataAtual, 217, 26.5, { size: 9 });
        const nomeEstado = textoEstado(uf).toUpperCase();
        drawText(nomeEstado, 120, 101, { size: 8, color: grayColor });
        drawText('SECRETARIA DE SEGURANÇA DA UNIDADE DA FEDERAÇÃO', 82, 111, { size: 8, color: grayColor });
        const linha1 = 'IDBRA5398762281453987622814<<0';
        const linha2 = '051120M340302BRA<<<<<<<<<<<<<2';
        const linha3 = formatarNomeMRZ(nomeCompleto);
        drawText(linha1, 65, 423, { font: ocrBFont, size: 7, color: grayColor });
        drawText(linha2, 65, 435, { font: ocrBFont, size: 7, color: grayColor });
        drawText(linha3, 62, 447, { font: ocrBFont, size: 7, color: grayColor });

        if (assinaturaBase64) {
          try {
            const assImg = await embedBase64(assinaturaBase64);
            page.drawImage(assImg, { x: 130, y: ty(240, 15), width: 110, height: 15 });
            page.drawImage(assImg, { x: 20, y: ty(583, 15), width: 110, height: 15 });
          } catch (e) { logger.error('PDF ass error:', e); }
        }

        const tempPdfBytes = await pdfDoc.save();
        const tempDoc = await PDFDocument.load(tempPdfBytes);
        const flatDoc = await PDFDocument.create();
        flatDoc.registerFontkit(fontkit);
        const [embeddedPage] = await flatDoc.embedPages(tempDoc.getPages());
        const flatPage = flatDoc.addPage([pageWidth, pageHeight]);
        flatPage.drawPage(embeddedPage, { x: 0, y: 0, width: pageWidth, height: pageHeight });
        await drawGovBrText(flatDoc, flatPage, pageHeight);
        const pdfBytes = await flatDoc.save();
        pdfUrl = saveBuffer(Buffer.from(pdfBytes), `RG_DIGITAL_${cleanCpf}`, 'pdf');
      }
    } catch (e) {
      logger.error('RG PDF generation error:', e);
    }

    // Update QR + PDF
    await query('UPDATE rgs SET qrcode = ? WHERE id = ?', [qrcodeUrl, rgId]);

    // Debitar 1 crédito (pular para dono/sub)
    if (!isUnlimited) {
      await query('UPDATE admins SET creditos = creditos - 1 WHERE id = ?', [admin_id]);
    }

    // Log transação
    await query(
      `INSERT INTO credit_transactions (from_admin_id, to_admin_id, amount, transaction_type) VALUES (?, ?, 1, 'rg_creation')`,
      [admin_id, admin_id]
    );

    const rgData = await query<any[]>('SELECT expires_at FROM rgs WHERE id = ?', [rgId]);

    res.json({
      success: true,
      id: rgId,
      senha,
      pdf: pdfUrl,
      dataExpiracao: rgData[0]?.expires_at || null,
      images: { frente: `/uploads/${cleanCpf}matriz.png`, verso: `/uploads/${cleanCpf}matriz2.png` },
    });
  } catch (error: any) {
    logger.error('RG save error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// ========== LIST RG ==========
router.post('/list', async (req, res) => {
  try {
    const { admin_id, session_token } = req.body;

    if (!await validateSession(admin_id, session_token)) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const adminResult = await query<any[]>('SELECT `rank` FROM admins WHERE id = ?', [admin_id]);
    const rank = adminResult[0]?.rank;

    const selectFields = `id, admin_id, cpf, nome_completo, nome_completo AS nome, nome_social, 
      data_nascimento, naturalidade, genero, nacionalidade, validade, uf, 
      data_emissao, \`local\` AS local_emissao, orgao_expedidor, pai, mae, senha,
      foto AS foto_url, assinatura AS assinatura_url, qrcode AS qrcode_url,
      created_at, expires_at AS data_expiracao`;

    let registros: any[];
    if (rank === 'dono' || rank === 'sub') {
      registros = await query<any[]>(`SELECT ${selectFields} FROM rgs ORDER BY created_at DESC LIMIT 200`);
    } else {
      registros = await query<any[]>(`SELECT ${selectFields} FROM rgs WHERE admin_id = ? ORDER BY created_at DESC LIMIT 200`, [admin_id]);
    }

    // Construct matrix URLs from CPF
    registros = registros.map(r => {
      const cpf = r.cpf?.replace(/\D/g, '') || '';
      return {
        ...r,
        rg_frente_url: r.rg_frente_url || `/uploads/${cpf}matriz.png`,
        rg_verso_url: r.rg_verso_url || `/uploads/${cpf}matriz2.png`,
        pdf_url: r.pdf_url || `/uploads/RG_DIGITAL_${cpf}.pdf`,
      };
    });

    // Filtrar registros cujos arquivos não existem mais no uploads
    const uploadsDir = process.env.UPLOADS_PATH || path.resolve(process.cwd(), '..', 'public', 'uploads');
    registros = registros.filter((r: any) => {
      const cpf = (r.cpf || '').replace(/\D/g, '');
      if (!cpf) return false;
      if (fs.existsSync(path.join(uploadsDir, `${cpf}matriz.png`))) return true;
      if (r.pdf_url && fs.existsSync(path.join(uploadsDir, path.basename(r.pdf_url)))) return true;
      return false;
    });

    res.json({ registros });
  } catch (error: any) {
    logger.error('RG list error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// ========== UPDATE RG ==========
router.post('/update', async (req, res) => {
  try {
    const {
      admin_id, session_token, rg_id,
      nomeCompleto, nomeSocial, dataNascimento, naturalidade, genero,
      nacionalidade, validade, uf, dataEmissao, local, orgaoExpedidor,
      pai, mae, changedMatrices,
      rgFrenteBase64, rgVersoBase64, fotoBase64, assinaturaBase64,
      pdfPageBase64,
    } = req.body;

    if (!await validateSession(admin_id, session_token)) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const existing = await query<any[]>('SELECT * FROM rgs WHERE id = ?', [rg_id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const rg = existing[0];
    const cleanCpf = rg.cpf;
    const changed: string[] = changedMatrices || [];

    const saveFile = (base64: string | undefined, name: string, ext: string = 'png'): string | null => {
      if (!base64) return null;
      const uploadsDir = path.resolve(process.cwd(), '..', 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const filename = `${name}.${ext}`;
      const filepath = path.join(uploadsDir, filename);
      const clean = base64.replace(/^data:[^;]+;base64,/, '');
      fs.writeFileSync(filepath, Buffer.from(clean, 'base64'));
      return `/uploads/${filename}`;
    };

    const saveBuffer = (buffer: Buffer | Uint8Array, name: string, ext: string = 'png'): string => {
      const uploadsDir = path.resolve(process.cwd(), '..', 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const filename = `${name}.${ext}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, buffer);
      return `/uploads/${filename}`;
    };

    // Upload changed matrices
    if (changed.includes('frente') && rgFrenteBase64) {
      saveFile(rgFrenteBase64, `${cleanCpf}matriz`);
    }
    if (changed.includes('verso') && rgVersoBase64) {
      saveFile(rgVersoBase64, `${cleanCpf}matriz2`);
    }
    if (fotoBase64) {
      saveFile(fotoBase64, `${cleanCpf}_foto`);
    }
    if (assinaturaBase64) {
      saveFile(assinaturaBase64, `${cleanCpf}_assinatura`);
    }

    // Update DB fields
    await query(
      `UPDATE rgs SET
        nome_completo = ?, nome_social = ?, data_nascimento = ?, naturalidade = ?,
        genero = ?, nacionalidade = ?, validade = ?, uf = ?,
        data_emissao = ?, \`local\` = ?, orgao_expedidor = ?,
        pai = ?, mae = ?, updated_at = NOW()
      WHERE id = ?`,
      [
        nomeCompleto, nomeSocial || null,
        toMySQLDate(dataNascimento), naturalidade, genero,
        nacionalidade || 'BRA', toMySQLDate(validade), uf,
        toMySQLDate(dataEmissao), local, orgaoExpedidor,
        pai || null, mae || null, rg_id,
      ]
    );

    // Regenerate QR + PDF
    const senha = cleanCpf.slice(-6);
    let qrcodeUrl: string | null = null;
    let qrPngBytes: Uint8Array | null = null;
    try {
      const densePadUpdate = '#REPUBLICA.FEDERATIVA.DO.BRASIL//CARTEIRA.DE.IDENTIDADE.NACIONAL//REGISTRO.GERAL//INSTITUTO.NACIONAL.DE.IDENTIFICACAO//v1=SERPRO//v2=ICP-BRASIL//v3=CERTIFICADO.DIGITAL//v4=ASSINATURA.DIGITAL//v5=VALIDACAO.BIOMETRICA//v6=SECRETARIA.SEGURANCA.PUBLICA//v7=GOV.BR//v8=DENATRAN//v9=POLICIA.FEDERAL//v10=MRZ.ICAO';
      const rgQrBaseUrl = process.env.RG_QR_URL || 'https://qrcode-validacao-vio.info/verificar-cin?cpf=';
      const qrData = `${rgQrBaseUrl}${cleanCpf}${densePadUpdate}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrData)}&format=png&ecc=M`;
      const qrResp = await fetch(qrApiUrl);
      if (qrResp.ok) {
        qrPngBytes = new Uint8Array(await qrResp.arrayBuffer());
        qrcodeUrl = saveBuffer(Buffer.from(qrPngBytes), `${cleanCpf}qrcode`);
      }
    } catch (e) {
      logger.error('RG QR update error:', e);
    }

    // Regenerate PDF
    let pdfUrl: string | null = null;
    try {
      const pageWidth = 595.28;
      const pageHeight = 841.89;

      if (pdfPageBase64) {
        // Use client-rendered full-page image (single PNG = non-editable)
        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const cleanB64 = pdfPageBase64.replace(/^data:image\/\w+;base64,/, '');
        const imgBytes = Buffer.from(cleanB64, 'base64');
        const fullPageImg = await pdfDoc.embedPng(imgBytes);
        page.drawImage(fullPageImg, { x: 0, y: 0, width: pageWidth, height: pageHeight });
        await drawGovBrText(pdfDoc, page, pageHeight);
        const pdfBytes = await pdfDoc.save();
        pdfUrl = saveBuffer(Buffer.from(pdfBytes), `RG_DIGITAL_${cleanCpf}`, 'pdf');
      } else {
        // Fallback: server-side PDF generation
        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const ocrBPath2 = path.resolve(process.cwd(), 'fonts', 'OCR-B.ttf');
        const ocrBFont = fs.existsSync(ocrBPath2) ? await pdfDoc.embedFont(fs.readFileSync(ocrBPath2)) : await pdfDoc.embedFont(StandardFonts.Courier);
        const fontSize = 7;
        const fillColor = rgb(0, 0, 0);
        const grayColor = rgb(0.224, 0.216, 0.22);
        const ty = (pdfkitY: number, h: number = 0) => pageHeight - pdfkitY - h;

        const bgPath2 = path.resolve(process.cwd(), '..', 'public', 'templates', 'matrizpdf.png');
        const bgFallback2 = path.resolve(process.cwd(), '..', 'public', 'images', 'rg-pdf-bg.png');
        const bgFile2 = fs.existsSync(bgPath2) ? bgPath2 : (fs.existsSync(bgFallback2) ? bgFallback2 : null);
        if (bgFile2) {
          const bgBytes = fs.readFileSync(bgFile2);
          const bgImg = await pdfDoc.embedPng(bgBytes);
          page.drawImage(bgImg, { x: 0, y: 0, width: pageWidth, height: pageHeight });
        }

        const embedBase64Pdf = async (b64: string) => {
          const isJpeg = b64.startsWith('data:image/jpeg') || b64.startsWith('data:image/jpg');
          const clean = b64.replace(/^data:image\/\w+;base64,/, '');
          const buf = Buffer.from(clean, 'base64');
          return isJpeg ? await pdfDoc.embedJpg(buf) : await pdfDoc.embedPng(buf);
        };

        if (qrPngBytes) {
          const qrImg = await pdfDoc.embedPng(qrPngBytes);
          const qrX = 462 * 0.85;
          const qrY_pk = 90 * 0.85;
          const qrSz = 180 * 0.85;
          page.drawImage(qrImg, { x: qrX, y: ty(qrY_pk, qrSz), width: qrSz, height: qrSz });
          page.drawImage(qrImg, { x: 39, y: ty(314, 57), width: 57, height: 57 });
        }

        const fotoToEmbed = fotoBase64 || (() => {
          const fotoPath = path.resolve(process.cwd(), '..', 'public', 'uploads', `${cleanCpf}_foto.png`);
          if (fs.existsSync(fotoPath)) return `data:image/png;base64,${fs.readFileSync(fotoPath).toString('base64')}`;
          return null;
        })();
        if (fotoToEmbed) {
          try {
            const fotoImg = await embedBase64Pdf(fotoToEmbed);
            page.drawImage(fotoImg, { x: 35, y: ty(137.5, 86), width: 69, height: 86 });
            page.drawImage(fotoImg, { x: 297, y: ty(302.5, 32), width: 28, height: 32 });
          } catch (e) { logger.error('PDF foto error:', e); }
        }

        const fmtDate = (d: string) => {
          if (!d) return '';
          if (d.includes('/')) return d;
          const p = d.split('-');
          return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
        };
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const drawText = (text: string, x: number, pdfkitY: number, opts?: { font?: any; size?: number; color?: any }) => {
          page.drawText(text || '', {
            x, y: ty(pdfkitY, opts?.size || fontSize),
            size: opts?.size || fontSize,
            font: opts?.font || helvetica,
            color: opts?.color || fillColor,
          });
        };

        drawText(nomeCompleto, 112, 146);
        drawText(nomeSocial || '', 112, 172);
        drawText(formatCPF(cleanCpf), 112, 192);
        drawText(fmtDate(dataNascimento), 112, 212);
        drawText(naturalidade, 112, 231);
        drawText(genero, 231, 186);
        drawText(nacionalidade || 'BRA', 231, 206);
        drawText(fmtDate(validade), 231, 225);
        drawText(pai || '', 112, 308);
        drawText(mae || '', 112, 325);
        drawText(orgaoExpedidor || '', 112, 348);
        drawText(local || '', 112, 367);
        drawText(fmtDate(dataEmissao), 228, 367);
        drawText(dataAtual, 217, 26.5, { size: 9 });
        const nomeEstado = textoEstado(uf).toUpperCase();
        drawText(nomeEstado, 120, 101, { size: 8, color: grayColor });
        drawText('SECRETARIA DE SEGURANÇA DA UNIDADE DA FEDERAÇÃO', 82, 111, { size: 8, color: grayColor });
        const linha1 = 'IDBRA5398762281453987622814<<0';
        const linha2 = '051120M340302BRA<<<<<<<<<<<<<2';
        const linha3 = formatarNomeMRZ(nomeCompleto);
        drawText(linha1, 65, 423, { font: ocrBFont, size: 7, color: grayColor });
        drawText(linha2, 65, 435, { font: ocrBFont, size: 7, color: grayColor });
        drawText(linha3, 62, 447, { font: ocrBFont, size: 7, color: grayColor });

        const assToEmbed = assinaturaBase64 || (() => {
          const assPath = path.resolve(process.cwd(), '..', 'public', 'uploads', `${cleanCpf}_assinatura.png`);
          if (fs.existsSync(assPath)) return `data:image/png;base64,${fs.readFileSync(assPath).toString('base64')}`;
          return null;
        })();
        if (assToEmbed) {
          try {
            const assImg = await embedBase64Pdf(assToEmbed);
            page.drawImage(assImg, { x: 130, y: ty(240, 15), width: 110, height: 15 });
            page.drawImage(assImg, { x: 20, y: ty(583, 15), width: 110, height: 15 });
          } catch (e) { logger.error('PDF ass error:', e); }
        }

        const tempPdfBytes = await pdfDoc.save();
        const tempDoc = await PDFDocument.load(tempPdfBytes);
        const flatDoc = await PDFDocument.create();
        flatDoc.registerFontkit(fontkit);
        const [embeddedPage] = await flatDoc.embedPages(tempDoc.getPages());
        const flatPage = flatDoc.addPage([pageWidth, pageHeight]);
        flatPage.drawPage(embeddedPage, { x: 0, y: 0, width: pageWidth, height: pageHeight });
        await drawGovBrText(flatDoc, flatPage, pageHeight);
        const pdfBytes = await flatDoc.save();
        pdfUrl = saveBuffer(Buffer.from(pdfBytes), `RG_DIGITAL_${cleanCpf}`, 'pdf');
      }
    } catch (e) {
      logger.error('RG PDF update error:', e);
    }

    // Update QR + PDF URLs
    await query('UPDATE rgs SET qrcode = ?, pdf_url = ? WHERE id = ?', [qrcodeUrl, pdfUrl, rg_id]);

    res.json({
      success: true,
      pdf: pdfUrl,
      changedMatrices: changed,
      images: { frente: `/uploads/${cleanCpf}matriz.png`, verso: `/uploads/${cleanCpf}matriz2.png` },
    });
  } catch (error: any) {
    logger.error('RG update error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// ========== DELETE RG ==========
router.post('/delete', async (req, res) => {
  try {
    const { admin_id, session_token, rg_id } = req.body;

    if (!await validateSession(admin_id, session_token)) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const existing = await query<any[]>('SELECT id, cpf, admin_id FROM rgs WHERE id = ?', [rg_id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const adminResult = await query<any[]>('SELECT `rank` FROM admins WHERE id = ?', [admin_id]);
    if (adminResult[0]?.rank !== 'dono' && existing[0].admin_id !== admin_id) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const cpf = existing[0].cpf;
    const uploadsDir = path.resolve(process.cwd(), '..', 'public', 'uploads');
    const filesToDelete = [
      `${cpf}matriz.png`, `${cpf}matriz2.png`, `${cpf}_foto.png`,
      `${cpf}_assinatura.png`, `${cpf}qrcode.png`, `RG_DIGITAL_${cpf}.pdf`,
    ];
    for (const file of filesToDelete) {
      const filepath = path.join(uploadsDir, file);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }

    await query('DELETE FROM rgs WHERE id = ?', [rg_id]);
    logger.action('RG EXCLUÍDO', `rg_id=${rg_id}, cpf=${cpf}, por admin_id=${admin_id}`);

    res.json({ success: true });
  } catch (error: any) {
    logger.error('RG delete error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// POST /rg/renew - Renovar RG (+45 dias)
router.post('/renew', async (req, res) => {
  try {
    const { admin_id, session_token, record_id } = req.body;

    if (!admin_id || !session_token || !record_id) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios faltando' });
    }

    // Validar sessão
    const admins = await query<any[]>('SELECT id, creditos, session_token, `rank` FROM admins WHERE id = ? AND session_token = ?', [admin_id, session_token]);
    if (!admins || admins.length === 0) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const admin = admins[0];
    const isUnlimitedRenew = admin.rank === 'dono' || admin.rank === 'sub';
    if (!isUnlimitedRenew && admin.creditos < 1) {
      return res.status(400).json({ error: 'Créditos insuficientes' });
    }

    // Buscar registro
    const records = await query<any[]>('SELECT id, admin_id, expires_at FROM rgs WHERE id = ? AND admin_id = ?', [record_id, admin_id]);
    if (!records || records.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const record = records[0];
    const currentExp = record.expires_at ? new Date(record.expires_at) : new Date();
    const base = currentExp > new Date() ? currentExp : new Date();
    const newExpiration = new Date(base.getTime() + 45 * 24 * 60 * 60 * 1000);

    // Atualizar expiração
    await query('UPDATE rgs SET expires_at = ? WHERE id = ?', [newExpiration, record_id]);

    // Deduzir crédito
    if (!isUnlimitedRenew) {
      await query('UPDATE admins SET creditos = creditos - 1 WHERE id = ?', [admin_id]);
    }

    logger.action('RG RENOVADO', `record_id=${record_id}, nova_expiracao=${newExpiration.toISOString()}, admin_id=${admin_id}`);

    res.json({
      success: true,
      newExpiration: newExpiration.toISOString(),
      creditsRemaining: admin.creditos - 1,
    });
  } catch (error: any) {
    logger.error('RG renew error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

export default router;
