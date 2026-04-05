// Serviço Carteira Estudante - abstrai Node.js MySQL e Supabase
import { isUsingMySQL } from './db-config';
import { supabase } from '@/integrations/supabase/client';

export interface EstudanteSaveData {
  admin_id: number;
  session_token: string;
  nome: string;
  cpf: string;
  rg: string;
  data_nascimento: string;
  faculdade: string;
  graduacao: string;
  fotoBase64: string;
}

export interface EstudanteSaveResult {
  success: boolean;
  id: number;
  senha: string;
  qrcode: string | null;
  perfil_imagem: string | null;
  error?: string;
  details?: any;
}

export interface EstudanteRecord {
  id: number;
  nome: string;
  cpf: string;
  senha: string;
  rg: string;
  data_nascimento: string;
  faculdade: string;
  graduacao: string;
  perfil_imagem: string | null;
  admin_id: number;
  created_at: string;
  qrcode: string | null;
  data_expiracao?: string | null;
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

export const estudanteService = {
  save: async (data: EstudanteSaveData): Promise<EstudanteSaveResult> => {
    if (isUsingMySQL()) {
      return fetchNodeAPI('/estudante/save', data);
    }
    // Supabase edge function (future)
    const { data: result, error } = await supabase.functions.invoke('save-estudante', { body: data });
    if (error) throw new Error(error.message || 'Erro ao salvar');
    if (result?.error) {
      const err: any = new Error(result.error);
      err.status = result.error === 'CPF já cadastrado' ? 409 : 500;
      err.details = result.details;
      throw err;
    }
    return result;
  },

  list: async (admin_id: number, session_token: string): Promise<{ registros: EstudanteRecord[] }> => {
    if (isUsingMySQL()) {
      return fetchNodeAPI('/estudante/list', { admin_id, session_token });
    }
    const { data, error } = await supabase.functions.invoke('list-estudante', {
      body: { admin_id, session_token },
    });
    if (error) throw error;
    return { registros: data?.registros || [] };
  },

  delete: async (admin_id: number, session_token: string, estudante_id: number): Promise<{ success: boolean }> => {
    if (isUsingMySQL()) {
      return fetchNodeAPI('/estudante/delete', { admin_id, session_token, estudante_id });
    }
    const { data, error } = await supabase.functions.invoke('delete-estudante', {
      body: { admin_id, session_token, estudante_id },
    });
    if (error) throw error;
    return data;
  },

  update: async (data: any): Promise<{ success: boolean }> => {
    if (isUsingMySQL()) {
      return fetchNodeAPI('/estudante/update', data);
    }
    const { data: result, error } = await supabase.functions.invoke('update-estudante', { body: data });
    if (error) throw new Error(error.message || 'Erro ao atualizar');
    return result;
  },

  renew: async (admin_id: number, session_token: string, record_id: number): Promise<{ success: boolean; newExpiration: string; creditsRemaining: number }> => {
    if (isUsingMySQL()) {
      return fetchNodeAPI('/estudante/renew', { admin_id, session_token, record_id });
    }
    const { data, error } = await supabase.functions.invoke('renew-estudante', {
      body: { admin_id, session_token, record_id },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  },
};

export default estudanteService;
