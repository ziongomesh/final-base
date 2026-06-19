import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import {
  ArrowLeft, User, CreditCard, FileText, Clock, TrendingUp, TrendingDown,
  Calendar, Mail, Phone, Activity, LogIn, Wallet, Wifi, WifiOff,
  CarFront, IdCard, GraduationCap, Truck, Ship, Stethoscope,
} from 'lucide-react';

interface ResellerDetailsResponse {
  reseller: {
    id: number;
    nome: string;
    email: string;
    telefone: string | null;
    creditos: number;
    rank: string;
    profile_photo: string | null;
    created_at: string;
    last_active: string | null;
    created_by: { id: number; nome: string } | null;
  };
  status: {
    is_online: boolean;
    minutes_since_active: number | null;
    days_offline: number | null;
    last_active: string | null;
  };
  stats: {
    totalCreditsReceived: number;
    creditsUsed: number;
    currentBalance: number;
    totalDocuments: number;
    totalCnh: number;
    totalRg: number;
    totalCarteira: number;
    totalCrlv: number;
    totalCha: number;
    diasAtivos30d: number;
    logins7d: number;
  };
  activity30d: { dia: string; count: number }[];
  lastService: any | null;
  documents: {
    cnhs: any[];
    rgs: any[];
    carteiras: any[];
    crlvs: any[];
    chas: any[];
  };
  recharges: {
    id: number;
    from_admin_id: number | null;
    from_nome: string | null;
    amount: number;
    unit_price: number | null;
    total_price: number | null;
    transaction_type: string;
    created_at: string;
  }[];
  logins: { id: number; login_at: string; ip: string | null }[];
}

const formatDate = (s?: string | null) => {
  if (!s) return '—';
  return new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const formatCpf = (cpf?: string) => {
  if (!cpf) return '—';
  const c = cpf.replace(/\D/g, '');
  if (c.length === 11) return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return cpf;
};
const formatCurrency = (n?: number | null) => {
  if (n == null) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function RevendedorDetalhes() {
  const { admin, role, loading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<ResellerDetailsResponse | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docFilter, setDocFilter] = useState<'all' | 'cnh' | 'rg' | 'carteira' | 'crlv' | 'cha'>('all');

  useEffect(() => {
    if (admin && (role === 'master' || role === 'sub' || role === 'dono') && id) {
      fetchDetails();
    }
  }, [admin, role, id]);

  const fetchDetails = async () => {
    try {
      setLoadingData(true);
      const data = await api.admins.getResellerDetails(parseInt(id!));
      setDetails(data as ResellerDetailsResponse);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes');
    } finally {
      setLoadingData(false);
    }
  };

  // Documentos unificados pra tab "Documentos"
  const allDocs = useMemo(() => {
    if (!details) return [];
    const merged = [
      ...details.documents.cnhs.map(d => ({ ...d, _tipo: 'CNH' as const })),
      ...details.documents.rgs.map(d => ({ ...d, _tipo: 'RG' as const })),
      ...details.documents.carteiras.map(d => ({ ...d, _tipo: 'Carteira' as const })),
      ...details.documents.crlvs.map(d => ({ ...d, _tipo: 'CRLV' as const })),
      ...details.documents.chas.map(d => ({ ...d, _tipo: 'Náutica' as const })),
    ];
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (docFilter === 'all') return merged;
    const map: any = { cnh: 'CNH', rg: 'RG', carteira: 'Carteira', crlv: 'CRLV', cha: 'Náutica' };
    return merged.filter(d => d._tipo === map[docFilter]);
  }, [details, docFilter]);

  // Activity heatmap simples (últimos 30 dias)
  const heatmap = useMemo(() => {
    if (!details) return [];
    const map = new Map<string, number>();
    details.activity30d.forEach(a => map.set(String(a.dia).slice(0, 10), a.count));
    const out: { dia: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ dia: key, count: map.get(key) || 0 });
    }
    return out;
  }, [details]);
  const maxLogins = useMemo(() => Math.max(1, ...heatmap.map(h => h.count)), [heatmap]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }
  if (!admin) return <Navigate to="/login" replace />;
  if (role !== 'master' && role !== 'sub' && role !== 'dono') return <Navigate to="/dashboard" replace />;

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>
        </div>
      </DashboardLayout>
    );
  }

  const r = details?.reseller;
  const s = details?.stats;
  const st = details?.status;
  const totalRecargas = details?.recharges.reduce((acc, x) => acc + (x.total_price || 0), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header compacto */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground">Detalhes do Revendedor</h1>
            <p className="text-[11px] text-muted-foreground">Visão completa de atividade, documentos e recargas</p>
          </div>
        </div>

        {loadingData ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : !r ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Revendedor não encontrado</div>
        ) : (
          <>
            {/* Card de perfil */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold truncate">{r.nome}</p>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">{r.rank}</Badge>
                        {st?.is_online ? (
                          <Badge className="text-[10px] h-4 px-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1"><Wifi className="h-2.5 w-2.5" />Online</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-1 text-muted-foreground"><WifiOff className="h-2.5 w-2.5" />{st?.days_offline != null ? `${st.days_offline}d offline` : 'Offline'}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>
                        {r.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.telefone}</span>}
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Criado {formatDate(r.created_at)}</span>
                        {r.created_by && <span>por <span className="text-foreground">{r.created_by.nome}</span></span>}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Último acesso: {formatDate(st?.last_active || null)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 6 stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <StatCard icon={<Wallet className="h-4 w-4" />} label="Saldo atual" value={s!.currentBalance} accent="primary" />
              <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Recebidos" value={s!.totalCreditsReceived} accent="emerald" />
              <StatCard icon={<TrendingDown className="h-4 w-4" />} label="Usados" value={s!.creditsUsed} accent="red" />
              <StatCard icon={<FileText className="h-4 w-4" />} label="Documentos" value={s!.totalDocuments} accent="purple" />
              <StatCard icon={<Activity className="h-4 w-4" />} label="Dias ativos (30d)" value={s!.diasAtivos30d} accent="blue" />
              <StatCard icon={<LogIn className="h-4 w-4" />} label="Logins (7d)" value={s!.logins7d} accent="amber" />
            </div>

            {/* Mini heatmap atividade 30d */}
            <Card>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground"><Activity className="h-3.5 w-3.5" />Atividade nos últimos 30 dias</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex items-end gap-0.5 h-16">
                  {heatmap.map(h => {
                    const pct = h.count === 0 ? 4 : Math.max(8, (h.count / maxLogins) * 100);
                    return (
                      <div key={h.dia} className="flex-1 group relative" title={`${h.dia}: ${h.count} login(s)`}>
                        <div
                          className={`w-full rounded-sm transition-all ${h.count === 0 ? 'bg-muted/30' : 'bg-primary/70 hover:bg-primary'}`}
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>30d atrás</span>
                  <span>hoje</span>
                </div>
              </CardContent>
            </Card>

            {/* Tabs principais */}
            <Tabs defaultValue="docs">
              <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="docs" className="text-xs gap-1"><FileText className="h-3 w-3" />Documentos ({s!.totalDocuments})</TabsTrigger>
                <TabsTrigger value="recargas" className="text-xs gap-1"><CreditCard className="h-3 w-3" />Recargas ({details!.recharges.length})</TabsTrigger>
                <TabsTrigger value="atividade" className="text-xs gap-1"><LogIn className="h-3 w-3" />Atividade ({details!.logins.length})</TabsTrigger>
              </TabsList>

              {/* TAB: Documentos */}
              <TabsContent value="docs" className="mt-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex gap-1 flex-wrap mb-3">
                      <FilterChip active={docFilter === 'all'} onClick={() => setDocFilter('all')}>Todos ({s!.totalDocuments})</FilterChip>
                      <FilterChip active={docFilter === 'cnh'} onClick={() => setDocFilter('cnh')} icon={<CarFront className="h-3 w-3" />}>CNH ({s!.totalCnh})</FilterChip>
                      <FilterChip active={docFilter === 'rg'} onClick={() => setDocFilter('rg')} icon={<IdCard className="h-3 w-3" />}>RG ({s!.totalRg})</FilterChip>
                      <FilterChip active={docFilter === 'carteira'} onClick={() => setDocFilter('carteira')} icon={<GraduationCap className="h-3 w-3" />}>Carteira ({s!.totalCarteira})</FilterChip>
                      <FilterChip active={docFilter === 'crlv'} onClick={() => setDocFilter('crlv')} icon={<Truck className="h-3 w-3" />}>CRLV ({s!.totalCrlv})</FilterChip>
                      <FilterChip active={docFilter === 'cha'} onClick={() => setDocFilter('cha')} icon={<Ship className="h-3 w-3" />}>Náutica ({s!.totalCha})</FilterChip>
                    </div>
                    {allDocs.length === 0 ? (
                      <p className="text-center text-muted-foreground text-xs py-8">Nenhum documento encontrado</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="text-[10px]">
                              <TableHead className="h-7">Tipo</TableHead>
                              <TableHead className="h-7">Nome</TableHead>
                              <TableHead className="h-7">CPF</TableHead>
                              <TableHead className="h-7">Senha</TableHead>
                              <TableHead className="h-7">Saldo na criação</TableHead>
                              <TableHead className="h-7">Validade</TableHead>
                              <TableHead className="h-7">Criado em</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allDocs.slice(0, 200).map((d: any, i) => (
                              <TableRow key={`${d._tipo}-${d.id}-${i}`} className="text-xs">
                                <TableCell><Badge variant="outline" className="text-[10px] h-4 px-1.5">{d._tipo}</Badge></TableCell>
                                <TableCell className="font-medium max-w-[180px] truncate">{d.nome}</TableCell>
                                <TableCell className="font-mono text-[10px]">{formatCpf(d.cpf)}</TableCell>
                                <TableCell className="font-mono text-primary text-xs">{d.senha || '—'}</TableCell>
                                <TableCell className="font-mono">
                                  {d.creditos_no_momento != null ? (
                                    <span className="text-emerald-400">{d.creditos_no_momento}</span>
                                  ) : (
                                    <span className="text-muted-foreground/50">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-[10px]">{d.validade ? new Date(d.validade).toLocaleDateString('pt-BR') : '—'}</TableCell>
                                <TableCell className="text-[10px] text-muted-foreground">{formatDate(d.created_at)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB: Recargas */}
              <TabsContent value="recargas" className="mt-3">
                <Card>
                  <CardContent className="p-3">
                    {details!.recharges.length === 0 ? (
                      <p className="text-center text-muted-foreground text-xs py-8">Nenhuma recarga ou transferência recebida</p>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="text-[10px]">
                                <TableHead className="h-7">Tipo</TableHead>
                                <TableHead className="h-7">De</TableHead>
                                <TableHead className="h-7">Créditos</TableHead>
                                <TableHead className="h-7">Valor unit.</TableHead>
                                <TableHead className="h-7">Total</TableHead>
                                <TableHead className="h-7">Data</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {details!.recharges.map(rc => (
                                <TableRow key={rc.id} className="text-xs">
                                  <TableCell>
                                    <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${rc.transaction_type === 'recharge' ? 'border-emerald-500/30 text-emerald-400' : 'border-blue-500/30 text-blue-400'}`}>
                                      {rc.transaction_type === 'recharge' ? 'Recarga' : 'Transferência'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-[11px]">{rc.from_nome || (rc.from_admin_id === rc.from_admin_id ? '—' : 'Sistema')}</TableCell>
                                  <TableCell className="font-mono font-semibold text-primary">+{rc.amount}</TableCell>
                                  <TableCell className="text-[11px]">{formatCurrency(rc.unit_price)}</TableCell>
                                  <TableCell className="font-semibold">{formatCurrency(rc.total_price)}</TableCell>
                                  <TableCell className="text-[10px] text-muted-foreground">{formatDate(rc.created_at)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="flex justify-end mt-3 pt-3 border-t text-xs">
                          <span className="text-muted-foreground">Total recebido em R$:&nbsp;</span>
                          <span className="font-bold text-emerald-400">{formatCurrency(totalRecargas)}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB: Atividade */}
              <TabsContent value="atividade" className="mt-3">
                <Card>
                  <CardContent className="p-3">
                    {details!.logins.length === 0 ? (
                      <p className="text-center text-muted-foreground text-xs py-8">Nenhum login registrado ainda<br /><span className="text-[10px]">O histórico começa a ser gravado a partir do próximo login</span></p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="text-[10px]">
                              <TableHead className="h-7">Data e hora</TableHead>
                              <TableHead className="h-7">IP</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {details!.logins.map(l => (
                              <TableRow key={l.id} className="text-xs">
                                <TableCell>{formatDate(l.login_at)}</TableCell>
                                <TableCell className="font-mono text-[10px] text-muted-foreground">{l.ip || '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// ===== Componentes auxiliares =====

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: 'primary' | 'emerald' | 'red' | 'purple' | 'blue' | 'amber' }) {
  const colors: Record<string, string> = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
  return (
    <Card className={colors[accent]}>
      <CardContent className="p-2.5 flex items-center gap-2">
        <div className="shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-base font-bold leading-tight">{value}</p>
          <p className="text-[9px] uppercase tracking-wider opacity-80 leading-tight">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterChip({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] h-6 px-2 rounded-md border flex items-center gap-1 transition-colors ${
        active ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-card border-border/50 text-muted-foreground hover:bg-muted/40'
      }`}
    >
      {icon}{children}
    </button>
  );
}
