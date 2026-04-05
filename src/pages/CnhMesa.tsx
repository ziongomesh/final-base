import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import WatermarkOverlay from '@/components/cnh/WatermarkOverlay';
import { generateCnhMesa, type CnhMesaData } from '@/lib/cnh-mesa-generator';

export default function CnhMesa() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [nome, setNome] = useState('');

  const updatePreview = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      await generateCnhMesa(canvasRef.current, { nome });
    } catch (e) {
      console.error('Preview error:', e);
    }
  }, [nome]);

  useEffect(() => {
    const timer = setTimeout(updatePreview, 150);
    return () => clearTimeout(timer);
  }, [updatePreview]);

  if (!admin) return <Navigate to="/login" />;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/servicos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">CNH na Mesa</h1>
            <p className="text-sm text-muted-foreground">Carteira Nacional de Habilitação — Formato Físico</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome Completo</label>
                <Input
                  placeholder="Nome e Sobrenome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value.toUpperCase())}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted/30 rounded-lg p-2 flex justify-center">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto rounded border border-border cursor-pointer"
                    onClick={() => setPreviewExpanded(true)}
                  />
                  <WatermarkOverlay />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Clique na imagem para expandir
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expanded preview modal */}
      {previewExpanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewExpanded(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-auto">
            <canvas
              ref={(el) => {
                if (el) generateCnhMesa(el, { nome });
              }}
              className="max-w-full h-auto rounded"
            />
            <WatermarkOverlay />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
