import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, FileText, Trash2, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';

type PageSize = 'A4' | 'LETTER' | 'FIT';
type Orient = 'portrait' | 'landscape';

interface Item {
  id: string;
  file: File;
  url: string;
}

const SIZES: Record<Exclude<PageSize, 'FIT'>, [number, number]> = {
  A4: [595.28, 841.89],
  LETTER: [612, 792],
};

export default function ImagemParaPdf() {
  const { admin, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [orient, setOrient] = useState<Orient>('portrait');
  const [margin, setMargin] = useState(20);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!admin) return <Navigate to="/login" replace />;

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const arr: Item[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue;
      arr.push({ id: crypto.randomUUID(), file: f, url: URL.createObjectURL(f) });
    }
    setItems((p) => [...p, ...arr]);
  };

  const remove = (id: string) => setItems((p) => p.filter((i) => i.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    setItems((p) => {
      const idx = p.findIndex((i) => i.id === id);
      if (idx < 0) return p;
      const ni = idx + dir;
      if (ni < 0 || ni >= p.length) return p;
      const c = [...p];
      [c[idx], c[ni]] = [c[ni], c[idx]];
      return c;
    });
  };

  const generate = async () => {
    if (items.length === 0) return;
    setBusy(true);
    try {
      const pdf = await PDFDocument.create();
      pdf.setProducer('');
      pdf.setCreator('');

      for (const it of items) {
        const buf = await it.file.arrayBuffer();
        let img;
        const isPng = /png$/i.test(it.file.type) || /\.png$/i.test(it.file.name);
        if (isPng) {
          img = await pdf.embedPng(buf);
        } else if (/jpe?g/i.test(it.file.type) || /\.jpe?g$/i.test(it.file.name)) {
          img = await pdf.embedJpg(buf);
        } else {
          // Convert other formats (webp, gif, bmp...) to PNG via canvas
          const bmp = await loadImg(it.url);
          const c = document.createElement('canvas');
          c.width = bmp.naturalWidth;
          c.height = bmp.naturalHeight;
          c.getContext('2d')!.drawImage(bmp, 0, 0);
          const dataUrl = c.toDataURL('image/png');
          img = await pdf.embedPng(dataUrl);
        }

        let pageW: number;
        let pageH: number;
        if (pageSize === 'FIT') {
          pageW = img.width;
          pageH = img.height;
        } else {
          const [w, h] = SIZES[pageSize];
          if (orient === 'landscape') {
            pageW = h;
            pageH = w;
          } else {
            pageW = w;
            pageH = h;
          }
        }
        const page = pdf.addPage([pageW, pageH]);

        const availW = pageW - margin * 2;
        const availH = pageH - margin * 2;
        const scale = pageSize === 'FIT' ? 1 : Math.min(availW / img.width, availH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        page.drawImage(img, {
          x: (pageW - drawW) / 2,
          y: (pageH - drawH) / 2,
          width: drawW,
          height: drawH,
        });
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagens-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF gerado com sucesso');
    } catch (e: any) {
      toast.error('Erro ao gerar PDF', { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-rose-500" />
            Imagem para PDF
          </h1>
          <p className="text-muted-foreground text-sm">Converta qualquer formato de imagem em um único PDF</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configurações da página</CardTitle>
            <CardDescription>Tamanho, orientação e margens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tamanho</Label>
                <Select value={pageSize} onValueChange={(v) => setPageSize(v as PageSize)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="LETTER">Carta</SelectItem>
                    <SelectItem value="FIT">Ajustar à imagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Orientação</Label>
                <Select value={orient} onValueChange={(v) => setOrient(v as Orient)} disabled={pageSize === 'FIT'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Retrato</SelectItem>
                    <SelectItem value="landscape">Paisagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Margem ({margin}pt)</Label>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full accent-primary"
                  disabled={pageSize === 'FIT'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFiles(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-foreground">Clique ou arraste imagens aqui</p>
              <p className="text-xs text-muted-foreground mt-1">Cada imagem vira uma página do PDF</p>
            </div>

            {items.length > 0 && (
              <>
                <div className="flex items-center justify-between gap-2 pt-2">
                  <span className="text-xs text-muted-foreground">{items.length} página(s)</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setItems([])}>Limpar</Button>
                    <Button size="sm" onClick={generate} disabled={busy}>
                      {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1" />}
                      Gerar PDF
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {items.map((it, idx) => (
                    <div key={it.id} className="relative group border border-border rounded-lg overflow-hidden bg-muted/20">
                      <div className="absolute top-1 left-1 text-[10px] bg-background/80 rounded px-1.5 py-0.5 font-medium">
                        {idx + 1}
                      </div>
                      <img src={it.url} alt="" className="w-full h-28 object-cover" />
                      <div className="p-2 text-[10px] truncate text-muted-foreground">{it.file.name}</div>
                      <div className="absolute top-1 right-1 flex gap-1">
                        <button onClick={() => move(it.id, -1)} className="p-1 rounded bg-background/80" title="Subir">
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button onClick={() => move(it.id, 1)} className="p-1 rounded bg-background/80" title="Descer">
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button onClick={() => remove(it.id)} className="p-1 rounded bg-destructive text-destructive-foreground" title="Remover">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
