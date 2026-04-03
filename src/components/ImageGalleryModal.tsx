import { useState, useEffect } from 'react';
import { X, ImageIcon, PenLine, Loader2, Bot, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchGallery, type GalleryItem } from '@/lib/gallery-service';
import { toast } from 'sonner';

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: File) => void;
  type: 'foto' | 'assinatura';
  adminId: number;
  sessionToken: string;
}

export default function ImageGalleryModal({
  isOpen,
  onClose,
  onSelect,
  type,
  adminId,
  sessionToken,
}: ImageGalleryModalProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [loadingImage, setLoadingImage] = useState<string | null>(null);
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchGallery(adminId, sessionToken)
      .then((result) => {
        setItems(type === 'foto' ? result.photos : result.signatures);
      })
      .catch((err) => {
        console.error('Erro ao carregar galeria:', err);
        toast.error('Erro ao carregar acervo de imagens');
      })
      .finally(() => setLoading(false));
  }, [isOpen, adminId, sessionToken, type]);

  if (!isOpen) return null;

  const filtered = (search
    ? items.filter(
        (i) =>
          i.nome.toLowerCase().includes(search.toLowerCase()) ||
          i.cpf.includes(search.replace(/\D/g, ''))
      )
    : items
  ).filter((i) => !brokenUrls.has(i.url));

  const visibleCount = items.filter((i) => !brokenUrls.has(i.url)).length;

  const handleSelect = async (item: GalleryItem) => {
    setLoadingImage(item.url);
    try {
      const response = await fetch(item.url);
      if (!response.ok) throw new Error('Imagem não encontrada');
      const blob = await response.blob();
      if (blob.size < 100) throw new Error('Imagem vazia');
      const ext = item.url.includes('.png') ? 'png' : 'jpg';
      const file = new File([blob], `${type}-acervo.${ext}`, { type: `image/${ext}` });
      onSelect(file);
      onClose();
      toast.success(`${type === 'foto' ? 'Foto' : 'Assinatura'} carregada do acervo!`);
    } catch (err) {
      console.error('Erro ao carregar imagem:', err);
      toast.error('Não foi possível carregar esta imagem. Ela pode ter sido removida.');
    } finally {
      setLoadingImage(null);
    }
  };

  const label = type === 'foto' ? 'Fotos' : 'Assinaturas';
  const Icon = type === 'foto' ? ImageIcon : PenLine;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com bot */}
        <div className="p-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10 shrink-0">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Encontrei <strong>{visibleCount}</strong> {label.toLowerCase()} no seu acervo!
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Você pode reutilizar {type === 'foto' ? 'uma foto' : 'uma assinatura'} de um cliente anterior. Selecione abaixo ou faça upload de uma nova.
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -mt-1">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          {items.length > 5 && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando acervo...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Icon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? 'Nenhum resultado encontrado' : `Nenhuma ${type} encontrada no acervo`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Faça upload normalmente e ela ficará salva automaticamente para reutilização.
              </p>
            </div>
          ) : (
            <div className={`grid gap-3 ${type === 'foto' ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {filtered.map((item, idx) => (
                <button
                  key={`${item.url}-${idx}`}
                  onClick={() => handleSelect(item)}
                  disabled={loadingImage === item.url}
                  className="group relative rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all overflow-hidden bg-background"
                >
                  <div className={`relative ${type === 'foto' ? 'aspect-square' : 'aspect-[2/1]'}`}>
                    {loadingImage === item.url ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.nome}
                        className={`w-full h-full ${type === 'foto' ? 'object-cover' : 'object-contain p-2'}`}
                        loading="lazy"
                        onError={() => {
                          setBrokenUrls(prev => new Set(prev).add(item.url));
                        }}
                      />
                    )}
                  </div>
                  <div className="p-1.5 border-t border-border">
                    <p className="text-[10px] font-medium text-foreground truncate">{item.nome}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground">{item.modulo}</span>
                      <span className="text-[9px] text-muted-foreground">{item.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.**-$4')}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
                      Usar esta
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/30">
          <p className="text-[10px] text-muted-foreground text-center">
            💡 Todas as {label.toLowerCase()} dos módulos CNH, RG, CHA e Estudante aparecem aqui automaticamente
          </p>
        </div>
      </div>
    </div>
  );
}
