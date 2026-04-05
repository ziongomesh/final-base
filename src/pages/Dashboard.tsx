import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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
import LastRecords from '@/components/dashboard/LastRecords';

export default function Dashboard() {
  const { admin, role: rawRole, credits, creditsTransf, loading, updateAdmin } = useAuth();
  const role = rawRole as string;
  const [totalResellers, setTotalResellers] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMasterOnboarding, setShowMasterOnboarding] = useState(false);
  const [myDocStats, setMyDocStats] = useState<{ today: number; week: number; month: number }>({ today: 0, week: 0, month: 0 });

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
      {!showOnboarding && !showMasterOnboarding && (
        <NewModuleNotification adminId={admin.id} />
      )}

      <div className="animate-fade-in max-w-[1000px] mx-auto">
        <LauncherTopBar />

        <div className="space-y-6">
          <StatisticsChart adminId={admin.id} docStats={myDocStats} />
          <LastRecords adminId={admin.id} sessionToken={admin.session_token} />
        </div>

        {role === 'master' && (
          <div className="mt-6">
            <MasterTeamTabs adminId={admin.id} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
