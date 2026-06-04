import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type Fmt = 'png' | 'jpeg' | 'webp';

const FORMATS: { value: Fmt; label: string; ext: string; mime: string }[] = [
  { value: 'png', label: 'PNG', ext: 'png', mime: 'image/png' },
  { value: 'jpeg', label: 'JPG', ext: 'jpg', mime: 'image/jpeg' },
  { value: 'webp', label: 'WEBP', ext: 'webp', mime: 'image/webp' },
];

interface Item {
  id: string;
  file: File;
  url: string;
  converted?: { url: string; name: string };
}

export default function ConverterFormato() {
  const { admin, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [format, setFormat] = useState<Fmt>('png');
  const [quality, setQuality] = useState(0.92);
  const [converting, setConverting] = useState(false);
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

  const remove = (id: string) => {
    setItems((p) => p.filter((i) => i.id !== id));
  };

  const convertAll = async () => {
    if (items.length === 0) return;
    setConverting(true);
    const fmt = FORMATS.find((f) => f.value === format)!;
    try {
      const updated: Item[] = [];
      for (const it of items) {
        const img = await loadImg(it.url);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        if (fmt.value === 'jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        const blob: Blob = await new Promise((res, rej) =>
          canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob falhou'))), fmt.mime, quality),
        );
        const baseName = it.file.name.replace(/\.[^.]+$/, '');
        updated.push({
          ...it,
          converted: { url: URL.createObjectURL(blob), name: `${baseName}.${fmt.ext}` },
        });
      }
      setItems(updated);
      toast.success(`${updated.length} imagem(ns) convertida(s)`);
    } catch (e: any) {
      toast.error('Erro ao converter', { description: e.message });
    } finally {
      setConverting(false);
    }
  };

  const downloadOne = (it: Item) => {
    if (!it.converted) return;
    const a = document.createElement('a');
    a.href = it.converted.url;
    a.download = it.converted.name;
    a.click();
  };

  const downloadAll = () => {
    items.forEach((it) => it.converted && downloadOne(it));
  };

  const converted = items.filter((i) => i.converted).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-emerald-500" />
            Converter Imagens
          </h1>
          <p className="text-muted-foreground text-sm">Converta entre JPG, PNG e WEBP</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configurações</CardTitle>
            <CardDescription>Escolha o formato de saída</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Formato de saída</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as Fmt)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {format !== 'png' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Qualidade ({Math.round(quality * 100)}%)</Label>
                  <input
                    type="range"
                    min={0.3}
                    max={1}
                    step={0.01}
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              )}
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
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP, GIF, BMP, etc.</p>
            </div>

            {items.length > 0 && (
              <>
                <div className="flex items-center justify-between gap-2 pt-2">
                  <span className="text-xs text-muted-foreground">{items.length} arquivo(s) • {converted} convertido(s)</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setItems([])}>Limpar</Button>
                    <Button size="sm" onClick={convertAll} disabled={converting}>
                      {converting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
                      Converter
                    </Button>
                    {converted > 0 && (
                      <Button size="sm" variant="secondary" onClick={downloadAll}>
                        <Download className="h-3.5 w-3.5 mr-1" /> Baixar todos
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {items.map((it) => (
                    <div key={it.id} className="relative group border border-border rounded-lg overflow-hidden bg-muted/20">
                      <img src={it.url} alt="" className="w-full h-28 object-cover" />
                      <div className="p-2 text-[10px] truncate text-muted-foreground">{it.file.name}</div>
                      <div className="absolute top-1 right-1 flex gap-1">
                        {it.converted && (
                          <button
                            onClick={() => downloadOne(it)}
                            className="p-1 rounded bg-primary text-primary-foreground"
                            title="Baixar"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => remove(it.id)}
                          className="p-1 rounded bg-destructive text-destructive-foreground"
                          title="Remover"
                        >
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
