// Serviço CNH unificado - abstrai Supabase Edge Functions e Node.js MySQL
import { isUsingMySQL } from './db-config';
import { supabase } from '@/integrations/supabase/client';

// Tipo dos dados de salvamento de CNH
export interface CnhSaveData {
  admin_id: number;
  session_token: string;
  cpf: string;
  nome: string;
  dataNascimento: string;
  sexo: string;
  nacionalidade: string;
  docIdentidade: string;
  categoria: string;
  numeroRegistro: string;
  dataEmissao: string;
  dataValidade: string;
  hab: string;
  pai?: string;
  mae?: string;
  uf: string;
  localEmissao: string;
  estadoExtenso: string;
  espelho: string;
  codigo_seguranca: string;
  renach: string;
  obs?: string;
  matrizFinal?: string;
  cnhDefinitiva?: string;
  cnhFrenteBase64: string;
  cnhMeioBase64: string;
  cnhVersoBase64: string;
  fotoBase64: string;
  assinaturaBase64?: string;
  qrcodeBase64?: string;
  pdfBase64?: string;
}

export interface CnhUpdateData extends CnhSaveData {
  usuario_id: number;
  changedMatrices: string[];
  assinaturaBase64?: string;
}

export interface CnhSaveResult {
  success: boolean;
  id: number;
  senha: string;
  pdf: string | null;
  dataExpiracao: string | null;
  images: { frente: string | null; meio: string | null; verso: string | null };
  error?: string;
  details?: any;
}

export interface CnhUpdateResult {
  success: boolean;
  pdf: string | null;
  changedMatrices: string[];
  images: { frente: string | null; meio: string | null; verso: string | null };
  error?: string;
}

export interface CnhListResult {
  usuarios: any[];
  error?: string;
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

export const cnhService = {
  save: async (data: CnhSaveData): Promise<CnhSaveResult> => {
    if (isUsingMySQL()) {
      console.log('📦 Salvando CNH via Node.js API...');
      return fetchNodeAPI('/cnh/save', data);
    }

    console.log('📦 Salvando CNH via Edge Function...');
    const { data: result, error } = await supabase.functions.invoke('save-cnh', {
      body: data,
    });

    if (error) throw new Error(error.message || 'Erro ao salvar CNH');
    if (result?.error) {
      const err: any = new Error(result.error);
      err.status = result.error === 'CPF já cadastrado' ? 409 : 500;
      err.details = result.details;
      throw err;
    }

    return result;
  },

  update: async (data: CnhUpdateData): Promise<CnhUpdateResult> => {
    if (isUsingMySQL()) {
      console.log('📦 Atualizando CNH via Node.js API...');
      return fetchNodeAPI('/cnh/update', data);
    }

    console.log('📦 Atualizando CNH via Edge Function...');
    const { data: result, error } = await supabase.functions.invoke('update-cnh', {
      body: data,
    });

    if (error) throw error;
    if (result?.error) throw new Error(result.error);

    return result;
  },

  list: async (admin_id: number, session_token: string): Promise<CnhListResult> => {
    if (isUsingMySQL()) {
      console.log('📦 Listando CNH via Node.js API...');
      return fetchNodeAPI('/cnh/list', { admin_id, session_token });
    }

    console.log('📦 Listando CNH via Edge Function...');
    const { data, error } = await supabase.functions.invoke('list-cnh', {
      body: { admin_id, session_token },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return { usuarios: data?.usuarios || [] };
  },

  delete: async (admin_id: number, session_token: string, usuario_id: number): Promise<{ success: boolean }> => {
    if (isUsingMySQL()) {
      console.log('📦 Excluindo CNH via Node.js API...');
      return fetchNodeAPI('/cnh/delete', { admin_id, session_token, usuario_id });
    }

    console.log('📦 Excluindo CNH via Edge Function...');
    const { data, error } = await supabase.functions.invoke('delete-cnh', {
      body: { admin_id, session_token, usuario_id },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return data;
  },

  renew: async (admin_id: number, session_token: string, record_id: number): Promise<{ success: boolean; newExpiration: string; creditsRemaining: number }> => {
    if (isUsingMySQL()) {
      console.log('📦 Renovando CNH via Node.js API...');
      return fetchNodeAPI('/cnh/renew', { admin_id, session_token, record_id, service_type: 'cnh' });
    }

    console.log('📦 Renovando CNH via Edge Function...');
    const { data, error } = await supabase.functions.invoke('renew-service', {
      body: { admin_id, session_token, record_id, service_type: 'cnh' },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return data;
  },
};

export default cnhService;
