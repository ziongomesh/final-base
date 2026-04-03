import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Zap, Wallet, FileText, Users, Calendar } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import OnboardingWizard from '@/components/tutorial/OnboardingWizard';
import MasterOnboardingWizard from '@/components/tutorial/MasterOnboardingWizard';
import DashboardDono from './DashboardDono';
import MasterTeamTabs from '@/components/dashboard/MasterTeamTabs';
import AlertNotification from '@/components/dashboard/AlertNotification';
import NewModuleNotification from '@/components/dashboard/NewModuleNotification';
import LauncherTopBar from '@/components/dashboard/LauncherTopBar';
import StatisticsChart from '@/components/dashboard/StatisticsChart';
import TopServices from '@/components/dashboard/TopServices';
import LastRecords from '@/components/dashboard/LastRecords';

export default function Dashboard() {
  const { admin, role: rawRole, credits, creditsTransf, loading } = useAuth();
  const role = rawRole as string;
  const [totalResellers, setTotalResellers] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMasterOnboarding, setShowMasterOnboarding] = useState(false);
  const [myDocStats, setMyDocStats] = useState<{ today: number; week: number; month: number }>({ today: 0, week: 0, month: 0 });

  useEffect(() => {
    if (admin && !loading) {
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
        const docStats = await api.admins.getMyDocumentStats(admin.id).catch(() => ({ today: 0, week: 0, month: 0 }));
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
      <div className="min-h-screen flex items-center justify-center bg-[#0c1420]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5ba8d4]" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;
  if (role === 'dono' || role === 'sub') return <DashboardDono />;

  const firstName = admin.nome?.split(' ')[0] || 'Usuário';

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

      <div className="space-y-6 animate-fade-in max-w-[1400px]">
        {/* Top Bar */}
        <LauncherTopBar />

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Créditos"
            value={credits.toLocaleString('pt-BR')}
            icon={<Zap className="h-5 w-5" />}
            color="#5ba8d4"
          />
          {role === 'master' && (
            <StatCard
              label="Transferência"
              value={creditsTransf.toLocaleString('pt-BR')}
              icon={<Wallet className="h-5 w-5" />}
              color="#e8a838"
            />
          )}
          <StatCard
            label="Hoje"
            value={String(myDocStats.today)}
            icon={<FileText className="h-5 w-5" />}
            color="#6bc9a0"
          />
          {role === 'master' ? (
            <StatCard
              label="Equipe"
              value={String(totalResellers)}
              icon={<Users className="h-5 w-5" />}
              color="#a078d4"
            />
          ) : (
            <StatCard
              label="Este mês"
              value={String(myDocStats.month)}
              icon={<Calendar className="h-5 w-5" />}
              color="#e06080"
            />
          )}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Statistics Chart */}
          <div className="lg:col-span-2">
            <StatisticsChart adminId={admin.id} docStats={myDocStats} />
          </div>

          {/* Right: Last Records */}
          <div>
            <LastRecords adminId={admin.id} />
          </div>
        </div>

        {/* Services */}
        <TopServices adminId={admin.id} />

        {/* Team (Master) */}
        {role === 'master' && (
          <MasterTeamTabs adminId={admin.id} />
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl bg-[#111a27] border border-white/5 p-4 hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </div>
  );
}
