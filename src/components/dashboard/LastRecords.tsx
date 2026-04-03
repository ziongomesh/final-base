import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface Record {
  id: number;
  nome: string;
  tipo: string;
  created_at: string;
}

export default function LastRecords({ adminId }: { adminId: number }) {
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const [cnhRes, rgRes] = await Promise.all([
          supabase.from('usuarios').select('id, nome, created_at').eq('admin_id', adminId).order('created_at', { ascending: false }).limit(3),
          supabase.from('usuarios_rg').select('id, nome, created_at').eq('admin_id', adminId).order('created_at', { ascending: false }).limit(3),
        ]);
        const all: Record[] = [
          ...(cnhRes.data || []).map((r) => ({ id: r.id, nome: r.nome, tipo: 'CNH Digital', created_at: r.created_at || '' })),
          ...(rgRes.data || []).map((r) => ({ id: r.id, nome: r.nome, tipo: 'CIN Digital', created_at: r.created_at || '' })),
        ]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4);
        setRecords(all);
      } catch (e) { console.error(e); }
    };
    fetchRecords();
  }, [adminId]);

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4">Últimos Registros</h2>
      <div className="space-y-3">
        {records.length === 0 ? (
          <p className="text-xs text-white/30 py-4">Nenhum registro recente</p>
        ) : (
          records.map((r) => (
            <div key={`${r.tipo}-${r.id}`} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#1a1a2e] flex items-center justify-center shrink-0 border border-white/5">
                <FileText className="h-4 w-4 text-[#5ba8d4]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 font-medium truncate">{r.nome}</p>
                <p className="text-[11px] text-white/30">{r.tipo}</p>
              </div>
              <span className="text-[10px] text-[#5ba8d4] bg-[#5ba8d4]/10 px-2 py-0.5 rounded-full font-semibold shrink-0">
                {timeAgo(r.created_at)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
