import { useState, useEffect } from 'react';

interface RecordItem {
  id: number;
  nome: string;
  tipo: string;
  created_at: string;
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function LastRecords({ adminId }: { adminId: number }) {
  const [items, setItems] = useState<RecordItem[]>([]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const [cnhRes, rgRes] = await Promise.all([
          supabase.from('usuarios').select('id, nome, created_at').eq('admin_id', adminId).order('created_at', { ascending: false }).limit(3),
          supabase.from('usuarios_rg').select('id, nome, created_at').eq('admin_id', adminId).order('created_at', { ascending: false }).limit(3),
        ]);
        const all: RecordItem[] = [
          ...(cnhRes.data || []).map((r) => ({ id: r.id, nome: r.nome, tipo: 'CNH Digital', created_at: r.created_at || '' })),
          ...(rgRes.data || []).map((r) => ({ id: r.id, nome: r.nome, tipo: 'CIN Digital', created_at: r.created_at || '' })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);
        setItems(all);
      } catch (e) { console.error(e); }
    };
    fetchRecords();
  }, [adminId]);

  const getTimeAgo = (date: string) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const colors = ['bg-orange-500', 'bg-purple-500', 'bg-[#5ba8d4]', 'bg-amber-500'];
  const badgeColors = ['bg-purple-500/80', 'bg-green-500/80', 'bg-[#5ba8d4]/80', 'bg-amber-500/80'];

  return (
    <div>
      <h3 className="text-base font-bold text-white mb-4">Último Registro</h3>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-white/25 py-6 text-center">Nenhum registro</p>
        ) : (
          items.map((item, i) => (
            <div
              key={`${item.tipo}-${item.id}`}
              className="flex items-center gap-3 bg-[#141420]/60 rounded-xl px-3 py-2.5 border border-white/[0.04] hover:border-white/[0.08] transition-colors"
            >
              <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", colors[i % colors.length])}>
                <span className="text-xs font-bold text-white">{item.nome?.[0] || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.nome}</p>
                <p className="text-[10px] text-white/30">{item.tipo}</p>
              </div>
              <span className={cn("text-[10px] font-semibold text-white px-2 py-0.5 rounded-full", badgeColors[i % badgeColors.length])}>
                {getTimeAgo(item.created_at)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
