import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import logger from '../utils/logger.ts';

const router = Router();

const publicDir = path.resolve(process.cwd(), '..', 'public');
const templatesDir = path.join(publicDir, 'templates');
const uploadsDir = path.join(publicDir, 'uploads');
const serverFontsDir = path.resolve(process.cwd(), 'fonts');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Posicoes EXATAS do script python original
const CAMPOS_LAYOUT: Array<{ key: string; x: number; y: number; size: number }> = [
  { key: 'tipo',            x: 1310, y: 2053, size: 18 },
  { key: 'registro',        x: 1297, y: 1960, size: 21 },
  { key: 'n_serie',         x: 1309, y: 2210, size: 18 },
  { key: 'n_sigma',         x: 1545, y: 2210, size: 18 },
  { key: 'calibre',         x: 1309, y: 2128, size: 18 },
  { key: 'marca',           x: 1550, y: 2053, size: 18 },
  { key: 'data_expedicao',  x: 1306, y: 2279, size: 20 },
  { key: 'gac_emissora',    x: 1293, y: 2423, size: 18 },
  { key: 'cidade_uf',       x: 1294, y: 2465, size: 18 },
  { key: 'amparo_legal',    x:  711, y: 1465, size: 18 },
  { key: 'sfpc_vinculacao', x: 1356, y: 1363, size: 18 },
  { key: 'rg',              x: 1018, y: 1363, size: 18 },
  { key: 'cpf',             x:  712, y: 1363, size: 18 },
  { key: 'nome',            x:  712, y: 1245, size: 20 },
  { key: 'validade',        x:  706, y: 1136, size: 21 },
];

const QR_X = 691;
const QR_Y = 1929;

// Registrar fonte (tenta arial do Windows, fallback OpenSans incluida no servidor)
let fontFamily = 'CrafFont';
let fontLoaded = false;
function ensureFont() {
  if (fontLoaded) return;
  const candidates = [
    process.env.CRAF_FONT,
    'C:\\Windows\\Fonts\\arial.ttf',
    path.join(serverFontsDir, 'OpenSans-Regular.ttf'),
  ].filter(Boolean) as string[];
  for (const fp of candidates) {
    try {
      if (fs.existsSync(fp)) {
        GlobalFonts.registerFromPath(fp, fontFamily);
        fontLoaded = true;
        logger.info(`[CRAF] Fonte carregada: ${fp}`);
        return;
      }
    } catch {}
  }
  // ultimo recurso: usar sans-serif default do canvas
  fontFamily = 'sans-serif';
  fontLoaded = true;
}

function resolveBasePath(): string {
  const candidates = [
    path.join(templatesDir, 'craf-base.png'),
    path.join(templatesDir, 'base.png'),
    path.join(publicDir, 'base.png'),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return candidates[0];
}

function b64ToBuffer(b64?: string | null): Buffer | null {
  if (!b64) return null;
  const clean = b64.replace(/^data:[^;]+;base64,/, '');
  if (!clean) return null;
  const buf = Buffer.from(clean, 'base64');
  return buf.length ? buf : null;
}

/**
 * POST /api/craf/render
 * body: { campos: {...}, qrcodeBase64?, cpf? }
 * Replica o script Python original em TypeScript usando @napi-rs/canvas.
 */
router.post('/render', async (req, res) => {
  try {
    ensureFont();
    const { campos = {}, qrcodeBase64 } = req.body || {};

    const basePath = resolveBasePath();
    if (!fs.existsSync(basePath)) {
      return res.status(500).json({ error: `base nao encontrada: ${basePath}` });
    }

    const base = await loadImage(basePath);
    const canvas = createCanvas(base.width, base.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(base, 0, 0);

    // QR-Code (mesma posicao do python: paste em (691,1929))
    const qrBuf = b64ToBuffer(qrcodeBase64);
    if (qrBuf) {
      try {
        const qr = await loadImage(qrBuf);
        ctx.drawImage(qr, QR_X, QR_Y);
      } catch (e) {
        logger.warn('[CRAF] qrcode invalido, ignorando');
      }
    }

    // Texto preto, identico ao Pillow draw.text((x,y), ...)
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    for (const { key, x, y, size } of CAMPOS_LAYOUT) {
      const valor = (campos as any)[key];
      if (valor === undefined || valor === null || valor === '') continue;
      ctx.font = `${size}px "${fontFamily}"`;
      ctx.fillText(String(valor), x, y);
    }

    const png = await canvas.encode('png');
    const b64 = `data:image/png;base64,${png.toString('base64')}`;
    res.json({ success: true, imageBase64: b64 });
  } catch (e: any) {
    logger.error('[CRAF render] ', e);
    res.status(500).json({ error: e?.message || 'Erro ao renderizar CRAF' });
  }
});

export default router;
