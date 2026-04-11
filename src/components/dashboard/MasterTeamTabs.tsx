import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, UserX, Bell, Clock, Send, Trash2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Reseller {
  id: number;
  nome: string;
  email: string;
  creditos: number;
  created_at?: string;
  last_active?: string | null;
}

interface MasterTeamTabsProps {
  adminId: number;
}

function getDaysInactive(lastActive: string | null | undefined, createdAt?: string): number {
  const refDate = lastActive || createdAt;
  if (!refDate) return 0;
  const diff = Date.now() - new Date(refDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function MasterTeamTabs({ adminId }: MasterTeamTabsProps) {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResellers();
  }, [adminId]);

  const fetchResellers = async () => {
    try {
      const data = await api.admins.getResellers(adminId);
      setResellers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeResellers = resellers.filter(r => getDaysInactive(r.last_active, r.created_at) < 7);
  const inactiveResellers = resellers.filter(r => getDaysInactive(r.last_active, r.created_at) >= 7);

  const handleSendAlert = async () => {
    if (!selectedUserId) return;
    setSending(true);
    try {
      await api.alerts.send(
        Number(selectedUserId),
        '⚠️ Você está inativo na base. Use com frequência, pois poderá perder acesso.'
      );
      toast.success('Alerta enviado com sucesso!');
      setAlertOpen(false);
      setSelectedUserId('');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar alerta');
    } finally {
      setSending(false);
    }
  };

  const handleSendAlertToAll = async () => {
    if (inactiveResellers.length === 0) return;
    setSending(true);
    try {
      for (const r of inactiveResellers) {
        await api.alerts.send(
          r.id,
          '⚠️ Você está inativo na base. Use com frequência, pois poderá perder acesso.'
        );
      }
      toast.success(`Alerta enviado para ${inactiveResellers.length} inativos!`);
      setAlertOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar alertas');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteReseller = async (id: number) => {
    setDeleting(true);
    try {
      await api.admins.delete(id);
      toast.success('Revendedor excluído');
      setResellers(prev => prev.filter(r => r.id !== id));
      setDeleteConfirm(null);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Users className="h-3 w-3" /> Equipe ({resellers.length})
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => navigate('/criar-revendedor')}
          >
            <UserPlus className="h-3 w-3" /> Novo
          </Button>
          <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                <Bell className="h-3 w-3" /> Alerta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" /> Enviar Alerta
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione um revendedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resellers.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        <span className="flex items-center gap-2">
                          {r.nome}
                          {getDaysInactive(r.last_active, r.created_at) >= 7 && (
                            <Badge variant="destructive" className="text-[8px] px-1 py-0">
                              {getDaysInactive(r.last_active, r.created_at)}d
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={handleSendAlert} disabled={!selectedUserId || sending} className="flex-1 h-9 text-sm gap-1.5">
                    <Send className="h-3.5 w-3.5" /> Enviar
                  </Button>
                  {inactiveResellers.length > 0 && (
                    <Button onClick={handleSendAlertToAll} disabled={sending} variant="destructive" className="h-9 text-sm gap-1.5">
                      <Bell className="h-3.5 w-3.5" /> Todos ({inactiveResellers.length})
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="ativos" className="w-full">
        <TabsList className="w-full h-9 bg-muted/50">
          <TabsTrigger value="ativos" className="flex-1 text-xs gap-1.5 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
            <UserCheck className="h-3 w-3" /> Ativos
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-1">{activeResellers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="inativos" className="flex-1 text-xs gap-1.5 data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400">
            <UserX className="h-3 w-3" /> Inativos
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 ml-1">{inactiveResellers.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ativos" className="mt-3">
          {activeResellers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum revendedor ativo</p>
          ) : (
            <div className="space-y-1.5">
              {activeResellers.map(r => (
                <ResellerRow key={r.id} reseller={r} onDelete={() => setDeleteConfirm(r.id)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inativos" className="mt-3">
          {inactiveResellers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum revendedor inativo</p>
          ) : (
            <div className="space-y-1.5">
              {inactiveResellers
                .sort((a, b) => getDaysInactive(b.last_active, b.created_at) - getDaysInactive(a.last_active, a.created_at))
                .map(r => (
                  <ResellerRow key={r.id} reseller={r} inactive onDelete={() => setDeleteConfirm(r.id)} />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Excluir revendedor?</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Esta ação é irreversível. O revendedor <strong>{resellers.find(r => r.id === deleteConfirm)?.nome}</strong> será removido permanentemente.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" className="flex-1" onClick={() => deleteConfirm && handleDeleteReseller(deleteConfirm)} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResellerRow({ reseller, inactive, onDelete }: { reseller: Reseller; inactive?: boolean; onDelete: () => void }) {
  const days = getDaysInactive(reseller.last_active, reseller.created_at);
  const severityColor = days >= 30 ? 'text-red-500' : days >= 14 ? 'text-amber-500' : days >= 7 ? 'text-yellow-500' : 'text-emerald-400';

  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
      inactive
        ? days >= 30
          ? 'bg-red-500/5 border-red-500/20'
          : 'bg-amber-500/5 border-amber-500/20'
        : 'bg-card border-border/50'
    }`}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{reseller.nome}</p>
        <p className="text-[10px] text-muted-foreground truncate">{reseller.email}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {inactive && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className={`text-[10px] font-bold ${severityColor}`}>{days}d</span>
          </div>
        )}
        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
          {reseller.creditos} cr
        </Badge>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
