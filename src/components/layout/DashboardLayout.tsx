import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useSessionSecurity } from '@/hooks/useSessionSecurity';
import { useCreditNotifications } from '@/hooks/useCreditNotifications';
import SuggestionButton from '@/components/dashboard/SuggestionButton';
import DashboardFooter from '@/components/dashboard/DashboardFooter';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  useSessionSecurity();
  useCreditNotifications();

  return (
    <div className="min-h-screen bg-[#0a0f16] flex flex-col">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />

      {/* Floating suggestion button */}
      <SuggestionButton />
      
      {/* Main Content */}
      <main className="lg:ml-[220px] p-4 sm:p-5 lg:p-6 pt-20 lg:pt-4 flex-1">
        {children}
      </main>

      {/* Footer */}
      <div className="lg:ml-[220px]">
        <DashboardFooter />
      </div>
    </div>
  );
}
