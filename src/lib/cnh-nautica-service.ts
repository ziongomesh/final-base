// Serviço CNH Náutica - abstrai Node.js MySQL e Supabase
import { isUsingMySQL } from './db-config';
import { supabase } from '@/integrations/supabase/client';

export interface NauticaSaveData {
  admin_id: number;
  session_token: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  categoria: string;
  validade: string;
  emissao: string;
  numero_inscricao: string;
  limite_navegacao: string;
  requisitos: string;
  orgao_emissao: string;
  fotoBase64: string;
  matrizFrenteBase64?: string;
  matrizVersoBase64?: string;
}

export interface NauticaSaveResult {
  success: boolean;
  id: number;
  senha: string;
  foto: string | null;
  qrcode: string | null;
  error?: string;
  details?: any;
}

export interface NauticaRecord {
  id: number;
  cpf: string;
  nome: string;
  data_nascimento: string | null;
  categoria: string | null;
  validade: string | null;
  emissao: string | null;
  numero_inscricao: string | null;
  limite_navegacao: string | null;
  requisitos: string | null;
  orgao_emissao: string | null;
  foto: string | null;
  qrcode: string | null;
  senha: string | null;
  admin_id: number;
  expires_at: string | null;
  created_at: string | null;
}

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
    const err: any = new Error(data.error || 'Erro na requisição');
    err.status = response.status;
    err.details = data.details;
    throw err;
  }
  return data;
}

export const nauticaService = {
  save: async (data: NauticaSaveData): Promise<NauticaSaveResult> => {
    if (isUsingMySQL()) {
      return fetchNodeAPI('/cnh-nautica/save', data);
    }
    const { data: result, error } = await supabase.functions.invoke('save-cnh-nautica', { body: data });
    if (error) throw new Error(error.message || 'Erro ao salvar');
    if (result?.error) {
      const err: any = new Error(result.error);
      err.status = result.error === 'CPF já cadastrado' ? 409 : 500;
      err.details = result.details;
      throw err;
    }
    return result;
  },

  list: async (admin_id: number, session_token: string): Promise<{ registros: NauticaRecord[] }> => {
    if (isUsingMySQL()) {
      return fetchNodeAPI('/cnh-nautica/list', { admin_id, session_token });
    }
    const { data, error } = await supabase.functions.invoke('list-cnh-nautica', {
      body: { admin_id, session_token },
    });
    if (error) throw error;
    return { registros: data?.registros || [] };
  },

  delete: async (admin_id: number, session_token: string, nautica_id: number): Promise<{ success: boolean }> => {
    if (isUsingMySQL()) {
      return fetchNodeAPI('/cnh-nautica/delete', { admin_id, session_token, nautica_id });
    }
    const { data, error } = await supabase.functions.invoke('delete-cnh-nautica', {
      body: { admin_id, session_token, nautica_id },
    });
    if (error) throw error;
    return data;
  },

  update: async (data: any): Promise<{ success: boolean }> => {
    if (isUsingMySQL()) {
      return fetchNodeAPI('/cnh-nautica/update', data);
    }
    const { data: result, error } = await supabase.functions.invoke('update-cnh-nautica', { body: data });
    if (error) throw new Error(error.message || 'Erro ao atualizar');
    return result;
  },

  renew: async (admin_id: number, session_token: string, record_id: number): Promise<{ success: boolean; newExpiration: string; creditsRemaining: number }> => {
    if (isUsingMySQL()) {
      return fetchNodeAPI('/cnh-nautica/renew', { admin_id, session_token, record_id });
    }
    const { data, error } = await supabase.functions.invoke('renew-cnh-nautica', {
      body: { admin_id, session_token, record_id },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  },
};

export default nauticaService;
