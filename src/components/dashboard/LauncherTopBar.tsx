import { useState } from 'react';
import { Search, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';


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
    <div className="flex items-center justify-between gap-3 mb-6 flex-wrap sm:flex-nowrap">
      {/* Left: Greeting */}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold text-white tracking-tight truncate">
          Olá, {firstName}
        </h1>
        <p className="text-xs mt-0.5 text-white/40">
          Bem-vindo de volta ao painel
        </p>
      </div>

      {/* Right: Search + Credits */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
        <div className="relative">
          <button
            onClick={() => setFocused(!focused)}
            className="h-9 px-3 sm:px-4 rounded-xl flex items-center gap-2 transition-colors glass-card-flat hover:bg-white/[0.05] text-white/45 hover:text-white"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs hidden sm:inline">Pesquisar...</span>
          </button>

          {focused && (
            <div className="absolute top-12 right-0 w-72 sm:w-80 rounded-xl overflow-hidden z-50 glass-card">
              <div className="p-3 border-b border-white/5">
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
                      className="w-full text-left px-4 py-2.5 text-sm text-white/65 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              {query.length > 0 && filtered.length === 0 && (
                <p className="px-4 py-3 text-xs text-white/30">Nenhum resultado</p>
              )}
            </div>
          )}
        </div>

        {/* Credits */}
        <div className="h-9 px-3 sm:px-4 rounded-xl flex items-center gap-2 bg-sky-400/10 border border-sky-400/20">
          <CreditCard className="h-3.5 w-3.5 text-sky-300" />
          <span className="text-sm font-semibold text-sky-300 tabular-nums">
            {credits.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  );
}

