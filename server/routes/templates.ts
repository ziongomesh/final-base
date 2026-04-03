import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { query } from '../db';

const router = Router();

// Map of allowed template names to file paths
const TEMPLATE_MAP: Record<string, string> = {
  'limpa1.png': 'src/assets/templates/limpa1.png',
  'limpa-1.png': 'src/assets/templates/limpa-1.png',
  'limpa1-2.png': 'src/assets/templates/limpa1-2.png',
  'limpa2.png': 'src/assets/templates/limpa2.png',
  'limpa2-2.png': 'src/assets/templates/limpa2-2.png',
  'limpa3.png': 'src/assets/templates/limpa3.png',
  'limpa3-2.png': 'src/assets/templates/limpa3-2.png',
  'rg-frente.png': 'src/assets/templates/rg-frente.png',
  'rg-verso.png': 'src/assets/templates/rg-verso.png',
  'rg-verso-template.png': 'src/assets/templates/rg-verso-template.png',
  'rg-pdf-bg.png': 'src/assets/templates/rg-pdf-bg.png',
  'matrizcha.png': 'src/assets/templates/matrizcha.png',
  'matrizcha2.png': 'src/assets/templates/matrizcha2.png',
  'qrcode-sample.png': 'src/assets/templates/qrcode-sample.png',
  'qrcode-sample-rg.png': 'src/assets/templates/qrcode-sample-rg.png',
  'cha-sample-foto.png': 'src/assets/templates/cha-sample-foto.png',
};

// XOR obfuscation key - makes raw response unreadable in proxy tools
const XOR_KEY = [0x5A, 0x3C, 0x7F, 0x1D, 0xA2, 0x6E, 0x91, 0xB4, 0xD8, 0x43, 0xF0, 0x27, 0x8B, 0xE5, 0x19, 0x6C];

function xorBuffer(data: Buffer): Buffer {
  const result = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ XOR_KEY[i % XOR_KEY.length];
  }
  return result;
}

// Validate session via headers
async function validateTemplateSession(req: any): Promise<boolean> {
  const adminId = req.headers['x-admin-id'];
  const sessionToken = req.headers['x-session-token'];
  if (!adminId || !sessionToken) return false;
  const result = await query<any[]>(
    'SELECT 1 FROM admins WHERE id = ? AND session_token = ?',
    [adminId, sessionToken]
  );
  return result.length > 0;
}

// Serve template as obfuscated binary payload (requires auth)
router.post('/secure/:name', async (req, res) => {
  try {
    // Require authentication
    if (!await validateTemplateSession(req)) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const name = req.params.name;
    const relativePath = TEMPLATE_MAP[name];

    if (!relativePath) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }

    const filePath = path.resolve(process.cwd(), '..', relativePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Read file, XOR obfuscate, return as binary
    const fileData = fs.readFileSync(filePath);
    const obfuscated = xorBuffer(fileData);

    // Return as application/octet-stream (not image/png - proxy tools won't preview it)
    res.set('Content-Type', 'application/octet-stream');
    res.set('Cache-Control', 'no-store'); // No caching of templates
    res.set('X-Content-Type-Options', 'nosniff');
    res.send(obfuscated);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
