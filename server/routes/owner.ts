import { Router } from 'express';
import { query } from '../db';

const router = Router();

// Middleware: verificar se é dono ou sub
async function requireOwnerOrSub(req: any, res: any, next: any) {
  const adminId = req.headers['x-admin-id'];
  const sessionToken = req.headers['x-session-token'];
  
  if (!adminId || !sessionToken) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const admins = await query<any[]>(
    'SELECT `rank` FROM admins WHERE id = ? AND session_token = ?',
    [adminId, sessionToken]
  );

  if (admins.length === 0 || (admins[0].rank !== 'dono' && admins[0].rank !== 'sub')) {
    return res.status(403).json({ error: 'Apenas donos ou subdonos podem acessar' });
  }

  (req as any).ownerRank = admins[0].rank;
  (req as any).ownerId = parseInt(adminId);
  next();
}

router.use(requireOwnerOrSub);

// GET /owner/overview - Visão geral completa do sistema
router.get('/overview', async (req, res) => {
  try {
    const rank = (req as any).ownerRank;
    const ownerId = (req as any).ownerId;
    
    if (rank === 'sub') {
      // Sub: vê apenas seus criados
      const allCreated = await query<any[]>('SELECT id, `rank` FROM admins WHERE criado_por = ?', [ownerId]);
      const masterIds = allCreated.filter(a => a.rank === 'master').map(a => a.id);
      const directResellers = allCreated.filter(a => a.rank === 'revendedor').length;
      
      let subResellers = 0;
      if (masterIds.length > 0) {
        const ph = masterIds.map(() => '?').join(',');
        const [extra] = await query<any[]>(`SELECT COUNT(*) as count FROM admins WHERE \`rank\` = 'revendedor' AND criado_por IN (${ph})`, masterIds);
        subResellers = extra?.count || 0;
      }
      
      const allIds = [ownerId, ...allCreated.map(a => a.id)];
      // Add resellers of sub's masters
      if (masterIds.length > 0) {
        const ph = masterIds.map(() => '?').join(',');
        const subMasterResellers = await query<any[]>(`SELECT id FROM admins WHERE \`rank\` = 'revendedor' AND criado_por IN (${ph})`, masterIds);
        allIds.push(...subMasterResellers.map(r => r.id));
      }
      const uniqueIds = [...new Set(allIds)];
      const ph2 = uniqueIds.map(() => '?').join(',');
      
      const [cnhCount] = await query<any[]>(`SELECT COUNT(*) as count FROM usuarios WHERE admin_id IN (${ph2})`, uniqueIds);
      const [rgCount] = await query<any[]>(`SELECT COUNT(*) as count FROM rgs WHERE admin_id IN (${ph2})`, uniqueIds);
      const [carteiraCount] = await query<any[]>(`SELECT COUNT(*) as count FROM carteira_estudante WHERE admin_id IN (${ph2})`, uniqueIds);
      const [crlvCount] = await query<any[]>(`SELECT COUNT(*) as count FROM usuarios_crlv WHERE admin_id IN (${ph2})`, uniqueIds);
      const [chaCount] = await query<any[]>(`SELECT COUNT(*) as count FROM chas WHERE admin_id IN (${ph2})`, uniqueIds);
      const [txCount] = await query<any[]>(`SELECT COUNT(*) as count FROM credit_transactions WHERE from_admin_id IN (${ph2}) OR to_admin_id IN (${ph2})`, [...uniqueIds, ...uniqueIds]);
      const [revenue] = await query<any[]>(`SELECT COALESCE(SUM(amount), 0) as total FROM pix_payments WHERE status = ? AND admin_id IN (${ph2})`, ['PAID', ...uniqueIds]);
      
      res.json({
        totalMasters: masterIds.length,
        totalResellers: directResellers + subResellers,
        totalCredits: 0,
        totalTransactions: txCount?.count || 0,
        totalRevenue: revenue?.total || 0,
        documents: {
          cnh: cnhCount?.count || 0,
          rg: rgCount?.count || 0,
          carteira: carteiraCount?.count || 0,
          crlv: crlvCount?.count || 0,
          cha: chaCount?.count || 0,
          total: (cnhCount?.count || 0) + (rgCount?.count || 0) + (carteiraCount?.count || 0) + (crlvCount?.count || 0) + (chaCount?.count || 0),
        }
      });
    } else {
      const [masters] = await query<any[]>('SELECT COUNT(*) as count FROM admins WHERE `rank` = ?', ['master']);
      const [resellers] = await query<any[]>('SELECT COUNT(*) as count FROM admins WHERE `rank` = ?', ['revendedor']);
      const [totalCredits] = await query<any[]>('SELECT SUM(creditos) as total FROM admins');
      const [cnhCount] = await query<any[]>('SELECT COUNT(*) as count FROM usuarios');
      const [rgCount] = await query<any[]>('SELECT COUNT(*) as count FROM rgs');
      const [carteiraCount] = await query<any[]>('SELECT COUNT(*) as count FROM carteira_estudante');
      const [crlvCount] = await query<any[]>('SELECT COUNT(*) as count FROM usuarios_crlv');
      const [chaCount] = await query<any[]>('SELECT COUNT(*) as count FROM chas');
      const [txCount] = await query<any[]>('SELECT COUNT(*) as count FROM credit_transactions');
      const [revenue] = await query<any[]>('SELECT COALESCE(SUM(amount), 0) as total FROM pix_payments WHERE status = ?', ['PAID']);

      res.json({
        totalMasters: masters?.count || 0,
        totalResellers: resellers?.count || 0,
        totalCredits: totalCredits?.total || 0,
        totalTransactions: txCount?.count || 0,
        totalRevenue: revenue?.total || 0,
        documents: {
          cnh: cnhCount?.count || 0,
          rg: rgCount?.count || 0,
          carteira: carteiraCount?.count || 0,
          crlv: crlvCount?.count || 0,
          cha: chaCount?.count || 0,
          total: (cnhCount?.count || 0) + (rgCount?.count || 0) + (carteiraCount?.count || 0) + (crlvCount?.count || 0) + (chaCount?.count || 0),
        }
      });
    }
  } catch (error) {
    console.error('Erro no overview:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /owner/all-admins - Listar todos os admins com contagem de serviços e último serviço
router.get('/all-admins', async (req, res) => {
  try {
    const rank = (req as any).ownerRank;
    const ownerId = (req as any).ownerId;
    
    let whereClause = '';
    let whereParams: any[] = [];
    
    if (rank === 'sub') {
      // Sub vê: a si mesmo + seus criados diretos + revendedores dos seus masters
      const directCreated = await query<any[]>('SELECT id FROM admins WHERE criado_por = ?', [ownerId]);
      const masterIds = directCreated.filter((a: any) => true).map((a: any) => a.id);
      const allVisibleIds = [ownerId, ...masterIds];
      
      // Also get resellers created by sub's masters
      if (masterIds.length > 0) {
        const ph = masterIds.map(() => '?').join(',');
        const subResellers = await query<any[]>(`SELECT id FROM admins WHERE criado_por IN (${ph})`, masterIds);
        allVisibleIds.push(...subResellers.map((r: any) => r.id));
      }
      
      const uniqueIds = [...new Set(allVisibleIds)];
      const placeholders = uniqueIds.map(() => '?').join(',');
      whereClause = `WHERE a.id IN (${placeholders})`;
      whereParams = uniqueIds;
    }
    
    const admins = await query<any[]>(
      `SELECT a.id, a.nome, a.email, a.creditos, a.\`rank\`, a.profile_photo, a.created_at, a.last_active, a.criado_por, a.key_plain,
              c.nome as criado_por_nome,
              (SELECT COUNT(*) FROM usuarios WHERE admin_id = a.id) as total_cnh,
              (SELECT COUNT(*) FROM rgs WHERE admin_id = a.id) as total_rg,
              (SELECT COUNT(*) FROM carteira_estudante WHERE admin_id = a.id) as total_carteira,
              (SELECT COUNT(*) FROM usuarios_crlv WHERE admin_id = a.id) as total_crlv,
              (SELECT COUNT(*) FROM chas WHERE admin_id = a.id) as total_cha
       FROM admins a
       LEFT JOIN admins c ON a.criado_por = c.id
       ${whereClause}
       ORDER BY a.\`rank\` ASC, a.nome ASC`,
      whereParams
    );

    // Para cada admin, buscar último serviço criado
    for (const adm of admins) {
      adm.total_services = (adm.total_cnh || 0) + (adm.total_rg || 0) + (adm.total_carteira || 0) + (adm.total_crlv || 0) + (adm.total_cha || 0);

      // Buscar último serviço com data
      const lastServices = await query<any[]>(
        `(SELECT 'CNH' COLLATE utf8mb4_unicode_ci as tipo, nome COLLATE utf8mb4_unicode_ci as nome, cpf COLLATE utf8mb4_unicode_ci as cpf, created_at FROM usuarios WHERE admin_id = ? ORDER BY created_at DESC LIMIT 1)
         UNION ALL
         (SELECT 'RG' COLLATE utf8mb4_unicode_ci as tipo, nome_completo COLLATE utf8mb4_unicode_ci as nome, cpf COLLATE utf8mb4_unicode_ci as cpf, created_at FROM rgs WHERE admin_id = ? ORDER BY created_at DESC LIMIT 1)
         UNION ALL
         (SELECT 'Carteira' COLLATE utf8mb4_unicode_ci as tipo, nome COLLATE utf8mb4_unicode_ci as nome, cpf COLLATE utf8mb4_unicode_ci as cpf, created_at FROM carteira_estudante WHERE admin_id = ? ORDER BY created_at DESC LIMIT 1)
         UNION ALL
         (SELECT 'CRLV' COLLATE utf8mb4_unicode_ci as tipo, nome_proprietario COLLATE utf8mb4_unicode_ci as nome, cpf_cnpj COLLATE utf8mb4_unicode_ci as cpf, created_at FROM usuarios_crlv WHERE admin_id = ? ORDER BY created_at DESC LIMIT 1)
         UNION ALL
         (SELECT 'Náutica' COLLATE utf8mb4_unicode_ci as tipo, nome COLLATE utf8mb4_unicode_ci as nome, cpf COLLATE utf8mb4_unicode_ci as cpf, created_at FROM chas WHERE admin_id = ? ORDER BY created_at DESC LIMIT 1)
         ORDER BY created_at DESC LIMIT 1`,
        [adm.id, adm.id, adm.id, adm.id, adm.id]
      );

      if (lastServices.length > 0) {
        const ls = lastServices[0];
        adm.last_service = {
          tipo: ls.tipo,
          nome: ls.nome,
          cpf: ls.cpf,
          created_at: ls.created_at,
        };

        // Calcular saldo antes/depois do último serviço
        // Contar serviços criados DEPOIS do último serviço (incluindo ele)
        // Cada serviço custa 1 crédito, então saldo_antes = saldo_atual + serviços_criados_desde
        const serviceDate = ls.created_at;
        const [afterCount] = await query<any[]>(
          `SELECT (
            (SELECT COUNT(*) FROM usuarios WHERE admin_id = ? AND created_at >= ?) +
            (SELECT COUNT(*) FROM rgs WHERE admin_id = ? AND created_at >= ?) +
            (SELECT COUNT(*) FROM carteira_estudante WHERE admin_id = ? AND created_at >= ?) +
            (SELECT COUNT(*) FROM usuarios_crlv WHERE admin_id = ? AND created_at >= ?) +
            (SELECT COUNT(*) FROM chas WHERE admin_id = ? AND created_at >= ?)
          ) as services_since`,
          [adm.id, serviceDate, adm.id, serviceDate, adm.id, serviceDate, adm.id, serviceDate, adm.id, serviceDate]
        );

        // Buscar créditos recebidos desde o último serviço
        const [creditsReceived] = await query<any[]>(
          `SELECT COALESCE(SUM(amount), 0) as received FROM credit_transactions 
           WHERE to_admin_id = ? AND created_at >= ?`,
          [adm.id, serviceDate]
        );
        // Buscar créditos enviados desde o último serviço
        const [creditsSent] = await query<any[]>(
          `SELECT COALESCE(SUM(amount), 0) as sent FROM credit_transactions 
           WHERE from_admin_id = ? AND created_at >= ?`,
          [adm.id, serviceDate]
        );

        const servicesSince = afterCount?.services_since || 0;
        const received = creditsReceived?.received || 0;
        const sent = creditsSent?.sent || 0;

        // saldo_antes_ultimo = saldo_atual + serviços_desde + enviados_desde - recebidos_desde
        const saldoAntes = adm.creditos + servicesSince + sent - received;
        // saldo_depois_ultimo = saldo_antes - 1 (custo do serviço)
        const saldoDepois = saldoAntes - 1;

        adm.last_service.saldo_antes = Math.max(0, saldoAntes);
        adm.last_service.saldo_depois = Math.max(0, saldoDepois);
      } else {
        adm.last_service = null;
      }
    }

    res.json(admins);
  } catch (error) {
    console.error('Erro ao listar admins:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /owner/audit-log - Histórico de atividades do sistema
router.get('/audit-log', async (req, res) => {
  try {
    const adminId = req.query.adminId ? parseInt(req.query.adminId as string) : null;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const activities: any[] = [];

    const cnhFilter = adminId ? 'WHERE u.admin_id = ?' : '';
    const cnhParams = adminId ? [adminId] : [];
    const cnhs = await query<any[]>(
      `SELECT u.id, u.cpf, u.nome, u.created_at, u.admin_id, a.nome as admin_nome, a.creditos as admin_saldo_atual
       FROM usuarios u JOIN admins a ON u.admin_id = a.id ${cnhFilter}
       ORDER BY u.created_at DESC LIMIT ?`,
      [...cnhParams, limit]
    );
    cnhs.forEach(c => activities.push({ type: 'service', service: 'CNH', cpf: c.cpf, nome_documento: c.nome, admin_id: c.admin_id, admin_nome: c.admin_nome, admin_saldo_atual: c.admin_saldo_atual, created_at: c.created_at }));

    const rgFilter = adminId ? 'WHERE r.admin_id = ?' : '';
    const rgParams = adminId ? [adminId] : [];
    const rgs = await query<any[]>(
      `SELECT r.id, r.cpf, r.nome_completo as nome, r.created_at, r.admin_id, a.nome as admin_nome, a.creditos as admin_saldo_atual
       FROM rgs r JOIN admins a ON r.admin_id = a.id ${rgFilter}
       ORDER BY r.created_at DESC LIMIT ?`,
      [...rgParams, limit]
    );
    rgs.forEach(r => activities.push({ type: 'service', service: 'RG', cpf: r.cpf, nome_documento: r.nome, admin_id: r.admin_id, admin_nome: r.admin_nome, admin_saldo_atual: r.admin_saldo_atual, created_at: r.created_at }));

    const cartFilter = adminId ? 'WHERE ce.admin_id = ?' : '';
    const cartParams = adminId ? [adminId] : [];
    const carteiras = await query<any[]>(
      `SELECT ce.id, ce.cpf, ce.nome, ce.created_at, ce.admin_id, a.nome as admin_nome, a.creditos as admin_saldo_atual
       FROM carteira_estudante ce JOIN admins a ON ce.admin_id = a.id ${cartFilter}
       ORDER BY ce.created_at DESC LIMIT ?`,
      [...cartParams, limit]
    );
    carteiras.forEach(c => activities.push({ type: 'service', service: 'Carteira', cpf: c.cpf, nome_documento: c.nome, admin_id: c.admin_id, admin_nome: c.admin_nome, admin_saldo_atual: c.admin_saldo_atual, created_at: c.created_at }));

    const crlvFilter = adminId ? 'WHERE uc.admin_id = ?' : '';
    const crlvParams = adminId ? [adminId] : [];
    const crlvs = await query<any[]>(
      `SELECT uc.id, uc.cpf_cnpj as cpf, uc.nome_proprietario as nome, uc.created_at, uc.admin_id, a.nome as admin_nome, a.creditos as admin_saldo_atual
       FROM usuarios_crlv uc JOIN admins a ON uc.admin_id = a.id ${crlvFilter}
       ORDER BY uc.created_at DESC LIMIT ?`,
      [...crlvParams, limit]
    );
    crlvs.forEach(c => activities.push({ type: 'service', service: 'CRLV', cpf: c.cpf, nome_documento: c.nome, admin_id: c.admin_id, admin_nome: c.admin_nome, admin_saldo_atual: c.admin_saldo_atual, created_at: c.created_at }));

    const chaFilter = adminId ? 'WHERE ch.admin_id = ?' : '';
    const chaParams = adminId ? [adminId] : [];
    const chas = await query<any[]>(
      `SELECT ch.id, ch.cpf, ch.nome, ch.created_at, ch.admin_id, a.nome as admin_nome, a.creditos as admin_saldo_atual
       FROM chas ch JOIN admins a ON ch.admin_id = a.id ${chaFilter}
       ORDER BY ch.created_at DESC LIMIT ?`,
      [...chaParams, limit]
    );
    chas.forEach(c => activities.push({ type: 'service', service: 'Náutica', cpf: c.cpf, nome_documento: c.nome, admin_id: c.admin_id, admin_nome: c.admin_nome, admin_saldo_atual: c.admin_saldo_atual, created_at: c.created_at }));

    const txFilter = adminId ? 'WHERE ct.from_admin_id = ? OR ct.to_admin_id = ?' : '';
    const txParams = adminId ? [adminId, adminId] : [];
    const transfers = await query<any[]>(
      `SELECT ct.id, ct.amount, ct.transaction_type, ct.total_price, ct.created_at,
              ct.from_admin_id, ct.to_admin_id,
              fa.nome as from_nome, fa.creditos as from_saldo_atual,
              ta.nome as to_nome, ta.creditos as to_saldo_atual
       FROM credit_transactions ct
       LEFT JOIN admins fa ON ct.from_admin_id = fa.id
       LEFT JOIN admins ta ON ct.to_admin_id = ta.id
       ${txFilter}
       ORDER BY ct.created_at DESC LIMIT ?`,
      [...txParams, limit]
    );
    transfers.forEach(t => activities.push({
      type: t.transaction_type === 'recharge' ? 'recharge' : 'transfer',
      amount: t.amount, total_price: t.total_price,
      from_admin_id: t.from_admin_id, from_nome: t.from_nome, from_saldo_atual: t.from_saldo_atual,
      to_admin_id: t.to_admin_id, to_nome: t.to_nome, to_saldo_atual: t.to_saldo_atual,
      created_at: t.created_at
    }));

    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(activities.slice(0, limit));
  } catch (error) {
    console.error('Erro no audit log:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /owner/change-password/:adminId
router.put('/change-password/:adminId', async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    const { newPassword } = req.body;
    const targetId = parseInt(req.params.adminId);
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await query('UPDATE admins SET `key` = ?, key_plain = ? WHERE id = ?', [hashed, newPassword, targetId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /owner/transfer-credits
router.post('/transfer-credits', async (req, res) => {
  try {
    const { toAdminId, amount } = req.body;
    const fromAdminId = parseInt(req.headers['x-admin-id'] as string);
    if (!toAdminId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    const [owner] = await query<any[]>('SELECT creditos FROM admins WHERE id = ?', [fromAdminId]);
    if (!owner || owner.creditos < amount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }
    await query('UPDATE admins SET creditos = creditos - ? WHERE id = ?', [amount, fromAdminId]);
    await query('UPDATE admins SET creditos = creditos + ? WHERE id = ?', [amount, toAdminId]);
    await query(
      'INSERT INTO credit_transactions (from_admin_id, to_admin_id, amount, transaction_type) VALUES (?, ?, ?, ?)',
      [fromAdminId, toAdminId, amount, 'transfer']
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao transferir créditos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /owner/top-resellers - Top por serviços
router.get('/top-resellers', async (_req, res) => {
  try {
    const resellers = await query<any[]>(
      `SELECT a.id, a.nome, a.email, a.creditos, a.last_active, a.\`rank\`, a.criado_por,
        (SELECT COUNT(*) FROM usuarios WHERE admin_id = a.id) +
        (SELECT COUNT(*) FROM rgs WHERE admin_id = a.id) +
        (SELECT COUNT(*) FROM carteira_estudante WHERE admin_id = a.id) +
        (SELECT COUNT(*) FROM usuarios_crlv WHERE admin_id = a.id) +
        (SELECT COUNT(*) FROM chas WHERE admin_id = a.id) as total_services
       FROM admins a
       WHERE a.\`rank\` IN ('revendedor', 'master', 'dono')
       ORDER BY total_services DESC
       LIMIT 15`
    );
    res.json(resellers);
  } catch (error) {
    console.error('Erro ao buscar top:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /owner/last-service - Último serviço criado no sistema inteiro
router.get('/last-service', async (_req, res) => {
  try {
    const lastServices = await query<any[]>(
      `(SELECT 'CNH' COLLATE utf8mb4_unicode_ci as tipo, u.nome COLLATE utf8mb4_unicode_ci as nome, u.cpf COLLATE utf8mb4_unicode_ci as cpf, u.created_at, u.admin_id, a.nome COLLATE utf8mb4_unicode_ci as admin_nome, a.creditos as admin_saldo 
        FROM usuarios u JOIN admins a ON u.admin_id = a.id ORDER BY u.created_at DESC LIMIT 1)
       UNION ALL
       (SELECT 'RG' COLLATE utf8mb4_unicode_ci as tipo, r.nome_completo COLLATE utf8mb4_unicode_ci as nome, r.cpf COLLATE utf8mb4_unicode_ci as cpf, r.created_at, r.admin_id, a.nome COLLATE utf8mb4_unicode_ci as admin_nome, a.creditos as admin_saldo 
        FROM rgs r JOIN admins a ON r.admin_id = a.id ORDER BY r.created_at DESC LIMIT 1)
       UNION ALL
       (SELECT 'Carteira' COLLATE utf8mb4_unicode_ci as tipo, ce.nome COLLATE utf8mb4_unicode_ci as nome, ce.cpf COLLATE utf8mb4_unicode_ci as cpf, ce.created_at, ce.admin_id, a.nome COLLATE utf8mb4_unicode_ci as admin_nome, a.creditos as admin_saldo 
        FROM carteira_estudante ce JOIN admins a ON ce.admin_id = a.id ORDER BY ce.created_at DESC LIMIT 1)
       UNION ALL
       (SELECT 'CRLV' COLLATE utf8mb4_unicode_ci as tipo, uc.nome_proprietario COLLATE utf8mb4_unicode_ci as nome, uc.cpf_cnpj COLLATE utf8mb4_unicode_ci as cpf, uc.created_at, uc.admin_id, a.nome COLLATE utf8mb4_unicode_ci as admin_nome, a.creditos as admin_saldo 
        FROM usuarios_crlv uc JOIN admins a ON uc.admin_id = a.id ORDER BY uc.created_at DESC LIMIT 1)
       UNION ALL
       (SELECT 'Náutica' COLLATE utf8mb4_unicode_ci as tipo, ch.nome COLLATE utf8mb4_unicode_ci as nome, ch.cpf COLLATE utf8mb4_unicode_ci as cpf, ch.created_at, ch.admin_id, a.nome COLLATE utf8mb4_unicode_ci as admin_nome, a.creditos as admin_saldo 
        FROM chas ch JOIN admins a ON ch.admin_id = a.id ORDER BY ch.created_at DESC LIMIT 1)
       ORDER BY created_at DESC LIMIT 1`
    );

    if (lastServices.length === 0) {
      return res.json(null);
    }

    const ls = lastServices[0];

    // Calcular saldo antes do serviço = saldo_atual + 1 (pois gastou 1 crédito)
    // Mais preciso: contar serviços + transações desde a data
    const [afterCount] = await query<any[]>(
      `SELECT (
        (SELECT COUNT(*) FROM usuarios WHERE admin_id = ? AND created_at >= ?) +
        (SELECT COUNT(*) FROM rgs WHERE admin_id = ? AND created_at >= ?) +
        (SELECT COUNT(*) FROM carteira_estudante WHERE admin_id = ? AND created_at >= ?) +
        (SELECT COUNT(*) FROM usuarios_crlv WHERE admin_id = ? AND created_at >= ?) +
        (SELECT COUNT(*) FROM chas WHERE admin_id = ? AND created_at >= ?)
      ) as services_since`,
      [ls.admin_id, ls.created_at, ls.admin_id, ls.created_at, ls.admin_id, ls.created_at, ls.admin_id, ls.created_at, ls.admin_id, ls.created_at]
    );

    const [creditsReceived] = await query<any[]>(
      `SELECT COALESCE(SUM(amount), 0) as received FROM credit_transactions WHERE to_admin_id = ? AND created_at >= ?`,
      [ls.admin_id, ls.created_at]
    );
    const [creditsSent] = await query<any[]>(
      `SELECT COALESCE(SUM(amount), 0) as sent FROM credit_transactions WHERE from_admin_id = ? AND created_at >= ?`,
      [ls.admin_id, ls.created_at]
    );

    const servicesSince = afterCount?.services_since || 0;
    const received = creditsReceived?.received || 0;
    const sent = creditsSent?.sent || 0;
    const saldoAntes = ls.admin_saldo + servicesSince + sent - received;

    res.json({
      tipo: ls.tipo,
      nome: ls.nome,
      cpf: ls.cpf,
      created_at: ls.created_at,
      admin_id: ls.admin_id,
      admin_nome: ls.admin_nome,
      saldo_antes: Math.max(0, saldoAntes),
      saldo_depois: Math.max(0, saldoAntes - 1),
      saldo_atual: ls.admin_saldo,
    });
  } catch (error) {
    console.error('Erro ao buscar último serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /owner/admin-documents/:adminId - Todos os documentos ativos de um admin por categoria
router.get('/admin-documents/:adminId', async (req, res) => {
  try {
    const adminId = parseInt(req.params.adminId);

    const [adminData] = await query<any[]>(
      'SELECT id, nome, email, creditos, `rank`, created_at, last_active FROM admins WHERE id = ?',
      [adminId]
    );
    if (!adminData) return res.status(404).json({ error: 'Admin não encontrado' });

    const cnhs = await query<any[]>(
      'SELECT id, cpf, nome, senha, data_validade as validade, created_at FROM usuarios WHERE admin_id = ? ORDER BY created_at DESC',
      [adminId]
    );
    const rgs = await query<any[]>(
      'SELECT id, cpf, nome_completo as nome, senha, validade, created_at FROM rgs WHERE admin_id = ? ORDER BY created_at DESC',
      [adminId]
    );
    const carteiras = await query<any[]>(
      'SELECT id, cpf, nome, senha, created_at FROM carteira_estudante WHERE admin_id = ? ORDER BY created_at DESC',
      [adminId]
    );
    const crlvs = await query<any[]>(
      'SELECT id, cpf_cnpj as cpf, nome_proprietario as nome, senha, placa, created_at FROM usuarios_crlv WHERE admin_id = ? ORDER BY created_at DESC',
      [adminId]
    );
    const chas = await query<any[]>(
      'SELECT id, cpf, nome, senha, validade, created_at FROM chas WHERE admin_id = ? ORDER BY created_at DESC',
      [adminId]
    );

    res.json({
      admin: adminData,
      documents: { cnhs, rgs, carteiras, crlvs, chas }
    });
  } catch (error) {
    console.error('Erro ao buscar documentos do admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /owner/daily-history - Histórico diário de todos os serviços, agrupado por dia
router.get('/daily-history', async (req, res) => {
  try {
    const viewerAdminId = parseInt(req.headers['x-admin-id'] as string);
    const filterAdminId = req.query.adminId ? parseInt(req.query.adminId as string) : null;
    const filterModule = req.query.module as string | null; // CNH, RG, Carteira, CRLV, Nautica
    const filterDate = req.query.date as string | null; // YYYY-MM-DD
    const limit = Math.min(parseInt(req.query.limit as string) || 200, 500);

    const services: any[] = [];

    // Helper to build WHERE clause
    const buildWhere = (adminCol: string, dateCol: string, extraWhere?: string) => {
      const conditions: string[] = [];
      const params: any[] = [];
      if (filterAdminId) { conditions.push(`${adminCol} = ?`); params.push(filterAdminId); }
      if (filterDate) { conditions.push(`DATE(${dateCol}) = ?`); params.push(filterDate); }
      if (extraWhere) conditions.push(extraWhere);
      return { where: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '', params };
    };

    // CNH
    if (!filterModule || filterModule === 'CNH') {
      const { where, params } = buildWhere('u.admin_id', 'u.created_at');
      const cnhs = await query<any[]>(
        `SELECT u.id, u.cpf, u.nome, u.created_at, u.admin_id, a.nome as admin_nome, a.\`rank\` as admin_rank
         FROM usuarios u JOIN admins a ON u.admin_id = a.id ${where}
         ORDER BY u.created_at DESC LIMIT ?`,
        [...params, limit]
      );
      cnhs.forEach(c => services.push({ ...c, modulo: 'CNH' }));
    }

    // RG
    if (!filterModule || filterModule === 'RG') {
      const { where, params } = buildWhere('r.admin_id', 'r.created_at');
      const rgs = await query<any[]>(
        `SELECT r.id, r.cpf, r.nome_completo as nome, r.created_at, r.admin_id, a.nome as admin_nome, a.\`rank\` as admin_rank
         FROM rgs r JOIN admins a ON r.admin_id = a.id ${where}
         ORDER BY r.created_at DESC LIMIT ?`,
        [...params, limit]
      );
      rgs.forEach(r => services.push({ ...r, modulo: 'RG' }));
    }

    // Carteira Estudante
    if (!filterModule || filterModule === 'Carteira') {
      const { where, params } = buildWhere('ce.admin_id', 'ce.created_at');
      const carteiras = await query<any[]>(
        `SELECT ce.id, ce.cpf, ce.nome, ce.created_at, ce.admin_id, a.nome as admin_nome, a.\`rank\` as admin_rank
         FROM carteira_estudante ce JOIN admins a ON ce.admin_id = a.id ${where}
         ORDER BY ce.created_at DESC LIMIT ?`,
        [...params, limit]
      );
      carteiras.forEach(c => services.push({ ...c, modulo: 'Carteira' }));
    }

    // CRLV
    if (!filterModule || filterModule === 'CRLV') {
      const { where, params } = buildWhere('uc.admin_id', 'uc.created_at');
      const crlvs = await query<any[]>(
        `SELECT uc.id, uc.cpf_cnpj as cpf, uc.nome_proprietario as nome, uc.created_at, uc.admin_id, a.nome as admin_nome, a.\`rank\` as admin_rank
         FROM usuarios_crlv uc JOIN admins a ON uc.admin_id = a.id ${where}
         ORDER BY uc.created_at DESC LIMIT ?`,
        [...params, limit]
      );
      crlvs.forEach(c => services.push({ ...c, modulo: 'CRLV' }));
    }

    // Náutica
    if (!filterModule || filterModule === 'Nautica') {
      const { where, params } = buildWhere('ch.admin_id', 'ch.created_at');
      const chas = await query<any[]>(
        `SELECT ch.id, ch.cpf, ch.nome, ch.created_at, ch.admin_id, a.nome as admin_nome, a.\`rank\` as admin_rank
         FROM chas ch JOIN admins a ON ch.admin_id = a.id ${where}
         ORDER BY ch.created_at DESC LIMIT ?`,
        [...params, limit]
      );
      chas.forEach(c => services.push({ ...c, modulo: 'Náutica' }));
    }

    // Ordenar por data desc
    services.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Agrupar por dia
    const grouped: Record<string, any[]> = {};
    for (const svc of services) {
      const day = new Date(svc.created_at).toISOString().slice(0, 10);
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(svc);
    }

    // Marcar quais são "meus" (do admin logado)
    for (const day of Object.values(grouped)) {
      for (const svc of day) {
        svc.is_mine = svc.admin_id === viewerAdminId;
      }
    }

    res.json({ grouped, total: services.length });
  } catch (error) {
    console.error('Erro no daily-history:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
