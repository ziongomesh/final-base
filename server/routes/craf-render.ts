import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { spawn } from 'child_process';
import logger from '../utils/logger.ts';

const router = Router();

const publicDir = path.resolve(process.cwd(), '..', 'public');
const templatesDir = path.join(publicDir, 'templates');
const uploadsDir = path.join(publicDir, 'uploads');
const scriptsDir = path.resolve(process.cwd(), 'scripts');
const pythonScript = path.join(scriptsDir, 'craf_generator.py');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Possiveis caminhos da base no projeto
function resolveBasePath(): string {
  const candidates = [
    path.join(templatesDir, 'craf-base.png'),
    path.join(templatesDir, 'base.png'),
    path.join(publicDir, 'base.png'),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  // ultima tentativa: assume craf-base.png (vai falhar com mensagem clara)
  return candidates[0];
}

function pythonCmd(): string {
  // Permite override por env: CRAF_PYTHON=C:\Python311\python.exe
  return process.env.CRAF_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
}

function fontPath(): string {
  return process.env.CRAF_FONT || (process.platform === 'win32'
    ? 'C:\\Windows\\Fonts\\arial.ttf'
    : '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');
}

function saveB64ToTemp(b64: string | null | undefined, suffix: string): string | null {
  if (!b64) return null;
  const clean = b64.replace(/^data:[^;]+;base64,/, '');
  if (!clean) return null;
  const buf = Buffer.from(clean, 'base64');
  if (!buf.length) return null;
  const tmp = path.join(os.tmpdir(), `craf_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${suffix}`);
  fs.writeFileSync(tmp, buf);
  return tmp;
}

function runPython(payload: any): Promise<{ output: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(pythonCmd(), [pythonScript], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    proc.stdout.on('data', (d) => { out += d.toString(); });
    proc.stderr.on('data', (d) => { err += d.toString(); });
    proc.on('error', (e) => reject(new Error(`spawn falhou: ${e.message}`)));
    proc.on('close', (code) => {
      try {
        const parsed = JSON.parse(out.trim().split('\n').pop() || '{}');
        if (parsed?.ok) return resolve({ output: parsed.output });
        return reject(new Error(parsed?.error || err || `python exit ${code}`));
      } catch {
        return reject(new Error(err || out || `python exit ${code}`));
      }
    });
    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
  });
}

/**
 * POST /api/craf/render
 * body: { campos: {...}, qrcodeBase64, fotoBase64?, cpf? }
 * Gera o PNG via Python e retorna { imageBase64 }.
 */
router.post('/render', async (req, res) => {
  const tmpFiles: string[] = [];
  try {
    const { campos = {}, qrcodeBase64, cpf } = req.body || {};
    const qrcodePath = saveB64ToTemp(qrcodeBase64, '.png');
    if (qrcodePath) tmpFiles.push(qrcodePath);

    const cleanCpf = String(cpf || 'preview').replace(/\D/g, '') || 'preview';
    const outputPath = path.join(os.tmpdir(), `craf_out_${cleanCpf}_${Date.now()}.png`);
    tmpFiles.push(outputPath);

    const payload = {
      base_path: resolveBasePath(),
      qrcode_path: qrcodePath,
      output_path: outputPath,
      font_path: fontPath(),
      campos,
    };

    const { output } = await runPython(payload);
    const buf = fs.readFileSync(output);
    const b64 = `data:image/png;base64,${buf.toString('base64')}`;
    res.json({ success: true, imageBase64: b64 });
  } catch (e: any) {
    logger.error('[CRAF render] ', e);
    res.status(500).json({ error: e?.message || 'Erro ao renderizar CRAF' });
  } finally {
    for (const f of tmpFiles) { try { fs.unlinkSync(f); } catch {} }
  }
});

export default router;
