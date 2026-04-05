import { useState, useEffect, useCallback } from 'react';
import { isUsingMySQL } from '@/lib/db-config';

function resolveUploadUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  if (url.startsWith('/uploads/') && isUsingMySQL()) {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined;
    let base = '';
    if (envUrl) {
      base = envUrl.replace(/\/+$/, '').replace(/\/api$/, '');
    } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      base = window.location.origin;
    } else {
      base = 'http://localhost:4000';
    }
    return `${base}${url}`;
  }
  return url;
}

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { cnhService } from '@/lib/cnh-service';
import { rgService, type RgRecord } from '@/lib/rg-service';
import { estudanteService, type EstudanteRecord } from '@/lib/estudante-service';
import { nauticaService, type NauticaRecord } from '@/lib/cnh-nautica-service';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  History, Search, IdCard, Eye, Edit, Loader2, Clock, FileText, ChevronDown, ChevronUp, Trash2, AlertTriangle, CreditCard, RefreshCw, Timer, GraduationCap, Copy, Check, Anchor, FileDown, User
} from 'lucide-react';
import CnhEditView from '@/components/cnh/CnhEditView';
import RgEditView from '@/components/rg/RgEditView';
import EstudanteEditView from '@/components/estudante/EstudanteEditView';
import ChaEditView from '@/components/cha/ChaEditView';
import { generateChaPdf, downloadPdfBlob } from '@/lib/cha-pdf-generator';

interface UsuarioRecord {
  id: number;
  cpf: string;
  nome: string;
  categoria: string | null;
  uf: string | null;
  data_emissao: string | null;
  data_validade: string | null;
  created_at: string | null;
  data_expiracao: string | null;
  pdf_url: string | null;
  cnh_frente_url: string | null;
  cnh_meio_url: string | null;
  cnh_verso_url: string | null;
  foto_url: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  nacionalidade: string | null;
  doc_identidade: string | null;
  numero_registro: string | null;
  hab: string | null;
  pai: string | null;
  mae: string | null;
  local_emissao: string | null;
  estado_extenso: string | null;
  espelho: string | null;
  codigo_seguranca: string | null;
  renach: string | null;
  obs: string | null;
  matriz_final: string | null;
  cnh_definitiva: string | null;
  senha: string | null;
  admin_id: number;
}

function daysUntilExpiration(dataExpiracao: string | null): number | null {
  if (!dataExpiracao) return null;
  const exp = new Date(dataExpiracao);
  const now = new Date();
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function ExpirationBadge({ dataExpiracao }: { dataExpiracao: string | null }) {
  const days = daysUntilExpiration(dataExpiracao);
  if (days === null) return null;

  if (days <= 0) {
    return (
      <Badge variant="destructive" className="text-[10px] gap-1">
        <Timer className="h-3 w-3" /> Expirado
      </Badge>
    );
  }
  if (days <= 5) {
    return (
      <Badge className="text-[10px] gap-1 bg-orange-500 text-white border-orange-500">
        <Timer className="h-3 w-3" /> {days}d restante{days > 1 ? 's' : ''}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
      <Clock className="h-3 w-3" /> Expira {new Date(dataExpiracao).toLocaleDateString('pt-BR')}
    </Badge>
  );
}

export default function HistoricoServicos() {
  const { admin, loading, refreshCredits, role } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioRecord[]>([]);
  const [rgRegistros, setRgRegistros] = useState<RgRecord[]>([]);
  const [estudanteRegistros, setEstudanteRegistros] = useState<EstudanteRecord[]>([]);
  const [nauticaRegistros, setNauticaRegistros] = useState<NauticaRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioRecord | null>(null);
  const [editingRg, setEditingRg] = useState<RgRecord | null>(null);
  const [editingEstudante, setEditingEstudante] = useState<EstudanteRecord | null>(null);
  const [editingNautica, setEditingNautica] = useState<NauticaRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [expiringOpen, setExpiringOpen] = useState(false);
  const [historyView, setHistoryView] = useState<'mine' | 'base'>('mine');
  const isAdminView = role === 'dono' || role === 'sub';

  const handleDeleteCnh = async (usuarioId: number) => {
    if (!admin) return;
    setDeletingId(usuarioId);
    try {
      await cnhService.delete(admin.id, admin.session_token, usuarioId);
      toast.success('Acesso excluído com sucesso');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteRg = async (rgId: number) => {
    if (!admin) return;
    setDeletingId(rgId);
    try {
      await rgService.delete(admin.id, admin.session_token, rgId);
      toast.success('RG excluído com sucesso');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteEstudante = async (estudanteId: number) => {
    if (!admin) return;
    setDeletingId(estudanteId);
    try {
      await estudanteService.delete(admin.id, admin.session_token, estudanteId);
      toast.success('Carteira de Estudante excluída com sucesso');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteNautica = async (nauticaId: number) => {
    if (!admin) return;
    setDeletingId(nauticaId);
    try {
      await nauticaService.delete(admin.id, admin.session_token, nauticaId);
      toast.success('CNH Náutica excluída com sucesso');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRenewCnh = async (recordId: number) => {
    if (!admin) return;
    const key = `cnh-${recordId}`;
    setRenewingId(key);
    try {
      await cnhService.renew(admin.id, admin.session_token, recordId);
      toast.success('CNH renovada! +45 dias de validade');
      await refreshCredits();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao renovar');
    } finally {
      setRenewingId(null);
    }
  };

  const handleRenewRg = async (recordId: number) => {
    if (!admin) return;
    const key = `rg-${recordId}`;
    setRenewingId(key);
    try {
      await rgService.renew(admin.id, admin.session_token, recordId);
      toast.success('RG renovado! +45 dias de validade');
      await refreshCredits();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao renovar');
    } finally {
      setRenewingId(null);
    }
  };

  const handleRenewEstudante = async (recordId: number) => {
    if (!admin) return;
    const key = `estudante-${recordId}`;
    setRenewingId(key);
    try {
      await estudanteService.renew(admin.id, admin.session_token, recordId);
      toast.success('Carteira renovada! +45 dias de validade');
      await refreshCredits();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao renovar');
    } finally {
      setRenewingId(null);
    }
  };

  const handleRenewNautica = async (recordId: number) => {
    if (!admin) return;
    const key = `nautica-${recordId}`;
    setRenewingId(key);
    try {
      await nauticaService.renew(admin.id, admin.session_token, recordId);
      toast.success('CNH Náutica renovada! +45 dias de validade');
      await refreshCredits();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao renovar');
    } finally {
      setRenewingId(null);
    }
  };

  const fetchData = async () => {
    if (!admin) return;
    setLoadingData(true);
    try {
      const [cnhData, rgData, estudanteData, nauticaData] = await Promise.all([
        cnhService.list(admin.id, admin.session_token),
        rgService.list(admin.id, admin.session_token),
        estudanteService.list(admin.id, admin.session_token),
        nauticaService.list(admin.id, admin.session_token),
      ]);
      setUsuarios(cnhData?.usuarios || []);
      setRgRegistros(rgData?.registros || []);
      setEstudanteRegistros(estudanteData?.registros || []);
      setNauticaRegistros(nauticaData?.registros || []);
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [admin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;

  if (editingUsuario) {
    return (
      <DashboardLayout>
        <CnhEditView
          usuario={editingUsuario}
          onClose={() => setEditingUsuario(null)}
          onSaved={() => {
            setEditingUsuario(null);
            fetchData();
            toast.success('CNH atualizada com sucesso!');
          }}
        />
      </DashboardLayout>
    );
  }

  if (editingRg) {
    return (
      <DashboardLayout>
        <RgEditView
          registro={editingRg}
          onClose={() => setEditingRg(null)}
          onSaved={() => {
            setEditingRg(null);
            fetchData();
            toast.success('RG atualizado com sucesso!');
          }}
        />
      </DashboardLayout>
    );
  }

  if (editingEstudante) {
    return (
      <DashboardLayout>
        <EstudanteEditView
          registro={editingEstudante}
          onClose={() => setEditingEstudante(null)}
          onSaved={() => {
            setEditingEstudante(null);
            fetchData();
            toast.success('Carteira de Estudante atualizada!');
          }}
        />
      </DashboardLayout>
    );
  }

  if (editingNautica) {
    return (
      <DashboardLayout>
        <ChaEditView
          registro={editingNautica}
          onClose={() => setEditingNautica(null)}
          onSaved={() => {
            setEditingNautica(null);
            fetchData();
            toast.success('CHA Náutica atualizada com sucesso!');
          }}
        />
      </DashboardLayout>
    );
  }

  const applyViewFilter = <T extends { admin_id?: number }>(records: T[]): T[] => {
    if (!isAdminView) return records;
    if (historyView === 'mine') return records.filter(r => (r as any).admin_id === admin?.id);
    return records.filter(r => (r as any).admin_id !== admin?.id);
  };

  const filteredUsuarios = applyViewFilter(usuarios.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (u.nome || '').toLowerCase().includes(q) || (u.cpf || '').includes(q);
  }));

  const filteredRgs = applyViewFilter(rgRegistros.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nome = r.nome_completo || r.nome || '';
    return nome.toLowerCase().includes(q) || (r.cpf || '').includes(q);
  }));

  const filteredEstudantes = applyViewFilter(estudanteRegistros.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (e.nome || '').toLowerCase().includes(q) || (e.cpf || '').includes(q);
  }));

  const filteredNauticas = applyViewFilter(nauticaRegistros.filter(n => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (n.nome || '').toLowerCase().includes(q) || (n.cpf || '').includes(q);
  }));

  const totalRecords = filteredUsuarios.length + filteredRgs.length + filteredEstudantes.length + filteredNauticas.length;

  const hasSearch = searchQuery.trim().length > 0;

  // Records expiring within 5 days
  const expiringCnhs = usuarios.filter(u => {
    const days = daysUntilExpiration(u.data_expiracao);
    return days !== null && days >= 0 && days <= 5;
  });
  const expiringRgs = rgRegistros.filter(r => {
    const days = daysUntilExpiration(r.data_expiracao);
    return days !== null && days >= 0 && days <= 5;
  });
  const expiringEstudantes = estudanteRegistros.filter(e => {
    const days = daysUntilExpiration(e.data_expiracao || null);
    return days !== null && days >= 0 && days <= 5;
  });
  const expiringNauticas = nauticaRegistros.filter(n => {
    const days = daysUntilExpiration(n.expires_at);
    return days !== null && days >= 0 && days <= 5;
  });
  const totalExpiring = expiringCnhs.length + expiringRgs.length + expiringEstudantes.length + expiringNauticas.length;

  // Last created across all types
  const allRecords = [
    ...filteredUsuarios.map(u => ({ type: 'cnh' as const, data: u, created: u.created_at })),
    ...filteredRgs.map(r => ({ type: 'rg' as const, data: r, created: r.created_at })),
    ...filteredEstudantes.map(e => ({ type: 'estudante' as const, data: e, created: e.created_at })),
    ...filteredNauticas.map(n => ({ type: 'nautica' as const, data: n, created: n.created_at })),
  ].sort((a, b) => {
    const da = a.created ? new Date(a.created).getTime() : 0;
    const db = b.created ? new Date(b.created).getTime() : 0;
    return db - da;
  });

  const lastCreated = allRecords.length > 0 ? allRecords[0] : null;

  const formatCpf = (cpf: string | null | undefined) => {
    if (!cpf) return '—';
    const c = cpf.replace(/\D/g, '');
    return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatDateStr = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 sm:h-6 sm:w-6" /> Histórico de Serviços
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie seus serviços criados</p>
          </div>
          <Badge variant="outline" className="text-sm">
            {totalRecords} registro{totalRecords !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Toggle for Dono/Sub */}
        {isAdminView && (
          <Tabs value={historyView} onValueChange={(v) => setHistoryView(v as 'mine' | 'base')} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="mine">Seu Histórico</TabsTrigger>
              <TabsTrigger value="base">Histórico da Base</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando histórico...</span>
          </div>
        ) : totalRecords === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum serviço encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Serviços próximos a expirar */}
            {totalExpiring > 0 && (
              <Card className="border-orange-500/40 bg-orange-500/5">
                <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpiringOpen(!expiringOpen)}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Serviços Próximos a Expirar ({totalExpiring})
                    </CardTitle>
                    {expiringOpen ? <ChevronUp className="h-4 w-4 text-orange-500" /> : <ChevronDown className="h-4 w-4 text-orange-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground">Estes serviços expiram em 5 dias ou menos. Renove por 1 crédito para +45 dias.</p>
                </CardHeader>
                {expiringOpen && (
                <CardContent className="space-y-3">
                  {expiringCnhs.map(u => (
                    <CnhHistoryCard
                      key={`exp-cnh-${u.id}`}
                      usuario={u}
                      formatCpf={formatCpf}
                      formatDate={formatDateStr}
                      onEdit={() => setEditingUsuario(u)}
                      onDelete={() => handleDeleteCnh(u.id)}
                      onRenew={() => handleRenewCnh(u.id)}
                      renewingId={renewingId}
                      highlight
                      showExpiring
                    />
                  ))}
                  {expiringRgs.map(r => (
                    <RgHistoryCard
                      key={`exp-rg-${r.id}`}
                      registro={r}
                      formatCpf={formatCpf}
                      formatDate={formatDateStr}
                      onEdit={() => setEditingRg(r)}
                      onDelete={() => handleDeleteRg(r.id)}
                      onRenew={() => handleRenewRg(r.id)}
                      renewingId={renewingId}
                      highlight
                      showExpiring
                    />
                  ))}
                  {expiringEstudantes.map(e => (
                    <EstudanteHistoryCard
                      key={`exp-est-${e.id}`}
                      registro={e}
                      formatCpf={formatCpf}
                      formatDate={formatDateStr}
                      onEdit={() => setEditingEstudante(e)}
                      onDelete={() => handleDeleteEstudante(e.id)}
                      onRenew={() => handleRenewEstudante(e.id)}
                      renewingId={renewingId}
                      highlight
                    />
                  ))}
                </CardContent>
                )}
              </Card>
            )}

            {/* Último serviço criado */}
            {lastCreated && (
              <div className="border border-primary/20 rounded-md bg-primary/5 p-3">
                <p className="text-xs text-primary flex items-center gap-1.5 mb-2">
                  <Clock className="h-3 w-3" /> Último: {lastCreated.type === 'cnh' ? 'CNH' : lastCreated.type === 'rg' ? 'RG' : lastCreated.type === 'nautica' ? 'Arrais Náutica' : 'Estudante'}
                </p>
                <div>
                  {lastCreated.type === 'cnh' ? (
                    <CnhHistoryCard
                      usuario={lastCreated.data as UsuarioRecord}
                      formatCpf={formatCpf}
                      formatDate={formatDateStr}
                      onEdit={() => setEditingUsuario(lastCreated.data as UsuarioRecord)}
                      onDelete={() => handleDeleteCnh((lastCreated.data as UsuarioRecord).id)}
                      onRenew={() => handleRenewCnh((lastCreated.data as UsuarioRecord).id)}
                      renewingId={renewingId}
                      highlight
                    />
                  ) : lastCreated.type === 'rg' ? (
                    <RgHistoryCard
                      registro={lastCreated.data as RgRecord}
                      formatCpf={formatCpf}
                      formatDate={formatDateStr}
                      onEdit={() => setEditingRg(lastCreated.data as RgRecord)}
                      onDelete={() => handleDeleteRg((lastCreated.data as RgRecord).id)}
                      onRenew={() => handleRenewRg((lastCreated.data as RgRecord).id)}
                      renewingId={renewingId}
                      highlight
                    />
                  ) : lastCreated.type === 'nautica' ? (
                    <NauticaHistoryCard
                      registro={lastCreated.data as NauticaRecord}
                      formatCpf={formatCpf}
                      formatDate={formatDateStr}
                      onEdit={() => setEditingNautica(lastCreated.data as NauticaRecord)}
                      onDelete={() => handleDeleteNautica((lastCreated.data as NauticaRecord).id)}
                      onRenew={() => handleRenewNautica((lastCreated.data as NauticaRecord).id)}
                      renewingId={renewingId}
                      highlight
                    />
                  ) : (
                    <EstudanteHistoryCard
                      registro={lastCreated.data as EstudanteRecord}
                      formatCpf={formatCpf}
                      formatDate={formatDateStr}
                      onEdit={() => setEditingEstudante(lastCreated.data as EstudanteRecord)}
                      onDelete={() => handleDeleteEstudante((lastCreated.data as EstudanteRecord).id)}
                      onRenew={() => handleRenewEstudante((lastCreated.data as EstudanteRecord).id)}
                      renewingId={renewingId}
                      highlight
                    />
                  )}
                </div>
              </div>
            )}

            {/* Módulo CNH */}
            {filteredUsuarios.length > 0 && (
              <Card>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedModule(expandedModule === 'cnh' ? null : 'cnh')}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <i className="fa-solid fa-id-card text-base text-primary" />
                      </div>
                      <div>
                        <span className="text-base">CNH Digital</span>
                        <p className="text-sm text-muted-foreground font-normal">{filteredUsuarios.length} registro{filteredUsuarios.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {(expandedModule === 'cnh' || (hasSearch && filteredUsuarios.length > 0)) ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>
                {(expandedModule === 'cnh' || (hasSearch && filteredUsuarios.length > 0)) && (
                  <CardContent className="space-y-3 pt-0">
                    {filteredUsuarios.map((u) => (
                      <CnhHistoryCard
                        key={u.id}
                        usuario={u}
                        formatCpf={formatCpf}
                        formatDate={formatDateStr}
                        onEdit={() => setEditingUsuario(u)}
                        onDelete={() => handleDeleteCnh(u.id)}
                        onRenew={() => handleRenewCnh(u.id)}
                        renewingId={renewingId}
                      />
                    ))}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Módulo RG */}
            {filteredRgs.length > 0 && (
              <Card>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedModule(expandedModule === 'rg' ? null : 'rg')}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <i className="fa-solid fa-user text-base text-blue-500" />
                      </div>
                      <div>
                        <span className="text-base">RG Digital</span>
                        <p className="text-sm text-muted-foreground font-normal">{filteredRgs.length} registro{filteredRgs.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {(expandedModule === 'rg' || (hasSearch && filteredRgs.length > 0)) ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>
                {(expandedModule === 'rg' || (hasSearch && filteredRgs.length > 0)) && (
                  <CardContent className="space-y-3 pt-0">
                    {filteredRgs.map((r) => (
                      <RgHistoryCard
                        key={r.id}
                        registro={r}
                        formatCpf={formatCpf}
                        formatDate={formatDateStr}
                        onEdit={() => setEditingRg(r)}
                        onDelete={() => handleDeleteRg(r.id)}
                        onRenew={() => handleRenewRg(r.id)}
                        renewingId={renewingId}
                      />
                    ))}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Módulo CNH Náutica / Arrais */}
            {filteredNauticas.length > 0 && (
              <Card>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedModule(expandedModule === 'nautica' ? null : 'nautica')}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Anchor className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-base">Arrais Náutica</span>
                        <p className="text-sm text-muted-foreground font-normal">{filteredNauticas.length} registro{filteredNauticas.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {(expandedModule === 'nautica' || (hasSearch && filteredNauticas.length > 0)) ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>
                {(expandedModule === 'nautica' || (hasSearch && filteredNauticas.length > 0)) && (
                  <CardContent className="space-y-3 pt-0">
                    {filteredNauticas.map((n) => (
                      <NauticaHistoryCard
                        key={n.id}
                        registro={n}
                        formatCpf={formatCpf}
                        formatDate={formatDateStr}
                        onEdit={() => setEditingNautica(n)}
                        onDelete={() => handleDeleteNautica(n.id)}
                        onRenew={() => handleRenewNautica(n.id)}
                        renewingId={renewingId}
                      />
                    ))}
                  </CardContent>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// ======== Copy Data Button (shared) ========
function CopyDataButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Dados copiados!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="border-primary/50 text-primary hover:bg-primary/10">
      {copied ? <Check className="h-4 w-4 sm:mr-1" /> : <Copy className="h-4 w-4 sm:mr-1" />}
      <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar Dados'}</span>
    </Button>
  );
}

function buildCnhCopyText(u: UsuarioRecord, formatCpf: (cpf: string) => string) {
  return `CNH Digital ✅\n\n👤 CPF: ${formatCpf(u.cpf)}\n🔑 Senha: ${u.senha || '—'}\n\n📅 Validade: 45 dias\n⚠️ Mantenha suas credenciais seguras`;
}

function buildRgCopyText(r: RgRecord, formatCpf: (cpf: string) => string) {
  return `RG Digital ✅\n\n👤 CPF: ${formatCpf(r.cpf)}\n🔑 Senha: ${r.senha || '—'}\n\n📅 Validade: 45 dias\n⚠️ Mantenha suas credenciais seguras`;
}

function buildEstudanteCopyText(e: EstudanteRecord, formatCpf: (cpf: string) => string) {
  return `Carteira de Estudante ✅\n\n👤 CPF: ${formatCpf(e.cpf)}\n🔑 Senha: ${e.senha || '—'}\n\n📅 Validade: 45 dias\n⚠️ Mantenha suas credenciais seguras`;
}

function buildNauticaCopyText(n: NauticaRecord, formatCpf: (cpf: string) => string) {
  return `CHA Náutica ✅\n\n👤 CPF: ${formatCpf(n.cpf)}\n🔑 Senha: ${n.senha || '—'}\n\n📅 Validade: 45 dias\n⚠️ Mantenha suas credenciais seguras`;
}

// ======== Renew Button (shared) ========
function RenewButton({ id, type, onRenew, renewingId }: { id: number; type: 'cnh' | 'rg' | 'estudante' | 'nautica'; onRenew: () => void; renewingId: string | null }) {
  const key = `${type}-${id}`;
  const isRenewing = renewingId === key;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-orange-500/50 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700" disabled={isRenewing}>
          {isRenewing ? <Loader2 className="h-4 w-4 animate-spin sm:mr-1" /> : <RefreshCw className="h-4 w-4 sm:mr-1" />}
          <span className="hidden sm:inline">Renovar</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-orange-500" />
            Renovar serviço
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Deseja renovar este serviço por mais <strong>45 dias</strong>?</p>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-md p-3 text-sm text-orange-700 dark:text-orange-400">
              <strong>💳 Custo:</strong> 1 crédito será descontado do seu saldo.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onRenew} className="bg-orange-500 text-white hover:bg-orange-600">
            Renovar por 1 crédito
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ======== CNH Card ========
function CnhHistoryCard({
  usuario, formatCpf, formatDate, onEdit, onDelete, onRenew, renewingId, highlight, showExpiring,
}: {
  usuario: UsuarioRecord;
  formatCpf: (cpf: string) => string;
  formatDate: (d: string | null) => string;
  onEdit: () => void;
  onDelete: () => void;
  onRenew: () => void;
  renewingId: string | null;
  highlight?: boolean;
  showExpiring?: boolean;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const preventDrag = (e: React.DragEvent) => e.preventDefault();
  const preventContext = (e: React.MouseEvent) => e.preventDefault();
  const imgProps = {
    draggable: false,
    onDragStart: preventDrag,
    onContextMenu: preventContext,
    style: { userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties,
  };

  return (
    <>
      <div className={`border rounded-lg p-4 ${highlight ? 'border-primary/30' : 'border-border'} hover:bg-muted/20 transition-colors`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border bg-muted flex items-center justify-center shrink-0 relative overflow-hidden">
              {usuario.foto_url ? (
                <img src={resolveUploadUrl(usuario.foto_url)} alt="" className="absolute inset-0 h-full w-full object-cover cursor-pointer" onClick={() => setShowPreview(!showPreview)} {...imgProps} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : usuario.cnh_frente_url ? (
                <img src={resolveUploadUrl(usuario.cnh_frente_url)} alt="" className="absolute inset-0 h-full w-full object-cover cursor-pointer" onClick={() => setShowPreview(!showPreview)} {...imgProps} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : null}
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{usuario.nome}</h3>
                <ExpirationBadge dataExpiracao={usuario.data_expiracao} />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">CPF: {formatCpf(usuario.cpf)}</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-muted-foreground">
                <span>Cat: {usuario.categoria || '—'}</span>
                <span>UF: {usuario.uf || '—'}</span>
                {usuario.senha && <span>Senha: {usuario.senha}</span>}
                <span>Criado: {formatDate(usuario.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
            <CopyDataButton text={buildCnhCopyText(usuario, formatCpf)} />
            <RenewButton id={usuario.id} type="cnh" onRenew={onRenew} renewingId={renewingId} />
            {usuario.pdf_url && (
              <Button variant="outline" size="sm" asChild>
              <a href={`${resolveUploadUrl(usuario.pdf_url)}?t=${Date.now()}`} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">PDF</span>
                </a>
              </Button>
            )}
            <Button variant="default" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Editar</span>
            </Button>
            <DeleteButton nome={usuario.nome} onDelete={onDelete} />
          </div>
        </div>

        {showPreview && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
            {usuario.cnh_frente_url && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Frente</p>
                <img src={resolveUploadUrl(usuario.cnh_frente_url)} alt="Frente" className="w-full rounded border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setExpandedImage(resolveUploadUrl(usuario.cnh_frente_url) || null)} {...imgProps} />
              </div>
            )}
            {usuario.cnh_meio_url && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Meio</p>
                <img src={resolveUploadUrl(usuario.cnh_meio_url)} alt="Meio" className="w-full rounded border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setExpandedImage(resolveUploadUrl(usuario.cnh_meio_url) || null)} {...imgProps} />
              </div>
            )}
            {usuario.cnh_verso_url && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Verso</p>
                <img src={resolveUploadUrl(usuario.cnh_verso_url)} alt="Verso" className="w-full rounded border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setExpandedImage(resolveUploadUrl(usuario.cnh_verso_url) || null)} {...imgProps} />
              </div>
            )}
          </div>
        )}
      </div>

      {expandedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer" onClick={() => setExpandedImage(null)} onContextMenu={preventContext}>
          <img src={resolveUploadUrl(expandedImage)} alt="Preview" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} {...imgProps} />
        </div>
      )}
    </>
  );
}

// ======== RG Card ========
function RgHistoryCard({
  registro, formatCpf, formatDate, onEdit, onDelete, onRenew, renewingId, highlight, showExpiring,
}: {
  registro: RgRecord;
  formatCpf: (cpf: string) => string;
  formatDate: (d: string | null) => string;
  onEdit: () => void;
  onDelete: () => void;
  onRenew: () => void;
  renewingId: string | null;
  highlight?: boolean;
  showExpiring?: boolean;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const preventDrag = (e: React.DragEvent) => e.preventDefault();
  const preventContext = (e: React.MouseEvent) => e.preventDefault();
  const imgProps = {
    draggable: false,
    onDragStart: preventDrag,
    onContextMenu: preventContext,
    style: { userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties,
  };

  const nome = registro.nome_completo || registro.nome || '';

  return (
    <>
      <div className={`border rounded-lg p-4 ${highlight ? 'border-primary/30' : 'border-border'} hover:bg-muted/20 transition-colors`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border bg-muted flex items-center justify-center shrink-0 relative overflow-hidden">
              {registro.foto_url ? (
                <img src={resolveUploadUrl(registro.foto_url)} alt="" className="absolute inset-0 h-full w-full object-cover cursor-pointer" onClick={() => setShowPreview(!showPreview)} {...imgProps} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : registro.rg_frente_url ? (
                <img src={resolveUploadUrl(registro.rg_frente_url)} alt="" className="absolute inset-0 h-full w-full object-cover cursor-pointer" onClick={() => setShowPreview(!showPreview)} {...imgProps} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : null}
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{nome}</h3>
                <ExpirationBadge dataExpiracao={registro.data_expiracao} />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">CPF: {formatCpf(registro.cpf)}</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-muted-foreground">
                <span>UF: {registro.uf || '—'}</span>
                {registro.senha && <span>Senha: {registro.senha}</span>}
                <span>Criado: {formatDate(registro.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
            <CopyDataButton text={buildRgCopyText(registro, formatCpf)} />
            <RenewButton id={registro.id} type="rg" onRenew={onRenew} renewingId={renewingId} />
            {registro.pdf_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={`${resolveUploadUrl(registro.pdf_url)}?t=${Date.now()}`} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">PDF</span>
                </a>
              </Button>
            )}
            <Button variant="default" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Editar</span>
            </Button>
            <DeleteButton nome={nome} onDelete={onDelete} />
          </div>
        </div>

        {showPreview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
            {registro.rg_frente_url && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Frente</p>
                <img src={resolveUploadUrl(registro.rg_frente_url)} alt="Frente" className="w-full rounded border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setExpandedImage(resolveUploadUrl(registro.rg_frente_url) || null)} {...imgProps} />
              </div>
            )}
            {registro.rg_verso_url && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Verso</p>
                <img src={resolveUploadUrl(registro.rg_verso_url)} alt="Verso" className="w-full rounded border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setExpandedImage(resolveUploadUrl(registro.rg_verso_url) || null)} {...imgProps} />
              </div>
            )}
          </div>
        )}
      </div>

      {expandedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer" onClick={() => setExpandedImage(null)} onContextMenu={preventContext}>
          <img src={resolveUploadUrl(expandedImage)} alt="Preview" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} {...imgProps} />
        </div>
      )}
    </>
  );
}

// ======== Delete Button (shared) ========
function DeleteButton({ nome, onDelete }: { nome: string; onDelete: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Excluir</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Excluir acesso
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Tem certeza que deseja excluir o acesso de <strong>{nome}</strong>?</p>
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive">
              <strong>⚠️ Atenção:</strong> Esta ação é irreversível. O crédito utilizado <strong>não será devolvido</strong> e todos os arquivos serão permanentemente apagados.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ======== Estudante Card ========
function EstudanteHistoryCard({
  registro, formatCpf, formatDate, onEdit, onDelete, onRenew, renewingId, highlight,
}: {
  registro: EstudanteRecord;
  formatCpf: (cpf: string) => string;
  formatDate: (d: string | null) => string;
  onEdit: () => void;
  onDelete: () => void;
  onRenew: () => void;
  renewingId: string | null;
  highlight?: boolean;
}) {
  return (
    <div className={`border rounded-lg p-4 ${highlight ? 'border-primary/30' : 'border-border'} hover:bg-muted/20 transition-colors`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border bg-muted flex items-center justify-center shrink-0 relative overflow-hidden">
            {registro.perfil_imagem && (
              <img src={resolveUploadUrl(registro.perfil_imagem)} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            )}
            <User className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{registro.nome}</h3>
              <Badge variant="outline" className="text-[10px]">
                <GraduationCap className="h-3 w-3 mr-1" /> Estudante
              </Badge>
              <ExpirationBadge dataExpiracao={registro.data_expiracao || null} />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">CPF: {formatCpf(registro.cpf)}</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-muted-foreground">
              <span>Faculdade: {registro.faculdade || '—'}</span>
              <span>Curso: {registro.graduacao || '—'}</span>
              {registro.senha && <span>Senha: {registro.senha}</span>}
              <span>Criado: {formatDate(registro.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
          <CopyDataButton text={buildEstudanteCopyText(registro, formatCpf)} />
          <RenewButton id={registro.id} type="estudante" onRenew={onRenew} renewingId={renewingId} />
          <Button variant="default" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Editar</span>
          </Button>
          <DeleteButton nome={registro.nome} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}

// ======== Nautica Card ========
function NauticaHistoryCard({
  registro, formatCpf, formatDate, onEdit, onDelete, onRenew, renewingId, highlight,
}: {
  registro: NauticaRecord;
  formatCpf: (cpf: string) => string;
  formatDate: (d: string | null) => string;
  onEdit: () => void;
  onDelete: () => void;
  onRenew: () => void;
  renewingId: string | null;
  highlight?: boolean;
}) {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      const cleanCpf = registro.cpf.replace(/\D/g, '');
      let matrizFrenteUrl = '';
      let matrizVersoUrl = '';
      if (registro.foto) {
        const baseUrl = registro.foto.substring(0, registro.foto.lastIndexOf('/') + 1);
        matrizFrenteUrl = `${baseUrl}${cleanCpf}matrizcha.png`;
        matrizVersoUrl = `${baseUrl}${cleanCpf}matrizcha2.png`;
      }
      const qrcodeUrl = registro.qrcode || '';

      const pdfBytes = await generateChaPdf(
        '/images/cha-pdf-base.png',
        matrizFrenteUrl,
        matrizVersoUrl,
        qrcodeUrl,
      );
      downloadPdfBlob(pdfBytes, `CHA_${cleanCpf}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${highlight ? 'border-primary/30' : 'border-border'} hover:bg-muted/20 transition-colors`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border bg-muted flex items-center justify-center shrink-0 relative overflow-hidden">
            {registro.foto && (
              <img src={resolveUploadUrl(registro.foto)} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            )}
            <User className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{registro.nome}</h3>
              <Badge variant="outline" className="text-[10px]">
                <Anchor className="h-3 w-3 mr-1" /> Náutica
              </Badge>
              <ExpirationBadge dataExpiracao={registro.expires_at} />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">CPF: {formatCpf(registro.cpf)}</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-muted-foreground">
              <span>Cat: {registro.categoria || '—'}</span>
              <span>Inscrição: {registro.numero_inscricao || '—'}</span>
              {registro.senha && <span>Senha: {registro.senha}</span>}
              <span>Criado: {formatDate(registro.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
          <CopyDataButton text={buildNauticaCopyText(registro, formatCpf)} />
          <RenewButton id={registro.id} type="nautica" onRenew={onRenew} renewingId={renewingId} />
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={generatingPdf}>
            {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4 sm:mr-1" />}
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button variant="default" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Editar</span>
          </Button>
          <DeleteButton nome={registro.nome} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}
