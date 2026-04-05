import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Download, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SCENES = [
  { value: 'wood', label: '🪵 Mesa de Madeira' },
  { value: 'marble', label: '🪨 Mármore' },
  { value: 'leather', label: '🟤 Couro' },
  { value: 'concrete', label: '🏗️ Concreto' },
  { value: 'plastic', label: '🧴 Plástico Envelhecido' },
];

export default function MockupGenerator() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [scene, setScene] = useState('wood');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
      setResultImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = () => {
          setSourceImage(reader.result as string);
          setResultImage(null);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }, []);

  const generateMockup = async () => {
    if (!sourceImage) {
      toast.error('Selecione uma imagem primeiro');
      return;
    }
    setLoading(true);
    setResultImage(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-mockup', {
        body: { imageBase64: sourceImage, scene },
      });
      if (error) throw error;
      if (data?.image) {
        const img = data.image.startsWith('data:') ? data.image : `data:image/png;base64,${data.image}`;
        setResultImage(img);
        toast.success('Mockup gerado!');
      } else {
        throw new Error(data?.error || 'Erro ao gerar mockup');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar mockup');
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `mockup-${scene}-${Date.now()}.png`;
    a.click();
  };

  return (
    <div
      className="min-h-screen bg-background p-4 md:p-8"
      onPaste={handlePaste}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teste 4 — Gerador de Mockup</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cole ou envie a imagem do documento e gere um mockup realista em cima de uma superfície.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input */}
          <Card className="p-4 space-y-4">
            <p className="text-sm font-medium text-foreground">Documento original</p>
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center min-h-[260px] cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {sourceImage ? (
                <img src={sourceImage} alt="Documento" className="max-w-full max-h-[400px] object-contain" />
              ) : (
                <div className="text-center space-y-2 p-6">
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Clique ou cole (Ctrl+V) uma imagem</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            <div className="flex items-center gap-3">
              <Select value={scene} onValueChange={setScene}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCENES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={generateMockup} disabled={loading || !sourceImage} className="min-w-[140px]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}
                {loading ? 'Gerando...' : 'Gerar Mockup'}
              </Button>
            </div>
          </Card>

          {/* Result */}
          <Card className="p-4 space-y-4">
            <p className="text-sm font-medium text-foreground">Resultado</p>
            <div className="border rounded-lg flex items-center justify-center min-h-[260px] bg-muted/30 overflow-hidden">
              {loading ? (
                <div className="text-center space-y-3 p-6">
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Gerando mockup realista...</p>
                  <p className="text-xs text-muted-foreground">Isso pode levar ~20s</p>
                </div>
              ) : resultImage ? (
                <img src={resultImage} alt="Mockup" className="max-w-full max-h-[400px] object-contain" />
              ) : (
                <p className="text-sm text-muted-foreground">O resultado aparecerá aqui</p>
              )}
            </div>
            {resultImage && (
              <Button variant="outline" onClick={downloadResult} className="w-full">
                <Download className="h-4 w-4 mr-2" /> Baixar Mockup
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
