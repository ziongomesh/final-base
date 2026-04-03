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
  const { admin } = useAuth();
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
    <div className="flex items-center justify-between gap-4">
      {/* Search */}
      <div className="relative flex-1 max-w-xl">
        <div className="flex items-center gap-2 bg-[#1a2332] rounded-full px-4 py-2.5 border border-white/5">
          <Search className="h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Pesquise o que você quer..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            className="bg-transparent text-sm text-white placeholder-white/30 outline-none flex-1"
          />
        </div>

        {focused && filtered.length > 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-[#1a2332] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
            {filtered.map((item) => (
              <button
                key={item.route}
                onClick={() => { navigate(item.route); setQuery(''); }}
                className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-white">{firstName}</p>
          <p className="text-[10px] text-white/40 capitalize">{admin?.rank || 'Revendedor'}</p>
        </div>
        <div className="relative group cursor-pointer">
          {admin?.profile_photo ? (
            <img
              src={admin.profile_photo}
              alt={firstName}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-[#5ba8d4]/40"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#5ba8d4] to-[#4a90b8] flex items-center justify-center ring-2 ring-[#5ba8d4]/30">
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
