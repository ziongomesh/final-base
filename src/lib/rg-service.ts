// Serviço RG Digital - abstrai Supabase Edge Functions e Node.js MySQL
import { isUsingMySQL } from './db-config';
import { supabase } from '@/integrations/supabase/client';

export interface RgSaveData {
  admin_id: number;
  session_token: string;
  cpf: string;
  nomeCompleto: string;
  nomeSocial?: string;
  dataNascimento: string;
  naturalidade: string;
  genero: string;
  nacionalidade: string;
  validade: string;
  uf: string;
  dataEmissao: string;
  local: string;
  orgaoExpedidor: string;
  pai?: string;
  mae?: string;
  rgFrenteBase64: string;
  rgVersoBase64: string;
  fotoBase64: string;
  assinaturaBase64?: string;
  pdfPageBase64?: string;
}

export interface RgSaveResult {
  success: boolean;
  id: number;
  senha: string;
  pdf: string | null;
  dataExpiracao: string | null;
  images: { frente: string | null; verso: string | null };
  error?: string;
  details?: any;
}

export interface RgUpdateData {
  admin_id: number;
  session_token: string;
  rg_id: number;
  nomeCompleto: string;
  nomeSocial?: string;
  dataNascimento: string;
  naturalidade: string;
  genero: string;
  nacionalidade: string;
  validade: string;
  uf: string;
  dataEmissao: string;
  local: string;
  orgaoExpedidor: string;
  pai?: string;
  mae?: string;
  changedMatrices: string[];
  rgFrenteBase64?: string;
  rgVersoBase64?: string;
  fotoBase64?: string;
  assinaturaBase64?: string;
  pdfPageBase64?: string;
}

export interface RgUpdateResult {
  success: boolean;
  pdf: string | null;
  changedMatrices: string[];
  images: { frente: string | null; verso: string | null };
  error?: string;
}

export interface RgRecord {
  id: number;
  admin_id: number;
  cpf: string;
  nome: string;
  nome_social: string | null;
  data_nascimento: string | null;
  naturalidade: string | null;
  genero: string | null;
  nacionalidade: string | null;
  validade: string | null;
  uf: string | null;
  data_emissao: string | null;
  local_emissao: string | null;
  orgao_expedidor: string | null;
  pai: string | null;
  mae: string | null;
  senha: string | null;
  foto_url: string | null;
  assinatura_url: string | null;
  rg_frente_url: string | null;
  rg_verso_url: string | null;
  qrcode_url: string | null;
  pdf_url: string | null;
  created_at: string | null;
  data_expiracao: string | null;
  // MySQL field mapping aliases
  nome_completo?: string;
  // MySQL raw field fallbacks
  foto?: string | null;
  assinatura?: string | null;
  local?: string | null;
}

// Helper para obter a URL da API Node.js
function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl) {
    const base = envUrl.replace(/\/+$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:4000/api';
}

async function fetchNodeAPI(endpoint: string, body: any) {
  const API_URL = getApiUrl();
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw { status: response.status, ...data };
  }
  return data;
}

export const rgService = {
  save: async (data: RgSaveData): Promise<RgSaveResult> => {
    if (isUsingMySQL()) {
      console.log('📦 Salvando RG via Node.js API...');
      return fetchNodeAPI('/rg/save', data);
    }

    console.log('📦 Salvando RG via Edge Function...');
    const { data: result, error } = await supabase.functions.invoke('save-rg', {
      body: data,
    });

    if (error) throw new Error(error.message || 'Erro ao salvar RG');
    if (result?.error) {
      const err: any = new Error(result.error);
      err.status = result.error === 'CPF já cadastrado' ? 409 : 500;
      err.details = result.details;
      throw err;
    }

    return result;
  },

  update: async (data: RgUpdateData): Promise<RgUpdateResult> => {
    if (isUsingMySQL()) {
      console.log('📦 Atualizando RG via Node.js API...');
      return fetchNodeAPI('/rg/update', data);
    }

    console.log('📦 Atualizando RG via Edge Function...');
    const { data: result, error } = await supabase.functions.invoke('update-rg', {
      body: data,
    });

    if (error) throw error;
    if (result?.error) throw new Error(result.error);

    return result;
  },

  list: async (admin_id: number, session_token: string): Promise<{ registros: RgRecord[] }> => {
    if (isUsingMySQL()) {
      console.log('📦 Listando RG via Node.js API...');
      return fetchNodeAPI('/rg/list', { admin_id, session_token });
    }

    console.log('📦 Listando RG via Edge Function...');
    const { data, error } = await supabase.functions.invoke('list-rg', {
      body: { admin_id, session_token },
    });
    if (error) throw error;
    return { registros: data?.registros || [] };
  },

  delete: async (admin_id: number, session_token: string, rg_id: number): Promise<{ success: boolean }> => {
    if (isUsingMySQL()) {
      console.log('📦 Excluindo RG via Node.js API...');
      return fetchNodeAPI('/rg/delete', { admin_id, session_token, rg_id });
    }

    console.log('📦 Excluindo RG via Edge Function...');
    const { data, error } = await supabase.functions.invoke('delete-rg', {
      body: { admin_id, session_token, rg_id },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return data;
  },

  renew: async (admin_id: number, session_token: string, record_id: number): Promise<{ success: boolean; newExpiration: string; creditsRemaining: number }> => {
    if (isUsingMySQL()) {
      console.log('📦 Renovando RG via Node.js API...');
      return fetchNodeAPI('/rg/renew', { admin_id, session_token, record_id, service_type: 'rg' });
    }

    console.log('📦 Renovando RG via Edge Function...');
    const { data, error } = await supabase.functions.invoke('renew-service', {
      body: { admin_id, session_token, record_id, service_type: 'rg' },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return data;
  },
};

export default rgService;
