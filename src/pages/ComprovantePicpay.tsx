import { useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Receipt, Eye, X } from 'lucide-react';
import { PicpayPreview, type PicpayPreviewRef, type PicpayFormData } from '@/components/picpay/PicpayPreview';

const BANCOS = [
  'NUBANK',
  'ITAÚ UNIBANCO S.A.',
  'BRADESCO S.A.',
  'BANCO DO BRASIL S.A.',
  'CAIXA ECONÔMICA FEDERAL',
  'SANTANDER S.A.',
  'INTER S.A.',
  'C6 BANK',
  'MERCADO PAGO',
  'PAGBANK',
];

export default function ComprovantePicpay() {
  const { admin, loading } = useAuth();
  const previewRef = useRef<PicpayPreviewRef>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const [formData, setFormData] = useState<PicpayFormData>({
    paraNome: '',
    deNome: '',
    valor: '',
    contaRecebedor: '',
  });

  const updateField = useCallback((key: keyof PicpayFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comprovante PIX PicPay</h1>
            <p className="text-muted-foreground text-sm">Preencha os dados e gere o comprovante</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowMobilePreview(true)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Form */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Dados do Comprovante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Para (Nome do destinatário)</Label>
                  <Input
                    placeholder="NOME COMPLETO DO DESTINATÁRIO"
                    value={formData.paraNome}
                    onChange={(e) => updateField('paraNome', e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>
                <div>
                  <Label className="text-xs">De (Nome do remetente)</Label>
                  <Input
                    placeholder="NOME COMPLETO DO REMETENTE"
                    value={formData.deNome}
                    onChange={(e) => updateField('deNome', e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>
                <div>
                  <Label className="text-xs">Valor (R$)</Label>
                  <Input
                    placeholder="1.000,00"
                    value={formData.valor}
                    onChange={(e) => {
                      // Strip non-digits
                      const digits = e.target.value.replace(/\D/g, '');
                      if (!digits) { updateField('valor', ''); return; }
                      // Format as BRL: 20 -> 0,20 | 2000 -> 20,00 | 100000 -> 1.000,00
                      const num = parseInt(digits, 10);
                      const formatted = (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      updateField('valor', formatted);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Conta Recebedor(a)</Label>
                  <Select value={formData.contaRecebedor} onValueChange={(v) => updateField('contaRecebedor', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANCOS.map((banco) => (
                        <SelectItem key={banco} value={banco}>{banco}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Preview */}
          <div className="hidden lg:block">
            <div className="sticky top-4" style={{ maxWidth: 550 }}>
              <PicpayPreview ref={previewRef} formData={formData} />
            </div>
          </div>
        </div>

        {/* Mobile preview modal */}
        {showMobilePreview && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto bg-white rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={() => setShowMobilePreview(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              <PicpayPreview ref={previewRef} formData={formData} />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
