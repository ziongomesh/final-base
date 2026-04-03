import { useAuth } from '@/hooks/useAuth';
import { useFormGuard } from '@/hooks/useFormGuard';
import { cn } from '@/lib/utils';
import { 
  Home, LogOut, Menu, FolderOpen, Wrench, Download, Settings, Construction,
  History, Users, Send, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
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

export function MobileNav() {
  const { role, signOut, admin } = useAuth();
  const { guardedNavigate } = useFormGuard();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const filteredItems = navItems.filter(item => 
    role && item.roles.includes(role)
  );

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar-background/95 backdrop-blur-md border-b border-sidebar-border">
      <div className="flex items-center justify-between px-4 py-2.5">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Logo className="h-6 w-6" />
          <span className="text-sm font-semibold text-sidebar-foreground">Data</span>
          <span className="text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
            Beta
          </span>
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-60 p-0 bg-sidebar-background border-sidebar-border">
            <div className="flex flex-col h-full">
              <div className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <Logo className="h-7 w-7" />
                  <span className="text-sm font-semibold text-sidebar-foreground">Data</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                    Beta
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 ml-[38px]">
                  <Construction className="h-3 w-3 text-amber-500/70" />
                  <span className="text-[10px] text-amber-500/70 font-medium">Em construção</span>
                </div>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-0.5">
                {filteredItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => { setOpen(false); guardedNavigate(item.href); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                        isActive
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60'
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="px-3 py-3 border-t border-sidebar-border">
                <p className="text-[10px] text-muted-foreground truncate px-3 mb-1.5">{admin?.email}</p>
                <button
                  onClick={() => { setOpen(false); signOut(); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
