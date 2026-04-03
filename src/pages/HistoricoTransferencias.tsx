import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'sonner';
import { 
  ArrowRightLeft, 
  TrendingUp, 
  Target, 
  Users, 
  Wallet,
  Check,
  X,
  Edit2,
  Loader2,
  ArrowDownRight
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Transfer {
  id: number;
  amount: number;
  created_at: string;
  reseller_name: string;
  reseller_email: string;
}

interface MasterMetrics {
  totalTransferred: number;
  totalTransfers: number;
  monthTransferred: number;
  monthTransfers: number;
  totalRecharged: number;
  totalSpent: number;
  monthRecharged: number;
  monthSpent: number;
  monthlyGoal: number;
  totalResellers: number;
  estimatedRevenue: number;
  estimatedProfit: number;
}

export default function HistoricoTransferencias() {
  const { admin, role, loading } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [metrics, setMetrics] = useState<MasterMetrics | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [editingGoal, setEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    if (admin && (role === 'master' || role === 'sub')) {
      fetchData();
    }
  }, [admin?.id, role]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [transfersData, metricsData] = await Promise.all([
        api.credits.getMasterTransfers(admin!.id),
        api.credits.getMasterMetrics(admin!.id),
      ]);
      setTransfers(transfersData || []);
      setMetrics(metricsData);
      setNewGoal((metricsData?.monthlyGoal || 0).toFixed(2).replace('.', ','));
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  const parseLocalizedNumber = (val: string): number => {
    let str = val.trim().replace(/[R$\s]/g, '');
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastComma > lastDot) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleSaveGoal = async () => {
    const value = parseLocalizedNumber(newGoal);
    if (value <= 0) {
      toast.error('Digite um valor válido');
      return;
    }
    try {
      const now = new Date();
      await api.credits.setMasterGoal(admin!.id, now.getFullYear(), now.getMonth() + 1, value);
      setMetrics(prev => prev ? { ...prev, monthlyGoal: value } : null);
      setEditingGoal(false);
      toast.success('Meta atualizada!');
    } catch (error) {
      toast.error('Erro ao salvar meta');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;
  if (role !== 'master' && role !== 'sub') return <Navigate to="/dashboard" replace />;

  const monthProgress = metrics && metrics.monthlyGoal > 0 
    ? Math.min((metrics.monthTransferred / metrics.monthlyGoal) * 100, 100) 
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-foreground">Transferências</h1>
          <p className="text-sm text-muted-foreground">Métricas e histórico</p>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="p-1.5 rounded-md bg-primary/15">
                  <ArrowRightLeft className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transferido</p>
                  <p className="text-base font-bold">{(metrics?.totalTransferred ?? 0).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="p-1.5 rounded-md bg-emerald-500/15">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lucro Est.</p>
                  <p className="text-base font-bold text-emerald-500">{formatCurrency(metrics?.estimatedProfit || 0)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="p-1.5 rounded-md bg-blue-500/15">
                  <Wallet className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recarregado</p>
                  <p className="text-base font-bold">{(metrics?.totalRecharged ?? 0).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="p-1.5 rounded-md bg-purple-500/15">
                  <Users className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revendedores</p>
                  <p className="text-base font-bold">{metrics?.totalResellers ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Meta do Mês - Compact */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Meta do Mês</span>
                  </div>
                  {!editingGoal && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingGoal(true)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {editingGoal ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <Input
                        type="text"
                        placeholder="0,00"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        className="pl-10 h-9"
                      />
                    </div>
                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleSaveGoal}>
                      <Check className="h-4 w-4 text-emerald-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditingGoal(false)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {(metrics?.monthTransferred ?? 0).toLocaleString('pt-BR')} / {formatCurrency(metrics?.monthlyGoal || 0)}
                        </span>
                        <span className="font-medium">{monthProgress.toFixed(0)}%</span>
                      </div>
                      <Progress value={monthProgress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center pt-1">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Mês</p>
                        <p className="text-sm font-bold">{metrics?.monthTransfers ?? 0} ops</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Recarregado</p>
                        <p className="text-sm font-bold">{(metrics?.monthRecharged ?? 0).toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Investido</p>
                        <p className="text-sm font-bold">{formatCurrency(metrics?.monthSpent || 0)}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Histórico */}
            <div>
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                Histórico
              </p>

              {transfers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transferência realizada</p>
              ) : (
                <div className="space-y-1.5">
                  {transfers.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-2.5 px-3 rounded-md bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ArrowDownRight className="h-4 w-4 text-orange-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.reseller_name}</p>
                          <p className="text-[11px] text-muted-foreground">{formatDate(t.created_at)} · {formatTime(t.created_at)}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-orange-500 shrink-0">-{t.amount.toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
