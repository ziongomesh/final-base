import { useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/success-sound';
import { Loader2, Receipt, Copy, Check, Download, Eye, X } from 'lucide-react';
import { PicpayPreview, type PicpayPreviewRef, type PicpayFormData } from '@/components/picpay/PicpayPreview';
import { mysqlApi } from '@/lib/api-mysql';

function generateTransactionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function formatCPFMask(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

export default function ComprovantePicpay() {
  const { admin, loading } = useAuth();
  const previewRef = useRef<PicpayPreviewRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [generatedData, setGeneratedData] = useState<{ pdfUrl: string; senha: string } | null>(null);

  const [formData, setFormData] = useState<PicpayFormData>({
    valor: '',
    paraNome: '',
    paraCpf: '',
    paraInstituicao: '',
    deNome: '',
    deCpf: '',
    deInstituicao: '',
    transactionId: '',
    chavePix: '',
    dadosBancarios: '',
  });

  const updateField = useCallback((key: keyof PicpayFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleAutoGenerate = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    setFormData(prev => ({
      ...prev,
      transactionId: prev.transactionId || generateTransactionId(),
      dataHora: prev.dataHora || `${dateStr} às ${timeStr}`,
    }));
  };

  const hasAnyData = Object.values(formData).some(v => v.trim() !== '');

  const handleSubmit = async () => {
    if (!admin) return;

    if (!formData.valor.trim() || !formData.paraNome.trim() || !formData.deNome.trim()) {
      toast.error('Preencha pelo menos Valor, Nome do destinatário e Nome do remetente');
      return;
    }

    setIsSubmitting(true);
    try {
      // Auto-fill missing fields
      handleAutoGenerate();

      // Wait for canvas to update
      await new Promise(r => setTimeout(r, 300));

      const snapshot = await previewRef.current?.getSnapshot();
      if (!snapshot) {
        toast.error('Erro ao capturar preview');
        return;
      }

      // Generate password
      const senha = Math.random().toString(36).slice(2, 10);

      // Send to backend
      const result = await mysqlApi.picpay.save({
        adminId: admin.id,
        nome: formData.paraNome,
        cpf: formData.paraCpf.replace(/\D/g, ''),
        snapshot,
        senha,
        formData,
      });

      playSuccessSound();
      setGeneratedData({ pdfUrl: result.pdfUrl, senha });
      toast.success('Comprovante PicPay criado com sucesso!');

      // Copy data
      const copyText = [
        `👤 CPF: ${formData.paraCpf || 'N/A'}`,
        `🔑 Senha: ${senha}`,
        `📅 Validade: Indeterminada`,
        '',
        `⚠️ INFORMAÇÕES DO SERVIÇO`,
        `Tipo: Comprovante PIX PicPay`,
        `Criado em: ${new Date().toLocaleDateString('pt-BR')}`,
      ].join('\n');

      try {
        await navigator.clipboard.writeText(copyText);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {}

      // Clear form
      setFormData({
        valor: '', paraNome: '', paraCpf: '', paraInstituicao: '',
        deNome: '', deCpf: '', deInstituicao: '',
        transactionId: '', chavePix: '', dadosBancarios: '', dataHora: '',
      });
    } catch (error: any) {
      toast.error('Erro ao criar comprovante', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
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
            <h1 className="text-2xl font-bold text-foreground">Comprovante PIX PicPay</h1>
            <p className="text-muted-foreground text-sm">Preencha os dados e gere o comprovante</p>
          </div>
          {/* Mobile preview toggle */}
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
            {/* Valor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Valor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Valor (R$)</Label>
                  <Input
                    placeholder="R$ 150,00"
                    value={formData.valor}
                    onChange={(e) => updateField('valor', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Para (destinatário) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Para (Destinatário)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Nome</Label>
                  <Input
                    placeholder="Nome do destinatário"
                    value={formData.paraNome}
                    onChange={(e) => updateField('paraNome', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">CPF/CNPJ</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={formData.paraCpf}
                    onChange={(e) => updateField('paraCpf', formatCPFMask(e.target.value))}
                    maxLength={18}
                  />
                </div>
                <div>
                  <Label className="text-xs">Instituição</Label>
                  <Input
                    placeholder="Banco do destinatário"
                    value={formData.paraInstituicao}
                    onChange={(e) => updateField('paraInstituicao', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* De (remetente) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">De (Remetente)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Nome</Label>
                  <Input
                    placeholder="Nome do remetente"
                    value={formData.deNome}
                    onChange={(e) => updateField('deNome', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">CPF/CNPJ</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={formData.deCpf}
                    onChange={(e) => updateField('deCpf', formatCPFMask(e.target.value))}
                    maxLength={18}
                  />
                </div>
                <div>
                  <Label className="text-xs">Instituição</Label>
                  <Input
                    placeholder="PICPAY"
                    value={formData.deInstituicao}
                    onChange={(e) => updateField('deInstituicao', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Detalhes da transação */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Detalhes da Transação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">ID da Transação</Label>
                    <Input
                      placeholder="Auto-gerado"
                      value={formData.transactionId}
                      onChange={(e) => updateField('transactionId', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    className="mt-5 h-9 px-3 text-xs font-semibold"
                    onClick={() => updateField('transactionId', generateTransactionId())}
                  >
                    AUTO
                  </Button>
                </div>
                <div>
                  <Label className="text-xs">Chave Pix do Recebedor</Label>
                  <Input
                    placeholder="CPF, email, telefone ou chave aleatória"
                    value={formData.chavePix}
                    onChange={(e) => updateField('chavePix', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Dados Bancários do Recebedor</Label>
                  <Input
                    placeholder="Banco, agência, conta"
                    value={formData.dadosBancarios}
                    onChange={(e) => updateField('dadosBancarios', e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Data e Hora</Label>
                    <Input
                      placeholder="Auto-gerado"
                      value={formData.dataHora}
                      onChange={(e) => updateField('dataHora', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    className="mt-5 h-9 px-3 text-xs font-semibold"
                    onClick={() => {
                      const now = new Date();
                      const dateStr = now.toLocaleDateString('pt-BR');
                      const timeStr = now.toLocaleTimeString('pt-BR');
                      updateField('dataHora', `${dateStr} às ${timeStr}`);
                    }}
                  >
                    AUTO
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-12 text-base font-semibold"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando...</>
              ) : (
                <><Receipt className="mr-2 h-5 w-5" /> Criar Comprovante (1 crédito)</>
              )}
            </Button>

            {/* Success data */}
            {generatedData && hasAnyData === false && (
              <Card className="border-green-500/50 bg-green-500/5">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                    <Check className="h-4 w-4" />
                    Comprovante criado!
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.open(generatedData.pdfUrl, '_blank');
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Baixar PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 3000);
                      }}
                    >
                      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copied ? 'Copiado!' : 'Copiar Dados'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
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
