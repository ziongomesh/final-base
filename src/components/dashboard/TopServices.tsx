import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Car, Anchor, GraduationCap, Stethoscope, Star } from 'lucide-react';

interface ServiceItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route: string;
  color: string;
}

const allServices: ServiceItem[] = [
  { id: 'cnh', label: 'CNH Digital', icon: FileText, route: '/servicos/cnh-digital', color: '#5ba8d4' },
  { id: 'cin', label: 'CIN Digital', icon: FileText, route: '/servicos/rg-digital', color: '#a078d4' },
  { id: 'crlv', label: 'CRLV Digital', icon: Car, route: '/servicos/crlv-digital', color: '#e8a838' },
  { id: 'nautica', label: 'CNH Náutica', icon: Anchor, route: '/servicos/cnh-nautica', color: '#4ecdc4' },
  { id: 'estudante', label: 'Estudante', icon: GraduationCap, route: '/servicos/carteira-estudante', color: '#ff6b9d' },
  { id: 'hapvida', label: 'Hapvida', icon: Stethoscope, route: '/servicos/atestado-hapvida', color: '#45b7d1' },
];

export default function TopServices({ adminId }: { adminId: number }) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<string[]>(['cnh']);

  useEffect(() => {
    const stored = localStorage.getItem(`fav_services_${adminId}`);
    if (stored) setFavorites(JSON.parse(stored));
  }, [adminId]);

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem(`fav_services_${adminId}`, JSON.stringify(updated));
  };

  const favServices = allServices.filter(s => favorites.includes(s.id));
  const otherServices = allServices.filter(s => !favorites.includes(s.id));
  const displayed = [...favServices, ...otherServices].slice(0, 6);

  return (
    <div>
      <h3 className="text-base font-bold text-white mb-4">Top Serviços</h3>
      <div className="grid grid-cols-3 gap-2">
        {displayed.map((service) => {
          const isFav = favorites.includes(service.id);
          return (
            <button
              key={service.id}
              onClick={() => navigate(service.route)}
              className="relative flex flex-col items-center gap-2 bg-[#141420]/60 rounded-xl p-3 border border-white/[0.04] hover:border-white/[0.08] transition-all group"
            >
              <button
                onClick={(e) => toggleFav(service.id, e)}
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Star className={`h-3 w-3 ${isFav ? 'fill-[#5ba8d4] text-[#5ba8d4]' : 'text-white/20'}`} />
              </button>
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${service.color}15` }}
              >
                <service.icon className="h-4 w-4" style={{ color: service.color }} />
              </div>
              <span className="text-[10px] text-white/50 font-medium text-center leading-tight">{service.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
