import { useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Download, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type ConvertMode = 'grayscale' | 'blackwhite';

function convertImage(
  sourceCanvas: HTMLCanvasElement,
  mode: ConvertMode,
  threshold = 128
): string {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const ctx = sourceCanvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext('2d')!;
  const outData = outCtx.createImageData(w, h);
  const out = outData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;
    if (mode === 'blackwhite') {
      gray = gray >= threshold ? 255 : 0;
    }
    out[i] = gray;
    out[i + 1] = gray;
    out[i + 2] = gray;
    out[i + 3] = a;
  }

  outCtx.putImageData(outData, 0, 0);
  return outCanvas.toDataURL('image/png');
}

export default function ConverterImagem() {
  const { admin, loading } = useAuth();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [mode, setMode] = useState<ConvertMode>('grayscale');
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSourceImage(ev.target?.result as string);
      setResultImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleConvert = useCallback(() => {
    if (!sourceImage || !canvasRef.current) return;
    setProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const result = convertImage(canvas, mode);
      setResultImage(result);
      setProcessing(false);
      toast.success('Imagem convertida!');
    };
    img.onerror = () => {
      setProcessing(false);
      toast.error('Erro ao carregar imagem');
    };
    img.src = sourceImage;
  }, [sourceImage, mode]);

  const handleDownload = useCallback(() => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `convertida-${mode}.png`;
    a.click();
    toast.success('Download iniciado!');
  }, [resultImage, mode]);

  const handleReset = useCallback(() => {
    setSourceImage(null);
    setResultImage(null);
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!admin) return <Navigate to="/login" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link to="/ferramentas" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">🎨 Converter Imagem</h1>
            <p className="text-muted-foreground text-sm">Converta imagens para tons de cinza ou preto e branco</p>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!sourceImage ? (
                <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clique para selecionar uma imagem</span>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                </label>
              ) : (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Imagem original</Label>
                  <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
                    <img src={sourceImage} alt="Original" className="w-full max-h-48 object-contain" />
                  </div>
                </div>
              )}

              {sourceImage && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selecione o tipo:</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="mode" checked={mode === 'grayscale'} onChange={() => setMode('grayscale')} className="accent-primary" />
                        <span className="text-sm">Tons de cinza</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="mode" checked={mode === 'blackwhite'} onChange={() => setMode('blackwhite')} className="accent-primary" />
                        <span className="text-sm">Somente preto e branco</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleConvert} disabled={processing} className="flex-1">
                      {processing ? 'Convertendo...' : 'Converter'}
                    </Button>
                    <Button variant="outline" onClick={handleReset} size="icon">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resultado</CardTitle>
            </CardHeader>
            <CardContent>
              {resultImage ? (
                <div className="space-y-3">
                  <div className="border border-border rounded-lg overflow-hidden bg-white">
                    <img src={resultImage} alt="Resultado" className="w-full object-contain" />
                  </div>
                  <Button onClick={handleDownload} className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" /> Baixar imagem
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2 opacity-30" />
                  <p className="text-sm">O resultado aparecerá aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
