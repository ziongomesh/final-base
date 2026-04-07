import { Router } from 'express';
import { query, getConnection } from '../db';
import logger from '../utils/logger.ts';
import { requireSession, requireDono, requireMasterOrAbove } from '../middleware/auth';

const router = Router();

// Transferir créditos (requer sessão)
router.post('/transfer', requireSession, async (req, res) => {
  const connection = await getConnection();
  
  try {
    const { fromAdminId, toAdminId, amount } = req.body;

    // Verificar que o remetente é o próprio usuário logado
    if ((req as any).adminId !== fromAdminId) {
      return res.status(403).json({ error: 'Sem permissão para transferir de outro admin' });
    }

    if (!fromAdminId || !toAdminId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    // Validar que o destinatário é revendedor criado pelo remetente (exceto dono, que pode transferir para qualquer um)
    const senderRank = (req as any).adminRank;
    if (senderRank !== 'dono') {
      const [targetRows] = await connection.execute(
        'SELECT criado_por FROM admins WHERE id = ?',
        [toAdminId]
      );
      const target = (targetRows as any[])[0];
      if (!target || target.criado_por !== fromAdminId) {
        return res.status(403).json({ error: 'Você só pode transferir para revendedores que você criou' });
      }
    }

    await connection.beginTransaction();

    const [fromAdmin] = await connection.execute(
      'SELECT creditos, creditos_transf, `rank` FROM admins WHERE id = ? FOR UPDATE',
      [fromAdminId]
    );

    const adminRow = (fromAdmin as any[])[0];
    if (!adminRow) {
      await connection.rollback();
      return res.status(400).json({ error: 'Admin não encontrado' });
    }

    // Masters e subs usam creditos_transf para transferir, dono usa creditos
    const usesTransfBalance = adminRow.rank === 'master' || adminRow.rank === 'sub';
    const balance = usesTransfBalance ? (adminRow.creditos_transf || 0) : (adminRow.creditos || 0);

    if (balance < amount) {
      await connection.rollback();
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Masters/subs debitam de creditos_transf, dono debita de creditos
    if (usesTransfBalance) {
      await connection.execute(
        'UPDATE admins SET creditos_transf = creditos_transf - ?, last_active = NOW() WHERE id = ?',
        [amount, fromAdminId]
      );
    } else {
      await connection.execute(
        'UPDATE admins SET creditos = creditos - ?, last_active = NOW() WHERE id = ?',
        [amount, fromAdminId]
      );
    }

    await connection.execute(
      'UPDATE admins SET creditos = creditos + ?, last_active = NOW() WHERE id = ?',
      [amount, toAdminId]
    );

    await connection.execute(
      'INSERT INTO credit_transactions (from_admin_id, to_admin_id, amount, transaction_type) VALUES (?, ?, ?, ?)',
      [fromAdminId, toAdminId, amount, 'transfer']
    );

    await connection.commit();

    logger.creditTransfer(fromAdminId, toAdminId, amount);

    res.json({ success: true });
  } catch (error: any) {
    await connection.rollback();
    console.error('Erro na transferência:', error);

    if (error?.code === 'ER_DUP_ENTRY' && String(error?.sqlMessage || '').includes("for key 'PRIMARY'")) {
      return res.status(500).json({
        error:
          "Banco MySQL: a tabela credit_transactions está com o campo id sem AUTO_INCREMENT. Rode o script docs/mysql-update.sql (ou aplique: ALTER TABLE credit_transactions MODIFY id INT NOT NULL AUTO_INCREMENT).",
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    connection.release();
  }
});

// Recarregar créditos (requer sessão + dono)
router.post('/recharge', requireSession, requireDono, async (req, res) => {
  try {
    const { adminId, amount, unitPrice, totalPrice } = req.body;

    // Verificar rank do admin destino para saber onde creditar
    const targetAdmins = await query<any[]>('SELECT `rank` FROM admins WHERE id = ?', [adminId]);
    const targetRank = targetAdmins[0]?.rank;

    if (targetRank === 'master') {
      // Master recebe em creditos_transf
      await query(
        'UPDATE admins SET creditos_transf = creditos_transf + ?, last_active = NOW() WHERE id = ?',
        [amount, adminId]
      );
    } else {
      await query(
        'UPDATE admins SET creditos = creditos + ?, last_active = NOW() WHERE id = ?',
        [amount, adminId]
      );
    }

    await query(
      'INSERT INTO credit_transactions (to_admin_id, amount, unit_price, total_price, transaction_type) VALUES (?, ?, ?, ?, ?)',
      [adminId, amount, unitPrice, totalPrice, 'recharge']
    );

    logger.creditRecharge(adminId, amount, totalPrice);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro na recarga:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Histórico de transações (requer sessão - só próprias ou dono vê tudo)
router.get('/transactions/:adminId', requireSession, async (req, res) => {
  try {
    const targetId = req.params.adminId;
    
    // Só pode ver suas próprias transações, ou dono vê qualquer
    if ((req as any).adminId !== parseInt(targetId) && (req as any).adminRank !== 'dono') {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const transactions = await query<any[]>(
      `SELECT ct.*, 
        fa.nome as from_admin_name, 
        ta.nome as to_admin_name
      FROM credit_transactions ct
      LEFT JOIN admins fa ON ct.from_admin_id = fa.id
      LEFT JOIN admins ta ON ct.to_admin_id = ta.id
      WHERE ct.from_admin_id = ? OR ct.to_admin_id = ?
      ORDER BY ct.created_at DESC
      LIMIT 50`,
      [targetId, targetId]
    );

    res.json(transactions);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter saldo (requer sessão - só próprio ou dono)
router.get('/balance/:adminId', requireSession, async (req, res) => {
  try {
    const targetId = parseInt(req.params.adminId);
    
    if ((req as any).adminId !== targetId && (req as any).adminRank !== 'dono') {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const admins = await query<any[]>(
      'SELECT creditos, creditos_transf, `rank` FROM admins WHERE id = ?',
      [req.params.adminId]
    );

    if (admins.length === 0) {
      return res.status(404).json({ error: 'Admin não encontrado' });
    }

    res.json({ 
      credits: admins[0].creditos,
      creditos_transf: admins[0].creditos_transf || 0,
      rank: admins[0].rank
    });
  } catch (error) {
    console.error('Erro ao buscar saldo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Receita mensal (requer sessão + dono)
router.get('/revenue/:year/:month', requireSession, requireDono, async (req, res) => {
  try {
    const { year, month } = req.params;

    const result = await query<any[]>(
      `SELECT COALESCE(SUM(total_price), 0) as revenue
      FROM credit_transactions
      WHERE transaction_type = 'recharge'
      AND YEAR(created_at) = ?
      AND MONTH(created_at) = ?`,
      [year, month]
    );

    res.json({ revenue: result[0]?.revenue || 0 });
  } catch (error) {
    console.error('Erro ao buscar receita:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get all transactions (requer sessão + dono)
router.get('/transactions/all', requireSession, requireDono, async (_req, res) => {
  try {
    const transactions = await query<any[]>(
      `SELECT ct.*, fa.nome as from_admin_name, ta.nome as to_admin_name
      FROM credit_transactions ct
      LEFT JOIN admins fa ON ct.from_admin_id = fa.id
      LEFT JOIN admins ta ON ct.to_admin_id = ta.id
      ORDER BY ct.created_at DESC LIMIT 100`
    );
    res.json(transactions);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Métricas (requer sessão + dono)
router.get('/metrics', requireSession, requireDono, async (_req, res) => {
  try {
    const paidPayments = await query<any[]>(
      'SELECT amount FROM pix_payments WHERE status = ?',
      ['PAID']
    );
    const totalDeposits = paidPayments.length;
    const totalDepositValue = paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const avgTicket = totalDeposits > 0 ? totalDepositValue / totalDeposits : 0;

    const transfers = await query<any[]>(
      'SELECT amount FROM credit_transactions WHERE transaction_type = ?',
      ['transfer']
    );
    const totalTransfers = transfers.length;
    const totalTransferCredits = transfers.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    res.json({
      totalDeposits,
      totalDepositValue,
      totalTransfers,
      totalTransferCredits,
      avgTicket,
    });
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Monthly data (requer sessão + dono)
router.get('/monthly-data', requireSession, requireDono, async (_req, res) => {
  try {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      chartData.push({ month: months[d.getMonth()], deposits: 0, transfers: 0 });
    }
    res.json(chartData);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Métricas de um Master (requer sessão + master ou dono)
router.get('/master-metrics/:masterId', requireSession, requireMasterOrAbove, async (req, res) => {
  try {
    const { masterId } = req.params;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const transfersTotal = await query<any[]>(
      `SELECT COALESCE(SUM(amount), 0) as total_transferred, COUNT(*) as total_transfers
       FROM credit_transactions 
       WHERE from_admin_id = ? AND transaction_type = 'transfer'`,
      [masterId]
    );

    const transfersMonth = await query<any[]>(
      `SELECT COALESCE(SUM(amount), 0) as month_transferred, COUNT(*) as month_transfers
       FROM credit_transactions 
       WHERE from_admin_id = ? AND transaction_type = 'transfer'
       AND MONTH(created_at) = ? AND YEAR(created_at) = ?`,
      [masterId, currentMonth, currentYear]
    );

    const rechargesTotal = await query<any[]>(
      `SELECT COALESCE(SUM(amount), 0) as total_recharged, COALESCE(SUM(total_price), 0) as total_spent
       FROM credit_transactions 
       WHERE to_admin_id = ? AND transaction_type = 'recharge'`,
      [masterId]
    );

    const rechargesMonth = await query<any[]>(
      `SELECT COALESCE(SUM(amount), 0) as month_recharged, COALESCE(SUM(total_price), 0) as month_spent
       FROM credit_transactions 
       WHERE to_admin_id = ? AND transaction_type = 'recharge'
       AND MONTH(created_at) = ? AND YEAR(created_at) = ?`,
      [masterId, currentMonth, currentYear]
    );

    const masterGoal = await query<any[]>(
      `SELECT target_revenue FROM monthly_goals 
       WHERE year = ? AND month = ?`,
      [currentYear, currentMonth]
    );

    const resellersCount = await query<any[]>(
      `SELECT COUNT(*) as count FROM admins WHERE criado_por = ? AND rank = 'revendedor'`,
      [masterId]
    );

    const totalTransferred = Number(transfersTotal[0]?.total_transferred) || 0;
    const totalSpent = Number(rechargesTotal[0]?.total_spent) || 0;
    const estimatedRevenue = totalTransferred * 20;
    const estimatedProfit = estimatedRevenue - totalSpent;

    res.json({
      totalTransferred,
      totalTransfers: Number(transfersTotal[0]?.total_transfers) || 0,
      monthTransferred: Number(transfersMonth[0]?.month_transferred) || 0,
      monthTransfers: Number(transfersMonth[0]?.month_transfers) || 0,
      totalRecharged: Number(rechargesTotal[0]?.total_recharged) || 0,
      totalSpent,
      monthRecharged: Number(rechargesMonth[0]?.month_recharged) || 0,
      monthSpent: Number(rechargesMonth[0]?.month_spent) || 0,
      monthlyGoal: Number(masterGoal[0]?.target_revenue) || 0,
      totalResellers: Number(resellersCount[0]?.count) || 0,
      estimatedRevenue,
      estimatedProfit,
    });
  } catch (error) {
    console.error('Erro ao buscar métricas do master:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Histórico de transferências de um master (requer sessão + master ou dono)
router.get('/master-transfers/:masterId', requireSession, requireMasterOrAbove, async (req, res) => {
  try {
    const { masterId } = req.params;
    
    const transfers = await query<any[]>(
      `SELECT ct.id, ct.amount, ct.created_at, 
              ta.nome as reseller_name, ta.email as reseller_email
       FROM credit_transactions ct
       JOIN admins ta ON ct.to_admin_id = ta.id
       WHERE ct.from_admin_id = ? AND ct.transaction_type = 'transfer'
       ORDER BY ct.created_at DESC
       LIMIT 100`,
      [masterId]
    );

    res.json(transfers);
  } catch (error) {
    console.error('Erro ao buscar transferências do master:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar/criar meta (requer sessão + dono)
router.post('/master-goal', requireSession, requireDono, async (req, res) => {
  try {
    const { year, month, targetRevenue } = req.body;

    const existing = await query<any[]>(
      'SELECT id FROM monthly_goals WHERE year = ? AND month = ?',
      [year, month]
    );

    if (existing.length > 0) {
      await query(
        'UPDATE monthly_goals SET target_revenue = ?, updated_at = NOW() WHERE year = ? AND month = ?',
        [targetRevenue, year, month]
      );
    } else {
      await query(
        'INSERT INTO monthly_goals (year, month, target_revenue) VALUES (?, ?, ?)',
        [year, month, targetRevenue]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar meta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Todas as transferências com filtro opcional por master (requer sessão + dono)
router.get('/all-transfers', requireSession, requireDono, async (req, res) => {
  try {
    const masterId = req.query.masterId ? parseInt(req.query.masterId as string) : null;
    
    let sql = `SELECT ct.id, ct.amount, ct.created_at, ct.from_admin_id, ct.to_admin_id,
                fa.nome as from_admin_name, fa.email as from_admin_email,
                ta.nome as to_admin_name, ta.email as to_admin_email
               FROM credit_transactions ct
               LEFT JOIN admins fa ON ct.from_admin_id = fa.id
               LEFT JOIN admins ta ON ct.to_admin_id = ta.id
               WHERE ct.transaction_type = 'transfer'`;
    const params: any[] = [];
    
    if (masterId) {
      sql += ' AND ct.from_admin_id = ?';
      params.push(masterId);
    }
    
    sql += ' ORDER BY ct.created_at DESC LIMIT 10000';
    
    const transfers = await query<any[]>(sql, params);
    res.json(transfers);
  } catch (error) {
    console.error('Erro ao buscar todas as transferências:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
