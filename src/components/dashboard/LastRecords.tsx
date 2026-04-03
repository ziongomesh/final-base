import { useState, useEffect } from 'react';
import { FileText, Clock } from 'lucide-react';
import api from '@/lib/api';

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
        // Try to get recent CNH records
        const cnhRecords = await api.cnh?.list(adminId).catch(() => []);
        const rgRecords = await api.rg?.list(adminId).catch(() => []);

        const all: Record[] = [
          ...(cnhRecords || []).map((r: any) => ({
            id: r.id,
            nome: r.nome,
            tipo: 'CNH Digital',
            created_at: r.created_at,
          })),
          ...(rgRecords || []).map((r: any) => ({
            id: r.id,
            nome: r.nome,
            tipo: 'CIN Digital',
            created_at: r.created_at,
          })),
        ]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        setRecords(all);
      } catch (e) {
        console.error(e);
      }
    };
    fetchRecords();
  }, [adminId]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="bg-[#111a27] rounded-2xl border border-white/5 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Últimos Registros</h2>
      <div className="space-y-3">
        {records.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-6">Nenhum registro recente</p>
        ) : (
          records.map((r) => (
            <div key={`${r.tipo}-${r.id}`} className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-full bg-[#5ba8d4]/10 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-[#5ba8d4]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 font-medium truncate">{r.nome}</p>
                <p className="text-[10px] text-white/30">{r.tipo}</p>
              </div>
              <span className="text-[10px] text-[#5ba8d4] bg-[#5ba8d4]/10 px-2 py-0.5 rounded-full font-medium">
                {timeAgo(r.created_at)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
