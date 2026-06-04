import { useState, useRef, useCallback, useEffect } from 'react';
import { useFormGuard } from '@/hooks/useFormGuard';
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
import { InterPreview, type InterPreviewRef, type InterFormData, PAGE_W, PAGE_H } from '@/components/inter/InterPreview';
import api from '@/lib/api';

const BANCOS = [
  'Banco Inter S.A.',
  'Nu Pagamentos S.A.',
  'Itaú Unibanco S.A.',
  'Banco Bradesco S.A.',
  'Banco do Brasil S.A.',
  'Caixa Econômica Federal',
  'Banco Santander (Brasil) S.A.',
  'Banco C6 S.A.',
  'Mercado Pago - Instituição de Pagamento',
  'PagSeguro Internet S.A. - Instituição de Pagamento',
  'PicPay Serviços S.A. - Instituição de Pagamento',
  'BCO ITAÚ S.A',
  'Banco Original S.A.',
  'Banco Pan S.A.',
  'Banco Safra S.A.',
  'Banco BTG Pactual S.A.',
  'Banco Sicoob S.A.',
  'Banco Sicredi S.A.',
  'Banco Next S.A.',
  'Neon Pagamentos S.A. - Instituição de Pagamento',
  'Stone Instituição de Pagamento S.A.',
  'Banco Daycoval S.A.',
  'Banco BMG S.A.',
  'Banco Agibank S.A.',
  'Banco BS2 S.A.',
  'Banco Banrisul S.A.',
];

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function formatExtenso(d: Date) {
  const dow = DIAS_SEMANA[d.getDay()];
  const day = d.getDate();
  const mon = MESES_ABREV[d.getMonth()];
  const yr = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dow}, ${day} ${mon} ${yr} ${hh}:${mm}:${ss}`;
}
function formatBR(d: Date, withTime = false) {
  const dow = DIAS_SEMANA[d.getDay()];
  const day = String(d.getDate()).padStart(2, '0');
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const yr = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return withTime ? `${dow}, ${day}/${mon}/${yr} ${hh}:${mm}:${ss}` : `${dow}, ${day}/${mon}/${yr}`;
}
function genBoleto() {
  const r = (n: number) => String(Math.floor(Math.random() * Math.pow(10, n))).padStart(n, '0');
  return {
    l1: `${r(5)}.${r(5)} ${r(5)}.${r(6)} ${r(5)}.${r(6)} ${Math.floor(Math.random() * 9) + 1}`,
    l2: r(11),
  };
}

export default function ComprovanteInter() {
  const { admin, credits, loading, refreshCredits } = useAuth();
  const previewRef = useRef<InterPreviewRef>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [tipoDocRecebedor, setTipoDocRecebedor] = useState<string>('cnpj');
  const [hasTouched, setHasTouched] = useState(false);

  const { setFormDirty } = useFormGuard();
  useEffect(() => {
    if (hasTouched) setFormDirty(true);
    return () => setFormDirty(false);
  }, [hasTouched, setFormDirty]);

  const boleto = genBoleto();
  const [formData, setFormData] = useState<InterFormData>({
    valorPrincipal: '',
    dataHora: '',
    descricao: 'Pagamento',
    valorOriginal: '',
    desconto: 'R$ 0,00',
    juros: 'R$ 0,00',
    multa: 'R$ 0,00',
    valorTotal: '',
    dataVencimento: '',
    dataPagamento: '',
    codigoBarras1: boleto.l1,
    codigoBarras2: boleto.l2,
    beneficiario: '',
    cpfRecebedor: '',
    instituicaoRecebedor: '',
    nomePagador: '',
    instituicaoPagador: 'Banco Inter S.A.',
    agencia: '0001',
    conta: '',
  });

  const updateField = useCallback((key: keyof InterFormData, value: string) => {
    setHasTouched(true);
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const formatMoney = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits, 10);
    return 'R$ ' + (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleValorChange = (key: keyof InterFormData, raw: string) => {
    updateField(key, formatMoney(raw));
  };

  const handleCpfMasked = (value: string): string => {
    const d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    return d;
  };
  const handleCnpjMasked = (value: string): string => {
    const d = value.replace(/\D/g, '').slice(0, 14);
    if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
    return d;
  };

  const definirAgora = useCallback(() => {
    const now = new Date();
    updateField('dataHora', formatExtenso(now));
    updateField('dataPagamento', formatBR(now, true));
    const venc = new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000);
    updateField('dataVencimento', formatBR(venc));
  }, [updateField]);

  const handleCopiarValor = () => {
    if (formData.valorPrincipal) {
      updateField('valorOriginal', formData.valorPrincipal);
      updateField('valorTotal', formData.valorPrincipal);
    }
  };

  const handleGerarPdf = async () => {
    if (!admin) return;
    const obrig: { key: keyof InterFormData; nome: string }[] = [
      { key: 'valorPrincipal', nome: 'Valor' },
      { key: 'dataHora', nome: 'Data e Hora' },
      { key: 'valorOriginal', nome: 'Valor Original' },
      { key: 'valorTotal', nome: 'Valor Total' },
      { key: 'dataPagamento', nome: 'Data Pagamento' },
      { key: 'dataVencimento', nome: 'Data Vencimento' },
      { key: 'beneficiario', nome: 'Beneficiário' },
      { key: 'cpfRecebedor', nome: 'CPF/CNPJ Recebedor' },
      { key: 'instituicaoRecebedor', nome: 'Instituição Emissora' },
      { key: 'nomePagador', nome: 'Nome do Pagador' },
      { key: 'conta', nome: 'Conta' },
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
      if (!snapshot) { toast.error('Erro ao capturar comprovante'); return; }

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
      const url = URL.createObjectURL(blob);
      setGeneratedPdfUrl(url);

      try {
        await api.credits.transfer(admin.id, admin.id, 1);
      } catch {
        console.warn('Credit debit via transfer failed, PDF still generated');
      }
      await refreshCredits();

      const novoBoleto = genBoleto();
      setFormData({
        valorPrincipal: '',
        dataHora: '',
        descricao: 'Pagamento',
        valorOriginal: '',
        desconto: 'R$ 0,00',
        juros: 'R$ 0,00',
        multa: 'R$ 0,00',
        valorTotal: '',
        dataVencimento: '',
        dataPagamento: '',
        codigoBarras1: novoBoleto.l1,
        codigoBarras2: novoBoleto.l2,
        beneficiario: '',
        cpfRecebedor: '',
        instituicaoRecebedor: '',
        nomePagador: '',
        instituicaoPagador: 'Banco Inter S.A.',
        agencia: '0001',
        conta: '',
      });
      setHasTouched(false);
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
    a.download = 'comprovante-inter.pdf';
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
            <h1 className="text-xl font-bold text-foreground">Comprovante Inter</h1>
            <p className="text-muted-foreground text-xs">Preencha os dados e gere o comprovante</p>
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
                  <Receipt className="h-3.5 w-3.5 text-primary" /> Cabeçalho
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Valor Principal</Label>
                    <Input value={formData.valorPrincipal} onChange={e => handleValorChange('valorPrincipal', e.target.value)} placeholder="R$ 0,00" className="text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Data/Hora (extenso)</Label>
                    <div className="flex gap-1">
                      <Input value={formData.dataHora} onChange={e => updateField('dataHora', e.target.value)} placeholder="Sexta, 17 Abr 2026 15:53:12" className="text-xs h-8" />
                      <Button variant="outline" size="sm" className="h-8 px-2 text-[10px]" onClick={definirAgora}>Agora</Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Descrição</Label>
                  <Input value={formData.descricao} onChange={e => updateField('descricao', e.target.value)} className="text-xs h-8" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs">Sobre a Transação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Valor Original</Label>
                    <div className="flex gap-1">
                      <Input value={formData.valorOriginal} onChange={e => handleValorChange('valorOriginal', e.target.value)} placeholder="R$ 0,00" className="text-xs h-8" />
                      <Button variant="outline" size="sm" className="h-8 px-2 text-[10px]" onClick={handleCopiarValor}>=</Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Valor Total</Label>
                    <Input value={formData.valorTotal} onChange={e => handleValorChange('valorTotal', e.target.value)} placeholder="R$ 0,00" className="text-xs h-8" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Desconto</Label>
                    <Input value={formData.desconto} onChange={e => handleValorChange('desconto', e.target.value)} className="text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Juros</Label>
                    <Input value={formData.juros} onChange={e => handleValorChange('juros', e.target.value)} className="text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Multa</Label>
                    <Input value={formData.multa} onChange={e => handleValorChange('multa', e.target.value)} className="text-xs h-8" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Data Vencimento</Label>
                    <Input value={formData.dataVencimento} onChange={e => updateField('dataVencimento', e.target.value)} placeholder="Sábado, 09/05/2026" className="text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Data Pagamento</Label>
                    <Input value={formData.dataPagamento} onChange={e => updateField('dataPagamento', e.target.value)} placeholder="Quarta, 17/04/2026 15:53:12" className="text-xs h-8" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Código de Barras (linha 1)</Label>
                    <Input value={formData.codigoBarras1} onChange={e => updateField('codigoBarras1', e.target.value)} className="text-xs h-8 font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Código de Barras (linha 2)</Label>
                    <div className="flex gap-1">
                      <Input value={formData.codigoBarras2} onChange={e => updateField('codigoBarras2', e.target.value)} className="text-xs h-8 font-mono" />
                      <Button variant="outline" size="sm" className="h-8 px-2 text-[10px]" onClick={() => { const b = genBoleto(); updateField('codigoBarras1', b.l1); updateField('codigoBarras2', b.l2); }}>Gerar</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs">Quem Recebeu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Beneficiário</Label>
                  <Input value={formData.beneficiario} onChange={e => updateField('beneficiario', e.target.value.toUpperCase())} placeholder="NOME COMPLETO" className="text-xs h-8" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Tipo Doc</Label>
                    <Select value={tipoDocRecebedor} onValueChange={(v) => { setTipoDocRecebedor(v); updateField('cpfRecebedor', ''); }}>
                      <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">{tipoDocRecebedor === 'cnpj' ? 'CNPJ' : 'CPF'}</Label>
                    <Input
                      value={formData.cpfRecebedor}
                      onChange={e => updateField('cpfRecebedor', tipoDocRecebedor === 'cnpj' ? handleCnpjMasked(e.target.value) : handleCpfMasked(e.target.value))}
                      placeholder={tipoDocRecebedor === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
                      className="text-xs h-8"
                      maxLength={tipoDocRecebedor === 'cnpj' ? 18 : 14}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Instituição Emissora</Label>
                  <Select value={formData.instituicaoRecebedor} onValueChange={v => updateField('instituicaoRecebedor', v)}>
                    <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                    <SelectContent>
                      {BANCOS.map(b => <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs">Quem Pagou</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Nome</Label>
                  <Input value={formData.nomePagador} onChange={e => updateField('nomePagador', e.target.value.toUpperCase())} placeholder="NOME / RAZÃO SOCIAL" className="text-xs h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Instituição</Label>
                  <Input value="Banco Inter S.A." readOnly disabled className="text-xs h-8 opacity-70 cursor-not-allowed" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Agência</Label>
                    <Input value={formData.agencia} onChange={e => updateField('agencia', e.target.value)} className="text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Conta</Label>
                    <Input value={formData.conta} onChange={e => updateField('conta', e.target.value)} className="text-xs h-8" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleGerarPdf} disabled={generating} className="w-full" size="default">
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</> : <><FileDown className="h-4 w-4 mr-2" /> Gerar Comprovante (1 crédito)</>}
            </Button>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-4" style={{ maxWidth: 550 }}>
              <InterPreview ref={previewRef} formData={formData} />
            </div>
          </div>
        </div>

        {showMobilePreview && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto bg-white rounded-lg">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10" onClick={() => setShowMobilePreview(false)}>
                <X className="h-5 w-5" />
              </Button>
              <InterPreview ref={previewRef} formData={formData} />
            </div>
          </div>
        )}

        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Comprovante Gerado — Inter
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 pt-2">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span><strong>Importante:</strong> Baixe e salve o arquivo agora. O comprovante não é armazenado no sistema por segurança.</span>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-xs text-muted-foreground mb-1">Formato do arquivo</p>
                    <p className="text-sm font-medium font-mono">comprovante-inter.pdf</p>
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
