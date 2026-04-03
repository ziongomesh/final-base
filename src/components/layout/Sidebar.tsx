import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
  Home, LogOut, FolderOpen, Wrench, Download, Settings,
  History, Users, Send, CreditCard, Phone, Radio, Box, PhoneOff
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: Array<'dono' | 'sub' | 'master' | 'revendedor'>;
  color?: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Início', icon: Home, href: '/dashboard', roles: ['dono', 'sub', 'master', 'revendedor'] },
  { label: 'Serviços', icon: FolderOpen, href: '/servicos', roles: ['dono', 'sub', 'master', 'revendedor'], color: 'text-purple-400' },
  { label: 'Histórico', icon: History, href: '/historico-servicos', roles: ['dono', 'sub', 'master', 'revendedor'] },
  { label: 'Revendedores', icon: Users, href: '/revendedores', roles: ['master', 'sub'], badge: 2 },
  { label: 'Transferir', icon: Send, href: '/transferir', roles: ['master', 'sub'] },
  { label: 'Recarregar', icon: CreditCard, href: '/recarregar', roles: ['master', 'sub', 'revendedor'] },
  { label: 'Ferramentas', icon: Wrench, href: '/ferramentas', roles: ['dono', 'sub', 'master', 'revendedor'] },
  { label: 'Downloads', icon: Download, href: '/downloads', roles: ['dono', 'sub', 'master', 'revendedor'] },
];

const bottomItems: NavItem[] = [
  { label: 'Configurações', icon: Settings, href: '/configuracoes', roles: ['dono', 'sub', 'master'] },
];

export function Sidebar() {
  const { role, signOut } = useAuth();
  const location = useLocation();

  const filteredItems = navItems.filter(item => 
    role && item.roles.includes(role)
  );

  const filteredBottom = bottomItems.filter(item =>
    role && item.roles.includes(role)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-[60px] flex flex-col items-center py-4 z-50"
      style={{
        background: 'linear-gradient(180deg, #0d0d1a 0%, #1a1028 60%, #1a1028 100%)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Nav icons */}
      <nav className="flex-1 flex flex-col items-center gap-0.5 mt-4">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link to={item.href} className="relative">
                  <div
                    className={cn(
                      'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 relative',
                      isActive
                        ? 'bg-[#5ba8d4]/15 text-[#5ba8d4]'
                        : 'text-white/25 hover:text-white/50 hover:bg-white/[0.04]'
                    )}
                  >
                    <item.icon className={cn("h-[17px] w-[17px]", item.color && !isActive ? item.color : '')} />
                    {item.badge && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-pink-500 text-[9px] font-bold text-white flex items-center justify-center px-1">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs bg-[#1a1a2e] border-white/10 text-white">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom: Settings + Logout */}
      <div className="flex flex-col items-center gap-1 mb-2">
        {filteredBottom.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link to={item.href}>
                  <div
                    className={cn(
                      'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150',
                      isActive
                        ? 'bg-[#5ba8d4]/15 text-[#5ba8d4]'
                        : 'text-white/25 hover:text-white/50 hover:bg-white/[0.04]'
                    )}
                  >
                    <item.icon className="h-[17px] w-[17px]" />
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs bg-[#1a1a2e] border-white/10 text-white">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={signOut}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-[17px] w-[17px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs bg-[#1a1a2e] border-white/10 text-white">
            Sair
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
