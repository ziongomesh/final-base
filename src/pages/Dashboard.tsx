import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  Zap, FileText, Users, History, FolderOpen, Send, Wrench, 
  Download, UserPlus, CreditCard, Wallet, ArrowRight, Trophy,
  Shield, Megaphone, Target, Settings2, TrendingUp, Calendar
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import OnboardingWizard from '@/components/tutorial/OnboardingWizard';
import MasterOnboardingWizard from '@/components/tutorial/MasterOnboardingWizard';
import DashboardDono from './DashboardDono';
import MasterTeamTabs from '@/components/dashboard/MasterTeamTabs';
import AlertNotification from '@/components/dashboard/AlertNotification';
import NewModuleNotification from '@/components/dashboard/NewModuleNotification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Noticia {
  id: number;
  titulo: string;
  informacao: string;
  data_post: string;
}

interface Goals {
  daily: number;
  weekly: number;
  monthly: number;
}

const DEFAULT_GOALS: Goals = { daily: 3, weekly: 10, monthly: 30 };

function loadGoals(adminId: number): Goals {
  const stored = localStorage.getItem(`goals_${adminId}`);
  if (stored) return JSON.parse(stored);
  return DEFAULT_GOALS;
}

function saveGoals(adminId: number, goals: Goals) {
  localStorage.setItem(`goals_${adminId}`, JSON.stringify(goals));
}

export default function Dashboard() {
  const { admin, role: rawRole, credits, creditsTransf, loading } = useAuth();
  const role = rawRole as string;
  const navigate = useNavigate();
  const [totalResellers, setTotalResellers] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMasterOnboarding, setShowMasterOnboarding] = useState(false);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [myDocStats, setMyDocStats] = useState<{ today: number; week: number; month: number }>({ today: 0, week: 0, month: 0 });
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [editGoals, setEditGoals] = useState<Goals>(DEFAULT_GOALS);
  const [goalsOpen, setGoalsOpen] = useState(false);

  useEffect(() => {
    if (admin && !loading) {
      setGoals(loadGoals(admin.id));
      if (admin.rank === 'revendedor') {
        const tutorialKey = `tutorial_completed_${admin.id}`;
        if (!localStorage.getItem(tutorialKey)) setShowOnboarding(true);
      } else if (admin.rank === 'master') {
        const masterKey = `master_tutorial_completed_${admin.id}`;
        if (!localStorage.getItem(masterKey)) setShowMasterOnboarding(true);
      }
    }
  }, [admin, loading]);

  useEffect(() => {
    const fetchData = async () => {
      if (!admin) return;
      try {
        const [news, docStats] = await Promise.all([
          api.noticias.list().catch(() => []),
          api.admins.getMyDocumentStats(admin.id).catch(() => ({ today: 0, week: 0, month: 0 })),
        ]);
        setNoticias(news);
        setMyDocStats(docStats);
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, [admin]);

  useEffect(() => {
    const fetchResellers = async () => {
      if (!admin || (role !== 'master' && role !== 'sub')) return;
      try {
        const resellers = await api.admins.getResellers(admin.id);
        if (resellers) setTotalResellers(resellers.length);
      } catch (e) { console.error(e); }
    };
    fetchResellers();
  }, [admin, role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;
  if (role === 'dono' || role === 'sub') return <DashboardDono />;

  const firstName = admin.nome?.split(' ')[0] || 'Usuário';

  const handleSaveGoals = () => {
    saveGoals(admin.id, editGoals);
    setGoals(editGoals);
    setGoalsOpen(false);
    toast.success('Metas atualizadas!');
  };

  const quickActions = [
    { label: 'Serviços', icon: FolderOpen, href: '/servicos', desc: 'Gerar documentos' },
    { label: 'Histórico', icon: History, href: '/historico-servicos', desc: 'Serviços gerados' },
    ...(role === 'master' ? [
      { label: 'Revendedores', icon: Users, href: '/revendedores', desc: 'Gerenciar equipe' },
      { label: 'Transferir', icon: Send, href: '/transferir', desc: 'Enviar créditos' },
      { label: 'Criar Revendedor', icon: UserPlus, href: '/criar-revendedor', desc: 'Nova conta' },
      { label: 'Recarregar', icon: CreditCard, href: '/recarregar', desc: 'Comprar créditos' },
    ] : [
      { label: 'Recarregar', icon: CreditCard, href: '/recarregar', desc: 'Comprar créditos' },
    ]),
  ];

  const goalItems = [
    { label: 'Diária', current: myDocStats.today, target: goals.daily, color: 'text-primary', bg: 'bg-primary' },
    { label: 'Semanal', current: myDocStats.week, target: goals.weekly, color: 'text-primary', bg: 'bg-primary/70' },
    { label: 'Mensal', current: myDocStats.month, target: goals.monthly, color: 'text-primary', bg: 'bg-primary/50' },
  ];

  return (
    <DashboardLayout>
      {showOnboarding && admin && (
        <OnboardingWizard userName={firstName} adminId={admin.id} onClose={() => setShowOnboarding(false)} />
      )}
      {showMasterOnboarding && admin && (
        <MasterOnboardingWizard userName={firstName} adminId={admin.id} onClose={() => setShowMasterOnboarding(false)} />
      )}

      <AlertNotification adminId={admin.id} />
      <NewModuleNotification adminId={admin.id} />

      <div className="space-y-8 animate-fade-in max-w-6xl">
        {/* ═══ HEADER ═══ */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {role === 'master' ? 'Painel Master' : 'Painel Revendedor'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">{admin.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{firstName[0]}</span>
            </div>
          </div>
        </div>

        {/* ═══ STATS CARDS ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Créditos"
            value={credits.toLocaleString('pt-BR')}
            icon={<Zap className="h-5 w-5" />}
            trend="+0"
          />
          {role === 'master' && (
            <StatCard
              label="Transferência"
              value={creditsTransf.toLocaleString('pt-BR')}
              icon={<Wallet className="h-5 w-5" />}
              trend="+0"
            />
          )}
          <StatCard
            label="Hoje"
            value={String(myDocStats.today)}
            icon={<FileText className="h-5 w-5" />}
            trend={`+${myDocStats.today}`}
          />
          {role === 'master' ? (
            <StatCard
              label="Equipe"
              value={String(totalResellers)}
              icon={<Users className="h-5 w-5" />}
            />
          ) : (
            <StatCard
              label="Este mês"
              value={String(myDocStats.month)}
              icon={<Calendar className="h-5 w-5" />}
              trend={`+${myDocStats.month}`}
            />
          )}
        </div>

        {/* ═══ MAIN GRID ═══ */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Goals + Shortcuts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Goals */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Metas</h2>
                </div>
                <Dialog open={goalsOpen} onOpenChange={(open) => { setGoalsOpen(open); if (open) setEditGoals(goals); }}>
                  <DialogTrigger asChild>
                    <button className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                      <Settings2 className="h-3.5 w-3.5" /> Alterar
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xs">
                    <DialogHeader>
                      <DialogTitle className="text-base">Alterar Metas</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Meta Diária</label>
                        <Input type="number" min={1} value={editGoals.daily} onChange={(e) => setEditGoals(g => ({ ...g, daily: Number(e.target.value) || 1 }))} className="h-9" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Meta Semanal</label>
                        <Input type="number" min={1} value={editGoals.weekly} onChange={(e) => setEditGoals(g => ({ ...g, weekly: Number(e.target.value) || 1 }))} className="h-9" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Meta Mensal</label>
                        <Input type="number" min={1} value={editGoals.monthly} onChange={(e) => setEditGoals(g => ({ ...g, monthly: Number(e.target.value) || 1 }))} className="h-9" />
                      </div>
                      <Button onClick={handleSaveGoals} className="w-full h-9 text-sm">Salvar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {goalItems.map((g) => {
                  const pct = Math.min((g.current / g.target) * 100, 100);
                  return (
                    <div key={g.label} className="text-center">
                      <div className="relative mx-auto w-16 h-16 mb-2">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                          <circle
                            cx="32" cy="32" r="28" fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${pct * 1.76} 176`}
                            className="transition-all duration-700"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground">{g.label}</p>
                      <p className="text-[10px] text-muted-foreground">{g.current}/{g.target}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shortcuts */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Atalhos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.href}
                      onClick={() => navigate(action.href)}
                      className="group flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-sm transition-all text-left"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{action.label}</p>
                        <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Activity */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Atividade
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Hoje</span>
                  <span className="text-sm font-bold text-foreground">{myDocStats.today} docs</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min((myDocStats.today / Math.max(goals.daily, 1)) * 100, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Semana</span>
                  <span className="text-sm font-bold text-foreground">{myDocStats.week} docs</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/70 transition-all duration-500" style={{ width: `${Math.min((myDocStats.week / Math.max(goals.weekly, 1)) * 100, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Mês</span>
                  <span className="text-sm font-bold text-foreground">{myDocStats.month} docs</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/50 transition-all duration-500" style={{ width: `${Math.min((myDocStats.month / Math.max(goals.monthly, 1)) * 100, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* News */}
            {noticias.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" />
                  Comunicados
                </h2>
                <div className="space-y-3">
                  {noticias.slice(0, 3).map((n) => (
                    <div key={n.id} className="pb-3 border-b border-border last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-medium text-foreground">{n.titulo}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.informacao}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(n.data_post).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ EQUIPE (MASTER) ═══ */}
        {role === 'master' && (
          <MasterTeamTabs adminId={admin.id} />
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, icon, trend }: { label: string; value: string; icon: React.ReactNode; trend?: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <span className="text-primary">{icon}</span>
        </div>
        {trend && (
          <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
