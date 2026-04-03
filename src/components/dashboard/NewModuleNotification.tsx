import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Car, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  adminId: number;
}

const STORAGE_KEY = 'new_modules_seen_v2_';

export default function NewModuleNotification({ adminId }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const key = STORAGE_KEY + adminId;
    if (!localStorage.getItem(key)) {
      // Small delay so dashboard renders first
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [adminId]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY + adminId, '1');
    setOpen(false);
  };

  const handleGoTo = (path: string) => {
    localStorage.setItem(STORAGE_KEY + adminId, '1');
    setOpen(false);
    navigate(path);
  };

  const modules = [
    {
      icon: <Car className="h-6 w-6 text-white" />,
      label: 'CRLV DIGITAL',
      title: 'CRLV Digital',
      description: 'Gere documentos de licenciamento veicular completos — CRLV com QR Code, dados do proprietário e do veículo.',
      path: '/servicos/crlv-digital',
      gradient: 'from-purple-600 to-indigo-600',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-md p-0 gap-0 border-0 overflow-hidden bg-[#1a1a2e] text-white">
        {/* Top accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

        <div className="p-6 space-y-5">
          {/* Badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs font-semibold text-purple-300 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Novidades
            </span>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold">{modules.length} Novo{modules.length > 1 ? 's' : ''} Módulo{modules.length > 1 ? 's' : ''}</h2>
            <p className="text-sm text-gray-400">Conheça as novas ferramentas disponíveis na plataforma</p>
          </div>

          {/* Module cards */}
          <div className="space-y-3">
            {modules.map((mod) => (
              <button
                key={mod.path}
                onClick={() => handleGoTo(mod.path)}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group"
              >
                {/* Icon box */}
                <div className={`shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-lg shadow-purple-500/20`}>
                  {mod.icon}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold group-hover:text-purple-300 transition-colors">{mod.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{mod.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* CTA button */}
          <Button
            onClick={handleDismiss}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 text-white font-semibold text-sm border-0 shadow-lg shadow-purple-500/25"
          >
            Entendi!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
