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
  'PICPAY',
];

export default function ComprovantePicpay() {
  const { admin, loading } = useAuth();
  const previewRef = useRef<PicpayPreviewRef>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const [formData, setFormData] = useState<PicpayFormData>({
    dataHora: '',
    valor: '',
    nomeRemetente: '',
    cpfPara: '',
    bancoRecebedor: '',
    nomeRecebedor: '',
    cpfDe: '',
    bancoRemetente: 'PICPAY',
    idTransacao: '',
    chavePix: '',
    agencia: '',
  });

  const updateField = useCallback((key: keyof PicpayFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCpfInput = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 11) {
      const mid = digits.slice(3, 9);
      return `***.${mid.slice(0, 3)}.${mid.slice(3)}-**`;
    }
    return digits;
  };

  const definirDataAtual = useCallback(() => {
    const now = new Date();
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = meses[now.getMonth()];
    const ano = now.getFullYear();
    const hora = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const seg = String(now.getSeconds()).padStart(2, '0');
    updateField('dataHora', `${dia}/${mes}/${ano} - ${hora}:${min}:${seg}`);
  }, [updateField]);

  const gerarIdTransacao = useCallback(() => {
    const now = new Date();
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const hex = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    const id = `E22896431${y}${mo}${d}${h}${mi}${s}${hex()}${hex()} ${hex().slice(0, 2)}`;
    updateField('idTransacao', id.slice(0, 35));
  }, [updateField]);

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
                {/* 1. Data e Hora */}
                <div>
                  <Label className="text-xs">Data e Hora</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="09/out/2025 - 10:34:09"
                      value={formData.dataHora}
                      onChange={(e) => updateField('dataHora', e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={definirDataAtual}>
                      Atual
                    </Button>
                  </div>
                </div>

                {/* 2. Valor */}
                <div>
                  <Label className="text-xs">Valor (R$)</Label>
                  <Input
                    placeholder="1.000,00"
                    value={formData.valor}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      if (!digits) { updateField('valor', ''); return; }
                      const num = parseInt(digits, 10);
                      const formatted = (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      updateField('valor', formatted);
                    }}
                  />
                </div>

                {/* 3. Nome Remetente (De) */}
                <div>
                  <Label className="text-xs">Nome Remetente (De)</Label>
                  <Input
                    placeholder="FRANCISCO WANDERLEY G BONATES"
                    value={formData.nomeRemetente}
                    onChange={(e) => updateField('nomeRemetente', e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>

                {/* 4. CPF Para (destinatário) */}
                <div>
                  <Label className="text-xs">CPF Destinatário (Para)</Label>
                  <Input
                    placeholder="00000000000"
                    value={formData.cpfPara}
                    onChange={(e) => updateField('cpfPara', handleCpfInput(e.target.value))}
                  />
                </div>

                {/* 5. Banco Recebedor */}
                <div>
                  <Label className="text-xs">Banco Recebedor</Label>
                  <Select value={formData.bancoRecebedor} onValueChange={(v) => updateField('bancoRecebedor', v)}>
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

                {/* 6. Nome Recebedor (Para) */}
                <div>
                  <Label className="text-xs">Nome Recebedor (Para)</Label>
                  <Input
                    placeholder="MARILENA PEDROSO DE OLIVEIRA"
                    value={formData.nomeRecebedor}
                    onChange={(e) => updateField('nomeRecebedor', e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>

                {/* 7. CPF De (remetente) */}
                <div>
                  <Label className="text-xs">CPF Remetente (De)</Label>
                  <Input
                    placeholder="00000000000"
                    value={formData.cpfDe}
                    onChange={(e) => updateField('cpfDe', handleCpfInput(e.target.value))}
                  />
                </div>

                {/* 8. Banco Remetente (fixo PICPAY) */}
                <div>
                  <Label className="text-xs">Banco Remetente</Label>
                  <Input value="PICPAY" disabled className="bg-muted" />
                </div>

                {/* 9. ID Transação */}
                <div>
                  <Label className="text-xs">ID da Transação</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="E228964312025100913340GFB93BF3 3U"
                      value={formData.idTransacao}
                      onChange={(e) => updateField('idTransacao', e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={gerarIdTransacao}>
                      Gerar
                    </Button>
                  </div>
                </div>

                {/* 10. Chave Pix */}
                <div>
                  <Label className="text-xs">Chave Pix Recebedor</Label>
                  <Input
                    placeholder="64126277234"
                    value={formData.chavePix}
                    onChange={(e) => updateField('chavePix', e.target.value)}
                  />
                </div>

                {/* 11. Agência e Conta Recebedor */}
                <div>
                  <Label className="text-xs">Agência e Conta Recebedor</Label>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs font-medium text-muted-foreground">AG</span>
                    <Input
                      placeholder="9651"
                      className="flex-1"
                      inputMode="numeric"
                      value={(formData.agencia.match(/AG\s*(\d*)/)?.[1]) || ''}
                      onChange={(e) => {
                        const ag = e.target.value.replace(/\D/g, '');
                        const ccMatch = formData.agencia.match(/CC\s*(\d*)/);
                        const cc = ccMatch ? ccMatch[1] : '';
                        updateField('agencia', `AG ${ag}${cc ? ` | CC ${cc}` : ''}`);
                      }}
                    />
                    <span className="text-xs font-medium text-muted-foreground">CC</span>
                    <Input
                      placeholder="46733"
                      className="flex-1"
                      inputMode="numeric"
                      value={(formData.agencia.match(/CC\s*(\d*)/)?.[1]) || ''}
                      onChange={(e) => {
                        const cc = e.target.value.replace(/\D/g, '');
                        const agMatch = formData.agencia.match(/AG\s*(\d*)/);
                        const ag = agMatch ? agMatch[1] : '';
                        updateField('agencia', `AG ${ag} | CC ${cc}`);
                      }}
                    />
                  </div>
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
