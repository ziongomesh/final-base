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
import { BradescoPreview, type BradescoPreviewRef, type BradescoFormData } from '@/components/bradesco/BradescoPreview';
import api from '@/lib/api';

const BANCOS = [
  'NUBANK', 'ITAÚ UNIBANCO S.A.', 'BRADESCO S.A.', 'BANCO DO BRASIL S.A.',
  'CAIXA ECONÔMICA FEDERAL', 'SANTANDER S.A.', 'INTER S.A.', 'C6 BANK',
  'MERCADO PAGO', 'PAGBANK', 'PICPAY',
];

export default function ComprovanteBradesco() {
  const { admin, credits, loading, refreshCredits } = useAuth();
  const previewRef = useRef<BradescoPreviewRef>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [tipoChavePix, setTipoChavePix] = useState<string>('cpf');

  const generateControle = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const now = new Date();
    const prefix = 'E' + String(Math.floor(Math.random() * 9e9)).padStart(10, '0');
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    let suffix = '';
    for (let i = 0; i < 8; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
    return prefix + datePart + suffix;
  };

  const [formData, setFormData] = useState<BradescoFormData>({
    numeroControle: generateControle(),
    dataHora: '',
    valor: '',
    nomePagador: '',
    cpfPagador: '',
    agenciaConta: '',
    nomeRecebedor: '',
    cpfRecebedor: '',
    instituicaoRecebedor: '',
    chavePix: '',
    idTransacao: '',
    autenticacao: '',
  });

  const updateField = useCallback((key: keyof BradescoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCpfInput = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return digits;
  };

  const definirDataAtual = useCallback(() => {
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
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
    const id = `E60746948${y}${mo}${d}${h}${mi}${s}${hex()}${hex()}`;
    updateField('idTransacao', id.slice(0, 35));
  }, [updateField]);

  const gerarAutenticacao = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 32; i++) {
      if (i > 0 && i % 4 === 0) code += '.';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    updateField('autenticacao', code);
  }, [updateField]);

  const handleGerarPdf = async () => {
    if (!admin) return;
    if (!formData.valor || !formData.nomePagador || !formData.nomeRecebedor || !formData.dataHora) {
      toast.error('Preencha os campos obrigatórios: Data/Hora, Valor, Pagador e Recebedor');
      return;
    }
    if ((credits ?? 0) <= 0) {
      toast.error('Créditos insuficientes');
      return;
    }

    setGenerating(true);
    try {
      const snapshot = await previewRef.current?.getCleanSnapshot();
      if (!snapshot) { toast.error('Erro ao capturar comprovante'); return; }

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
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setGeneratedPdfUrl(url);

      try {
        await api.credits.transfer(admin.id, admin.id, 1);
      } catch {
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
    a.download = 'comprovante-bradesco.pdf';
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
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comprovante PIX Bradesco</h1>
            <p className="text-muted-foreground text-sm">Preencha os dados e gere o comprovante</p>
          </div>
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowMobilePreview(true)}>
            <Eye className="h-4 w-4 mr-1" /> Preview
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
                <div className="space-y-1.5">
                  <Label className="text-xs">Número de Controle</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.numeroControle}
                      onChange={e => updateField('numeroControle', e.target.value)}
                      className="text-xs font-mono"
                    />
                    <Button variant="outline" size="sm" onClick={() => updateField('numeroControle', generateControle())}>
                      Gerar
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome do Pagador</Label>
                  <Input
                    value={formData.nomePagador}
                    onChange={e => updateField('nomePagador', e.target.value.toUpperCase())}
                    placeholder="NOME COMPLETO"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CPF do Pagador</Label>
                  <Input
                    value={formData.cpfPagador}
                    onChange={e => updateField('cpfPagador', handleCpfInput(e.target.value))}
                    placeholder="***.000.000-**"
                    className="text-xs"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor</Label>
                  <Input
                    value={formData.valor}
                    onChange={e => updateField('valor', e.target.value)}
                    placeholder="6000,00"
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Preview */}
          <div className="hidden lg:block">
            <div className="sticky top-4" style={{ maxWidth: 550 }}>
              <BradescoPreview ref={previewRef} formData={formData} />
            </div>
          </div>
        </div>

        {/* Mobile preview modal */}
        {showMobilePreview && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto bg-white rounded-lg">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10" onClick={() => setShowMobilePreview(false)}>
                <X className="h-5 w-5" />
              </Button>
              <BradescoPreview ref={previewRef} formData={formData} />
            </div>
          </div>
        )}

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Comprovante PIX Gerado — Bradesco
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Data: {formData.dataHora || new Date().toLocaleDateString('pt-BR')}
                  </p>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span><strong>Importante:</strong> Baixe e salve o arquivo agora. O comprovante não é armazenado no sistema por segurança.</span>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-xs text-muted-foreground mb-1">Formato do arquivo</p>
                    <p className="text-sm font-medium font-mono">comprovante-bradesco.pdf</p>
                  </div>
                  <Button onClick={handleDownloadPdf} className="w-full" size="lg">
                    <FileDown className="h-5 w-5 mr-2" /> Baixar PDF
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
