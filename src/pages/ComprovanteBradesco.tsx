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
  'Nu Pagamentos S.A.',
  'Itaú Unibanco S.A.',
  'Banco Bradesco S.A.',
  'Banco do Brasil S.A.',
  'Caixa Econômica Federal',
  'Banco Santander (Brasil) S.A.',
  'Banco Inter S.A.',
  'Banco C6 S.A.',
  'Mercado Pago - Instituição de Pagamento',
  'PagSeguro Internet S.A. - Instituição de Pagamento',
  'PicPay Serviços S.A. - Instituição de Pagamento',
  'Banco Original S.A.',
  'Banco Pan S.A.',
  'Banco Safra S.A.',
  'Banco BTG Pactual S.A.',
  'Banco Sicoob S.A.',
  'Banco Sicredi S.A.',
  'Banco Votorantim S.A.',
  'Banco Next S.A.',
  'Neon Pagamentos S.A. - Instituição de Pagamento',
  'Stone Instituição de Pagamento S.A.',
  'Ame Digital Brasil - Instituição de Pagamento',
  'Will Financeira S.A.',
  'Banco Daycoval S.A.',
  'Banco BMG S.A.',
  'Banco Agibank S.A.',
  'Banco Modal S.A.',
  'Banco BS2 S.A.',
  'Banco Banrisul S.A.',
  'Banco do Nordeste do Brasil S.A.',
  'Banco da Amazônia S.A.',
  'RecargaPay Instituição de Pagamento S.A.',
];

export default function ComprovanteBradesco() {
  const { admin, credits, loading, refreshCredits } = useAuth();
  const previewRef = useRef<BradescoPreviewRef>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [tipoChavePix, setTipoChavePix] = useState<string>('email');
  const [tipoDocPagador, setTipoDocPagador] = useState<string>('cpf');
  const [tipoDocRecebedor, setTipoDocRecebedor] = useState<string>('cpf');

  const generateControle = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const now = new Date();
    const prefix = 'E' + String(Math.floor(Math.random() * 9e9)).padStart(10, '0');
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    let suffix = '';
    for (let i = 0; i < 8; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
    return prefix + datePart + suffix;
  };

  const generateAutenticacao = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#*?@';
    const groups: string[] = [];
    for (let g = 0; g < 25; g++) {
      let word = '';
      for (let i = 0; i < 8; i++) word += chars[Math.floor(Math.random() * chars.length)];
      groups.push(word);
    }
    const line1 = groups.slice(0, 9).join(' ');
    const line2 = groups.slice(9, 18).join(' ');
    const line3 = groups.slice(18, 23).join(' ') + ' ' + String(Math.floor(Math.random() * 99999999)).padStart(8, '0') + ' ' + String(Math.floor(Math.random() * 99999999)).padStart(8, '0') + ' 0';
    return `${line1}\n${line2}\n${line3}`;
  };

  const [formData, setFormData] = useState<BradescoFormData>({
    numeroControle: generateControle(),
    dataHora: '',
    valor: '',
    nomePagador: '',
    cpfPagador: '',
    instituicaoPagador: 'Bradesco S/A',
    debitarDa: 'Conta-Corrente',
    nomeRecebedor: '',
    cpfRecebedor: '',
    instituicaoRecebedor: '',
    chavePix: '',
    transacaoCelular: 'Transação concluída pelo BRADESCO CELULAR',
    autenticacao: generateAutenticacao(),
  });

  const updateField = useCallback((key: keyof BradescoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCpfMasked = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 11) {
      return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
    }
    return digits;
  };

  const handleCnpjMasked = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length === 14) {
      return `**.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-**`;
    }
    return digits;
  };

  const handleDocInput = (value: string, tipo: string): string => {
    if (tipo === 'cnpj') return handleCnpjMasked(value);
    return handleCpfMasked(value);
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

  const handleGerarPdf = async () => {
    if (!admin) return;
    const camposObrigatorios: { key: keyof BradescoFormData; nome: string }[] = [
      { key: 'dataHora', nome: 'Data e Hora' },
      { key: 'numeroControle', nome: 'Número de Controle' },
      { key: 'nomePagador', nome: 'Nome do Pagador' },
      { key: 'cpfPagador', nome: 'CPF/CNPJ do Pagador' },
      { key: 'valor', nome: 'Valor' },
      { key: 'nomeRecebedor', nome: 'Nome do Recebedor' },
      { key: 'cpfRecebedor', nome: 'CPF/CNPJ do Recebedor' },
      { key: 'instituicaoRecebedor', nome: 'Instituição do Recebedor' },
      { key: 'chavePix', nome: 'Chave Pix' },
      { key: 'autenticacao', nome: 'Autenticação' },
    ];
    const faltando = camposObrigatorios.filter(c => !formData[c.key]?.trim());
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
      setFormData({
        numeroControle: generateControle(),
        dataHora: '',
        valor: '',
        nomePagador: '',
        cpfPagador: '',
        instituicaoPagador: 'Bradesco S/A',
        debitarDa: 'Conta-Corrente',
        nomeRecebedor: '',
        cpfRecebedor: '',
        instituicaoRecebedor: '',
        chavePix: '',
        transacaoCelular: 'Transação concluída pelo BRADESCO CELULAR',
        autenticacao: generateAutenticacao(),
      });
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
            {/* Dados Gerais */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Dados Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Data e Hora</Label>
                  <div className="flex gap-2">
                    <Input value={formData.dataHora} onChange={e => updateField('dataHora', e.target.value)} placeholder="23/07/2025 - 18:25:11" className="text-xs" />
                    <Button variant="outline" size="sm" onClick={definirDataAtual}>Agora</Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Número de Controle</Label>
                  <div className="flex gap-2">
                    <Input value={formData.numeroControle} onChange={e => updateField('numeroControle', e.target.value)} className="text-xs font-mono" />
                    <Button variant="outline" size="sm" onClick={() => updateField('numeroControle', generateControle())}>Gerar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados de quem pagou */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Dados de quem pagou</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome</Label>
                  <Input value={formData.nomePagador} onChange={e => updateField('nomePagador', e.target.value.toUpperCase())} placeholder="NOME COMPLETO" className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de Documento</Label>
                  <Select value={tipoDocPagador} onValueChange={(v) => { setTipoDocPagador(v); updateField('cpfPagador', ''); }}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{tipoDocPagador === 'cnpj' ? 'CNPJ' : 'CPF'}</Label>
                  <Input
                    value={formData.cpfPagador}
                    onChange={e => updateField('cpfPagador', handleDocInput(e.target.value, tipoDocPagador))}
                    placeholder={tipoDocPagador === 'cnpj' ? '**.000.000/0000-**' : '***.000.000-**'}
                    className="text-xs"
                    maxLength={tipoDocPagador === 'cnpj' ? 18 : 14}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dados da Transação */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Dados da Transação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor</Label>
                  <Input value={formData.valor} onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (!raw) { updateField('valor', ''); return; }
                    const num = parseInt(raw, 10);
                    const formatted = (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    updateField('valor', formatted);
                  }} placeholder="0,00" className="text-xs" />
                </div>
              </CardContent>
            </Card>

            {/* Dados de quem recebeu */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Dados de quem recebeu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome</Label>
                  <Input value={formData.nomeRecebedor} onChange={e => updateField('nomeRecebedor', e.target.value.toUpperCase())} placeholder="NOME COMPLETO" className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de Documento</Label>
                  <Select value={tipoDocRecebedor} onValueChange={(v) => { setTipoDocRecebedor(v); updateField('cpfRecebedor', ''); }}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{tipoDocRecebedor === 'cnpj' ? 'CNPJ' : 'CPF'}</Label>
                  <Input
                    value={formData.cpfRecebedor}
                    onChange={e => updateField('cpfRecebedor', handleDocInput(e.target.value, tipoDocRecebedor))}
                    placeholder={tipoDocRecebedor === 'cnpj' ? '**.000.000/0000-**' : '***.000.000-**'}
                    className="text-xs"
                    maxLength={tipoDocRecebedor === 'cnpj' ? 18 : 14}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Instituição</Label>
                  <Select value={formData.instituicaoRecebedor} onValueChange={v => updateField('instituicaoRecebedor', v)}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                    <SelectContent>
                      {BANCOS.map(b => <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo da Chave Pix</Label>
                  <Select value={tipoChavePix} onValueChange={setTipoChavePix}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="telefone">Telefone</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Chave Pix</Label>
                  <Input
                    value={formData.chavePix}
                    onChange={e => {
                      let v = e.target.value;
                      if (tipoChavePix === 'email') v = v.toLowerCase();
                      else if (tipoChavePix === 'cpf') {
                        const d = v.replace(/\D/g, '').slice(0, 11);
                        v = d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : d;
                      } else if (tipoChavePix === 'cnpj') {
                        const d = v.replace(/\D/g, '').slice(0, 14);
                        v = d.length === 14 ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : d;
                      } else if (tipoChavePix === 'telefone') {
                        const d = v.replace(/\D/g, '').slice(0, 11);
                        v = d.length === 11 ? d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : d.length === 10 ? d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3') : d;
                      }
                      updateField('chavePix', v);
                    }}
                    placeholder={tipoChavePix === 'email' ? 'email@exemplo.com' : tipoChavePix === 'telefone' ? '(00) 00000-0000' : tipoChavePix === 'cpf' ? '000.000.000-00' : tipoChavePix === 'cnpj' ? '00.000.000/0000-00' : 'Chave Aleatória'}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rodapé e Autenticação */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Rodapé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de Transação</Label>
                  <Select value={formData.transacaoCelular} onValueChange={v => updateField('transacaoCelular', v)}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transação concluída pelo BRADESCO CELULAR">BRADESCO CELULAR</SelectItem>
                      <SelectItem value="Transação concluída pelo INTERNET BANKING">INTERNET BANKING</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Autenticação</Label>
                  <div className="flex gap-2">
                    <textarea
                      value={formData.autenticacao}
                      onChange={e => updateField('autenticacao', e.target.value)}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      rows={3}
                    />
                    <Button variant="outline" size="sm" onClick={() => updateField('autenticacao', generateAutenticacao())}>Gerar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão Gerar */}
            <Button onClick={handleGerarPdf} disabled={generating} className="w-full" size="lg">
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</> : <><FileDown className="h-4 w-4 mr-2" /> Gerar Comprovante (1 crédito)</>}
            </Button>
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
