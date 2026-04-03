import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, FileText, Users, History, FolderOpen, Send, Wrench, 
  Download, UserPlus, CreditCard, Wallet, ArrowRight, Trophy,
  Shield, Megaphone, Target, Settings2
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

  // Launcher quick actions
  const quickActions = [
    { label: 'Serviços', icon: FolderOpen, href: '/servicos', desc: 'Gerar documentos' },
    { label: 'Histórico', icon: History, href: '/historico-servicos', desc: 'Serviços gerados' },
    ...(role === 'master' ? [
      { label: 'Revendedores', icon: Users, href: '/revendedores', desc: 'Gerenciar equipe' },
      { label: 'Transferir', icon: Send, href: '/transferir', desc: 'Enviar créditos' },
      { label: 'Criar Revendedor', icon: UserPlus, href: '/criar-revendedor', desc: 'Nova conta' },
      { label: 'Métricas', icon: Trophy, href: '/historico-transferencias', desc: 'Histórico & ranking' },
      { label: 'Recarregar', icon: CreditCard, href: '/recarregar', desc: 'Comprar créditos' },
    ] : [
      { label: 'Recarregar', icon: CreditCard, href: '/recarregar', desc: 'Comprar créditos' },
    ]),
  ];

  const goalItems = [
    { label: 'Diária', current: myDocStats.today, target: goals.daily, color: 'text-emerald-400', bg: 'bg-emerald-400' },
    { label: 'Semanal', current: myDocStats.week, target: goals.weekly, color: 'text-blue-400', bg: 'bg-blue-400' },
    { label: 'Mensal', current: myDocStats.month, target: goals.monthly, color: 'text-violet-400', bg: 'bg-violet-400' },
  ];

  return (
    <DashboardLayout>
      {showOnboarding && admin && (
        <OnboardingWizard userName={firstName} adminId={admin.id} onClose={() => setShowOnboarding(false)} />
      )}
      {showMasterOnboarding && admin && (
        <MasterOnboardingWizard userName={firstName} adminId={admin.id} onClose={() => setShowMasterOnboarding(false)} />
      )}

      {/* Alertas de inatividade */}
      <AlertNotification adminId={admin.id} />
      <NewModuleNotification adminId={admin.id} />

      <div className="space-y-6 animate-fade-in max-w-5xl">
        {/* ═══ HEADER ═══ */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Olá, {firstName} 👋
            </h1>
            {admin.last_access ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                Último acesso em {new Date(admin.last_access).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} às {new Date(admin.last_access).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Primeiro acesso — bem-vindo!
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] font-medium border-primary/20 text-primary px-2 py-1">
            <Shield className="h-3 w-3 mr-1" />
            {role === 'master' ? 'Master' : 'Revendedor'}
          </Badge>
        </div>

        {/* ═══ STATS BAR ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Créditos"
            value={credits.toLocaleString('pt-BR')}
            icon={<Zap className="h-3.5 w-3.5" />}
            accent="text-emerald-400"
          />
          {role === 'master' && (
            <StatCard
              label="Transferência"
              value={creditsTransf.toLocaleString('pt-BR')}
              icon={<Wallet className="h-3.5 w-3.5" />}
              accent="text-blue-400"
            />
          )}
          <StatCard
            label="Hoje"
            value={String(myDocStats.today)}
            icon={<FileText className="h-3.5 w-3.5" />}
            accent="text-violet-400"
          />
          {role === 'master' ? (
            <StatCard
              label="Equipe"
              value={String(totalResellers)}
              icon={<Users className="h-3.5 w-3.5" />}
              accent="text-amber-400"
            />
          ) : (
            <StatCard
              label="Mês"
              value={String(myDocStats.month)}
              icon={<Trophy className="h-3.5 w-3.5" />}
              accent="text-amber-400"
            />
          )}
        </div>

        {/* ═══ METAS ═══ */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-3 w-3" /> Metas
            </p>
            <Dialog open={goalsOpen} onOpenChange={(open) => { setGoalsOpen(open); if (open) setEditGoals(goals); }}>
              <DialogTrigger asChild>
                <button className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <Settings2 className="h-3 w-3" /> Alterar
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
          <div className="grid grid-cols-3 gap-3">
            {goalItems.map((g) => {
              const pct = Math.min((g.current / g.target) * 100, 100);
              return (
                <div key={g.label} className="rounded-xl bg-card border border-border/50 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{g.label}</span>
                    <span className={`text-xs font-bold ${g.color}`}>{g.current}/{g.target}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted/30">
                    <div
                      className={`h-full rounded-full ${g.bg} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 text-right">{Math.round(pct)}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ LAUNCHER GRID ═══ */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Atalhos</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.href}
                  onClick={() => navigate(action.href)}
                  className="group flex items-center gap-3 px-3.5 py-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                >
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{action.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{action.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ EQUIPE (MASTER) ═══ */}
        {role === 'master' && (
          <MasterTeamTabs adminId={admin.id} />
        )}

        {/* ═══ COMUNICADOS ═══ */}
        {noticias.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Megaphone className="h-3 w-3" /> Comunicados
            </p>
            <div className="space-y-2">
              {noticias.slice(0, 3).map((n) => (
                <div key={n.id} className="px-4 py-3 rounded-xl bg-card border border-border/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-foreground">{n.titulo}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.informacao}</p>
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
    </DashboardLayout>
  );
}

// Minimal stat card component
function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-xl bg-card border border-border/50 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={accent}>{icon}</span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
