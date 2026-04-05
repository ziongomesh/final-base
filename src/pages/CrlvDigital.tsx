import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/success-sound';
import {
  Car, User, Loader2, ArrowLeft, Wrench, FileText, Eye, ClipboardList, QrCode, Upload, X, ChevronLeft, ChevronRight
} from 'lucide-react';
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
import { Link } from 'react-router-dom';

// Schema
const crlvFormSchema = z.object({
  // 1. Identificação
  renavam: z.string().min(8, 'Renavam obrigatório'),
  placa: z.string().min(7, 'Placa obrigatória'),
  exercicio: z.string().min(4, 'Exercício obrigatório'),
  numeroCrv: z.string().min(5, 'Número CRV obrigatório'),
  segurancaCrv: z.string().min(5, 'Segurança CRV obrigatória'),
  codSegCla: z.string().min(5, 'Cód. Seg CLA obrigatório'),
  // 2. Características
  marcaModelo: z.string().min(3, 'Marca/Modelo obrigatório'),
  anoFab: z.string().min(4, 'Ano fabricação obrigatório'),
  anoMod: z.string().min(4, 'Ano modelo obrigatório'),
  cor: z.string().min(2, 'Cor obrigatória'),
  combustivel: z.string().min(2, 'Combustível obrigatório'),
  especieTipo: z.string().min(2, 'Espécie/Tipo obrigatório'),
  categoria: z.string().min(2, 'Categoria obrigatória'),
  catObs: z.string().optional(),
  carroceria: z.string().min(2, 'Carroceria obrigatória'),
  // 3. Especificações técnicas
  chassi: z.string().min(10, 'Chassi obrigatório'),
  placaAnt: z.string().optional(),
  potenciaCil: z.string().min(2, 'Potência/Cil obrigatório'),
  capacidade: z.string().min(1, 'Capacidade obrigatória'),
  lotacao: z.string().min(1, 'Lotação obrigatória'),
  pesoBruto: z.string().min(1, 'Peso bruto obrigatório'),
  motor: z.string().min(3, 'Motor obrigatório'),
  cmt: z.string().min(1, 'CMT obrigatório'),
  eixos: z.string().min(1, 'Eixos obrigatório'),
  // 4. Proprietário
  nomeProprietario: z.string().min(3, 'Nome obrigatório'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ obrigatório'),
  local: z.string().min(3, 'Local obrigatório'),
  data: z.string().min(8, 'Data obrigatória'),
  uf: z.string().min(2, 'UF obrigatória'),
  // 5. Observações
  observacoes: z.string().optional(),
});

type CrlvFormData = z.infer<typeof crlvFormSchema>;

// Auto-generate button
function AutoButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant="default" className="h-8 px-3 text-xs font-semibold" onClick={onClick}>
      AUTO
    </Button>
  );
}

export default function CrlvDigital() {
  const { admin, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [useDenseQr, setUseDenseQr] = useState(true);
  const [customQrBase64, setCustomQrBase64] = useState<string | null>(null);
  const [customQrPreview, setCustomQrPreview] = useState<string | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [generatedSenha, setGeneratedSenha] = useState<string | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<CrlvPreviewRef>(null);
  const hasShownNotice = useRef(false);

  const STEPS = [
    { label: 'Identificação', icon: Car },
    { label: 'Características', icon: ClipboardList },
    { label: 'Técnicas', icon: Wrench },
    { label: 'Proprietário', icon: User },
    { label: 'Obs & QR', icon: QrCode },
  ];

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

  // Notificação ao entrar no módulo
  // No initial toast needed - CPF card handles the prompt

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
        renavam: data.renavam,
        placa: data.placa,
        exercicio: data.exercicio,
        numero_crv: data.numeroCrv,
        seguranca_crv: data.segurancaCrv,
        cod_seg_cla: data.codSegCla,
        marca_modelo: data.marcaModelo,
        ano_fab: data.anoFab,
        ano_mod: data.anoMod,
        cor: data.cor,
        combustivel: data.combustivel,
        especie_tipo: data.especieTipo,
        categoria: data.categoria,
        cat_obs: data.catObs || '',
        carroceria: data.carroceria,
        chassi: data.chassi,
        placa_ant: data.placaAnt || '',
        potencia_cil: data.potenciaCil,
        capacidade: data.capacidade,
        lotacao: data.lotacao,
        peso_bruto: data.pesoBruto,
        motor: data.motor,
        cmt: data.cmt,
        eixos: data.eixos,
        nome_proprietario: data.nomeProprietario,
        cpf_cnpj: data.cpfCnpj,
        local: data.local,
        data: data.data,
        uf: data.uf,
        observacoes: data.observacoes || '*.*',
        preview_image_base64: previewImageBase64,
      };
      if (!useDenseQr && customQrBase64) {
        payload.qrcode_base64 = customQrBase64;
      }
      const result = await crlvService.save(payload);

      if (result.success) {
        playSuccessSound();
        toast.success('CRLV gerado com sucesso!');
        const normalizePdfUrl = (pdfValue: string | null) => {
          if (!pdfValue) return null;
          if (/^https?:\/\//i.test(pdfValue)) return pdfValue;

          const envUrl = import.meta.env.VITE_API_URL as string | undefined;
          const baseUrl = envUrl || (window.location.hostname !== 'localhost'
            ? window.location.origin
            : 'http://localhost:4000');

          return `${baseUrl}${pdfValue.startsWith('/') ? pdfValue : `/${pdfValue}`}`;
        };

        setGeneratedPdfUrl(normalizePdfUrl(result.pdf));
        setGeneratedSenha(result.senha || null);

        // Reset form after success
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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/servicos">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Car className="h-6 w-6 text-primary" />
              CRLV Digital 2026
            </h1>
            <p className="text-muted-foreground text-sm">Preencha os dados do veículo • Custo: 1 crédito • Sem validade</p>
          </div>
        </div>

        {/* CPF Prompt Card */}
        {!cpfReady && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm">Insira o CPF/CNPJ do proprietário</h3>
                    <p className="text-xs text-muted-foreground">
                      O QR Code de verificação será gerado automaticamente. Preencha abaixo para desbloquear o formulário.
                    </p>
                  </div>
                  <div className="max-w-xs">
                    <Input
                      placeholder="000.000.000-00"
                      value={form.watch('cpfCnpj')}
                      onChange={(e) => form.setValue('cpfCnpj', formatCPF(e.target.value))}
                      maxLength={18}
                      className="text-base font-mono border-primary/30 focus:border-primary"
                      autoFocus
                    />
                  </div>
                  {(cpfValue?.replace(/\D/g, '').length ?? 0) > 0 && !cpfReady && (
                    <p className="text-xs text-destructive">CPF/CNPJ incompleto — digite pelo menos 11 dígitos.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {cpfReady && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <p className="text-xs font-medium text-primary">
              ✅ CPF/CNPJ preenchido: {cpfValue} — QR Code será gerado automaticamente.
            </p>
          </div>
        )}

        <div className="relative">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-300 ${!cpfReady ? 'opacity-40 saturate-50 pointer-events-none select-none' : 'opacity-100'}`}>
          {/* LEFT: Form */}
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                {/* Category header */}
                <div className="flex items-center gap-2 mb-1">
                  {(() => {
                    const s = STEPS[step];
                    const Icon = s.icon;
                    return (
                      <>
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold">{s.label}</h3>
                          <p className="text-xs text-muted-foreground">Etapa {step + 1} de {STEPS.length}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <Card>
                  <CardContent className="pt-5 space-y-4">
                    {/* STEP 0: IDENTIFICAÇÃO */}
                    {step === 0 && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <FormField control={form.control} name="renavam" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Renavam</FormLabel>
                              <div className="flex gap-2">
                                <FormControl><Input placeholder="Ex: 12345678901" {...field} /></FormControl>
                                <AutoButton onClick={() => form.setValue('renavam', generateRenavam())} />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="placa" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Placa</FormLabel>
                              <div className="flex gap-2">
                                <FormControl><Input placeholder="ABC1D23" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                                <AutoButton onClick={() => form.setValue('placa', generatePlaca())} />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="exercicio" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exercício</FormLabel>
                              <FormControl><Input placeholder="2026" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <FormField control={form.control} name="numeroCrv" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número do CRV</FormLabel>
                              <div className="flex gap-2">
                                <FormControl><Input placeholder="Ex: 1234567890" {...field} /></FormControl>
                                <AutoButton onClick={() => form.setValue('numeroCrv', generateNumeroCRV())} />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="segurancaCrv" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Segurança CRV</FormLabel>
                              <div className="flex gap-2">
                                <FormControl><Input placeholder="Igual ao CRV" {...field} /></FormControl>
                                <AutoButton onClick={() => form.setValue('segurancaCrv', generateSegurancaCRV())} />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="codSegCla" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cód. Seg CLA</FormLabel>
                              <div className="flex gap-2">
                                <FormControl><Input placeholder="Ex: 98765432100" {...field} /></FormControl>
                                <AutoButton onClick={() => form.setValue('codSegCla', generateCodSegCLA())} />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </>
                    )}

                    {/* STEP 1: CARACTERÍSTICAS */}
                    {step === 1 && (
                      <>
                        <FormField control={form.control} name="marcaModelo" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marca / Modelo</FormLabel>
                            <FormControl><Input placeholder="Ex: I/TOYOTA HILUX CDSRXA4FD" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <FormField control={form.control} name="anoFab" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ano Fab</FormLabel>
                              <FormControl><Input placeholder="2025" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="anoMod" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ano Mod</FormLabel>
                              <FormControl><Input placeholder="2026" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="cor" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cor</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                <SelectContent>{CORES_VEICULO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="combustivel" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Combustível</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                <SelectContent>{COMBUSTIVEIS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <FormField control={form.control} name="especieTipo" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Espécie / Tipo</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                <SelectContent>{ESPECIES_TIPO.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="categoria" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoria</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                <SelectContent>{CATEGORIAS_VEICULO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="catObs" render={({ field }) => (
                            <FormItem>
                              <FormLabel>CAT (*.*)</FormLabel>
                              <FormControl><Input placeholder="*.*" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="carroceria" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carroceria</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                              <SelectContent>{CARROCERIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </>
                    )}

                    {/* STEP 2: ESPECIFICAÇÕES TÉCNICAS */}
                    {step === 2 && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField control={form.control} name="chassi" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Chassi</FormLabel>
                              <div className="flex gap-2">
                                <FormControl><Input placeholder="Ex: 9B..." {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                                <AutoButton onClick={() => form.setValue('chassi', generateChassi())} />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="placaAnt" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Placa Ant.</FormLabel>
                              <FormControl><Input placeholder="Opcional" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <FormField control={form.control} name="potenciaCil" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Potência/Cil</FormLabel>
                              <FormControl><Input placeholder="177CV / 2755CC" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="capacidade" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Capacidade</FormLabel>
                              <FormControl><Input placeholder="1.00T" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="lotacao" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lotação</FormLabel>
                              <FormControl><Input placeholder="05" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="pesoBruto" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Peso Bruto</FormLabel>
                              <FormControl><Input placeholder="3.090 KG" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <FormField control={form.control} name="motor" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Motor</FormLabel>
                              <div className="flex gap-2">
                                <FormControl><Input placeholder="Ex: 1GDFTV..." {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                                <AutoButton onClick={() => form.setValue('motor', generateMotor())} />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="cmt" render={({ field }) => (
                            <FormItem>
                              <FormLabel>CMT</FormLabel>
                              <FormControl><Input placeholder="006.50 T" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="eixos" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Eixos</FormLabel>
                              <FormControl><Input placeholder="02" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </>
                    )}

                    {/* STEP 3: PROPRIETÁRIO */}
                    {step === 3 && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField control={form.control} name="nomeProprietario" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Proprietário</FormLabel>
                              <FormControl><Input placeholder="NOME COMPLETO" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="cpfCnpj" render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF/CNPJ</FormLabel>
                              <FormControl>
                                <Input placeholder="000.000.000-00" {...field} onChange={(e) => field.onChange(formatCPF(e.target.value))} maxLength={18} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <FormField control={form.control} name="local" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Local</FormLabel>
                              <FormControl><Input placeholder="SAO PAULO SP" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="data" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data</FormLabel>
                              <FormControl><Input placeholder="09/02/2026" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="uf" render={({ field }) => (
                            <FormItem>
                              <FormLabel>UF (DETRAN)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione UF" /></SelectTrigger></FormControl>
                                <SelectContent>{UFS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </>
                    )}

                    {/* STEP 4: OBSERVAÇÕES + QR CODE */}
                    {step === 4 && (
                      <>
                        <FormField control={form.control} name="observacoes" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações do Veículo</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Ex: *.*" className="min-h-[80px]" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <div className="border-t border-border pt-4 space-y-3">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <QrCode className="h-4 w-4 text-primary" /> QR Code
                          </h4>

                          {/* Auto-generated QR status */}
                          {useDenseQr && (
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              {form.watch('cpfCnpj')?.replace(/\D/g, '').length >= 11 ? (
                                <>
                                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                                  <p className="text-xs text-muted-foreground">
                                    ✅ QR Code real gerado automaticamente com URL de verificação para CPF/CNPJ coletado.
                                  </p>
                                </>
                              ) : (
                                <>
                                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                  <p className="text-xs text-muted-foreground">
                                    Preencha o CPF/CNPJ do proprietário para gerar o QR Code de verificação real.
                                  </p>
                                </>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <Switch
                              id="dense-qr"
                              checked={useDenseQr}
                              onCheckedChange={(checked) => {
                                setUseDenseQr(checked);
                                if (checked) { setCustomQrBase64(null); setCustomQrPreview(null); }
                              }}
                            />
                            <Label htmlFor="dense-qr" className="text-sm">
                              {useDenseQr ? 'QR Code de verificação (automático)' : 'QR Code personalizado (upload)'}
                            </Label>
                          </div>

                          {!useDenseQr && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Button type="button" variant="outline" className="gap-2" onClick={() => qrInputRef.current?.click()}>
                                  <Upload className="h-4 w-4" /> Enviar QR Code
                                </Button>
                                <input ref={qrInputRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleQrUpload} />
                                {customQrPreview && (
                                  <Button type="button" size="icon" variant="ghost" onClick={() => { setCustomQrBase64(null); setCustomQrPreview(null); }}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              {customQrPreview && (
                                <div className="border border-border rounded-lg p-2 w-fit">
                                  <img src={customQrPreview} alt="QR Code" className="h-24 w-24 object-contain" />
                                </div>
                              )}
                              {!customQrPreview && (
                                <p className="text-xs text-muted-foreground">Envie uma imagem PNG/JPG do QR Code personalizado.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation + Submit */}
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={step === 0}
                    onClick={() => setStep(s => s - 1)}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>

                  <span className="text-xs text-muted-foreground">
                    {step + 1}/{STEPS.length} • 1 crédito
                  </span>

                  {step < STEPS.length - 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setStep(s => s + 1)}
                      className="gap-1"
                    >
                      Próximo <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} size="sm" className="min-w-[160px]">
                      {isSubmitting ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando...</>
                      ) : (
                        <><Car className="h-4 w-4 mr-2" /> Gerar CRLV</>
                      )}
                    </Button>
                  )}
                </div>
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

          {/* Preview oculto para captura (mobile/tablet) */}
          <div className="fixed -left-[9999px] top-0 w-[595px] h-[842px] opacity-0 pointer-events-none">
            <CrlvPreview ref={previewRef} form={form} customQrPreview={customQrPreview} showDenseQr={useDenseQr} />
          </div>

          {/* RIGHT: Preview visível no desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-4 space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4" /> Preview em tempo real
              </h3>
              <div className="relative">
                <CrlvPreview form={form} customQrPreview={customQrPreview} showDenseQr={useDenseQr} />
                <WatermarkOverlay />
              </div>
            </div>
          </div>
          </div>

          {!cpfReady && (
            <div className="pointer-events-none absolute inset-0 hidden lg:flex items-center justify-center">
              <div className="rounded-xl border border-border bg-background/90 px-4 py-3 shadow-lg">
                <p className="text-xs font-medium text-foreground">Aguardando CPF/CNPJ para liberar edição</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
