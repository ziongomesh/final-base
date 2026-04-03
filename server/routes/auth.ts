import { Router } from 'express';
import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.ts';
import { requireSession } from '../middleware/auth';

const router = Router();

const BCRYPT_ROUNDS = 10;

// Login (público - não precisa de sessão)
router.post('/login', async (req, res) => {
  try {
    const { email, key } = req.body;
    const clientIp = req.headers['x-forwarded-for'] as string || req.ip || 'unknown';

    if (!email || !key) {
      logger.loginFailed(email || '(vazio)', clientIp, 'Email ou chave não fornecidos');
      return res.status(400).json({ error: 'Email e chave são obrigatórios' });
    }

    const admins = await query<any[]>(
      'SELECT id, nome, email, creditos, creditos_transf, `rank`, profile_photo, pin, criado_por, `key` as stored_key, session_token, ip_address, last_active FROM admins WHERE email = ? LIMIT 1',
      [email]
    );

    if (admins.length === 0) {
      logger.loginFailed(email, clientIp, 'Email não encontrado');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const admin = admins[0];

    const providedKey = String(key).trim();
    const storedKeyRaw = String((admin as any).stored_key ?? '').trim();

    // Verificar senha: tenta bcrypt primeiro, senão compara plain text (migração)
    let match = false;
    if (storedKeyRaw.startsWith('$2a$') || storedKeyRaw.startsWith('$2b$')) {
      // Senha já está em bcrypt
      match = await bcrypt.compare(providedKey, storedKeyRaw);
    } else {
      // Senha ainda em plain text (migração automática)
      match = providedKey === storedKeyRaw;
    }

    if (!match) {
      logger.loginFailed(email, clientIp, 'Chave incorreta');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Re-hash com novo salt a cada login (hash rotativo)
    const newHash = await bcrypt.hash(providedKey, BCRYPT_ROUNDS);

    // Sessão única: se já tem sessão ativa de outro IP, notificar kick
    const oldSessionToken = admin.session_token;
    const oldIp = admin.ip_address;
    if (oldSessionToken && oldIp && oldIp !== clientIp) {
      logger.sessionKicked({ id: admin.id, nome: admin.nome }, oldIp, clientIp);
    }

    // Gerar novo token de sessão
    const sessionToken = uuidv4();

    // Atualiza sessão + re-hash da senha + salva plain em key_plain
    await query(
      'UPDATE admins SET session_token = ?, last_active = NOW(), ip_address = ?, `key` = ?, key_plain = ? WHERE id = ?',
      [sessionToken, clientIp, newHash, providedKey, admin.id]
    );

    logger.login(
      { id: admin.id, nome: admin.nome, email: admin.email, rank: admin.rank },
      clientIp
    );

    const lastAccess = admin.last_active;
    delete (admin as any).stored_key;
    delete (admin as any).ip_address;
    delete (admin as any).last_active;

    res.json({
      admin: {
        ...admin,
        session_token: sessionToken,
        has_pin: admin.pin ? true : false,
        last_access: lastAccess,
      },
    });
  } catch (error) {
    logger.error('Login', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Validar PIN (público - faz parte do fluxo de login, antes da sessão estar no localStorage)
router.post('/validate-pin', async (req, res) => {
  try {
    const { adminId, pin } = req.body;

    if (!adminId || !pin) {
      return res.status(400).json({ error: 'adminId e pin são obrigatórios' });
    }

    const result = await query<any[]>(
      'SELECT pin FROM admins WHERE id = ? LIMIT 1',
      [adminId]
    );

    if (result.length === 0) {
      logger.pinValidated(adminId, false);
      return res.json({ valid: false });
    }

    const storedPin = result[0].pin;
    const providedPin = String(req.body.pin ?? '').trim();
    const storedPinRaw = String(storedPin ?? '').trim();
    const valid = storedPinRaw === providedPin;

    logger.pinValidated(adminId, valid);

    res.json({ valid });
  } catch (error) {
    logger.error('Validar PIN', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Definir PIN (público - faz parte do fluxo de login, antes da sessão estar no localStorage)
router.post('/set-pin', async (req, res) => {
  try {
    const { adminId, pin } = req.body;

    if (!adminId || !pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN deve ter 4 dígitos numéricos' });
    }

    // Verificar que o admin existe e tem sessão ativa (validação leve)
    const rows = await query<any[]>(
      'SELECT id FROM admins WHERE id = ? AND session_token IS NOT NULL',
      [adminId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    await query('UPDATE admins SET pin = ? WHERE id = ?', [pin, adminId]);

    logger.action('PIN', `Admin ${adminId} definiu novo PIN`);

    res.json({ success: true });
  } catch (error) {
    logger.error('Definir PIN', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Validar sessão (público - usado pelo useSessionSecurity)
router.post('/validate-session', async (req, res) => {
  try {
    const { adminId, sessionToken } = req.body;
    const clientIp = req.headers['x-forwarded-for'] as string || req.ip || 'unknown';

    const result = await query<any[]>(
      'SELECT session_token, ip_address FROM admins WHERE id = ? AND session_token = ?',
      [adminId, sessionToken]
    );

    if (result.length === 0) {
      logger.sessionInvalid(adminId, clientIp);
      return res.json({ valid: false });
    }

    await query('UPDATE admins SET last_active = NOW() WHERE id = ?', [adminId]);

    res.json({ valid: true });
  } catch (error) {
    logger.error('Validar sessão', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { adminId } = req.body;

    const admins = await query<any[]>('SELECT nome FROM admins WHERE id = ?', [adminId]);
    const nome = admins[0]?.nome || 'Desconhecido';

    await query('UPDATE admins SET session_token = NULL WHERE id = ?', [adminId]);

    logger.logout(adminId, nome);

    res.json({ success: true });
  } catch (error) {
    logger.error('Logout', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
