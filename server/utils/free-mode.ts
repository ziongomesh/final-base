import { query } from '../db';

let cached: { value: boolean; ts: number } | null = null;
const TTL_MS = 5_000; // cache curto p/ evitar query a cada request

/**
 * Verifica se o "Modo Uso Sem Custo" está ativo.
 * Quando true, nenhum crédito deve ser debitado de masters/revendedores.
 * Cache de 5s para reduzir carga.
 */
export async function isFreeMode(): Promise<boolean> {
  const now = Date.now();
  if (cached && now - cached.ts < TTL_MS) return cached.value;
  try {
    const rows = await query<any[]>('SELECT free_mode FROM platform_settings WHERE id = 1');
    const value = rows.length > 0 ? !!rows[0].free_mode : false;
    cached = { value, ts: now };
    return value;
  } catch {
    return false;
  }
}

export function invalidateFreeModeCache() {
  cached = null;
}
