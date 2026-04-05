// Cliente API para PostgreSQL (Supabase/Cloud)
// IMPORTANTE: Pagamentos usam EXCLUSIVAMENTE Node.js/MySQL
import { supabase } from '@/integrations/supabase/client';

// URL da API Node.js para pagamentos
function getPaymentApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  
  if (envUrl) {
    // Se o painel estiver em HTTPS e a URL estiver em HTTP no mesmo host, faz upgrade para HTTPS
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      envUrl.startsWith('http://')
    ) {
      try {
        const parsed = new URL(envUrl);
        if (parsed.hostname === window.location.hostname) {
          parsed.protocol = 'https:';
          return parsed.toString().replace(/\/+$/, '');
        }
      } catch {
        // ignora e usa como veio
      }
    }
    return envUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `${window.location.origin}/api`;
  }

  return 'http://localhost:4000/api';
}

// Função para chamar a API Node.js
async function fetchNodeAPI(endpoint: string, options: RequestInit = {}) {
  const API_URL = getPaymentApiUrl();
  const stored = localStorage.getItem('admin');
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (stored) {
    try {
      const admin = JSON.parse(stored);
      headers['X-Admin-Id'] = String(admin.id);
      headers['X-Session-Token'] = admin.session_token;
    } catch {}
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro de conexão' }));
    throw new Error(error.error || 'Erro na requisição');
  }

  return response.json();
}

// Helper para obter dados da sessão armazenada
function getStoredSession(): { adminId: number; sessionToken: string } | null {
  const stored = localStorage.getItem('admin');
  if (!stored) return null;
  try {
    const admin = JSON.parse(stored);
    return { adminId: admin.id, sessionToken: admin.session_token };
  } catch {
    return null;
  }
}

export const supabaseApi = {
  auth: {
    login: async (email: string, key: string) => {
      const { data, error } = await supabase.rpc('validate_login', {
        p_email: email,
        p_key: key
      } as any);

      if (error) {
        console.error('Login error:', error);
        throw new Error(error.message);
      }
      
      const adminData = Array.isArray(data) ? data[0] : data;
      
      if (!adminData) throw new Error('Email ou senha incorretos');

      return {
        admin: {
          id: adminData.id,
          nome: adminData.nome,
          email: adminData.email,
          creditos: adminData.creditos,
          creditos_transf: 0,
          rank: adminData.rank,
          profile_photo: adminData.profile_photo,
          pin: adminData.has_pin,
          session_token: adminData.session_token,
          criado_por: null,
          last_access: null,
          tutorial_completed: adminData.tutorial_completed ?? false,
        }
      };
    },

    validatePin: async (adminId: number, pin: string) => {
      const { data, error } = await supabase.rpc('validate_pin', {
        p_admin_id: adminId,
        p_pin: pin
      });

      if (error) throw new Error(error.message);
      return { valid: data === true };
    },

    setPin: async (adminId: number, pin: string) => {
      const { data, error } = await supabase.rpc('set_admin_pin', {
        p_admin_id: adminId,
        p_pin: pin
      });

      if (error) throw new Error(error.message);
      return { success: data === true };
    },

    validateSession: async (adminId: number, sessionToken: string) => {
      const { data, error } = await supabase.rpc('is_valid_admin', {
        p_admin_id: adminId,
        p_session_token: sessionToken
      });

      if (error) return { valid: false };
      return { valid: data === true };
    },

    logout: async (adminId: number) => {
      const { data, error } = await supabase.rpc('logout_admin', {
        p_admin_id: adminId
      });

      if (error) throw new Error(error.message);
      return { success: data === true };
    },
  },

  admins: {
    getById: async (id: number) => {
      const session = getStoredSession();
      if (!session) throw new Error('Sessão inválida');

      const { data, error } = await supabase.rpc('get_admin_by_id', {
        p_admin_id: id,
        p_session_token: session.sessionToken
      });

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error('Admin não encontrado');
      return data[0];
    },

    getResellers: async (masterId: number) => {
      const session = getStoredSession();
      if (!session) throw new Error('Sessão inválida');

      const { data, error } = await supabase.rpc('get_resellers_by_master', {
        p_master_id: masterId,
        p_session_token: session.sessionToken
      });

      if (error) throw new Error(error.message);
      return data || [];
    },

    getAllMasters: async () => {
      const session = getStoredSession();
      if (!session) throw new Error('Sessão inválida');

      const { data, error } = await supabase.rpc('get_all_masters', {
        p_admin_id: session.adminId,
        p_session_token: session.sessionToken
      });

      if (error) throw new Error(error.message);
      return data || [];
    },

    getAllResellers: async () => {
      return [];
    },

    search: async (query: string) => {
      const session = getStoredSession();
      if (!session) throw new Error('Sessão inválida');

      const { data, error } = await supabase.rpc('search_admins', {
        p_admin_id: session.adminId,
        p_session_token: session.sessionToken,
        p_query: query
      });

      if (error) throw new Error(error.message);
      return data || [];
    },

    createMaster: async (params: { nome: string; email: string; key: string; criadoPor: number; creditos?: number }) => {
      const session = getStoredSession();
      if (!session) throw new Error('Sessão inválida');

      const { data, error } = await supabase.rpc('create_master', {
        p_creator_id: params.criadoPor,
        p_session_token: session.sessionToken,
        p_nome: params.nome,
        p_email: params.email,
        p_key: params.key,
        p_creditos: params.creditos || 0
      } as any);

      if (error) throw new Error(error.message);
      return { id: data };
    },

    createReseller: async (params: { nome: string; email: string; key: string; criadoPor: number; creditos?: number }) => {
      const session = getStoredSession();
      if (!session) throw new Error('Sessão inválida');

      const { data, error } = await supabase.rpc('create_reseller', {
        p_creator_id: params.criadoPor,
        p_session_token: session.sessionToken,
        p_nome: params.nome,
        p_email: params.email,
        p_key: params.key,
        p_creditos: params.creditos || 0
      } as any);

      if (error) throw new Error(error.message);
      return { id: data };
    },

    update: async (_id: number, _data: Partial<{ nome: string; email: string; key: string }>) => {
      throw new Error('Função não implementada');
    },

    delete: async (_id: number) => {
      throw new Error('Função não implementada');
    },

    getDashboardStats: async () => {
      const session = getStoredSession();
      if (!session) throw new Error('Sessão inválida');

      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_admin_id: session.adminId,
        p_session_token: session.sessionToken
      });

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) return { totalMasters: 0, totalResellers: 0, totalCredits: 0 };
      
      return {
        totalMasters: Number(data[0].total_masters) || 0,
        totalResellers: Number(data[0].total_resellers) || 0,
        totalCredits: Number(data[0].total_credits) || 0
      };
    },

    getDocumentStats: async (_masterId: number) => {
      // Supabase não tem as tabelas de documentos, retorna vazio
      return {
        totalDocuments: 0,
        totalCnh: 0,
        totalRg: 0,
        totalCarteira: 0,
        byReseller: []
      };
    },

    getResellerDetails: async (_resellerId: number) => {
      return {
        reseller: null,
        stats: { totalCreditsReceived: 0, creditsUsed: 0, currentBalance: 0, totalDocuments: 0, totalCnh: 0, totalRg: 0, totalCarteira: 0 },
        lastService: null,
        documents: { cnhs: [], rgs: [], carteiras: [] }
      };
    },

    getMyDocumentStats: async (_adminId: number) => {
      return { today: 0, week: 0, month: 0 };
    },

    completeTutorial: async (adminId: number) => {
      const { error } = await supabase
        .from('admins')
        .update({ tutorial_completed: true } as any)
        .eq('id', adminId);
      if (error) throw new Error(error.message);
      return { success: true };
    },
  },

  credits: {
    transfer: async (fromAdminId: number, toAdminId: number, amount: number) => {
      const { data, error } = await supabase.rpc('transfer_credits', {
        p_from_admin_id: fromAdminId,
        p_to_admin_id: toAdminId,
        p_amount: amount
      });

      if (error) {
        // Extrair mensagem de erro do PostgreSQL (formato: "ERROR: mensagem")
        const errorMessage = error.message || 'Erro ao transferir créditos';
        // Remover prefixo "ERROR: " se existir
        const cleanMessage = errorMessage.replace(/^ERROR:\s*/i, '');
        throw new Error(cleanMessage);
      }
      return { success: data === true };
    },

    recharge: async (adminId: number, amount: number, unitPrice: number, totalPrice: number) => {
      const { data, error } = await supabase.rpc('recharge_credits', {
        p_admin_id: adminId,
        p_amount: amount,
        p_unit_price: unitPrice,
        p_total_price: totalPrice
      });

      if (error) throw new Error(error.message);
      return { success: data === true };
    },

    getTransactions: async (_adminId?: number) => {
      return [];
    },

    getAllTransactions: async () => {
      return [];
    },

    getBalance: async (adminId: number) => {
      const session = getStoredSession();
      if (!session) throw new Error('Sessão inválida');

      const { data, error } = await supabase.rpc('get_admin_balance', {
        p_admin_id: adminId,
        p_session_token: session.sessionToken
      });

      if (error) throw new Error(error.message);
      return { credits: data || 0 };
    },

    getRevenue: async (_year: number, _month: number) => {
      return { revenue: 0 };
    },

    getMetrics: async () => {
      return {
        totalDeposits: 0,
        totalDepositValue: 0,
        totalTransfers: 0,
        totalTransferCredits: 0,
        avgTicket: 0
      };
    },

    getMonthlyData: async () => {
      return [];
    },

    getMasterMetrics: async (_masterId: number) => {
      // Fetch monthly goal from DB
      const now = new Date();
      const { data: goalData } = await supabase
        .from('monthly_goals')
        .select('target_revenue')
        .eq('year', now.getFullYear())
        .eq('month', now.getMonth() + 1)
        .maybeSingle();

      return {
        totalTransferred: 0,
        totalTransfers: 0,
        monthTransferred: 0,
        monthTransfers: 0,
        totalRecharged: 0,
        totalSpent: 0,
        monthRecharged: 0,
        monthSpent: 0,
        monthlyGoal: goalData?.target_revenue || 0,
        totalResellers: 0,
        estimatedRevenue: 0,
        estimatedProfit: 0,
      };
    },

    getMasterTransfers: async (_masterId: number) => {
      return [];
    },

    setMasterGoal: async (_masterId: number, year: number, month: number, targetRevenue: number) => {
      // Check if goal exists for this month
      const { data: existing } = await supabase
        .from('monthly_goals')
        .select('id')
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('monthly_goals')
          .update({ target_revenue: targetRevenue, updated_at: new Date().toISOString() })
          .eq('year', year)
          .eq('month', month);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('monthly_goals')
          .insert({ year, month, target_revenue: targetRevenue });
        if (error) throw new Error(error.message);
      }
      return { success: true };
    },
  },

  // PAGAMENTOS: Usam EXCLUSIVAMENTE Node.js/MySQL
  payments: {
    createPix: async (credits: number, adminId: number, adminName: string, _sessionToken: string) => {
      console.log('📦 Criando PIX via Node.js API...');
      return fetchNodeAPI('/payments/create-pix', {
        method: 'POST',
        body: JSON.stringify({ credits, adminId, adminName })
      });
    },

    checkStatus: async (transactionId: string) => {
      console.log('🔍 Verificando status via Node.js API...');
      return fetchNodeAPI(`/payments/status/${transactionId}`);
    },

    createResellerPix: async (params: { masterId: number; masterName: string; resellerData: { nome: string; email: string; key: string } }) => {
      console.log('📦 Criando PIX revendedor via Node.js API...');
      return fetchNodeAPI('/payments/create-reseller-pix', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    },

    getResellerStatus: async (transactionId: string) => {
      console.log('🔍 Verificando status revendedor via Node.js API...');
      return fetchNodeAPI(`/payments/reseller-status/${transactionId}`);
    },

    getHistory: async (adminId: number) => {
      return fetchNodeAPI(`/payments/history/${adminId}`);
    },

    getPriceTiers: async () => {
      try {
        return await fetchNodeAPI('/payments/price-tiers');
      } catch {
        return [
          { id: 1, min_qty: 50, max_qty: 50, price: 1.40, is_active: true },
          { id: 2, min_qty: 100, max_qty: 100, price: 1.30, is_active: true },
          { id: 3, min_qty: 200, max_qty: 200, price: 1.20, is_active: true },
          { id: 4, min_qty: 300, max_qty: 300, price: 1.10, is_active: true },
          { id: 5, min_qty: 500, max_qty: 500, price: 1.00, is_active: true },
        ];
      }
    },

    getGoal: async (year: number, month: number) => {
      try {
        return await fetchNodeAPI(`/payments/goal/${year}/${month}`);
      } catch {
        return { target_revenue: 0, current_revenue: 0 };
      }
    },

    setGoal: async (year: number, month: number, targetRevenue: number) => {
      return fetchNodeAPI('/payments/goal', {
        method: 'POST',
        body: JSON.stringify({ year, month, targetRevenue })
      });
    },
  },

  owner: {
    getOverview: async () => fetchNodeAPI('/owner/overview'),
    getAllAdmins: async () => fetchNodeAPI('/owner/all-admins'),
    getAuditLog: async (adminId?: number) => {
      const params = adminId ? `?adminId=${adminId}` : '';
      return fetchNodeAPI(`/owner/audit-log${params}`);
    },
    changePassword: async (adminId: number, newPassword: string) => {
      return fetchNodeAPI(`/owner/change-password/${adminId}`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword })
      });
    },
    transferCredits: async (toAdminId: number, amount: number) => {
      return fetchNodeAPI('/owner/transfer-credits', {
        method: 'POST',
        body: JSON.stringify({ toAdminId, amount })
      });
    },
    getTopResellers: async () => fetchNodeAPI('/owner/top-resellers'),
    getLastService: async () => fetchNodeAPI('/owner/last-service'),
    getAdminDocuments: async (adminId: number) => fetchNodeAPI(`/owner/admin-documents/${adminId}`),
  },

  noticias: {
    list: async () => fetchNodeAPI('/noticias'),
    create: async (titulo: string, informacao: string) => {
      return fetchNodeAPI('/noticias', {
        method: 'POST',
        body: JSON.stringify({ titulo, informacao }),
      });
    },
    update: async (id: number, titulo: string, informacao: string) => {
      return fetchNodeAPI(`/noticias/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ titulo, informacao }),
      });
    },
    delete: async (id: number) => {
      return fetchNodeAPI(`/noticias/${id}`, { method: 'DELETE' });
    },
  },

  alerts: {
    send: async (targetAdminId: number, message: string) => {
      return fetchNodeAPI('/alerts/send', {
        method: 'POST',
        body: JSON.stringify({ targetAdminId, message }),
      });
    },
    getUnread: async () => fetchNodeAPI('/alerts/unread'),
    markRead: async (alertIds?: number[]) => {
      return fetchNodeAPI('/alerts/read', {
        method: 'PUT',
        body: JSON.stringify({ alertIds }),
      });
    },
  },

  settings: {
    get: async () => {
      const session = getStoredSession();
      if (!session) return {};
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/manage-settings`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ admin_id: session.adminId, session_token: session.sessionToken, action: 'get' }),
        }
      );
      return res.json();
    },
    toggleRecargaDobro: async (enabled: boolean) => {
      const session = getStoredSession();
      if (!session) throw new Error('Sessão inválida');
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/manage-settings`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ admin_id: session.adminId, session_token: session.sessionToken, action: 'toggle_recarga_dobro', data: { enabled } }),
        }
      );
      if (!res.ok) throw new Error('Erro ao atualizar');
      return res.json();
    },
    update: async (data: { reseller_price?: number; reseller_credits?: number; credit_packages?: unknown[] }) => {
      const session = getStoredSession();
      if (!session) throw new Error('Sessão inválida');
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/manage-settings`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ admin_id: session.adminId, session_token: session.sessionToken, action: 'update', data }),
        }
      );
      if (!res.ok) throw new Error('Erro ao atualizar');
      return res.json();
    },
  },

  health: async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  },
};

export default supabaseApi;
