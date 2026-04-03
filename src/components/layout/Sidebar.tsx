import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
  Home, LogOut, FolderOpen, Wrench, Download, Settings,
  History, Users, Send, CreditCard
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: Array<'dono' | 'sub' | 'master' | 'revendedor'>;
}

const navItems: NavItem[] = [
  { label: 'Início', icon: Home, href: '/dashboard', roles: ['dono', 'sub', 'master', 'revendedor'] },
  { label: 'Serviços', icon: FolderOpen, href: '/servicos', roles: ['dono', 'sub', 'master', 'revendedor'] },
  { label: 'Histórico', icon: History, href: '/historico-servicos', roles: ['dono', 'sub', 'master', 'revendedor'] },
  { label: 'Revendedores', icon: Users, href: '/revendedores', roles: ['master', 'sub'] },
  { label: 'Transferir', icon: Send, href: '/transferir', roles: ['master', 'sub'] },
  { label: 'Recarregar', icon: CreditCard, href: '/recarregar', roles: ['master', 'sub', 'revendedor'] },
  { label: 'Ferramentas', icon: Wrench, href: '/ferramentas', roles: ['dono', 'sub', 'master', 'revendedor'] },
  { label: 'Downloads', icon: Download, href: '/downloads', roles: ['dono', 'sub', 'master', 'revendedor'] },
  { label: 'Configurações', icon: Settings, href: '/configuracoes', roles: ['dono', 'sub', 'master'] },
];

export function Sidebar() {
  const { role, signOut } = useAuth();
  const location = useLocation();

  const filteredItems = navItems.filter(item => 
    role && item.roles.includes(role)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-[68px] bg-[hsl(201,40%,18%)] flex flex-col items-center py-5 z-50">
      {/* Logo */}
      <Link to="/dashboard" className="mb-8 hover:opacity-80 transition-opacity">
        <Logo className="h-8 w-8" />
      </Link>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link to={item.href}>
                  <button
                    className={cn(
                      'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150',
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'text-white/50 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                  </button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Logout */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={signOut}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          Sair
        </TooltipContent>
      </Tooltip>
    </aside>
  );
}
