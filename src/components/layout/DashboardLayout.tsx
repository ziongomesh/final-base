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
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, hsl(220 40% 12%) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 50%, hsl(230 30% 10%) 0%, transparent 50%),
          linear-gradient(to bottom, hsl(220 25% 6%), hsl(220 20% 4%))
        `,
      }}
    >
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />

      {/* Floating suggestion button */}
      <SuggestionButton />
      
      {/* Main Content */}
      <main className="lg:ml-[72px] p-4 sm:p-5 lg:p-6 pt-20 lg:pt-4 flex-1">
        {children}
      </main>

      {/* Footer */}
      <div className="lg:ml-[64px]">
        <DashboardFooter />
      </div>
    </div>
  );
}
