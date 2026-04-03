import { Request, Response, NextFunction } from 'express';
import { query } from '../db';

/**
 * Middleware de validação de sessão.
 * Espera os headers: x-admin-id e x-session-token
 * Anexa req.adminId e req.adminRank ao request se válido.
 */
export async function requireSession(req: Request, res: Response, next: NextFunction) {
  const adminId = req.headers['x-admin-id'] as string;
  const sessionToken = req.headers['x-session-token'] as string;

  if (!adminId || !sessionToken) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    const rows = await query<any[]>(
      'SELECT id, `rank` FROM admins WHERE id = ? AND session_token = ?',
      [adminId, sessionToken]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    (req as any).adminId = Number(rows[0].id);
    (req as any).adminRank = rows[0].rank;
    next();
  } catch (error) {
    console.error('Erro na validação de sessão:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Middleware que exige rank 'dono'.
 * Deve ser usado APÓS requireSession.
 */
export function requireDono(req: Request, res: Response, next: NextFunction) {
  if ((req as any).adminRank !== 'dono') {
    return res.status(403).json({ error: 'Sem permissão - apenas donos' });
  }
  next();
}

/**
 * Middleware que exige rank 'dono' ou 'sub'.
 * Deve ser usado APÓS requireSession.
 */
export function requireDonoOrSub(req: Request, res: Response, next: NextFunction) {
  const rank = (req as any).adminRank;
  if (rank !== 'dono' && rank !== 'sub') {
    return res.status(403).json({ error: 'Sem permissão - apenas donos ou subdonos' });
  }
  next();
}

/**
 * Middleware que exige rank 'dono', 'sub' ou 'master'.
 * Deve ser usado APÓS requireSession.
 */
export function requireMasterOrAbove(req: Request, res: Response, next: NextFunction) {
  const rank = (req as any).adminRank;
  if (rank !== 'dono' && rank !== 'sub' && rank !== 'master') {
    return res.status(403).json({ error: 'Sem permissão' });
  }
  next();
}

/**
 * Verifica se o rank tem créditos ilimitados (dono e sub).
 */
export function hasUnlimitedCredits(rank: string): boolean {
  return rank === 'dono' || rank === 'sub';
}
