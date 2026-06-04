import { useState, useRef, useCallback, useEffect } from 'react';
import { useFormGuard } from '@/hooks/useFormGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Smartphone, Eye, X, FileDown, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';
import { ItauPreview, type ItauPreviewRef, type ItauFormData, PAGE_W, PAGE_H } from '@/components/itau/ItauPreview';
import api from '@/lib/api';

function nowIphone() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
function nowAprovada() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mon = MESES[d.getMonth()];
  const yr = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `Aprovada ${dd} ${mon} ${yr} ${hh}:${mm}`;
}

export default function ComprovanteItau() {
  const { admin, credits, loading, refreshCredits } = useAuth();
  const previewRef = useRef<ItauPreviewRef>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedUrls, setGeneratedUrls] = useState<{ png: string | null; pdf: string | null }>({ png: null, pdf: null });
  const [hasTouched, setHasTouched] = useState(false);

  const { setFormDirty } = useFormGuard();
  useEffect(() => {
    if (hasTouched) setFormDirty(true);
    return () => setFormDirty(false);
  }, [hasTouched, setFormDirty]);

  const [formData, setFormData] = useState<ItauFormData>({
    horarioIphone: nowIphone(),
    descricao: 'Itpac c*acordodebitos',
    aprovadaEm: '',
    categoria: 'Categoria: outras despesas de educação',
    valorTotal: '',
    cartaoTipo: 'Cartão virtual - compra online',
    cartaoNome: '',
  });

  const updateField = useCallback((key: keyof ItauFormData, value: string) => {
    setHasTouched(true);
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const formatMoney = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits, 10);
    return 'R$ ' + (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseValor = (full: string) => {
    const m = full.match(/^(R\$ [\d.,]+) em (\d+)x$/);
    if (m) return { valor: m[1], vezes: m[2] };
    return { valor: full, vezes: '1' };
  };

  const handleValorChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const { vezes } = parseValor(formData.valorTotal);
    if (!digits) { updateField('valorTotal', ''); return; }
    updateField('valorTotal', `${formatMoney(raw)} em ${vezes || '1'}x`);
  };

  const handleVezesChange = (raw: string) => {
    const v = raw.replace(/\D/g, '') || '1';
    const { valor } = parseValor(formData.valorTotal);
    if (!valor) { updateField('valorTotal', ''); return; }
    updateField('valorTotal', `${valor} em ${v}x`);
  };

  const definirAgora = useCallback(() => {
    updateField('horarioIphone', nowIphone());
    updateField('aprovadaEm', nowAprovada());
  }, [updateField]);

  const handleGerar = async () => {
    if (!admin) return;
    const obrig: { key: keyof ItauFormData; nome: string }[] = [
      { key: 'horarioIphone', nome: 'Horário iPhone' },
      { key: 'descricao', nome: 'Descrição' },
      { key: 'aprovadaEm', nome: 'Aprovada em' },
      { key: 'valorTotal', nome: 'Valor Total' },
      { key: 'cartaoNome', nome: 'Cartão (final)' },
    ];
    const faltando = obrig.filter(c => !formData[c.key]?.trim());
    if (faltando.length > 0) {
      toast.error(`Preencha: ${faltando.map(c => c.nome).join(', ')}`);
      return;
    }
    if ((credits ?? 0) <= 0) {
      toast.error('Créditos insuficientes');
      return;
    }

    setGenerating(true);
    try {
      const snapshot = await previewRef.current?.getCleanSnapshot();
      if (!snapshot) { toast.error('Erro ao capturar print'); return; }

      // PNG download
      const pngUrl = snapshot;

      // PDF mesmo tamanho
      const { PDFDocument } = await import('pdf-lib');
      const { stripPdfMetadata } = await import('@/lib/strip-metadata');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      const cleanB64 = snapshot.replace(/^data:image\/\w+;base64,/, '');
      const imgBytes = Uint8Array.from(atob(cleanB64), (c) => c.charCodeAt(0));
      const pngImage = await pdfDoc.embedPng(imgBytes);
      page.drawImage(pngImage, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
      stripPdfMetadata(pdfDoc);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(blob);

      setGeneratedUrls({ png: pngUrl, pdf: pdfUrl });

      try {
        await api.credits.transfer(admin.id, admin.id, 1);
      } catch {
        console.warn('Credit debit via transfer failed, files still generated');
      }
      await refreshCredits();

      setFormData({
        horarioIphone: nowIphone(),
        descricao: 'Itpac c*acordodebitos',
        aprovadaEm: '',
        categoria: 'Categoria: outras despesas de educação',
        valorTotal: '',
        cartaoTipo: 'Cartão virtual - compra online',
        cartaoNome: '',
      });
      setHasTouched(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Erro ao gerar print:', err);
      toast.error('Erro ao gerar print');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (kind: 'png' | 'pdf') => {
    const url = generatedUrls[kind];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = kind === 'png' ? 'comprovante-itau.png' : 'comprovante-itau.pdf';
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
            <h1 className="text-xl font-bold text-foreground">Print Itaú</h1>
            <p className="text-muted-foreground text-xs">Print de tela — detalhes da compra no app Itaú</p>
          </div>
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowMobilePreview(true)}>
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs flex items-center gap-2">
                  <Smartphone className="h-3.5 w-3.5 text-primary" /> Topo do iPhone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Horário (status bar)</Label>
                    <Input value={formData.horarioIphone} onChange={e => updateField('horarioIphone', e.target.value)} placeholder="11:12" className="text-xs h-8 font-mono" maxLength={5} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Atalho</Label>
                    <Button variant="outline" size="sm" className="h-8 w-full text-[10px]" onClick={definirAgora}>Usar Agora</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs">Detalhes da Compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Descrição (estabelecimento)</Label>
                  <Input value={formData.descricao} onChange={e => updateField('descricao', e.target.value)} placeholder="Ex: Itpac c*acordodebitos" className="text-xs h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Aprovada em</Label>
                  <Input value={formData.aprovadaEm} onChange={e => updateField('aprovadaEm', e.target.value)} placeholder="Aprovada 04 mar 2026 13:23" className="text-xs h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Categoria</Label>
                  <Input value={formData.categoria} onChange={e => updateField('categoria', e.target.value)} placeholder="Categoria: outras despesas de educação" className="text-xs h-8" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs">Valor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Valor Total</Label>
                  <Input value={formData.valorTotal} onChange={e => handleValorChange(e.target.value)} placeholder="R$ 0,00 em 1x" className="text-xs h-8" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-primary" /> Cartão Utilizado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Tipo</Label>
                  <Input value={formData.cartaoTipo} onChange={e => updateField('cartaoTipo', e.target.value)} placeholder="Cartão virtual - compra online" className="text-xs h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Nome do cartão</Label>
                  <Input value={formData.cartaoNome} onChange={e => updateField('cartaoNome', e.target.value)} placeholder="Itau Platinum Final 5676" className="text-xs h-8" />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleGerar} disabled={generating} className="w-full" size="default">
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</> : <><FileDown className="h-4 w-4 mr-2" /> Gerar Print (1 crédito)</>}
            </Button>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-4" style={{ maxWidth: 550 }}>
              <ItauPreview ref={previewRef} formData={formData} />
            </div>
          </div>
        </div>

        {showMobilePreview && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto bg-white rounded-lg">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10" onClick={() => setShowMobilePreview(false)}>
                <X className="h-5 w-5" />
              </Button>
              <ItauPreview ref={previewRef} formData={formData} />
            </div>
          </div>
        )}

        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Print Gerado — Itaú
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 pt-2">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span><strong>Importante:</strong> Baixe e salve agora. O print não é armazenado no sistema por segurança.</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleDownload('png')} className="w-full" size="lg" variant="default">
                      <FileDown className="h-5 w-5 mr-2" /> PNG
                    </Button>
                    <Button onClick={() => handleDownload('pdf')} className="w-full" size="lg" variant="outline">
                      <FileDown className="h-5 w-5 mr-2" /> PDF
                    </Button>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
