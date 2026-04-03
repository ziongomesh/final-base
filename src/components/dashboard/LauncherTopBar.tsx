import { useState } from 'react';
import { Search, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

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

  return (
    <div className="flex items-center justify-between gap-6">
      {/* Left spacer (for sidebar alignment) */}
      <div className="flex-1" />

      {/* Center: Search + Credits badge */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <button
            onClick={() => setFocused(true)}
            className="h-10 w-10 rounded-full bg-[#1a1a2e] border border-white/10 flex items-center justify-center hover:border-white/20 transition-colors"
          >
            <Search className="h-4 w-4 text-white/50" />
          </button>

          {focused && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl">
              <div className="p-3 border-b border-white/5">
                <input
                  type="text"
                  placeholder="Pesquise o que você quer..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => setTimeout(() => setFocused(false), 200)}
                  autoFocus
                  className="bg-transparent text-sm text-white placeholder-white/30 outline-none w-full"
                />
              </div>
              {filtered.length > 0 && (
                <div className="max-h-60 overflow-y-auto">
                  {filtered.map((item) => (
                    <button
                      key={item.route}
                      onClick={() => { navigate(item.route); setQuery(''); setFocused(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
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

        {/* Credits badge (like the avatar group in reference) */}
        <div className="flex items-center gap-2 bg-[#1a1a2e] rounded-full px-4 py-2 border border-white/10">
          <div className="flex -space-x-1">
            <div className="h-6 w-6 rounded-full bg-[#5ba8d4]/30 border border-[#5ba8d4]/50" />
            <div className="h-6 w-6 rounded-full bg-[#a078d4]/30 border border-[#a078d4]/50" />
            <div className="h-6 w-6 rounded-full bg-[#e8a838]/30 border border-[#e8a838]/50 flex items-center justify-center">
              <span className="text-[8px] text-white/70">+</span>
            </div>
          </div>
          <span className="text-sm text-white/80 font-medium">{credits.toLocaleString('pt-BR')}</span>
          <span className="text-xs text-white/40">créditos</span>
        </div>
      </div>

      {/* Right: Profile */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-white leading-tight">{firstName}</p>
          <p className="text-[11px] text-white/40 capitalize">{admin?.rank || 'Revendedor'}</p>
        </div>
        <div className="relative group cursor-pointer" onClick={() => navigate('/configuracoes')}>
          {admin?.profile_photo ? (
            <img
              src={admin.profile_photo}
              alt={firstName}
              className="h-11 w-11 rounded-full object-cover ring-2 ring-[#5ba8d4]/40"
            />
          ) : (
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#5ba8d4] to-[#4a90b8] flex items-center justify-center ring-2 ring-[#5ba8d4]/30">
              <span className="text-sm font-bold text-white">{firstName[0]}</span>
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#5ba8d4] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-2.5 w-2.5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
