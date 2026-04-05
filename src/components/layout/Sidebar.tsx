import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useFormGuard } from '@/hooks/useFormGuard';
import { cn } from '@/lib/utils';
import { 
  Home, LogOut, FolderOpen, Wrench, Download, Settings,
  History, Users, Send, CreditCard, ChevronRight
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
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
  const { guardedNavigate } = useFormGuard();
  const location = useLocation();

  const [expanded, setExpanded] = useState(false);
  const [admin, setAdmin] = useState<{ nome?: string; profile_photo?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin');
      if (stored) setAdmin(JSON.parse(stored));
    } catch {}
  }, []);

  const firstName = admin?.nome?.split(' ')[0] || '';

  const filteredItems = navItems.filter(item => 
    role && item.roles.includes(role)
  );

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 ease-in-out"
      style={{
        width: expanded ? '220px' : '64px',
        background: `linear-gradient(180deg, hsl(210 30% 7%) 0%, hsl(215 35% 9%) 50%, hsl(210 30% 7%) 100%)`,
        borderRight: '1px solid hsl(210 40% 15% / 0.5)',
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className={cn("pt-5 pb-3 flex items-center transition-all duration-300", expanded ? "px-5 gap-2" : "px-0 justify-center")}>
        <Logo className="h-7 w-auto shrink-0" />
        <span className={cn(
          "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all duration-300 whitespace-nowrap",
          expanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden px-0"
        )}>
          Beta
        </span>
      </div>

      {/* Profile */}
      {firstName && (
        <div className={cn(
          "mx-2 mb-3 rounded-xl flex items-center transition-all duration-300",
          expanded ? "p-2.5 gap-3" : "p-1.5 justify-center"
        )}
          style={{
            background: 'linear-gradient(135deg, hsl(210 30% 12%) 0%, hsl(215 35% 15%) 100%)',
            border: '1px solid hsl(210 40% 18% / 0.6)',
          }}
        >
          <div
            className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(201 55% 45%), hsl(201 55% 35%))',
              border: '2px solid hsl(201 55% 59% / 0.3)',
            }}
          >
            <span className="text-xs font-bold" style={{ color: 'hsl(201 55% 85%)' }}>
              {firstName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className={cn("min-w-0 flex-1 transition-all duration-300", expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden")}>
            <p className="text-[12px] font-semibold text-foreground truncate">{firstName}</p>
            <p className="text-[10px] font-medium capitalize" style={{ color: 'hsl(201 55% 59%)' }}>{role}</p>
          </div>
        </div>
      )}

      {/* Section label */}
      <div className={cn("pb-2 transition-all duration-300", expanded ? "px-5" : "px-2")}>
        <div className="flex items-center gap-2">
          <div className="h-px flex-1" style={{ background: 'hsl(201 55% 59% / 0.15)' }} />
          <span className={cn(
            "text-[9px] font-semibold tracking-[0.15em] uppercase whitespace-nowrap transition-all duration-300",
            expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )} style={{ color: 'hsl(201 55% 59%)' }}>
            Área do Cliente
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 overflow-y-auto overflow-x-hidden">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <div
              key={item.href}
              onClick={() => guardedNavigate(item.href)}
              title={!expanded ? item.label : undefined}
              className={cn(
                'flex items-center rounded-lg text-sm transition-all duration-200 cursor-pointer whitespace-nowrap',
                expanded ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5',
                isActive ? 'font-medium' : 'hover:bg-white/[0.03]'
              )}
              style={isActive ? {
                background: 'hsl(201 55% 59% / 0.08)',
                color: 'hsl(201 55% 59%)',
              } : {
                color: 'hsl(210 20% 50%)',
              }}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className={cn("flex-1 transition-all duration-300", expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden")}>{item.label}</span>
              {isActive && expanded && (
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: 'hsl(201 55% 59%)' }} />
              )}
            </div>
          );
        })}
      </nav>

      {/* Expand indicator (collapsed only) */}
      {!expanded && (
        <div className="flex justify-center py-2">
          <ChevronRight className="h-3 w-3 animate-pulse" style={{ color: 'hsl(210 20% 35%)' }} />
        </div>
      )}

      {/* Logout */}
      <div className="px-2 pb-4 pt-2">
        <button
          onClick={signOut}
          title={!expanded ? 'Sair' : undefined}
          className={cn(
            "w-full flex items-center rounded-lg text-sm transition-colors",
            expanded ? "gap-3 px-3 py-2.5" : "justify-center py-2.5"
          )}
          style={{ color: 'hsl(210 20% 35%)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'hsl(0 60% 60%)'; e.currentTarget.style.background = 'hsl(0 60% 60% / 0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'hsl(210 20% 35%)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={cn("transition-all duration-300", expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden")}>Sair</span>
        </button>
      </div>
    </aside>
  );
}
