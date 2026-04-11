import { Router } from 'express';
import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { requireSession, requireDono, requireDonoOrSub, requireMasterOrAbove } from '../middleware/auth';

const router = Router();

// Buscar admin por ID (requer sessão)
router.get('/stats/dashboard', requireSession, requireDonoOrSub, async (req, res) => {
  try {
    const rank = (req as any).adminRank;
    const adminId = (req as any).adminId;
    
    if (rank === 'sub') {
      // Sub vê apenas masters/revendedores criados por ele
      const [masters] = await query<any[]>('SELECT COUNT(*) as count FROM admins WHERE `rank` = ? AND criado_por = ?', ['master', adminId]);
      const [resellers] = await query<any[]>('SELECT COUNT(*) as count FROM admins WHERE `rank` = ? AND criado_por = ?', ['revendedor', adminId]);
      // Also count resellers created by masters that sub created
      const subMasters = await query<any[]>('SELECT id FROM admins WHERE `rank` = ? AND criado_por = ?', ['master', adminId]);
      const subMasterIds = subMasters.map(m => m.id);
      let extraResellers = 0;
      if (subMasterIds.length > 0) {
        const placeholders = subMasterIds.map(() => '?').join(',');
        const [extra] = await query<any[]>(`SELECT COUNT(*) as count FROM admins WHERE \`rank\` = 'revendedor' AND criado_por IN (${placeholders})`, subMasterIds);
        extraResellers = extra?.count || 0;
      }
      const [totalCredits] = await query<any[]>('SELECT SUM(creditos) as total FROM admins WHERE criado_por = ? OR id = ?', [adminId, adminId]);
      res.json({
        totalMasters: masters?.count || 0,
        totalResellers: (resellers?.count || 0) + extraResellers,
        totalCredits: totalCredits?.total || 0
      });
    } else {
      const [masters] = await query<any[]>('SELECT COUNT(*) as count FROM admins WHERE `rank` = ?', ['master']);
      const [resellers] = await query<any[]>('SELECT COUNT(*) as count FROM admins WHERE `rank` = ?', ['revendedor']);
      const [totalCredits] = await query<any[]>('SELECT SUM(creditos) as total FROM admins');
      res.json({
        totalMasters: masters?.count || 0,
        totalResellers: resellers?.count || 0,
        totalCredits: totalCredits?.total || 0
      });
    }
  } catch (error) {
    console.error('Erro ao buscar stats:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas de documentos criados pelos revendedores de um master
router.get('/stats/documents/:masterId', requireSession, requireMasterOrAbove, async (req, res) => {
  try {
    const masterId = parseInt(req.params.masterId);
    
    // Buscar IDs dos revendedores deste master
    const resellers = await query<any[]>(
      'SELECT id, nome FROM admins WHERE criado_por = ?',
      [masterId]
    );
    
    if (resellers.length === 0) {
      return res.json({
        totalDocuments: 0,
        totalCnh: 0,
        totalRg: 0,
        totalCarteira: 0,
        byReseller: []
      });
    }
    
    const resellerIds = resellers.map(r => r.id);
    const placeholders = resellerIds.map(() => '?').join(',');
    
    const cnhCounts = await query<any[]>(
      `SELECT admin_id, COUNT(*) as count FROM usuarios WHERE admin_id IN (${placeholders}) GROUP BY admin_id`,
      resellerIds
    );
    
    const rgCounts = await query<any[]>(
      `SELECT admin_id, COUNT(*) as count FROM rgs WHERE admin_id IN (${placeholders}) GROUP BY admin_id`,
      resellerIds
    );
    
    const carteiraCounts = await query<any[]>(
      `SELECT admin_id, COUNT(*) as count FROM carteira_estudante WHERE admin_id IN (${placeholders}) GROUP BY admin_id`,
      resellerIds
    );
    
    const cnhMap = new Map(cnhCounts.map(c => [c.admin_id, c.count]));
    const rgMap = new Map(rgCounts.map(c => [c.admin_id, c.count]));
    const carteiraMap = new Map(carteiraCounts.map(c => [c.admin_id, c.count]));
    
    let totalCnh = 0;
    let totalRg = 0;
    let totalCarteira = 0;
    
    const byReseller = resellers.map(reseller => {
      const cnh = cnhMap.get(reseller.id) || 0;
      const rg = rgMap.get(reseller.id) || 0;
      const carteira = carteiraMap.get(reseller.id) || 0;
      
      totalCnh += cnh;
      totalRg += rg;
      totalCarteira += carteira;
      
      return {
        id: reseller.id,
        nome: reseller.nome,
        cnh,
        rg,
        carteira,
        total: cnh + rg + carteira
      };
    }).filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total);
    
    res.json({
      totalDocuments: totalCnh + totalRg + totalCarteira,
      totalCnh,
      totalRg,
      totalCarteira,
      byReseller
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de documentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /admins/stats/my-documents/:adminId
router.get('/stats/my-documents/:adminId', requireSession, async (req, res) => {
  try {
    const adminId = parseInt(req.params.adminId);
    
    // Verificar que o admin só acessa seus próprios dados
    if ((req as any).adminId !== adminId && (req as any).adminRank !== 'dono' && (req as any).adminRank !== 'sub') {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    
    // Today
    const [cnhToday] = await query<any[]>(
      'SELECT COUNT(*) as count FROM usuarios WHERE admin_id = ? AND DATE(created_at) = CURDATE()', [adminId]
    );
    const [rgToday] = await query<any[]>(
      'SELECT COUNT(*) as count FROM rgs WHERE admin_id = ? AND DATE(created_at) = CURDATE()', [adminId]
    );
    const [carteiraToday] = await query<any[]>(
      'SELECT COUNT(*) as count FROM carteira_estudante WHERE admin_id = ? AND DATE(created_at) = CURDATE()', [adminId]
    );
    const [crlvToday] = await query<any[]>(
      'SELECT COUNT(*) as count FROM usuarios_crlv WHERE admin_id = ? AND DATE(created_at) = CURDATE()', [adminId]
    );
    const [chaToday] = await query<any[]>(
      'SELECT COUNT(*) as count FROM chas WHERE admin_id = ? AND DATE(created_at) = CURDATE()', [adminId]
    );
    
    const today = (cnhToday?.count || 0) + (rgToday?.count || 0) + (carteiraToday?.count || 0) + (crlvToday?.count || 0) + (chaToday?.count || 0);
    
    // This week
    const [cnhWeek] = await query<any[]>(
      'SELECT COUNT(*) as count FROM usuarios WHERE admin_id = ? AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)', [adminId]
    );
    const [rgWeek] = await query<any[]>(
      'SELECT COUNT(*) as count FROM rgs WHERE admin_id = ? AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)', [adminId]
    );
    const [carteiraWeek] = await query<any[]>(
      'SELECT COUNT(*) as count FROM carteira_estudante WHERE admin_id = ? AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)', [adminId]
    );
    const [crlvWeek] = await query<any[]>(
      'SELECT COUNT(*) as count FROM usuarios_crlv WHERE admin_id = ? AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)', [adminId]
    );
    const [chaWeek] = await query<any[]>(
      'SELECT COUNT(*) as count FROM chas WHERE admin_id = ? AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)', [adminId]
    );
    
    const week = (cnhWeek?.count || 0) + (rgWeek?.count || 0) + (carteiraWeek?.count || 0) + (crlvWeek?.count || 0) + (chaWeek?.count || 0);
    
    // This month
    const [cnhMonth] = await query<any[]>(
      'SELECT COUNT(*) as count FROM usuarios WHERE admin_id = ? AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())', [adminId]
    );
    const [rgMonth] = await query<any[]>(
      'SELECT COUNT(*) as count FROM rgs WHERE admin_id = ? AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())', [adminId]
    );
    const [carteiraMonth] = await query<any[]>(
      'SELECT COUNT(*) as count FROM carteira_estudante WHERE admin_id = ? AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())', [adminId]
    );
    const [crlvMonth] = await query<any[]>(
      'SELECT COUNT(*) as count FROM usuarios_crlv WHERE admin_id = ? AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())', [adminId]
    );
    const [chaMonth] = await query<any[]>(
      'SELECT COUNT(*) as count FROM chas WHERE admin_id = ? AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())', [adminId]
    );
    
    const month = (cnhMonth?.count || 0) + (rgMonth?.count || 0) + (carteiraMonth?.count || 0) + (crlvMonth?.count || 0) + (chaMonth?.count || 0);
    
    res.json({ today, week, month });
  } catch (error) {
    console.error('Erro ao buscar stats de documentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /admins/masters - Get all masters (dono or sub)
router.get('/masters', requireSession, requireDonoOrSub, async (req, res) => {
  try {
    const rank = (req as any).adminRank;
    const adminId = (req as any).adminId;
    
    let masters;
    if (rank === 'sub') {
      masters = await query<any[]>(
        'SELECT id, nome, email, creditos, created_at FROM admins WHERE `rank` = ? AND criado_por = ?',
        ['master', adminId]
      );
    } else {
      masters = await query<any[]>(
        'SELECT id, nome, email, creditos, created_at FROM admins WHERE `rank` = ?',
        ['master']
      );
    }
    res.json(masters);
  } catch (error) {
    console.error('Erro ao buscar masters:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar admin por ID (requer sessão)
router.get('/:id', requireSession, async (req, res) => {
  try {
    const admins = await query<any[]>(
      'SELECT id, nome, email, creditos, `rank`, profile_photo, created_at FROM admins WHERE id = ?',
      [req.params.id]
    );

    if (admins.length === 0) {
      return res.status(404).json({ error: 'Admin não encontrado' });
    }

    res.json(admins[0]);
  } catch (error) {
    console.error('Erro ao buscar admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar revendedores de um master (requer sessão + master ou dono)
router.get('/resellers/:masterId', requireSession, requireMasterOrAbove, async (req, res) => {
  try {
    const resellers = await query<any[]>(
      'SELECT id, nome, email, creditos, `rank`, profile_photo, created_at FROM admins WHERE criado_por = ?',
      [req.params.masterId]
    );

    res.json(resellers);
  } catch (error) {
    console.error('Erro ao buscar revendedores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Pesquisar admins (requer sessão)
router.get('/search/:query', requireSession, async (req, res) => {
  try {
    const searchQuery = `%${req.params.query}%`;
    const admins = await query<any[]>(
      'SELECT id, nome, email, creditos, `rank`, created_at FROM admins WHERE nome LIKE ? OR email LIKE ? LIMIT 20',
      [searchQuery, searchQuery]
    );

    res.json(admins);
  } catch (error) {
    console.error('Erro ao pesquisar admins:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar master (requer sessão + dono ou sub)
router.post('/master', requireSession, requireDonoOrSub, async (req, res) => {
  try {
    const { nome, email, key } = req.body;
    const criadoPor = (req as any).adminId;

    const existing = await query<any[]>(
      'SELECT id FROM admins WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const creditos = req.body.creditos ? parseInt(req.body.creditos) : 0;

    const hashedKey = await bcrypt.hash(key, 10);

    const result = await query<any>(
      'INSERT INTO admins (nome, email, `key`, key_plain, `rank`, criado_por, creditos, creditos_transf) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nome, email, hashedKey, key, 'master', criadoPor, creditos, creditos]
    );

    res.json({ id: result.insertId, nome, email, rank: 'master', creditos });
  } catch (error) {
    console.error('Erro ao criar master:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar sub dono (requer sessão + dono apenas)
router.post('/sub', requireSession, requireDono, async (req, res) => {
  try {
    const { nome, email, key } = req.body;
    const criadoPor = (req as any).adminId;

    const existing = await query<any[]>(
      'SELECT id FROM admins WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const creditos = req.body.creditos ? parseInt(req.body.creditos) : 0;

    const hashedKey = await bcrypt.hash(key, 10);

    const result = await query<any>(
      'INSERT INTO admins (nome, email, `key`, key_plain, `rank`, criado_por, creditos, creditos_transf) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nome, email, hashedKey, key, 'sub', criadoPor, creditos, creditos]
    );

    res.json({ id: result.insertId, nome, email, rank: 'sub', creditos });
  } catch (error) {
    console.error('Erro ao criar sub:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar revendedor (requer sessão + master)
router.post('/reseller', requireSession, async (req, res) => {
  try {
    const { nome, email, key } = req.body;
    const criadoPor = (req as any).adminId;

    if ((req as any).adminRank !== 'master' && (req as any).adminRank !== 'dono' && (req as any).adminRank !== 'sub') {
      return res.status(403).json({ error: 'Apenas masters, subdonos ou donos podem criar revendedores' });
    }

    const existing = await query<any[]>(
      'SELECT id FROM admins WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const creditos = req.body.creditos ? parseInt(req.body.creditos) : 0;

    const hashedKey = await bcrypt.hash(key, 10);

    const result = await query<any>(
      'INSERT INTO admins (nome, email, `key`, key_plain, `rank`, criado_por, creditos) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nome, email, hashedKey, key, 'revendedor', criadoPor, creditos]
    );

    res.json({ id: result.insertId, nome, email, rank: 'revendedor', creditos });
  } catch (error) {
    console.error('Erro ao criar revendedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar admin (requer sessão - só pode editar a si mesmo ou dono edita qualquer)
router.put('/:id', requireSession, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const requesterId = (req as any).adminId;
    const requesterRank = (req as any).adminRank;

    // Só pode editar a si mesmo, ou dono pode editar qualquer
    if (requesterId !== targetId && requesterRank !== 'dono' && requesterRank !== 'sub') {
      return res.status(403).json({ error: 'Sem permissão para editar este admin' });
    }

    const { nome, email, key } = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (nome) {
      updates.push('nome = ?');
      values.push(nome);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (key) {
      const hashedKey = await bcrypt.hash(key, 10);
      updates.push('`key` = ?');
      values.push(hashedKey);
      updates.push('key_plain = ?');
      values.push(key);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(targetId);
    await query(`UPDATE admins SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar admin (requer sessão + dono ou master deletando seu próprio revendedor)
router.delete('/:id', requireSession, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const requesterId = (req as any).adminId;
    const requesterRank = (req as any).adminRank;

    // Impedir deletar a si mesmo
    if (requesterId === targetId) {
      return res.status(400).json({ error: 'Não é possível deletar a si mesmo' });
    }

    // Dono pode deletar qualquer um
    if (requesterRank === 'dono' || requesterRank === 'sub') {
      await query('DELETE FROM admins WHERE id = ?', [targetId]);
      return res.json({ success: true });
    }

    // Master pode deletar apenas revendedores que criou
    if (requesterRank === 'master') {
      const rows = await query<any[]>(
        'SELECT id FROM admins WHERE id = ? AND criado_por = ? AND `rank` = ?',
        [targetId, requesterId, 'revendedor']
      );
      if (rows.length === 0) {
        return res.status(403).json({ error: 'Sem permissão para deletar este usuário' });
      }
      await query('DELETE FROM admins WHERE id = ?', [targetId]);
      return res.json({ success: true });
    }

    return res.status(403).json({ error: 'Sem permissão' });
  } catch (error) {
    console.error('Erro ao deletar admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Detalhes completos de um revendedor específico (requer sessão + master ou dono)
router.get('/reseller-details/:resellerId', requireSession, requireMasterOrAbove, async (req, res) => {
  try {
    const resellerId = parseInt(req.params.resellerId);
    
    const [reseller] = await query<any[]>(
      'SELECT id, nome, email, creditos, `rank`, profile_photo, created_at, criado_por FROM admins WHERE id = ?',
      [resellerId]
    );
    
    if (!reseller) {
      return res.status(404).json({ error: 'Revendedor não encontrado' });
    }

    // Master/sub só pode ver seus próprios revendedores (ou revendedores de seus masters)
    const requesterRank = (req as any).adminRank;
    const requesterId = (req as any).adminId;
    if (requesterRank === 'master' && reseller.criado_por !== requesterId) {
      return res.status(403).json({ error: 'Sem permissão para ver este revendedor' });
    }
    if (requesterRank === 'sub') {
      // Sub pode ver: criados por si, ou criados por masters que o sub criou
      if (reseller.criado_por !== requesterId) {
        const subMasters = await query<any[]>('SELECT id FROM admins WHERE criado_por = ? AND `rank` = ?', [requesterId, 'master']);
        const masterIds = subMasters.map(m => m.id);
        if (!masterIds.includes(reseller.criado_por)) {
          return res.status(403).json({ error: 'Sem permissão para ver este revendedor' });
        }
      }
    }
    
    const cnhs = await query<any[]>(
      `SELECT id, cpf, nome, senha, data_validade as validade, created_at 
       FROM usuarios WHERE admin_id = ? ORDER BY created_at DESC LIMIT 50`,
      [resellerId]
    );
    
    const rgs = await query<any[]>(
      `SELECT id, cpf, nome_completo as nome, senha, validade, created_at 
       FROM rgs WHERE admin_id = ? ORDER BY created_at DESC LIMIT 50`,
      [resellerId]
    );
    
    const carteiras = await query<any[]>(
      `SELECT id, cpf, nome, senha, created_at 
       FROM carteira_estudante WHERE admin_id = ? ORDER BY created_at DESC LIMIT 50`,
      [resellerId]
    );

    const crlvs = await query<any[]>(
      `SELECT id, cpf_cnpj as cpf, nome_proprietario as nome, senha, data_expiracao as validade, placa, created_at 
       FROM usuarios_crlv WHERE admin_id = ? ORDER BY created_at DESC LIMIT 50`,
      [resellerId]
    );

    const chas = await query<any[]>(
      `SELECT id, cpf, nome, senha, validade, created_at 
       FROM chas WHERE admin_id = ? ORDER BY created_at DESC LIMIT 50`,
      [resellerId]
    );
    
    const creditsReceived = await query<any[]>(
      `SELECT SUM(amount) as total FROM credit_transactions 
       WHERE to_admin_id = ? AND transaction_type = 'transfer'`,
      [resellerId]
    );
    
    const totalReceived = creditsReceived[0]?.total || 0;
    const creditsUsed = Math.max(0, totalReceived - reseller.creditos);
    
    const allServices = [
      ...cnhs.map(c => ({ ...c, type: 'CNH', created_at: c.created_at })),
      ...rgs.map(r => ({ ...r, type: 'RG', created_at: r.created_at })),
      ...carteiras.map(c => ({ ...c, type: 'Carteira Estudante', created_at: c.created_at })),
      ...crlvs.map(c => ({ ...c, type: 'CRLV', created_at: c.created_at })),
      ...chas.map(c => ({ ...c, type: 'CHA Náutica', created_at: c.created_at }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const lastService = allServices[0] || null;
    
    const [cnhCount] = await query<any[]>('SELECT COUNT(*) as count FROM usuarios WHERE admin_id = ?', [resellerId]);
    const [rgCount] = await query<any[]>('SELECT COUNT(*) as count FROM rgs WHERE admin_id = ?', [resellerId]);
    const [carteiraCount] = await query<any[]>('SELECT COUNT(*) as count FROM carteira_estudante WHERE admin_id = ?', [resellerId]);
    const [crlvCount] = await query<any[]>('SELECT COUNT(*) as count FROM usuarios_crlv WHERE admin_id = ?', [resellerId]);
    const [chaCount] = await query<any[]>('SELECT COUNT(*) as count FROM chas WHERE admin_id = ?', [resellerId]);
    
    res.json({
      reseller: {
        id: reseller.id,
        nome: reseller.nome,
        email: reseller.email,
        creditos: reseller.creditos,
        rank: reseller.rank,
        profile_photo: reseller.profile_photo,
        created_at: reseller.created_at
      },
      stats: {
        totalCreditsReceived: totalReceived,
        creditsUsed,
        currentBalance: reseller.creditos,
        totalDocuments: (cnhCount?.count || 0) + (rgCount?.count || 0) + (carteiraCount?.count || 0) + (crlvCount?.count || 0) + (chaCount?.count || 0),
        totalCnh: cnhCount?.count || 0,
        totalRg: rgCount?.count || 0,
        totalCarteira: carteiraCount?.count || 0,
        totalCrlv: crlvCount?.count || 0,
        totalCha: chaCount?.count || 0
      },
      lastService: lastService ? {
        type: lastService.type,
        cpf: lastService.cpf,
        nome: lastService.nome,
        senha: lastService.senha,
        validade: lastService.validade,
        created_at: lastService.created_at
      } : null,
      documents: {
        cnhs: cnhs.map(c => ({ id: c.id, cpf: c.cpf, nome: c.nome, senha: c.senha, validade: c.validade, created_at: c.created_at })),
        rgs: rgs.map(r => ({ id: r.id, cpf: r.cpf, nome: r.nome, senha: r.senha, validade: r.validade, created_at: r.created_at })),
        carteiras: carteiras.map(c => ({ id: c.id, cpf: c.cpf, nome: c.nome, senha: c.senha, created_at: c.created_at })),
        crlvs: crlvs.map(c => ({ id: c.id, cpf: c.cpf, nome: c.nome, senha: c.senha, validade: c.validade, placa: c.placa, created_at: c.created_at })),
        chas: chas.map(c => ({ id: c.id, cpf: c.cpf, nome: c.nome, senha: c.senha, validade: c.validade, created_at: c.created_at }))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do revendedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /admins/creator/:adminId (requer sessão)
router.get('/creator/:adminId', requireSession, async (req, res) => {
  try {
    const adminId = parseInt(req.params.adminId);
    const rows = await query<any[]>(
      `SELECT a2.id as creator_id, a2.nome as creator_name, a2.telefone as creator_telefone
       FROM admins a1
       JOIN admins a2 ON a1.criado_por = a2.id
       WHERE a1.id = ?`,
      [adminId]
    );

    if (rows.length === 0) {
      return res.json({ creator_id: null, creator_name: null, creator_telefone: null });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar criador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /admins/:id/telefone (requer sessão - só a si mesmo)
router.put('/:id/telefone', requireSession, async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);

    if ((req as any).adminId !== adminId) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const { telefone } = req.body;
    await query('UPDATE admins SET telefone = ? WHERE id = ?', [telefone || null, adminId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar telefone:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /admins/master/daily-history/:masterId (requer sessão + master ou dono)
router.get('/master/daily-history/:masterId', requireSession, requireMasterOrAbove, async (req, res) => {
  try {
    const masterId = parseInt(req.params.masterId);
    const filterAdminId = req.query.adminId ? parseInt(req.query.adminId as string) : null;
    const filterModule = req.query.module as string | null;
    const filterDate = req.query.date as string | null;
    const limit = Math.min(parseInt(req.query.limit as string) || 200, 500);

    const resellers = await query<any[]>(
      'SELECT id FROM admins WHERE criado_por = ?',
      [masterId]
    );
    const resellerIds = resellers.map((r: any) => r.id);
    const allIds = [masterId, ...resellerIds];

    if (filterAdminId && !allIds.includes(filterAdminId)) {
      return res.json({ grouped: {}, total: 0 });
    }

    const targetIds = filterAdminId ? [filterAdminId] : allIds;
    const placeholders = targetIds.map(() => '?').join(',');

    const services: any[] = [];

    const buildWhere = (adminCol: string, dateCol: string) => {
      const conditions: string[] = [`${adminCol} IN (${placeholders})`];
      const params: any[] = [...targetIds];
      if (filterDate) { conditions.push(`DATE(${dateCol}) = ?`); params.push(filterDate); }
      return { where: 'WHERE ' + conditions.join(' AND '), params };
    };

    if (!filterModule || filterModule === 'CNH') {
      const { where, params } = buildWhere('u.admin_id', 'u.created_at');
      const cnhs = await query<any[]>(
        `SELECT u.id, u.cpf, u.nome, u.created_at, u.admin_id, a.nome as admin_nome, a.\`rank\` as admin_rank
         FROM usuarios u JOIN admins a ON u.admin_id = a.id ${where}
         ORDER BY u.created_at DESC LIMIT ?`,
        [...params, limit]
      );
      cnhs.forEach((c: any) => services.push({ ...c, modulo: 'CNH' }));
    }

    if (!filterModule || filterModule === 'RG') {
      const { where, params } = buildWhere('r.admin_id', 'r.created_at');
      const rgs = await query<any[]>(
        `SELECT r.id, r.cpf, r.nome_completo as nome, r.created_at, r.admin_id, a.nome as admin_nome, a.\`rank\` as admin_rank
         FROM rgs r JOIN admins a ON r.admin_id = a.id ${where}
         ORDER BY r.created_at DESC LIMIT ?`,
        [...params, limit]
      );
      rgs.forEach((r: any) => services.push({ ...r, modulo: 'RG' }));
    }

    if (!filterModule || filterModule === 'Carteira') {
      const { where, params } = buildWhere('ce.admin_id', 'ce.created_at');
      const carteiras = await query<any[]>(
        `SELECT ce.id, ce.cpf, ce.nome, ce.created_at, ce.admin_id, a.nome as admin_nome, a.\`rank\` as admin_rank
         FROM carteira_estudante ce JOIN admins a ON ce.admin_id = a.id ${where}
         ORDER BY ce.created_at DESC LIMIT ?`,
        [...params, limit]
      );
      carteiras.forEach((c: any) => services.push({ ...c, modulo: 'Carteira' }));
    }

    if (!filterModule || filterModule === 'CRLV') {
      const { where, params } = buildWhere('uc.admin_id', 'uc.created_at');
      const crlvs = await query<any[]>(
        `SELECT uc.id, uc.cpf_cnpj as cpf, uc.nome_proprietario as nome, uc.created_at, uc.admin_id, a.nome as admin_nome, a.\`rank\` as admin_rank
         FROM usuarios_crlv uc JOIN admins a ON uc.admin_id = a.id ${where}
         ORDER BY uc.created_at DESC LIMIT ?`,
        [...params, limit]
      );
      crlvs.forEach((c: any) => services.push({ ...c, modulo: 'CRLV' }));
    }

    if (!filterModule || filterModule === 'Nautica') {
      const { where, params } = buildWhere('ch.admin_id', 'ch.created_at');
      const chas = await query<any[]>(
        `SELECT ch.id, ch.cpf, ch.nome, ch.created_at, ch.admin_id, a.nome as admin_nome, a.\`rank\` as admin_rank
         FROM chas ch JOIN admins a ON ch.admin_id = a.id ${where}
         ORDER BY ch.created_at DESC LIMIT ?`,
        [...params, limit]
      );
      chas.forEach((c: any) => services.push({ ...c, modulo: 'Náutica' }));
    }

    services.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const grouped: Record<string, any[]> = {};
    for (const svc of services) {
      const day = new Date(svc.created_at).toISOString().slice(0, 10);
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(svc);
    }

    for (const day of Object.values(grouped)) {
      for (const svc of day) {
        svc.is_mine = svc.admin_id === masterId;
      }
    }

    const adminList = await query<any[]>(
      `SELECT id, nome, \`rank\` FROM admins WHERE id IN (${allIds.map(() => '?').join(',')})`,
      allIds
    );

    res.json({ grouped, total: services.length, admins: adminList });
  } catch (error) {
    console.error('Erro no master daily-history:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
