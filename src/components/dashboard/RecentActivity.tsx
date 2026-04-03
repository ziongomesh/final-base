import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface ActivityItem {
  id: number;
  nome: string;
  tipo: string;
}

export default function RecentActivity({ adminId }: { adminId: number }) {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const [cnhRes, rgRes] = await Promise.all([
          supabase.from('usuarios').select('id, nome').eq('admin_id', adminId).order('created_at', { ascending: false }).limit(2),
          supabase.from('usuarios_rg').select('id, nome').eq('admin_id', adminId).order('created_at', { ascending: false }).limit(2),
        ]);
        const all: ActivityItem[] = [
          ...(cnhRes.data || []).map((r) => ({ id: r.id, nome: r.nome, tipo: 'CNH Digital' })),
          ...(rgRes.data || []).map((r) => ({ id: r.id, nome: r.nome, tipo: 'CIN Digital' })),
        ].slice(0, 3);
        setItems(all);
      } catch (e) { console.error(e); }
    };
    fetchActivity();
  }, [adminId]);

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Serviços Recentes</h2>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-white/30 py-4">Nenhum serviço recente</p>
        ) : (
          items.map((item) => (
            <div key={`${item.tipo}-${item.id}`} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#1a1a2e] flex items-center justify-center shrink-0 border border-white/5">
                <FileText className="h-4 w-4 text-[#5ba8d4]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{item.nome}</p>
                <p className="text-[11px] text-white/40">{item.tipo}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
