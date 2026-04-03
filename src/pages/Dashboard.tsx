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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
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

      <div className="animate-fade-in max-w-[1400px]">
        {/* Top Bar */}
        <LauncherTopBar />

        {/* Main Grid: Left (Statistics) | Right (Services + Records) */}
        <div className="grid lg:grid-cols-[1fr_280px] gap-5 mt-5">
          {/* Left Column */}
          <div className="space-y-5">
            <StatisticsChart adminId={admin.id} docStats={myDocStats} />
          </div>

          {/* Right Column - like the reference sidebar panel */}
          <div className="space-y-6">
            <TopServices adminId={admin.id} />
            <LastRecords adminId={admin.id} />
          </div>
        </div>

        {/* Team (Master) */}
        {role === 'master' && (
          <div className="mt-5">
            <MasterTeamTabs adminId={admin.id} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
