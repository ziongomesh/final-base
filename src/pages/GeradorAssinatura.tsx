import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Download, PenLine, ArrowLeft } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const FONTS = [
  { name: 'Caveat', css: "'Caveat', cursive" },
  { name: 'Homemade Apple', css: "'Homemade Apple', cursive" },
  { name: 'Nothing You Could Do', css: "'Nothing You Could Do', cursive" },
];

const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?${FONTS.map(f => `family=${f.name.replace(/ /g, '+')}`).join('&')}&display=swap`;

export default function GeradorAssinatura() {
  const { admin, loading: authLoading } = useAuth();
  const [nome, setNome] = useState('');
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!admin) return <Navigate to="/login" replace />;

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = GOOGLE_FONTS_URL;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    link.onload = () => {
      // Give fonts time to render
      setTimeout(() => setFontsLoaded(true), 500);
    };
    return () => { document.head.removeChild(link); };
  }, []);

  // Draw signature on canvas
  useEffect(() => {
    if (!canvasRef.current || !fontsLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    const displayW = 600;
    const displayH = 200;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;
    ctx.scale(dpr, dpr);

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, displayW, displayH);

    if (nome.trim()) {
      ctx.fillStyle = '#000000';
      ctx.font = `48px ${selectedFont.css}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(nome, displayW / 2, displayH / 2);
    }
  }, [nome, selectedFont, fontsLoaded]);

  const handleDownload = () => {
    if (!canvasRef.current || !nome.trim()) {
      toast.error('Digite um nome primeiro');
      return;
    }

    const link = document.createElement('a');
    link.download = `assinatura-${nome.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Assinatura salva!');
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
              <PenLine className="h-6 w-6 text-primary" />
              Gerador de Assinatura
            </h1>
            <p className="text-muted-foreground">Digite o nome e gere uma assinatura manuscrita</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr,auto]">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <Label>Nome completo</Label>
              <Input
                placeholder="Ex: Felipe da Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="text-lg"
              />
            </div>

            <div>
              <Label>Fonte</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {FONTS.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => setSelectedFont(font)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-colors hover:border-primary/50',
                      selectedFont.name === font.name
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    )}
                  >
                    <span className="text-xs text-muted-foreground block mb-1">{font.name}</span>
                    <span style={{ fontFamily: font.css, fontSize: '20px' }}>
                      {nome || 'Assinatura'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview + Download */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pré-visualização</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-4">
                <canvas
                  ref={canvasRef}
                  className="rounded-lg border border-border"
                  style={{ width: 600, height: 200 }}
                />
              </CardContent>
            </Card>

            <Button
              onClick={handleDownload}
              className="w-full gap-2"
              size="lg"
              disabled={!nome.trim()}
            >
              <Download className="h-4 w-4" />
              Salvar Assinatura (PNG)
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
