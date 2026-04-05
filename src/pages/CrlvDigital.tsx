import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/success-sound';
import { Car, User, Loader2, ArrowLeft, Eye, QrCode, Upload, X, RefreshCw } from 'lucide-react';
import { CrlvPreview, type CrlvPreviewRef } from '@/components/crlv/CrlvPreview';
import WatermarkOverlay from '@/components/cnh/WatermarkOverlay';
import { CrlvPdfEditor } from '@/components/crlv/CrlvPdfEditor';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  generateRenavam, generatePlaca, generateNumeroCRV, generateSegurancaCRV,
  generateCodSegCLA, generateChassi, generateMotor, formatCPF,
  CATEGORIAS_VEICULO, COMBUSTIVEIS, CORES_VEICULO, ESPECIES_TIPO, CARROCERIAS,
  UFS_BRASIL,
} from '@/lib/crlv-utils';
import { crlvService } from '@/lib/crlv-service';

const crlvFormSchema = z.object({
  renavam: z.string().min(8, 'Obrigatório'),
  placa: z.string().min(7, 'Obrigatório'),
  exercicio: z.string().min(4, 'Obrigatório'),
  numeroCrv: z.string().min(5, 'Obrigatório'),
  segurancaCrv: z.string().min(5, 'Obrigatório'),
  codSegCla: z.string().min(5, 'Obrigatório'),
  marcaModelo: z.string().min(3, 'Obrigatório'),
  anoFab: z.string().min(4, 'Obrigatório'),
  anoMod: z.string().min(4, 'Obrigatório'),
  cor: z.string().min(2, 'Obrigatório'),
  combustivel: z.string().min(2, 'Obrigatório'),
  especieTipo: z.string().min(2, 'Obrigatório'),
  categoria: z.string().min(2, 'Obrigatório'),
  catObs: z.string().optional(),
  carroceria: z.string().min(2, 'Obrigatório'),
  chassi: z.string().min(10, 'Obrigatório'),
  placaAnt: z.string().optional(),
  potenciaCil: z.string().min(2, 'Obrigatório'),
  capacidade: z.string().min(1, 'Obrigatório'),
  lotacao: z.string().min(1, 'Obrigatório'),
  pesoBruto: z.string().min(1, 'Obrigatório'),
  motor: z.string().min(3, 'Obrigatório'),
  cmt: z.string().min(1, 'Obrigatório'),
  eixos: z.string().min(1, 'Obrigatório'),
  nomeProprietario: z.string().min(3, 'Obrigatório'),
  cpfCnpj: z.string().min(11, 'Obrigatório'),
  local: z.string().min(3, 'Obrigatório'),
  data: z.string().min(8, 'Obrigatório'),
  uf: z.string().min(2, 'Obrigatório'),
  observacoes: z.string().optional(),
});

type CrlvFormData = z.infer<typeof crlvFormSchema>;

// Compact auto-generate button
function AutoBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 h-7 w-7 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors" title="Gerar automático">
      <RefreshCw className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}

// Section header
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1 mb-2">{children}</p>;
}

export default function CrlvDigital() {
  const { admin, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useDenseQr, setUseDenseQr] = useState(true);
  const [customQrBase64, setCustomQrBase64] = useState<string | null>(null);
  const [customQrPreview, setCustomQrPreview] = useState<string | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [generatedSenha, setGeneratedSenha] = useState<string | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<CrlvPreviewRef>(null);

  const form = useForm<CrlvFormData>({
    resolver: zodResolver(crlvFormSchema),
    mode: 'onChange',
    defaultValues: {
      renavam: generateRenavam(),
      placa: generatePlaca(),
      exercicio: new Date().getFullYear().toString(),
      numeroCrv: generateNumeroCRV(),
      segurancaCrv: generateSegurancaCRV(),
      codSegCla: generateCodSegCLA(),
      marcaModelo: 'VW/GOL 1.0 MPI',
      anoFab: '2024',
      anoMod: '2025',
      cor: 'PRATA',
      combustivel: 'ALCOOL/GASOLINA',
      especieTipo: 'PASSAGEIRO/AUTOMOVEL',
      categoria: 'PARTICULAR',
      catObs: '***',
      carroceria: 'NAO APLICAVEL',
      chassi: generateChassi(),
      placaAnt: '********/**',
      potenciaCil: '76CV / 999CC',
      capacidade: '*.*',
      lotacao: '05',
      pesoBruto: '1.340 KG',
      motor: generateMotor(),
      cmt: '001.34 T',
      eixos: '02',
      nomeProprietario: 'NOME DO PROPRIETARIO',
      cpfCnpj: '',
      local: 'SAO PAULO SP',
      data: new Date().toLocaleDateString('pt-BR'),
      uf: 'SP',
      observacoes: '*.*',
    },
  });

  const cpfValue = form.watch('cpfCnpj');
  const cpfReady = (cpfValue?.replace(/\D/g, '').length ?? 0) >= 11;

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCustomQrBase64(result);
      setCustomQrPreview(result);
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!admin) return <Navigate to="/login" replace />;

  const handleSave = async (data: CrlvFormData) => {
    setIsSubmitting(true);
    try {
      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const isValidSnapshot = (value: string | null) =>
        !!value && value.startsWith('data:image/png;base64,') && value.length > 2000;

      let previewImageBase64: string | null = null;
      for (let attempt = 0; attempt < 30; attempt++) {
        const snapshot = (await previewRef.current?.getSnapshot?.()) ?? null;
        if (isValidSnapshot(snapshot)) {
          previewImageBase64 = snapshot;
          break;
        }
        await wait(150);
      }

      if (!previewImageBase64) {
        toast.warning('Preview atrasou. Gerando no modo padrão para não travar.');
      }

      const payload: any = {
        admin_id: admin.id,
        session_token: admin.session_token || '',
        renavam: data.renavam, placa: data.placa, exercicio: data.exercicio,
        numero_crv: data.numeroCrv, seguranca_crv: data.segurancaCrv, cod_seg_cla: data.codSegCla,
        marca_modelo: data.marcaModelo, ano_fab: data.anoFab, ano_mod: data.anoMod,
        cor: data.cor, combustivel: data.combustivel, especie_tipo: data.especieTipo,
        categoria: data.categoria, cat_obs: data.catObs || '', carroceria: data.carroceria,
        chassi: data.chassi, placa_ant: data.placaAnt || '', potencia_cil: data.potenciaCil,
        capacidade: data.capacidade, lotacao: data.lotacao, peso_bruto: data.pesoBruto,
        motor: data.motor, cmt: data.cmt, eixos: data.eixos,
        nome_proprietario: data.nomeProprietario, cpf_cnpj: data.cpfCnpj,
        local: data.local, data: data.data, uf: data.uf,
        observacoes: data.observacoes || '*.*', preview_image_base64: previewImageBase64,
      };
      if (!useDenseQr && customQrBase64) payload.qrcode_base64 = customQrBase64;

      const result = await crlvService.save(payload);
      if (result.success) {
        playSuccessSound();
        toast.success('CRLV gerado com sucesso!');
        const normalizePdfUrl = (pdfValue: string | null) => {
          if (!pdfValue) return null;
          if (/^https?:\/\//i.test(pdfValue)) return pdfValue;
          const envUrl = import.meta.env.VITE_API_URL as string | undefined;
          const baseUrl = envUrl || (window.location.hostname !== 'localhost' ? window.location.origin : 'http://localhost:4000');
          return `${baseUrl}${pdfValue.startsWith('/') ? pdfValue : `/${pdfValue}`}`;
        };
        setGeneratedPdfUrl(normalizePdfUrl(result.pdf));
        setGeneratedSenha(result.senha || null);
        form.reset();
        setCustomQrBase64(null);
        setCustomQrPreview(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar CRLV');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compact field with auto button
  const FieldWithAuto = ({ name, label, gen, upper }: { name: keyof CrlvFormData; label: string; gen: () => string; upper?: boolean }) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem className="space-y-0.5">
        <FormLabel className="text-[10px] text-muted-foreground">{label}</FormLabel>
        <div className="flex gap-1">
          <FormControl><Input className="h-7 text-xs" {...field} onChange={(e) => field.onChange(upper ? e.target.value.toUpperCase() : e.target.value)} /></FormControl>
          <AutoBtn onClick={() => form.setValue(name, gen())} />
        </div>
        <FormMessage className="text-[10px]" />
      </FormItem>
    )} />
  );

  // Simple compact field
  const Field = ({ name, label, placeholder, upper }: { name: keyof CrlvFormData; label: string; placeholder?: string; upper?: boolean }) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem className="space-y-0.5">
        <FormLabel className="text-[10px] text-muted-foreground">{label}</FormLabel>
        <FormControl><Input className="h-7 text-xs" placeholder={placeholder} {...field} onChange={(e) => field.onChange(upper ? e.target.value.toUpperCase() : e.target.value)} /></FormControl>
        <FormMessage className="text-[10px]" />
      </FormItem>
    )} />
  );

  // Select field
  const SelectField = ({ name, label, options }: { name: keyof CrlvFormData; label: string; options: string[] }) => (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem className="space-y-0.5">
        <FormLabel className="text-[10px] text-muted-foreground">{label}</FormLabel>
        <Select onValueChange={field.onChange} value={field.value}>
          <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger></FormControl>
          <SelectContent>{options.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}</SelectContent>
        </Select>
        <FormMessage className="text-[10px]" />
      </FormItem>
    )} />
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Link to="/servicos">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-1.5">
              <Car className="h-4 w-4 text-primary" />
              CRLV Digital
            </h1>
            <p className="text-[10px] text-muted-foreground">1 crédito • Sem validade</p>
          </div>
        </div>

        {/* CPF Prompt */}
        {!cpfReady && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
            <User className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium">Insira o CPF/CNPJ para desbloquear</p>
              <div className="mt-1.5 max-w-[200px]">
                <Input
                  placeholder="000.000.000-00"
                  value={form.watch('cpfCnpj')}
                  onChange={(e) => form.setValue('cpfCnpj', formatCPF(e.target.value))}
                  maxLength={18}
                  className="h-7 text-xs font-mono"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        {cpfReady && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <p className="text-[10px] text-primary font-medium">CPF/CNPJ: {cpfValue} — QR gerado automaticamente</p>
          </div>
        )}

        <div className="relative">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 transition-all duration-300 ${!cpfReady ? 'opacity-30 pointer-events-none select-none' : ''}`}>
            {/* LEFT: Form */}
            <div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-3">

                  {/* Identificação */}
                  <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                    <SectionTitle>🚗 Identificação do Veículo</SectionTitle>
                    <div className="grid grid-cols-3 gap-2">
                      <FieldWithAuto name="renavam" label="Renavam" gen={generateRenavam} />
                      <FieldWithAuto name="placa" label="Placa" gen={generatePlaca} upper />
                      <Field name="exercicio" label="Exercício" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <FieldWithAuto name="numeroCrv" label="Nº CRV" gen={generateNumeroCRV} />
                      <FieldWithAuto name="segurancaCrv" label="Segurança CRV" gen={generateSegurancaCRV} />
                      <FieldWithAuto name="codSegCla" label="Cód. Seg CLA" gen={generateCodSegCLA} />
                    </div>
                  </div>

                  {/* Características */}
                  <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                    <SectionTitle>📋 Características</SectionTitle>
                    <Field name="marcaModelo" label="Marca / Modelo" upper />
                    <div className="grid grid-cols-4 gap-2">
                      <Field name="anoFab" label="Ano Fab" />
                      <Field name="anoMod" label="Ano Mod" />
                      <SelectField name="cor" label="Cor" options={CORES_VEICULO} />
                      <SelectField name="combustivel" label="Combustível" options={COMBUSTIVEIS} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <SelectField name="especieTipo" label="Espécie / Tipo" options={ESPECIES_TIPO} />
                      <SelectField name="categoria" label="Categoria" options={CATEGORIAS_VEICULO} />
                      <Field name="catObs" label="CAT" placeholder="***" />
                    </div>
                    <SelectField name="carroceria" label="Carroceria" options={CARROCERIAS} />
                  </div>

                  {/* Técnicas */}
                  <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                    <SectionTitle>🔧 Especificações Técnicas</SectionTitle>
                    <div className="grid grid-cols-2 gap-2">
                      <FieldWithAuto name="chassi" label="Chassi" gen={generateChassi} upper />
                      <Field name="placaAnt" label="Placa Anterior" placeholder="Opcional" upper />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Field name="potenciaCil" label="Potência/Cil" />
                      <Field name="capacidade" label="Capacidade" />
                      <Field name="lotacao" label="Lotação" />
                      <Field name="pesoBruto" label="Peso Bruto" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <FieldWithAuto name="motor" label="Motor" gen={generateMotor} upper />
                      <Field name="cmt" label="CMT" />
                      <Field name="eixos" label="Eixos" />
                    </div>
                  </div>

                  {/* Proprietário */}
                  <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                    <SectionTitle>👤 Proprietário</SectionTitle>
                    <div className="grid grid-cols-2 gap-2">
                      <Field name="nomeProprietario" label="Nome" upper />
                      <FormField control={form.control} name="cpfCnpj" render={({ field }) => (
                        <FormItem className="space-y-0.5">
                          <FormLabel className="text-[10px] text-muted-foreground">CPF/CNPJ</FormLabel>
                          <FormControl><Input className="h-7 text-xs font-mono" {...field} onChange={(e) => field.onChange(formatCPF(e.target.value))} maxLength={18} /></FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Field name="local" label="Local" upper />
                      <Field name="data" label="Data Emissão" />
                      <SelectField name="uf" label="UF" options={UFS_BRASIL} />
                    </div>
                  </div>

                  {/* Obs & QR */}
                  <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                    <SectionTitle>📝 Observações & QR Code</SectionTitle>
                    <FormField control={form.control} name="observacoes" render={({ field }) => (
                      <FormItem className="space-y-0.5">
                        <FormLabel className="text-[10px] text-muted-foreground">Observações</FormLabel>
                        <FormControl><Textarea className="text-xs min-h-[50px] resize-none" placeholder="*.*" {...field} /></FormControl>
                      </FormItem>
                    )} />

                    <div className="flex items-center gap-2 pt-1">
                      <Switch id="dense-qr" checked={useDenseQr} onCheckedChange={(checked) => { setUseDenseQr(checked); if (checked) { setCustomQrBase64(null); setCustomQrPreview(null); } }} className="scale-75" />
                      <Label htmlFor="dense-qr" className="text-[10px]">
                        {useDenseQr ? 'QR automático ✅' : 'QR personalizado (upload)'}
                      </Label>
                    </div>

                    {!useDenseQr && (
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => qrInputRef.current?.click()}>
                          <Upload className="h-3 w-3" /> Upload
                        </Button>
                        <input ref={qrInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleQrUpload} />
                        {customQrPreview && (
                          <>
                            <img src={customQrPreview} alt="QR" className="h-8 w-8 rounded border border-border object-contain" />
                            <button type="button" onClick={() => { setCustomQrBase64(null); setCustomQrPreview(null); }} className="text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit */}
                  <Button type="submit" disabled={isSubmitting} className="w-full h-9 text-sm font-bold gap-2">
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
                    ) : (
                      <><Car className="h-4 w-4" /> Gerar CRLV — 1 crédito</>
                    )}
                  </Button>
                </form>
              </Form>

              {generatedPdfUrl && (
                <CrlvPdfEditor
                  pdfUrl={generatedPdfUrl}
                  senha={generatedSenha}
                  onClose={() => { setGeneratedPdfUrl(null); setGeneratedSenha(null); }}
                />
              )}
            </div>

            {/* Hidden preview for capture */}
            <div className="fixed -left-[9999px] top-0 w-[595px] h-[842px] opacity-0 pointer-events-none">
              <CrlvPreview ref={previewRef} form={form} customQrPreview={customQrPreview} showDenseQr={useDenseQr} />
            </div>

            {/* RIGHT: Preview */}
            <div className="hidden lg:block">
              <div className="sticky top-4 space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Preview em tempo real
                </p>
                <div className="relative">
                  <CrlvPreview form={form} customQrPreview={customQrPreview} showDenseQr={useDenseQr} />
                  <WatermarkOverlay />
                </div>
              </div>
            </div>
          </div>

          {!cpfReady && (
            <div className="pointer-events-none absolute inset-0 hidden lg:flex items-center justify-center">
              <div className="rounded-lg border border-border bg-background/90 px-3 py-2 shadow">
                <p className="text-[10px] font-medium">Aguardando CPF/CNPJ</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
