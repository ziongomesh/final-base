import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import OnboardingWizard from '@/components/tutorial/OnboardingWizard';
import MasterOnboardingWizard from '@/components/tutorial/MasterOnboardingWizard';
import DashboardDono from './DashboardDono';
import MasterTeamTabs from '@/components/dashboard/MasterTeamTabs';
import AlertNotification from '@/components/dashboard/AlertNotification';

import LauncherTopBar from '@/components/dashboard/LauncherTopBar';
import StatisticsChart from '@/components/dashboard/StatisticsChart';
import LastRecords from '@/components/dashboard/LastRecords';
import AnnouncementsFeed from '@/components/dashboard/AnnouncementsFeed';
import { Zap } from 'lucide-react';

export default function Dashboard() {
  const { admin, role: rawRole, credits, creditsTransf, loading, updateAdmin } = useAuth();
  const role = rawRole as string;
  const navigate = useNavigate();
  const [totalResellers, setTotalResellers] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMasterOnboarding, setShowMasterOnboarding] = useState(false);
  const [myDocStats, setMyDocStats] = useState<{ today: number; week: number; month: number }>({ today: 0, week: 0, month: 0 });
  const [recargaDobro, setRecargaDobro] = useState(false);

  useEffect(() => {
    if (admin && !loading) {
      if (!admin.tutorial_completed) {
        if (admin.rank === 'revendedor') {
          setShowOnboarding(true);
        } else if (admin.rank === 'master') {
          setShowMasterOnboarding(true);
        }
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

  // Fetch recarga em dobro status
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl && admin) {
      fetch(`${apiUrl}/settings`, {
        headers: { 'x-admin-id': String(admin.id), 'x-session-token': admin.session_token || '' },
      })
        .then(r => r.json())
        .then(s => { if (s?.recarga_em_dobro) setRecargaDobro(true); })
        .catch(() => {});
    }
  }, [admin]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, hsl(220 40% 12%) 0%, transparent 60%),
            linear-gradient(to bottom, hsl(220 25% 6%), hsl(220 20% 4%))
          `,
        }}
      >
        <div className="animate-spin rounded-full h-8 w-8" style={{ borderBottom: '2px solid hsl(201 55% 59%)' }} />
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;
  if (role === 'dono' || role === 'sub') return <DashboardDono />;

  const firstName = admin.nome?.split(' ')[0] || 'Usuário';

  return (
    <DashboardLayout>
      {showOnboarding && admin && (
        <OnboardingWizard userName={firstName} adminId={admin.id} onClose={() => {
          setShowOnboarding(false);
          if (admin) updateAdmin({ ...admin, tutorial_completed: true });
        }} />
      )}
      {showMasterOnboarding && admin && (
        <MasterOnboardingWizard userName={firstName} adminId={admin.id} onClose={() => {
          setShowMasterOnboarding(false);
          if (admin) updateAdmin({ ...admin, tutorial_completed: true });
        }} />
      )}

      <AlertNotification adminId={admin.id} />

      <div className="animate-fade-in max-w-[1000px] mx-auto">
        <LauncherTopBar />

        {/* Banner Recarga em Dobro */}
        {recargaDobro && (
          <button
            onClick={() => navigate('/recarregar')}
            className="w-full mb-4 relative overflow-hidden rounded-xl border border-green-500/30 p-3 cursor-pointer transition-all hover:scale-[1.01] hover:border-green-500/50 group"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 50%, rgba(59,130,246,0.06) 100%)',
            }}
          >
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity" style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.15) 50%, transparent 100%)',
              animation: 'shimmer 2.5s infinite',
            }} />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-500/15 border border-green-500/20">
                  <Zap className="h-5 w-5 text-green-400 animate-pulse" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-green-400 flex items-center gap-2">
                    RECARGA EM DOBRO ATIVA!
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Recarregue agora e ganhe o dobro de créditos.
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                RECARREGAR →
              </div>
            </div>
          </button>
        )}

        {role === 'master' ? (
          <div className="space-y-5">
            <MasterTeamTabs adminId={admin.id} />
            <LastRecords adminId={admin.id} sessionToken={admin.session_token} />
          </div>
        ) : (
          <div className="space-y-6">
            <AnnouncementsFeed />
            <StatisticsChart adminId={admin.id} docStats={myDocStats} />
            <LastRecords adminId={admin.id} sessionToken={admin.session_token} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </DashboardLayout>
  );
}