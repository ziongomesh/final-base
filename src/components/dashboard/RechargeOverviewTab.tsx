import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import {
  Wallet, TrendingUp, Calendar, Activity, Eye, Search,
  ArrowUpDown, Trophy, Loader2,
} from 'lucide-react';

interface RechargeOverview {
  totais: { total_valor: number; total_creditos: number; total_count: number };
  ultima_recarga: { id: number; admin_id: number; admin_nome: string; amount: number; credits: number; paid_at: string } | null;
  media_semanal_4w: number;
  media_semanal_12w: number;
  top_10: { admin_id: number; nome: string; rank: string; total_valor: number; total_creditos: number; num_recargas: number; ultima_recarga: string | null }[];
  serie_temporal: { week_key: string; week_start: string; total: number }[];
}

interface ResellerRow {
  id: number;
  nome: string;
  email: string;
  rank: string;
  saldo_atual: number;
  total_recarregado: number;
  num_recargas: number;
  ultima_recarga: string | null;
  last_active: string | null;
  days_offline: number | null;
  created_at: string;
}

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';
const fmtDateTime = (s?: string | null) => s ? new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export function RechargeOverviewTab() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<RechargeOverview | null>(null);
  const [rows, setRows] = useState<ResellerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof ResellerRow>('total_recarregado');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    (async () => {
      try {
        const [o, r] = await Promise.all([
          (api as any).owner.getRechargeOverview(),
          (api as any).owner.getAllResellersRechargeStats(),
        ]);
        setOverview(o);
        setRows(r);
      } catch (e) {
        console.error('Erro carregando recargas globais', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = rows
    .filter(r => !search || r.nome.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortBy] as any;
      const bv = b[sortBy] as any;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'desc' ? -cmp : cmp;
    });

  const toggleSort = (col: keyof ResellerRow) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const maxSerie = Math.max(1, ...(overview?.serie_temporal.map(s => s.total) || [1]));

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-3">
      {/* 4 cards de topo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] uppercase tracking-wider font-medium mb-1"><Wallet className="h-3.5 w-3.5" />Total Recarregado</div>
            <p className="text-lg font-bold">{fmtBRL(overview?.totais.total_valor || 0)}</p>
            <p className="text-[10px] text-muted-foreground">{overview?.totais.total_count || 0} recargas · {overview?.totais.total_creditos || 0} créditos</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-blue-400 text-[10px] uppercase tracking-wider font-medium mb-1"><Calendar className="h-3.5 w-3.5" />Última Recarga</div>
            {overview?.ultima_recarga ? (
              <>
                <p className="text-sm font-bold truncate">{overview.ultima_recarga.admin_nome}</p>
                <p className="text-[10px] text-muted-foreground">{fmtBRL(overview.ultima_recarga.amount)} · {fmtDateTime(overview.ultima_recarga.paid_at)}</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhuma</p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-purple-400 text-[10px] uppercase tracking-wider font-medium mb-1"><TrendingUp className="h-3.5 w-3.5" />Média 4 sem.</div>
            <p className="text-lg font-bold">{fmtBRL(overview?.media_semanal_4w || 0)}</p>
            <p className="text-[10px] text-muted-foreground">por semana</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-amber-400 text-[10px] uppercase tracking-wider font-medium mb-1"><Activity className="h-3.5 w-3.5" />Média 12 sem.</div>
            <p className="text-lg font-bold">{fmtBRL(overview?.media_semanal_12w || 0)}</p>
            <p className="text-[10px] text-muted-foreground">por semana</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de barras das últimas 12 semanas */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground"><Activity className="h-3.5 w-3.5" />Recarga semanal — últimas 12 semanas</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {!overview?.serie_temporal.length ? (
            <p className="text-center text-muted-foreground text-xs py-4">Sem dados de recarga ainda</p>
          ) : (
            <div className="flex items-end gap-1.5 h-28">
              {overview.serie_temporal.map(s => {
                const pct = (s.total / maxSerie) * 100;
                return (
                  <div key={s.week_key} className="flex-1 group relative" title={`Semana de ${fmtDate(s.week_start)}: ${fmtBRL(s.total)}`}>
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">{fmtBRL(s.total)}</div>
                    <div className="w-full bg-primary/70 hover:bg-primary rounded-t-sm transition-all" style={{ height: `${Math.max(3, pct)}%` }} />
                    <div className="text-[8px] text-muted-foreground text-center mt-1 truncate">{fmtDate(s.week_start)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 10 */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground"><Trophy className="h-3.5 w-3.5 text-amber-400" />Top 10 por valor recarregado</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {!overview?.top_10.length ? (
            <p className="text-center text-muted-foreground text-xs py-4">Sem dados</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[10px]">
                    <TableHead className="h-7 w-8">#</TableHead>
                    <TableHead className="h-7">Nome</TableHead>
                    <TableHead className="h-7">Cargo</TableHead>
                    <TableHead className="h-7">Total Recarregado</TableHead>
                    <TableHead className="h-7">Créditos</TableHead>
                    <TableHead className="h-7">Recargas</TableHead>
                    <TableHead className="h-7">Última</TableHead>
                    <TableHead className="h-7"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.top_10.map((t, i) => (
                    <TableRow key={t.admin_id} className="text-xs">
                      <TableCell className="font-bold text-amber-400">{i + 1}</TableCell>
                      <TableCell className="font-medium">{t.nome}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] h-4 px-1.5">{t.rank}</Badge></TableCell>
                      <TableCell className="font-semibold text-emerald-400">{fmtBRL(t.total_valor)}</TableCell>
                      <TableCell className="font-mono">{t.total_creditos}</TableCell>
                      <TableCell className="font-mono">{t.num_recargas}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">{fmtDate(t.ultima_recarga)}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => navigate(`/revendedor/${t.admin_id}`)} title="Ver detalhes">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela completa de revendedores ordenável */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground">Todos revendedores e masters ({rows.length})</CardTitle>
            <div className="relative w-full sm:w-auto sm:min-w-[200px]">
              <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou email..." className="h-7 pl-7 text-xs" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[10px]">
                  <SortableTh col="nome" label="Nome" current={sortBy} dir={sortDir} onClick={toggleSort} />
                  <TableHead className="h-7">Cargo</TableHead>
                  <SortableTh col="saldo_atual" label="Saldo" current={sortBy} dir={sortDir} onClick={toggleSort} />
                  <SortableTh col="total_recarregado" label="Total Recarregado" current={sortBy} dir={sortDir} onClick={toggleSort} />
                  <SortableTh col="num_recargas" label="# Recargas" current={sortBy} dir={sortDir} onClick={toggleSort} />
                  <SortableTh col="ultima_recarga" label="Última Recarga" current={sortBy} dir={sortDir} onClick={toggleSort} />
                  <SortableTh col="days_offline" label="Offline (dias)" current={sortBy} dir={sortDir} onClick={toggleSort} />
                  <TableHead className="h-7"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id} className="text-xs">
                    <TableCell className="font-medium max-w-[180px] truncate">{r.nome}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] h-4 px-1.5">{r.rank}</Badge></TableCell>
                    <TableCell className="font-mono text-primary">{r.saldo_atual}</TableCell>
                    <TableCell className="font-semibold text-emerald-400">{r.total_recarregado}</TableCell>
                    <TableCell className="font-mono">{r.num_recargas}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">{fmtDate(r.ultima_recarga)}</TableCell>
                    <TableCell>
                      {r.days_offline == null ? (
                        <span className="text-muted-foreground/50 text-[10px]">—</span>
                      ) : (
                        <span className={`font-mono text-[11px] ${r.days_offline >= 30 ? 'text-red-400' : r.days_offline >= 7 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {r.days_offline}d
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.rank === 'revendedor' && (
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => navigate(`/revendedor/${r.id}`)} title="Ver detalhes">
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground text-xs py-6">Nenhum resultado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SortableTh({ col, label, current, dir, onClick }: { col: keyof ResellerRow; label: string; current: keyof ResellerRow; dir: 'asc' | 'desc'; onClick: (c: keyof ResellerRow) => void }) {
  const active = current === col;
  return (
    <TableHead className="h-7 cursor-pointer select-none hover:bg-muted/30" onClick={() => onClick(col)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-2.5 w-2.5 ${active ? 'text-primary' : 'text-muted-foreground/40'} ${active && dir === 'asc' ? 'rotate-180' : ''}`} />
      </span>
    </TableHead>
  );
}
