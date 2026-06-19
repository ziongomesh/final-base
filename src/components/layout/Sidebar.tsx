import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useFormGuard } from '@/hooks/useFormGuard';
import { cn } from '@/lib/utils';
import { 
  Home, LogOut, FolderOpen, Wrench, Download, Settings,
  History, Users, Send, CreditCard
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

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

  const [admin, setAdmin] = useState<{ nome?: string } | null>(null);

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
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1.5 rounded-2xl py-3 px-1.5 glass-card">
      {/* Profile initial */}
      {firstName && (
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center mb-1 cursor-pointer transition-transform hover:scale-105"
          title={`${firstName} — ${role}`}
          onClick={() => guardedNavigate('/configuracoes')}
          style={{
            background: 'linear-gradient(135deg, hsl(201 55% 50%), hsl(201 55% 38%))',
            border: '1px solid hsl(201 55% 65% / 0.4)',
          }}
        >
          <span className="text-xs font-semibold text-white">
            {firstName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="w-5 h-px my-0.5 bg-white/10" />

      {/* Nav icons */}
      {filteredItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <button
            key={item.href}
            onClick={() => guardedNavigate(item.href)}
            title={item.label}
            className={cn(
              'h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200',
              isActive
                ? 'bg-sky-400/15 text-sky-300 shadow-[0_0_12px_-2px_hsl(201_55%_59%_/_0.3)]'
                : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
            )}
          >
            <item.icon className="h-4 w-4" />
          </button>
        );
      })}

      {/* Divider */}
      <div className="w-5 h-px my-0.5 bg-white/10" />

      {/* Logout */}
      <button
        onClick={signOut}
        title="Sair"
        className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 text-white/35 hover:text-red-400 hover:bg-red-500/10"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

