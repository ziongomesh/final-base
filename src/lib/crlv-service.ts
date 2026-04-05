// Serviço CRLV - backend Node.js/MySQL

import api from './api';

export interface CrlvRecord {
  id: number;
  admin_id: number;
  renavam: string;
  placa: string;
  exercicio: string;
  numero_crv: string;
  seguranca_crv: string;
  cod_seg_cla: string;
  marca_modelo: string;
  ano_fab: string;
  ano_mod: string;
  cor: string;
  combustivel: string;
  especie_tipo: string;
  categoria: string;
  cat_obs: string;
  carroceria: string;
  chassi: string;
  placa_ant: string;
  potencia_cil: string;
  capacidade: string;
  lotacao: string;
  peso_bruto: string;
  motor: string;
  cmt: string;
  eixos: string;
  nome_proprietario: string;
  cpf_cnpj: string;
  local: string;
  data: string;
  observacoes: string;
  pdf_url: string | null;
  created_at: string;
  expires_at: string | null;
  data_expiracao: string | null;
}

export interface CrlvSaveResult {
  success: boolean;
  id: number;
  senha: string;
  pdf: string | null;
  dataExpiracao: string | null;
}

function getBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:4000/api';
}

export const crlvService = {
  save: async (data: any): Promise<CrlvSaveResult> => {
    const res = await fetch(`${getBaseUrl()}/crlv/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao salvar' }));
      throw new Error(err.error || 'Erro ao salvar CRLV');
    }
    return res.json();
  },

  list: async (adminId: number, sessionToken: string): Promise<CrlvRecord[]> => {
    const res = await fetch(`${getBaseUrl()}/crlv/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id: adminId, session_token: sessionToken }),
    });
    if (!res.ok) return [];
    return res.json();
  },

  delete: async (adminId: number, sessionToken: string, crlvId: number): Promise<boolean> => {
    const res = await fetch(`${getBaseUrl()}/crlv/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id: adminId, session_token: sessionToken, crlv_id: crlvId }),
    });
    return res.ok;
  },
};
