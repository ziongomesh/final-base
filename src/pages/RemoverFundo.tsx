import { useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Download, Loader2, ImageMinus, ArrowLeft, Crop, Check } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Cropper, { Area } from 'react-easy-crop';
import { Slider } from '@/components/ui/slider';
import { removeBackground } from '@imgly/background-removal';

async function getCroppedImg(imageSrc: string, crop: Area): Promise<string> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return canvas.toDataURL('image/png');
}

async function removeBgLocal(imageDataUrl: string, onProgress: (p: number) => void): Promise<string> {
  const res = await fetch(imageDataUrl);
  const blob = await res.blob();

  onProgress(10);

  const resultBlob = await removeBackground(blob, {
    output: { format: 'image/png' },
    progress: (key: string, current: number, total: number) => {
      if (total > 0) {
        const pct = Math.round((current / total) * 80) + 10;
        onProgress(Math.min(pct, 90));
      }
    },
  });

  onProgress(92);

  const img = new Image();
  const url = URL.createObjectURL(resultBlob);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);

  onProgress(100);
  return canvas.toDataURL('image/png');
}

export default function RemoverFundo() {
  const { admin, loading: authLoading } = useAuth();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!admin) return <Navigate to="/login" replace />;

  const processImage = async (dataUrl: string) => {
    setLoading(true);
    setProgress(0);
    setResultImage(null);
    try {
      const result = await removeBgLocal(dataUrl, (p) => setProgress(p));
      setResultImage(result);
      toast.success('Fundo removido com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao remover fundo');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione um arquivo de imagem'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Imagem muito grande (máx 10MB)'); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const img = reader.result as string;
      setOriginalImage(img);
      setCroppedImage(null);
      setResultImage(null);
      setIsCropping(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!originalImage || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(originalImage, croppedAreaPixels);
      setCroppedImage(cropped);
      setIsCropping(false);
      processImage(cropped);
    } catch { toast.error('Erro ao recortar imagem'); }
  };

  const handleSkipCrop = () => {
    setCroppedImage(originalImage);
    setIsCropping(false);
    if (originalImage) processImage(originalImage);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `foto-fundo-branco-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Imagem salva!');
  };

  const handleReset = () => {
    setOriginalImage(null);
    setCroppedImage(null);
    setResultImage(null);
    setIsCropping(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Link to="/ferramentas">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ImageMinus className="h-6 w-6 text-primary" />
              Removedor de Fundo
            </h1>
            <p className="text-muted-foreground">Envie uma foto e receba com fundo branco — 100% local, sem limites</p>
          </div>
        </div>

        {!originalImage && (
          <Card
            className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-lg font-medium">Clique para enviar uma imagem</p>
                <p className="text-sm text-muted-foreground">PNG, JPG ou WEBP (máx 10MB)</p>
              </div>
            </CardContent>
          </Card>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

        {isCropping && originalImage && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Crop className="h-4 w-4" /> Recortar imagem (opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full h-[400px] bg-black/50 rounded-lg overflow-hidden">
                <Cropper
                  image={originalImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={3 / 4}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Zoom</span>
                <Slider value={[zoom]} onValueChange={(v) => setZoom(v[0])} min={1} max={3} step={0.1} className="flex-1" />
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleCropConfirm} className="gap-2">
                  <Check className="h-4 w-4" /> Confirmar recorte
                </Button>
                <Button onClick={handleSkipCrop} variant="outline">Usar sem recortar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isCropping && (croppedImage || resultImage) && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {croppedImage !== originalImage ? 'Recortada' : 'Original'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-4">
                  <img src={croppedImage || originalImage!} alt="Foto" className="max-h-80 rounded-lg object-contain" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Resultado</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-4 min-h-[280px]">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground w-full px-6">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <div className="w-full max-w-xs space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Removendo fundo...</span>
                          <span className="font-mono">{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : resultImage ? (
                    <img src={resultImage} alt="Fundo branco" className="max-h-80 rounded-lg object-contain" />
                  ) : (
                    <p className="text-sm text-muted-foreground">Processando...</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {resultImage && (
                <Button onClick={handleDownload} className="gap-2" size="lg">
                  <Download className="h-4 w-4" /> Salvar Imagem
                </Button>
              )}
              <Button onClick={handleReset} variant="ghost" size="lg">Nova imagem</Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}