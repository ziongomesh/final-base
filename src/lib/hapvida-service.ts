// Serviço Hapvida - backend Node.js/MySQL

function getBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:4000/api';
}

export const hapvidaService = {
  save: async (data: any): Promise<any> => {
    const res = await fetch(`${getBaseUrl()}/hapvida/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao salvar' }));
      throw new Error(err.error || 'Erro ao salvar atestado');
    }
    return res.json();
  },

  list: async (adminId: number, sessionToken: string): Promise<{ registros: any[] }> => {
    const res = await fetch(`${getBaseUrl()}/hapvida/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id: adminId, session_token: sessionToken }),
    });
    if (!res.ok) return { registros: [] };
    return res.json();
  },

  delete: async (adminId: number, sessionToken: string, atestadoId: number): Promise<boolean> => {
    const res = await fetch(`${getBaseUrl()}/hapvida/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id: adminId, session_token: sessionToken, atestado_id: atestadoId }),
    });
    return res.ok;
  },
};
