// Serviço para buscar acervo de fotos e assinaturas do admin
// SEMPRE usa o backend Node.js (dados estão no MySQL)

export interface GalleryItem {
  url: string;
  nome: string;
  cpf: string;
  modulo: string;
  created_at: string;
}

export interface GalleryResult {
  photos: GalleryItem[];
  signatures: GalleryItem[];
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

export async function fetchGallery(admin_id: number, session_token: string): Promise<GalleryResult> {
  // Always use Node.js backend - data is in MySQL
  const API_URL = getApiUrl();
  const response = await fetch(`${API_URL}/gallery/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_id, session_token }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Erro ao buscar galeria');
  return data;
}
