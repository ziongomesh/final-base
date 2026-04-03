import { useState, useEffect } from 'react';
import { Clock, FileText } from 'lucide-react';

interface RecordItem {
  id: number;
  nome: string;
  cpf: string;
  tipo: string;
  created_at: string;
}

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function LastRecords({ adminId }: { adminId: number }) {
  const [items, setItems] = useState<RecordItem[]>([]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const [cnhRes, rgRes] = await Promise.all([
          supabase.from('usuarios').select('id, nome, cpf, created_at').eq('admin_id', adminId).order('created_at', { ascending: false }).limit(3),
          supabase.from('usuarios_rg').select('id, nome, cpf, created_at').eq('admin_id', adminId).order('created_at', { ascending: false }).limit(3),
        ]);
        const all: RecordItem[] = [
          ...(cnhRes.data || []).map((r) => ({ id: r.id, nome: r.nome, cpf: r.cpf, tipo: 'CNH', created_at: r.created_at || '' })),
          ...(rgRes.data || []).map((r) => ({ id: r.id, nome: r.nome, cpf: r.cpf, tipo: 'RG', created_at: r.created_at || '' })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
        setItems(all);
      } catch (e) { console.error(e); }
    };
    fetchRecords();
  }, [adminId]);

  return (
    <div className="rounded-2xl border border-[#5ba8d4]/10 bg-[#0c1420] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-[#5ba8d4]" />
        <h3 className="text-sm font-semibold text-white">Últimos Registros</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-white/25 text-center py-6">Nenhum registro encontrado</p>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div
              key={`${r.tipo}-${r.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-[#5ba8d4]/15 transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-[#5ba8d4]/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-3.5 w-3.5 text-[#5ba8d4]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{r.nome}</p>
                <p className="text-[10px] text-white/30">{r.tipo} • {r.cpf}</p>
              </div>
              <span className="text-[10px] text-white/25 flex-shrink-0">{timeAgo(r.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
