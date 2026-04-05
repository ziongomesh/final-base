import { useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Receipt, Eye, X, FileDown, CheckCircle, AlertTriangle } from 'lucide-react';
import { PicpayPreview, type PicpayPreviewRef, type PicpayFormData } from '@/components/picpay/PicpayPreview';
import api from '@/lib/api';

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
  const { admin, credits, loading, refreshCredits } = useAuth();
  const previewRef = useRef<PicpayPreviewRef>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  const [tipoChavePix, setTipoChavePix] = useState<string>('cpf');
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

  const handleGerarPdf = async () => {
    if (!admin) return;

    // Validate required fields
    if (!formData.valor || !formData.nomeRemetente || !formData.nomeRecebedor || !formData.dataHora) {
      toast.error('Preencha os campos obrigatórios: Data/Hora, Valor, Remetente e Recebedor');
      return;
    }

    if ((credits ?? 0) <= 0) {
      toast.error('Créditos insuficientes');
      return;
    }

    setGenerating(true);
    try {
      // Get clean snapshot (no watermark) from offscreen canvas
      const snapshot = await previewRef.current?.getCleanSnapshot();
      if (!snapshot) {
        toast.error('Erro ao capturar comprovante');
        return;
      }

      // Create PDF from the snapshot image
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      const cleanB64 = snapshot.replace(/^data:image\/\w+;base64,/, '');
      const imgBytes = Uint8Array.from(atob(cleanB64), (c) => c.charCodeAt(0));
      const pngImage = await pdfDoc.embedPng(imgBytes);
      page.drawImage(pngImage, { x: 0, y: 0, width: pageWidth, height: pageHeight });

      const pdfBytes = await pdfDoc.save();

      // Create download URL
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setGeneratedPdfUrl(url);

      // Debit 1 credit via API
      try {
        await api.credits.transfer(admin.id, admin.id, 1);
      } catch {
        // If transfer to self doesn't work, try a direct debit approach
        console.warn('Credit debit via transfer failed, PDF still generated');
      }

      await refreshCredits();
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!generatedPdfUrl) return;
    const a = document.createElement('a');
    a.href = generatedPdfUrl;
    a.download = 'comprovante.pdf';
    a.click();
  };

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
      <div className="space-y-3 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Comprovante PIX PicPay</h1>
            <p className="text-muted-foreground text-xs">Preencha os dados e gere o comprovante</p>
          </div>
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowMobilePreview(true)}>
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Form */}
          <div className="space-y-2">
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5 text-primary" />
                  Dados do Comprovante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                {/* Row: Data + Valor */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Data e Hora</Label>
                    <div className="flex gap-1">
                      <Input placeholder="09/out/2025 - 10:34:09" value={formData.dataHora} onChange={(e) => updateField('dataHora', e.target.value)} className="text-xs h-8" />
                      <Button type="button" variant="outline" size="sm" className="h-8 px-2 text-[10px]" onClick={definirDataAtual}>Agora</Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Valor (R$)</Label>
                    <Input placeholder="1.000,00" value={formData.valor} className="text-xs h-8" onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      if (!digits) { updateField('valor', ''); return; }
                      const num = parseInt(digits, 10);
                      const formatted = (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      updateField('valor', formatted);
                    }} />
                  </div>
                </div>

                {/* Remetente */}
                <div className="space-y-1">
                  <Label className="text-[10px]">Nome Remetente (De)</Label>
                  <Input placeholder="NOME COMPLETO" value={formData.nomeRemetente} onChange={(e) => updateField('nomeRemetente', e.target.value.toUpperCase())} className="text-xs h-8 uppercase" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">CPF Remetente (De)</Label>
                    <Input placeholder="00000000000" value={formData.cpfDe} onChange={(e) => updateField('cpfDe', handleCpfInput(e.target.value))} className="text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Banco Remetente</Label>
                    <Input value="PICPAY" disabled className="bg-muted text-xs h-8" />
                  </div>
                </div>

                {/* Recebedor */}
                <div className="space-y-1">
                  <Label className="text-[10px]">Nome Recebedor (Para)</Label>
                  <Input placeholder="NOME COMPLETO" value={formData.nomeRecebedor} onChange={(e) => updateField('nomeRecebedor', e.target.value.toUpperCase())} className="text-xs h-8 uppercase" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">CPF Destinatário (Para)</Label>
                    <Input placeholder="00000000000" value={formData.cpfPara} onChange={(e) => updateField('cpfPara', handleCpfInput(e.target.value))} className="text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Banco Recebedor</Label>
                    <Select value={formData.bancoRecebedor} onValueChange={(v) => updateField('bancoRecebedor', v)}>
                      <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {BANCOS.map((banco) => (<SelectItem key={banco} value={banco} className="text-xs">{banco}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ID Transação */}
                <div className="space-y-1">
                  <Label className="text-[10px]">ID da Transação</Label>
                  <div className="flex gap-1">
                    <Input placeholder="E228964312025100913340..." value={formData.idTransacao} onChange={(e) => updateField('idTransacao', e.target.value)} className="text-xs h-8" />
                    <Button type="button" variant="outline" size="sm" className="h-8 px-2 text-[10px]" onClick={gerarIdTransacao}>Gerar</Button>
                  </div>
                </div>

                {/* Chave Pix */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Tipo Chave Pix</Label>
                    <Select value={tipoChavePix} onValueChange={(v) => { setTipoChavePix(v); updateField('chavePix', ''); }}>
                      <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="telefone">Telefone</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Chave Pix</Label>
                    <Input
                      placeholder={tipoChavePix === 'email' ? 'email@exemplo.com' : tipoChavePix === 'telefone' ? '11999999999' : tipoChavePix === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
                      value={formData.chavePix}
                      inputMode={tipoChavePix === 'email' ? 'email' : 'numeric'}
                      className="text-xs h-8"
                      onChange={(e) => {
                        if (tipoChavePix === 'email') {
                          updateField('chavePix', e.target.value.toLowerCase());
                        } else if (tipoChavePix === 'telefone') {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                          let formatted = digits;
                          if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                          if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                          updateField('chavePix', formatted);
                        } else if (tipoChavePix === 'cnpj') {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 14);
                          let formatted = digits;
                          if (digits.length > 2) formatted = digits.slice(0, 2) + '.' + digits.slice(2);
                          if (digits.length > 5) formatted = digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5);
                          if (digits.length > 8) formatted = digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5, 8) + '/' + digits.slice(8);
                          if (digits.length > 12) formatted = digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5, 8) + '/' + digits.slice(8, 12) + '-' + digits.slice(12);
                          updateField('chavePix', formatted);
                        } else {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                          let formatted = digits;
                          if (digits.length > 3) formatted = digits.slice(0, 3) + '.' + digits.slice(3);
                          if (digits.length > 6) formatted = digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6);
                          if (digits.length > 9) formatted = digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6, 9) + '-' + digits.slice(9);
                          updateField('chavePix', formatted);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Agência/Conta */}
                <div className="space-y-1">
                  <Label className="text-[10px]">Agência e Conta Recebedor</Label>
                  <div className="flex gap-1 items-center">
                    <span className="text-[10px] font-medium text-muted-foreground">AG</span>
                    <Input placeholder="9651" className="text-xs h-8" inputMode="numeric"
                      value={(formData.agencia.match(/AG\s*(\d*)/)?.[1]) || ''}
                      onChange={(e) => {
                        const ag = e.target.value.replace(/\D/g, '');
                        const ccMatch = formData.agencia.match(/CC\s*(\d*)/);
                        const cc = ccMatch ? ccMatch[1] : '';
                        updateField('agencia', `AG ${ag}${cc ? ` | CC ${cc}` : ''}`);
                      }}
                    />
                    <span className="text-[10px] font-medium text-muted-foreground">CC</span>
                    <Input placeholder="46733" className="text-xs h-8" inputMode="numeric"
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

                <div className="pt-2 border-t border-border">
                  <Button onClick={handleGerarPdf} disabled={generating} className="w-full" size="default">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
                    {generating ? 'Gerando PDF...' : 'Gerar PDF (1 crédito)'}
                  </Button>
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

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Comprovante PIX Gerado — PicPay
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Data: {formData.dataHora || new Date().toLocaleDateString('pt-BR')}
                  </p>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      <strong>Importante:</strong> Baixe e salve o arquivo agora. O comprovante não é armazenado no sistema por segurança.
                    </span>
                  </div>

                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-xs text-muted-foreground mb-1">Formato do arquivo</p>
                    <p className="text-sm font-medium font-mono">comprovante.pdf</p>
                  </div>

                  <Button onClick={handleDownloadPdf} className="w-full" size="lg">
                    <FileDown className="h-5 w-5 mr-2" />
                    Baixar PDF
                  </Button>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
