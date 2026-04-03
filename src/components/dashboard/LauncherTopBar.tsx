import { useState } from 'react';
import { Search, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import defaultAvatar from '@/assets/default-avatar.jpg';

const searchableItems = [
  { label: 'CNH Digital', route: '/servicos/cnh-digital', keywords: ['cnh', 'habilitação', 'carteira'] },
  { label: 'CIN (RG Digital)', route: '/servicos/rg-digital', keywords: ['rg', 'identidade', 'cin'] },
  { label: 'CRLV Digital', route: '/servicos/crlv-digital', keywords: ['crlv', 'veículo', 'licenciamento'] },
  { label: 'CNH Náutica', route: '/servicos/cnh-nautica', keywords: ['nautica', 'arrais', 'marinha'] },
  { label: 'Carteira Estudante', route: '/servicos/carteira-estudante', keywords: ['estudante', 'dne'] },
  { label: 'Atestado Hapvida', route: '/servicos/atestado-hapvida', keywords: ['hapvida', 'atestado'] },
  { label: 'Recarregar', route: '/recarregar', keywords: ['recarga', 'créditos', 'pix'] },
  { label: 'Transferir', route: '/transferir', keywords: ['transferir', 'enviar'] },
  { label: 'Revendedores', route: '/revendedores', keywords: ['revendedor', 'equipe'] },
  { label: 'Ferramentas', route: '/ferramentas', keywords: ['ferramentas', 'editor'] },
  { label: 'Downloads', route: '/downloads', keywords: ['download', 'apk'] },
  { label: 'Histórico', route: '/historico-servicos', keywords: ['histórico', 'serviços'] },
  { label: 'Configurações', route: '/configuracoes', keywords: ['configurações', 'config'] },
];

export default function LauncherTopBar() {
  const { admin, credits } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const filtered = query.length > 0
    ? searchableItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.keywords.some(k => k.includes(query.toLowerCase()))
      )
    : [];

  const firstName = admin?.nome?.split(' ')[0] || 'Usuário';
  const rank = admin?.rank || 'revendedor';

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left: Greeting */}
      <div>
        <h1 className="text-xl font-bold text-white">
          Olá, {firstName}
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'hsl(210 20% 45%)' }}>
          Bem-vindo de volta ao painel
        </p>
      </div>

      {/* Right: Search + Credits + Profile */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <button
            onClick={() => setFocused(!focused)}
            className="h-9 px-4 rounded-xl flex items-center gap-2 transition-colors"
            style={{
              background: 'hsl(215 30% 12%)',
              border: '1px solid hsl(210 40% 18%)',
              color: 'hsl(210 20% 45%)',
            }}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs hidden sm:inline">Pesquisar...</span>
          </button>

          {focused && (
            <div
              className="absolute top-12 right-0 w-80 rounded-xl overflow-hidden z-50"
              style={{
                background: 'hsl(215 30% 10%)',
                border: '1px solid hsl(210 40% 18%)',
                boxShadow: '0 20px 60px hsl(220 40% 4% / 0.6)',
              }}
            >
              <div className="p-3" style={{ borderBottom: '1px solid hsl(210 40% 15%)' }}>
                <input
                  type="text"
                  placeholder="Pesquise o que você quer..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => setTimeout(() => setFocused(false), 200)}
                  autoFocus
                  className="bg-transparent text-sm text-white placeholder-white/25 outline-none w-full"
                />
              </div>
              {filtered.length > 0 && (
                <div className="max-h-60 overflow-y-auto">
                  {filtered.map((item) => (
                    <button
                      key={item.route}
                      onClick={() => { navigate(item.route); setQuery(''); setFocused(false); }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-white/[0.04] transition-colors"
                      style={{ color: 'hsl(210 20% 60%)' }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              {query.length > 0 && filtered.length === 0 && (
                <p className="px-4 py-3 text-xs" style={{ color: 'hsl(210 20% 30%)' }}>Nenhum resultado</p>
              )}
            </div>
          )}
        </div>

        {/* Credits */}
        <div
          className="h-9 px-4 rounded-xl flex items-center gap-2"
          style={{
            background: 'hsl(201 55% 59% / 0.08)',
            border: '1px solid hsl(201 55% 59% / 0.15)',
          }}
        >
          <CreditCard className="h-3.5 w-3.5" style={{ color: 'hsl(201 55% 59%)' }} />
          <span className="text-sm font-semibold" style={{ color: 'hsl(201 55% 59%)' }}>
            {credits.toLocaleString('pt-BR')}
          </span>
        </div>

        {/* Profile */}
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => navigate('/configuracoes')}
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">{firstName}</p>
            <p className="text-[10px] capitalize" style={{ color: 'hsl(210 20% 40%)' }}>{rank}</p>
          </div>
          <img
            src={admin?.profile_photo || defaultAvatar}
            alt={firstName}
            className="h-9 w-9 rounded-full object-cover"
            style={{ border: '2px solid hsl(201 55% 59% / 0.3)' }}
          />
              <span className="text-xs font-bold text-white">{firstName[0]}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
