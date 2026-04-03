import { useState } from 'react';
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
  return ['cnh-digital'];
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
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Serviços Rápidos</h2>
      <div className="grid grid-cols-3 gap-4">
        {sorted.map((svc) => {
          const Icon = svc.icon;
          const isFav = favorites.includes(svc.id);
          return (
            <div
              key={svc.id}
              className="group relative bg-[#12121e] rounded-2xl p-5 hover:bg-[#1a1a2e] transition-all cursor-pointer border border-white/5"
              onClick={() => navigate(svc.route)}
            >
              {/* Fav star */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFav(svc.id); }}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Star
                  className={`h-4 w-4 transition-colors ${
                    isFav ? 'fill-[#e8a838] text-[#e8a838]' : 'text-white/20 hover:text-white/40'
                  }`}
                />
              </button>
              {isFav && (
                <Star className="absolute top-3 right-3 h-3.5 w-3.5 fill-[#e8a838] text-[#e8a838] group-hover:opacity-0 transition-opacity" />
              )}

              {/* Avatar circle */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center border-2"
                  style={{ borderColor: `${svc.color}50`, backgroundColor: `${svc.color}15` }}
                >
                  <Icon className="h-4 w-4" style={{ color: svc.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{svc.label}</p>
                </div>
              </div>

              {/* Fake activity dots like the reference */}
              <div className="flex flex-wrap gap-1 mt-2">
                {Array.from({ length: 14 }, (_, i) => {
                  const colors = [svc.color, '#e8a838', '#a078d4', svc.color];
                  return (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: Math.random() > 0.3 ? colors[i % colors.length] : 'rgba(255,255,255,0.08)',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
