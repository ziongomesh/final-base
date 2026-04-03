import { useAuth } from '@/hooks/useAuth';
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
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <Logo className="h-8 w-auto" />
      </div>

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
            <Link key={item.href} to={item.href}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
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
            </Link>
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
