import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
  Home, LogOut, FolderOpen, Wrench, Download, Settings, Construction,
  History, Users, Send, CreditCard
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: Array<'dono' | 'sub' | 'master' | 'revendedor'>;
}

const navItems: NavItem[] = [
  { label: 'Início', icon: Home, href: '/dashboard', roles: ['dono', 'sub', 'master', 'revendedor'] },
  { label: 'Serviços', icon: FolderOpen, href: '/servicos', roles: ['dono', 'sub', 'master', 'revendedor'] },
  
  { label: 'Revendedores', icon: Users, href: '/revendedores', roles: ['master', 'sub'] },
  { label: 'Transferir', icon: Send, href: '/transferir', roles: ['master', 'sub'] },
  { label: 'Recarregar', icon: CreditCard, href: '/recarregar', roles: ['master', 'sub', 'revendedor'] },
  { label: 'Ferramentas', icon: Wrench, href: '/ferramentas', roles: ['dono', 'sub', 'master', 'revendedor'] },
  { label: 'Downloads', icon: Download, href: '/downloads', roles: ['dono', 'sub', 'master', 'revendedor'] },
  { label: 'Configurações', icon: Settings, href: '/configuracoes', roles: ['dono', 'sub', 'master'] },
];

export function Sidebar() {
  const { role, signOut, admin } = useAuth();
  const location = useLocation();

  const filteredItems = navItems.filter(item => 
    role && item.roles.includes(role)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-sidebar-background border-r border-sidebar-border flex flex-col">
      {/* Logo + BETA */}
      <div className="p-4 pb-2">
        <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Logo className="h-7 w-7 shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-sidebar-foreground">Data</span>
            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
              Beta
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-1.5 mt-2 ml-[38px]">
          <Construction className="h-3 w-3 text-amber-500/70" />
          <span className="text-[10px] text-amber-500/70 font-medium">Em construção</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.href} to={item.href}>
              <button
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60'
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                {item.label}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground truncate px-3 mb-1.5">{admin?.email}</p>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
