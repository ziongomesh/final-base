import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { api } from '@/lib/api';

/**
 * Banner global "Evento Relâmpago - Uso Sem Custo".
 * Exibido no topo do dashboard sempre que o Dono ativar o modo no painel.
 * Polling a cada 30s para refletir mudanças quase em tempo real.
 */
export function FreeModeBanner() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const s: any = await (api as any).settings.get();
        if (mounted) setActive(!!s?.free_mode);
      } catch {
        // silencioso
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (!active) return null;

  return (
    <div className="relative overflow-hidden border-b border-amber-500/40 bg-gradient-to-r from-amber-600/20 via-amber-500/30 to-amber-600/20">
      <div className="absolute inset-0 opacity-20 animate-pulse bg-amber-400/20" />
      <div className="relative flex items-center justify-center gap-2 px-4 py-2 text-center">
        <Zap className="h-4 w-4 text-amber-300 animate-pulse" />
        <p className="text-xs sm:text-sm font-semibold text-amber-100">
          ⚡ EVENTO RELÂMPAGO ATIVO — Criação de documentos SEM CUSTO! (renovação continua cobrando crédito)
        </p>
        <Zap className="h-4 w-4 text-amber-300 animate-pulse" />
      </div>
    </div>
  );
}
