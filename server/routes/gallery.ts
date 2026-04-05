import { Router } from 'express';
import { query } from '../db';
import logger from '../utils/logger.ts';
import fs from 'fs';
import path from 'path';

const router = Router();

function getUploadsDir(): string {
  return process.env.UPLOADS_PATH || path.resolve(process.cwd(), '..', 'public', 'uploads');
}

function fileExistsInUploads(filePath: string): boolean {
  try {
    // If it's a relative path like /uploads/file.png, extract filename
    const filename = filePath.replace(/^.*\/uploads\//, '').replace(/^\/+/, '');
    const fullPath = path.join(getUploadsDir(), filename);
    const exists = fs.existsSync(fullPath);
    if (!exists) {
      logger.debug?.(`Gallery: file not found: ${fullPath}`);
    }
    return exists;
  } catch { return false; }
}

function extractUploadsFilename(url: string): string | null {
  // Extract filename from various URL formats
  if (!url) return null;
  if (url.startsWith('data:')) return null; // base64 - not a file
  const match = url.match(/\/uploads\/(.+)$/);
  if (match) return match[1];
  // If it's just a filename without path
  if (!url.includes('/') && !url.startsWith('http')) return url;
  return null;
}

async function validateSession(adminId: number, sessionToken: string): Promise<boolean> {
  const result = await query<any[]>(
    'SELECT 1 FROM admins WHERE id = ? AND session_token = ?',
    [adminId, sessionToken]
  );
  return result.length > 0;
}

function getUploadsBaseUrl(req: any): string {
  const envUrl = process.env.VITE_API_URL || process.env.API_URL;
  if (envUrl) return envUrl.replace(/\/api\/?$/, '');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:4000';
  return `${protocol}://${host}`;
}

// ========== LIST GALLERY (photos + signatures from all modules) ==========
router.post('/list', async (req, res) => {
  try {
    const { admin_id, session_token } = req.body;

    if (!await validateSession(admin_id, session_token)) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const baseUrl = getUploadsBaseUrl(req);
    const photos: any[] = [];
    const signatures: any[] = [];

    const makeUrl = (path: string | null) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      return `${baseUrl}${path}`;
    };

    // 1. CNH - usuarios table (foto_url + assinatura via file pattern)
    try {
      const cnhRows = await query<any[]>(
        'SELECT nome, cpf, foto_url, created_at FROM usuarios WHERE admin_id = ? AND foto_url IS NOT NULL ORDER BY created_at DESC LIMIT 100',
        [admin_id]
      );
      for (const row of cnhRows) {
        if (row.foto_url) {
          const filename = extractUploadsFilename(row.foto_url);
          logger.action('Gallery', `CNH foto_url: "${row.foto_url.substring(0, 80)}" -> filename: "${filename}" -> exists: ${filename ? fileExistsInUploads(filename) : 'N/A'}`);
          // Include if: it's a base64 data URL, no uploads filename (external URL), or file exists
          if (row.foto_url.startsWith('data:') || !filename || fileExistsInUploads(filename)) {
            photos.push({ url: makeUrl(row.foto_url), nome: row.nome, cpf: row.cpf, modulo: 'CNH', created_at: row.created_at });
          }
        }
        const cleanCpf = (row.cpf || '').replace(/\D/g, '');
        if (cleanCpf) {
          const sigFilename = `${cleanCpf}assinatura.png`;
          if (fileExistsInUploads(sigFilename)) {
            const sigUrl = `${baseUrl}/uploads/${sigFilename}`;
            signatures.push({ url: sigUrl, nome: row.nome, cpf: row.cpf, modulo: 'CNH', created_at: row.created_at });
          }
        }
      }
    } catch (e) { /* table may not exist */ }

    // 2. RG - rgs table (foto_url, assinatura_url)
    try {
      const rgRows = await query<any[]>(
        'SELECT nome_completo as nome, cpf, foto_url, assinatura_url, created_at FROM rgs WHERE admin_id = ? AND (foto_url IS NOT NULL OR assinatura_url IS NOT NULL) ORDER BY created_at DESC LIMIT 100',
        [admin_id]
      );
      for (const row of rgRows) {
        if (row.foto_url) {
          const filename = extractUploadsFilename(row.foto_url);
          if (row.foto_url.startsWith('data:') || !filename || fileExistsInUploads(filename)) {
            photos.push({ url: makeUrl(row.foto_url), nome: row.nome, cpf: row.cpf, modulo: 'RG', created_at: row.created_at });
          }
        }
        if (row.assinatura_url) {
          const filename = extractUploadsFilename(row.assinatura_url);
          if (row.assinatura_url.startsWith('data:') || !filename || fileExistsInUploads(filename)) {
            signatures.push({ url: makeUrl(row.assinatura_url), nome: row.nome, cpf: row.cpf, modulo: 'RG', created_at: row.created_at });
          }
        }
      }
    } catch (e) { /* table may not exist */ }

    // 3. CHA - chas table (foto)
    try {
      const chaRows = await query<any[]>(
        'SELECT nome, cpf, foto, created_at FROM chas WHERE admin_id = ? AND foto IS NOT NULL ORDER BY created_at DESC LIMIT 100',
        [admin_id]
      );
      for (const row of chaRows) {
        if (row.foto) {
          const filename = extractUploadsFilename(row.foto);
          if (row.foto.startsWith('data:') || !filename || fileExistsInUploads(filename)) {
            photos.push({ url: makeUrl(row.foto), nome: row.nome, cpf: row.cpf, modulo: 'CHA', created_at: row.created_at });
          }
        }
      }
    } catch (e) { /* table may not exist */ }

    // 4. Carteira Estudante - carteira_estudante table (perfil_imagem)
    try {
      const estRows = await query<any[]>(
        'SELECT nome, cpf, perfil_imagem, created_at FROM carteira_estudante WHERE admin_id = ? AND perfil_imagem IS NOT NULL ORDER BY created_at DESC LIMIT 100',
        [admin_id]
      );
      for (const row of estRows) {
        if (row.perfil_imagem) {
          const filename = extractUploadsFilename(row.perfil_imagem);
          if (row.perfil_imagem.startsWith('data:') || !filename || fileExistsInUploads(filename)) {
            photos.push({ url: makeUrl(row.perfil_imagem), nome: row.nome, cpf: row.cpf, modulo: 'Estudante', created_at: row.created_at });
          }
        }
      }
    } catch (e) { /* table may not exist */ }

    // Deduplicate by URL
    const uniquePhotos = [...new Map(photos.map(p => [p.url, p])).values()];
    const uniqueSignatures = [...new Map(signatures.map(s => [s.url, s])).values()];

    res.json({ photos: uniquePhotos, signatures: uniqueSignatures });
  } catch (error: any) {
    logger.error('Gallery list error:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

export default router;
