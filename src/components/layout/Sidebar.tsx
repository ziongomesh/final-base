import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useFormGuard } from '@/hooks/useFormGuard';
import { cn } from '@/lib/utils';
import { 
  Home, LogOut, FolderOpen, Wrench, Download, Settings,
  History, Users, Send, CreditCard
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
      className="fixed left-0 top-0 h-screen w-[220px] flex flex-col z-50"
      style={{
        background: `
          linear-gradient(180deg, 
            hsl(210 30% 7%) 0%, 
            hsl(215 35% 9%) 50%,
            hsl(210 30% 7%) 100%
          )
        `,
        borderRight: '1px solid hsl(210 40% 15% / 0.5)',
      }}
    >
      {/* Logo + Beta */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-2">
        <Logo className="h-8 w-auto" />
        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
          Beta
        </span>
      </div>

      {/* Profile Card */}
      {firstName && (
        <div className="mx-4 mb-4 rounded-xl p-3 flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, hsl(210 30% 12%) 0%, hsl(215 35% 15%) 100%)',
            border: '1px solid hsl(210 40% 18% / 0.6)',
            boxShadow: '0 2px 8px hsl(210 30% 5% / 0.4)',
          }}
        >
          <div
            className="h-10 w-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
            style={{
              background: admin?.profile_photo ? 'transparent' : 'linear-gradient(135deg, hsl(201 55% 45%), hsl(201 55% 35%))',
              border: '2px solid hsl(201 55% 59% / 0.3)',
              boxShadow: '0 0 12px hsl(201 55% 59% / 0.15)',
            }}
          >
            {admin?.profile_photo ? (
              <img src={admin.profile_photo} alt={firstName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold" style={{ color: 'hsl(201 55% 85%)' }}>
                {firstName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground truncate">{firstName}</p>
            <p className="text-[10px] font-medium capitalize" style={{ color: 'hsl(201 55% 59%)' }}>{role}</p>
          </div>
        </div>
      )}

      {/* Section label */}
      <div className="px-6 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1" style={{ background: 'hsl(201 55% 59% / 0.15)' }} />
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: 'hsl(201 55% 59%)' }}>
            Área do Cliente
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <div
              key={item.href}
              onClick={() => guardedNavigate(item.href)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer',
                isActive
                  ? 'font-medium'
                  : 'hover:bg-white/[0.03]'
              )}
              style={isActive ? {
                background: 'hsl(201 55% 59% / 0.08)',
                color: 'hsl(201 55% 59%)',
              } : {
                color: 'hsl(210 20% 50%)',
              }}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: 'hsl(201 55% 59%)' }} />
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="px-3 pb-4 pt-2">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
          style={{ color: 'hsl(210 20% 35%)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'hsl(0 60% 60%)'; e.currentTarget.style.background = 'hsl(0 60% 60% / 0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'hsl(210 20% 35%)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
