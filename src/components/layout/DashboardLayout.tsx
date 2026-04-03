import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useSessionSecurity } from '@/hooks/useSessionSecurity';
import { useCreditNotifications } from '@/hooks/useCreditNotifications';
import SuggestionButton from '@/components/dashboard/SuggestionButton';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  useSessionSecurity();
  useCreditNotifications();

  return (
    <div className="min-h-screen bg-[#0c1420]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />

      {/* Floating suggestion button */}
      <SuggestionButton />
      
      {/* Main Content */}
      <main className="lg:ml-[68px] p-5 sm:p-6 lg:p-8 pt-20 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
