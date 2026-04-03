import { useState, useEffect } from 'react';
import { Star, FileText, Anchor, IdCard, Car, Stethoscope, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ServiceItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route: string;
  color: string;
}

const allServices: ServiceItem[] = [
  { id: 'cnh-digital', label: 'CNH Digital', icon: FileText, route: '/servicos/cnh-digital', color: '#5ba8d4' },
  { id: 'rg-digital', label: 'CIN Digital', icon: IdCard, route: '/servicos/rg-digital', color: '#6bc9a0' },
  { id: 'crlv-digital', label: 'CRLV Digital', icon: Car, route: '/servicos/crlv-digital', color: '#e8a838' },
  { id: 'cnh-nautica', label: 'CNH Náutica', icon: Anchor, route: '/servicos/cnh-nautica', color: '#a078d4' },
  { id: 'estudante', label: 'Estudante', icon: GraduationCap, route: '/servicos/carteira-estudante', color: '#e06080' },
  { id: 'hapvida', label: 'Hapvida', icon: Stethoscope, route: '/servicos/atestado-hapvida', color: '#50c878' },
];

function loadFavorites(adminId: number): string[] {
  const stored = localStorage.getItem(`fav_services_${adminId}`);
  if (stored) return JSON.parse(stored);
  return ['cnh-digital']; // default
}

function saveFavorites(adminId: number, favs: string[]) {
  localStorage.setItem(`fav_services_${adminId}`, JSON.stringify(favs));
}

export default function TopServices({ adminId }: { adminId: number }) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites(adminId));

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      saveFavorites(adminId, next);
      return next;
    });
  };

  const sorted = [...allServices].sort((a, b) => {
    const aFav = favorites.includes(a.id) ? 0 : 1;
    const bFav = favorites.includes(b.id) ? 0 : 1;
    return aFav - bFav;
  });

  return (
    <div className="bg-[#111a27] rounded-2xl border border-white/5 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Serviços Rápidos</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sorted.map((svc) => {
          const Icon = svc.icon;
          const isFav = favorites.includes(svc.id);
          return (
            <div
              key={svc.id}
              className="group relative bg-[#1a2332] rounded-xl p-4 hover:bg-[#1e2a3a] transition-all cursor-pointer border border-white/5"
              onClick={() => navigate(svc.route)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleFav(svc.id); }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Star
                  className={`h-3.5 w-3.5 transition-colors ${
                    isFav ? 'fill-[#f5c542] text-[#f5c542]' : 'text-white/20 hover:text-white/40'
                  }`}
                />
              </button>
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${svc.color}15` }}
              >
                <Icon className="h-5 w-5" style={{ color: svc.color }} />
              </div>
              <p className="text-xs font-medium text-white/80">{svc.label}</p>
              {isFav && (
                <Star className="absolute top-2 right-2 h-3 w-3 fill-[#f5c542] text-[#f5c542] group-hover:opacity-0 transition-opacity" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
