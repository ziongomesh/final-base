// Template loader - busca templates do backend com autenticação + XOR decode
// Templates NUNCA ficam no bundle Vite - são servidos pelo backend protegidos
// Retorna ImageBitmap que pode ser desenhado direto no canvas sem criar URLs visíveis na Network

const templateCache = new Map<string, ImageBitmap>();

// XOR key - must match server
const XOR_KEY = [0x5A, 0x3C, 0x7F, 0x1D, 0xA2, 0x6E, 0x91, 0xB4, 0xD8, 0x43, 0xF0, 0x27, 0x8B, 0xE5, 0x19, 0x6C];

function xorDecode(data: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ XOR_KEY[i % XOR_KEY.length];
  }
  return result;
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

function getAuthHeaders(): Record<string, string> {
  try {
    const stored = localStorage.getItem('admin');
    if (!stored) return {};
    const admin = JSON.parse(stored);
    return {
      'X-Admin-Id': String(admin.id),
      'X-Session-Token': admin.session_token || '',
    };
  } catch {
    return {};
  }
}

// Returns ImageBitmap - drawable directly on canvas, invisible in Network tab
export async function loadTemplate(name: string): Promise<ImageBitmap> {
  if (templateCache.has(name)) {
    return templateCache.get(name)!;
  }

  const API_URL = getApiUrl();
  const headers = getAuthHeaders();

  const response = await fetch(`${API_URL}/templates/secure/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!response.ok) throw new Error(`Template ${name} não encontrado`);

  // Receive XOR-obfuscated binary data
  const obfuscatedBuffer = await response.arrayBuffer();
  const obfuscatedData = new Uint8Array(obfuscatedBuffer);

  // Decode XOR
  const decoded = xorDecode(obfuscatedData);

  // Create ImageBitmap directly from decoded bytes - no URLs, no Network visibility
  const blob = new Blob([decoded.buffer as ArrayBuffer], { type: 'image/png' });
  const bitmap = await createImageBitmap(blob);

  templateCache.set(name, bitmap);
  return bitmap;
}

// Pre-load multiple templates at once
export async function preloadTemplates(names: string[]): Promise<Record<string, ImageBitmap>> {
  const results: Record<string, ImageBitmap> = {};
  await Promise.all(
    names.map(async (name) => {
      results[name] = await loadTemplate(name);
    })
  );
  return results;
}
