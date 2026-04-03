import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, ChevronRight } from 'lucide-react';
import { cnhService } from '@/lib/cnh-service';
import { rgService } from '@/lib/rg-service';
import { crlvService } from '@/lib/crlv-service';
import { nauticaService } from '@/lib/cnh-nautica-service';
import { estudanteService } from '@/lib/estudante-service';
import { hapvidaService } from '@/lib/hapvida-service';

interface RecordItem {
  id: number;
  nome: string;
  cpf: string;
  tipo: string;
  created_at: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch { return ''; }
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

export default function LastRecords({ adminId, sessionToken }: { adminId: number; sessionToken: string }) {
  const [items, setItems] = useState<RecordItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const [cnhData, rgData, crlvData, chaData, estudanteData, hapvidaData] = await Promise.all([
          cnhService.list(adminId, sessionToken).catch(() => ({ usuarios: [] })),
          rgService.list(adminId, sessionToken).catch(() => ({ registros: [] })),
          crlvService.list(adminId, sessionToken).catch(() => []),
          nauticaService.list(adminId, sessionToken).catch(() => ({ registros: [] })),
          estudanteService.list(adminId, sessionToken).catch(() => ({ registros: [] })),
          hapvidaService.list(adminId, sessionToken).catch(() => ({ registros: [] })),
        ]);

        const all: RecordItem[] = [
          ...(cnhData?.usuarios || []).map((r: any) => ({ id: r.id, nome: r.nome, cpf: r.cpf, tipo: 'CNH', created_at: r.created_at || '' })),
          ...(rgData?.registros || []).map((r: any) => ({ id: r.id, nome: r.nome, cpf: r.cpf, tipo: 'RG', created_at: r.created_at || '' })),
          ...(Array.isArray(crlvData) ? crlvData : []).map((r: any) => ({ id: r.id, nome: r.nome_proprietario || r.nome, cpf: r.cpf_cnpj || r.cpf, tipo: 'CRLV', created_at: r.created_at || '' })),
          ...(chaData?.registros || []).map((r: any) => ({ id: r.id, nome: r.nome, cpf: r.cpf, tipo: 'CHA', created_at: r.created_at || '' })),
          ...(estudanteData?.registros || []).map((r: any) => ({ id: r.id, nome: r.nome, cpf: r.cpf, tipo: 'Estudante', created_at: r.created_at || '' })),
          ...(hapvidaData?.registros || []).map((r: any) => ({ id: r.id, nome: r.nome_paciente || r.nome, cpf: r.cpf_paciente || r.cpf, tipo: 'Hapvida', created_at: r.created_at || '' })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

        setItems(all);
      } catch (e) { console.error(e); }
    };
    if (adminId && sessionToken) fetchRecords();
  }, [adminId, sessionToken]);

  const cardStyle = {
    background: 'hsl(215 30% 10%)',
    border: '1px solid hsl(210 40% 16%)',
    borderRadius: '16px',
  };

  return (
    <div className="p-5" style={cardStyle}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" style={{ color: 'hsl(201 55% 59%)' }} />
          <h3 className="text-sm font-semibold text-white">Últimos Registros</h3>
        </div>
        <button
          onClick={() => navigate('/historico-servicos')}
          className="text-[10px] flex items-center gap-1 hover:opacity-80 transition-opacity"
          style={{ color: 'hsl(201 55% 59%)' }}
        >
          Ver todos <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-center py-6" style={{ color: 'hsl(210 20% 30%)' }}>Nenhum registro encontrado</p>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div
              key={`${r.tipo}-${r.id}`}
              onClick={() => navigate('/historico-servicos')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer hover:brightness-110"
              style={{
                background: 'hsl(215 25% 12%)',
                border: '1px solid hsl(210 40% 15%)',
              }}
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'hsl(201 55% 59% / 0.08)' }}
              >
                <FileText className="h-3.5 w-3.5" style={{ color: 'hsl(201 55% 59%)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{r.nome}</p>
                <p className="text-[10px]" style={{ color: 'hsl(210 20% 35%)' }}>
                  {r.tipo} • {r.cpf} • {formatDate(r.created_at)}
                </p>
              </div>
              <span className="text-[10px] flex-shrink-0" style={{ color: 'hsl(210 20% 30%)' }}>{timeAgo(r.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
