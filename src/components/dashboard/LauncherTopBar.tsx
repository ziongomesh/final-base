import { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';

const searchableItems = [
  { label: 'CNH Digital', route: '/servicos/cnh-digital', keywords: ['cnh', 'habilitação', 'carteira'] },
  { label: 'CIN (RG Digital)', route: '/servicos/rg-digital', keywords: ['rg', 'identidade', 'cin'] },
  { label: 'CRLV Digital', route: '/servicos/crlv-digital', keywords: ['crlv', 'veículo', 'licenciamento'] },
  { label: 'CNH Náutica', route: '/servicos/cnh-nautica', keywords: ['nautica', 'arrais', 'marinha'] },
  { label: 'Carteira Estudante', route: '/servicos/carteira-estudante', keywords: ['estudante', 'dne', 'carteira'] },
  { label: 'Atestado Hapvida', route: '/servicos/atestado-hapvida', keywords: ['hapvida', 'atestado', 'médico'] },
  { label: 'Recarregar', route: '/recarregar', keywords: ['recarga', 'créditos', 'pix', 'comprar'] },
  { label: 'Transferir', route: '/transferir', keywords: ['transferir', 'enviar', 'créditos'] },
  { label: 'Revendedores', route: '/revendedores', keywords: ['revendedor', 'equipe', 'time'] },
  { label: 'Ferramentas', route: '/ferramentas', keywords: ['ferramentas', 'editor', 'remover'] },
  { label: 'Downloads', route: '/downloads', keywords: ['download', 'apk', 'app'] },
  { label: 'Histórico', route: '/historico-servicos', keywords: ['histórico', 'serviços', 'gerados'] },
  { label: 'Configurações', route: '/configuracoes', keywords: ['configurações', 'config', 'senha'] },
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
  const rank = admin?.rank || 'Revendedor';

  return (
    <div className="flex items-center justify-between h-14 px-2">
      {/* Left: Logo */}
      <div className="flex items-center">
        <Logo className="h-7 w-auto" />
      </div>

      {/* Center: Search + Avatars + Stats */}
      <div className="flex items-center gap-3">
        {/* Search button */}
        <div className="relative">
          <button
            onClick={() => setFocused(true)}
            className="h-9 w-9 rounded-full bg-[#1a1a2e]/80 border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.06] transition-colors"
          >
            <Search className="h-4 w-4 text-white/40" />
          </button>

          {focused && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 bg-[#141422] border border-white/[0.08] rounded-2xl overflow-hidden z-50 shadow-2xl shadow-black/40">
              <div className="p-3 border-b border-white/[0.05]">
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
                      className="w-full text-left px-4 py-3 text-sm text-white/60 hover:bg-white/[0.04] hover:text-white transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              {query.length > 0 && filtered.length === 0 && (
                <p className="px-4 py-3 text-xs text-white/25">Nenhum resultado</p>
              )}
            </div>
          )}
        </div>

        {/* Avatar stack + stats pill */}
        <div className="flex items-center gap-2 bg-[#1a1a2e]/60 rounded-full pl-1.5 pr-4 py-1 border border-white/[0.06]">
          {/* Stacked avatars */}
          <div className="flex -space-x-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-[#0a0a0a] z-[3]" />
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border-2 border-[#0a0a0a] z-[2]" />
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-[#0a0a0a] z-[1]" />
            <div className="h-7 w-7 rounded-full bg-[#5ba8d4]/30 border-2 border-[#0a0a0a] flex items-center justify-center text-[9px] font-bold text-[#5ba8d4] z-[0]">
              +{credits > 99 ? '99' : credits}
            </div>
          </div>
          <span className="text-sm text-white/80 font-semibold">{credits.toLocaleString('pt-BR')}</span>
          <span className="text-[11px] text-white/30">créditos</span>
        </div>

        {/* On work / on break badges */}
        <div className="flex items-center gap-2">
          <div className="bg-[#1a1a2e]/60 rounded-full px-3 py-1.5 border border-white/[0.06] flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <span className="text-xs text-white/60">online</span>
          </div>
        </div>
      </div>

      {/* Right: Profile */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-white leading-tight">{firstName}</p>
          <p className="text-[10px] text-white/35 capitalize">{rank}</p>
        </div>
        <div className="relative group cursor-pointer" onClick={() => navigate('/configuracoes')}>
          {admin?.profile_photo ? (
            <img
              src={admin.profile_photo}
              alt={firstName}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-[#5ba8d4]/30"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#5ba8d4] to-[#4a90b8] flex items-center justify-center ring-2 ring-[#5ba8d4]/20">
              <span className="text-xs font-bold text-white">{firstName[0]}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
