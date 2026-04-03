import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCpfCheck } from '@/hooks/useCpfCheck';
import CpfDuplicateModal from '@/components/CpfDuplicateModal';
import {
  IdCard, User, ClipboardList, CreditCard, Upload, Shuffle, Loader2, HelpCircle, Eye, ArrowLeft, Sparkles, CalendarCheck, FolderOpen, ShieldCheck, X
} from 'lucide-react';
import ImageGalleryModal from '@/components/ImageGalleryModal';
import {
  BRAZILIAN_STATES, CNH_CATEGORIES, CNH_OBSERVACOES,
  generateRegistroCNH, generateEspelhoNumber, generateCodigoSeguranca,
  generateRenach, generateMRZ, getStateFullName, getStateCapital,
  generateRGByState, formatCPF, formatDate
} from '@/lib/cnh-utils';
import { generateCNH, generateCNHPdfPage } from '@/lib/cnh-generator';
import { generateCNHMeio } from '@/lib/cnh-generator-meio';
import { generateCNHVerso } from '@/lib/cnh-generator-verso';
import { cnhService } from '@/lib/cnh-service';
import { playSuccessSound } from '@/lib/success-sound';
import CnhSuccessModal from '@/components/cnh/CnhSuccessModal';
import api from '@/lib/api';

// Zod Schema
const cnhFormSchema = z.object({
  cpf: z.string().min(14, 'CPF inválido'),
  nome: z.string().min(3, 'Nome obrigatório'),
  uf: z.string().min(2, 'Selecione o UF'),
  sexo: z.string().min(1, 'Selecione o gênero'),
  nacionalidade: z.string().min(1, 'Selecione a nacionalidade'),
  dataNascimentoData: z.string().min(10, 'Informe a data de nascimento'),
  localNascimento: z.string().min(2, 'Informe o local de nascimento'),
  ufNascimento: z.string().min(2, 'Selecione o UF de nascimento'),
  dataNascimento: z.string().optional(),
  numeroRegistro: z.string().min(11, 'Registro deve ter 11 dígitos'),
  categoria: z.string().min(1, 'Selecione a categoria'),
  cnhDefinitiva: z.string().min(1, 'Selecione'),
  hab: z.string().min(10, 'Informe a data da 1ª habilitação'),
  dataEmissao: z.string().min(10, 'Informe a data de emissão'),
  dataValidade: z.string().min(10, 'Informe a data de validade'),
  localEmissao: z.string().min(3, 'Informe cidade/estado'),
  estadoExtenso: z.string().min(3, 'Informe o estado por extenso'),
  matrizFinal: z.string().optional(),
  docIdentidade: z.string().min(5, 'Informe o RG'),
  codigo_seguranca: z.string().min(8, 'Código de segurança obrigatório'),
  renach: z.string().min(9, 'RENACH obrigatório'),
  espelho: z.string().min(8, 'Nº do espelho obrigatório'),
  obs: z.string().optional(),
  pai: z.string().optional(),
  mae: z.string().optional(),
});

type CnhFormData = z.infer<typeof cnhFormSchema>;

// Tooltip helper
function WhereIsTooltip({ description }: { description: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-primary cursor-help font-semibold text-xs ml-1">Onde fica?</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// File Upload component with gallery support
function FileUploadField({ label, value, onChange, onOpenGallery, error }: {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  onOpenGallery?: () => void;
  error?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel>{label}</FormLabel>
        {onOpenGallery && (
          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1 text-primary" onClick={onOpenGallery}>
            <FolderOpen className="h-3 w-3" /> Acervo
          </Button>
        )}
      </div>
      <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors ${error ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
        {value ? (
          <div className="text-center px-2">
            <p className="text-sm text-primary font-medium truncate max-w-full">{value.name}</p>
            <p className="text-xs text-muted-foreground">{Math.round(value.size / 1024)}KB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Upload className="h-6 w-6" />
            <span className="text-xs">Clique para upload</span>
            <span className="text-[10px]">PNG, JPG até 10MB</span>
          </div>
        )}
        <input
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/jpg"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </label>
      {error && <p className="text-xs text-destructive">Campo obrigatório</p>}
    </div>
  );
}

// Field label mapping for toast notifications
const FIELD_LABELS: Record<string, string> = {
  cpf: 'CPF',
  nome: 'Nome Completo',
  uf: 'UF',
  sexo: 'Gênero',
  nacionalidade: 'Nacionalidade',
  dataNascimentoData: 'Data de Nascimento',
  localNascimento: 'Local de Nascimento',
  ufNascimento: 'UF de Nascimento',
  numeroRegistro: 'Registro da CNH',
  categoria: 'Categoria',
  cnhDefinitiva: 'CNH Definitiva',
  hab: '1ª Habilitação',
  dataEmissao: 'Data de Emissão',
  dataValidade: 'Data de Validade',
  localEmissao: 'Cidade / Estado',
  estadoExtenso: 'Estado por Extenso',
  docIdentidade: 'RG',
  codigo_seguranca: 'Código de Segurança',
  renach: 'RENACH',
  espelho: 'Nº Espelho',
};

export default function CnhDigital() {
  const { admin, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const [showDemoBanner, setShowDemoBanner] = useState(isDemo);
  const cpfCheck = useCpfCheck({
    admin_id: admin?.id || 0,
    session_token: admin?.session_token || '',
    service_type: 'cnh',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [assinatura, setAssinatura] = useState<File | null>(null);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [selectedObs, setSelectedObs] = useState<string[]>([]);
  const [customObs, setCustomObs] = useState('');
  const [demoStep, setDemoStep] = useState(0);
  const [demoFilling, setDemoFilling] = useState(false);
  const [galleryType, setGalleryType] = useState<'foto' | 'assinatura' | null>(null);

  // Live preview state
  const canvasFrenteRef = useRef<HTMLCanvasElement>(null);
  const canvasMeioRef = useRef<HTMLCanvasElement>(null);
  const canvasVersoRef = useRef<HTMLCanvasElement>(null);
  const [previewFrenteUrl, setPreviewFrenteUrl] = useState<string | null>(null);
  const [previewMeioUrl, setPreviewMeioUrl] = useState<string | null>(null);
  const [previewVersoUrl, setPreviewVersoUrl] = useState<string | null>(null);
  const [isCreatingCnh, setIsCreatingCnh] = useState(false);
  const [creationStep, setCreationStep] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [modalImageTitle, setModalImageTitle] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<CnhFormData>({
    resolver: zodResolver(cnhFormSchema),
    mode: 'onChange',
    defaultValues: {
      cpf: '', nome: '', uf: '', sexo: '', nacionalidade: '',
      dataNascimentoData: '', localNascimento: '', ufNascimento: '', dataNascimento: '',
      numeroRegistro: '', categoria: '', cnhDefinitiva: '',
      hab: '', dataEmissao: '', dataValidade: '', localEmissao: '',
      estadoExtenso: '', matrizFinal: '', docIdentidade: '', codigo_seguranca: '',
      renach: '', espelho: '', obs: '', pai: '', mae: '',
    },
  });

  // Demo auto-fill
  useEffect(() => {
    if (!isDemo || demoFilling) return;
    setDemoFilling(true);

    const demoData: Partial<CnhFormData> = {
      cpf: '529.982.247-25',
      nome: 'EDUARDO GOMES DIAS',
      uf: 'RJ',
      sexo: 'M',
      nacionalidade: 'brasileiro',
      dataNascimentoData: '15/03/1990',
      localNascimento: 'RIO DE JANEIRO',
      ufNascimento: 'RJ',
      categoria: 'AB',
      cnhDefinitiva: 'sim',
      hab: '10/05/2010',
      dataEmissao: '15/01/2025',
      dataValidade: '15/01/2030',
      pai: 'CARLOS EDUARDO DIAS',
      mae: 'MARIA HELENA GOMES DIAS',
    };

    // Fill fields progressively with animation
    const fields = Object.entries(demoData);
    let i = 0;
    const fillNext = () => {
      if (i >= fields.length) {
        // Generate auto-fields
        const regNum = generateRegistroCNH();
        const espelho = generateEspelhoNumber();
        const codSeg = generateCodigoSeguranca();
        const renach = generateRenach('RJ');
        const rg = generateRGByState('RJ');
        form.setValue('numeroRegistro', regNum);
        form.setValue('espelho', espelho);
        form.setValue('codigo_seguranca', codSeg);
        form.setValue('renach', renach);
        form.setValue('docIdentidade', rg);
        form.setValue('estadoExtenso', getStateFullName('RJ'));
        form.setValue('localEmissao', getStateCapital('RJ'));
        form.setValue('matrizFinal', generateMRZ('EDUARDO GOMES DIAS'));

        // Load demo photo and signature
        loadDemoFiles();
        setDemoStep(fields.length);
        return;
      }
      const [key, val] = fields[i];
      form.setValue(key as any, val as string, { shouldValidate: true });
      setDemoStep(i + 1);
      i++;
      setTimeout(fillNext, 120);
    };
    setTimeout(fillNext, 500);
  }, [isDemo]);

  // Load demo photo and signature files
  const loadDemoFiles = async () => {
    try {
      const [fotoRes, assRes] = await Promise.all([
        fetch('/images/tutorial-foto-demo.png'),
        fetch('/images/tutorial-assinatura-demo.png'),
      ]);
      const fotoBlob = await fotoRes.blob();
      const assBlob = await assRes.blob();
      const fotoFile = new File([fotoBlob], 'foto-demo.png', { type: 'image/png' });
      const assFile = new File([assBlob], 'assinatura-demo.png', { type: 'image/png' });
      setFotoPerfil(fotoFile);
      setAssinatura(assFile);
    } catch (e) {
      console.warn('Erro ao carregar arquivos demo:', e);
    }
  };

  // Auto MRZ when nome changes
  useEffect(() => {
    const sub = form.watch((value, { name }) => {
      if (name === 'nome' && value.nome) {
        form.setValue('matrizFinal', generateMRZ(value.nome));
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  // Auto estado extenso + cidade when UF changes
  useEffect(() => {
    const sub = form.watch((value, { name }) => {
      if (name === 'uf' && value.uf) {
        try {
          form.setValue('estadoExtenso', getStateFullName(value.uf));
          form.setValue('localEmissao', getStateCapital(value.uf));
        } catch (e) {
          console.error('Erro ao atualizar estado/cidade:', e);
        }
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  // ===== Auto-cálculo de datas CNH baseado na data de nascimento =====
  const [autoDatesSuggestion, setAutoDatesSuggestion] = useState<{
    hab: string; dataEmissao: string; dataValidade: string; cnhDefinitiva: string; idade: number; validadeAnos: number;
  } | null>(null);
  const autoDateSoundPlayed = useRef(false);
  const lastDetectedDate = useRef('');

  const watchedDateNascimento = form.watch('dataNascimentoData');

  useEffect(() => {
    const raw = watchedDateNascimento || '';
    const dateMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (!dateMatch) {
      setAutoDatesSuggestion(null);
      autoDateSoundPlayed.current = false;
      lastDetectedDate.current = '';
      return;
    }

    const dateStr = dateMatch[0]; // "DD/MM/YYYY"

    // Evitar recalcular se a data detectada é a mesma (evita random mudar ao digitar local)
    if (dateStr === lastDetectedDate.current) return;

    const day = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]) - 1;
    const year = parseInt(dateMatch[3]);
    const birthDate = new Date(year, month, day);

    if (isNaN(birthDate.getTime()) || year < 1930 || year > 2010) {
      setAutoDatesSuggestion(null);
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      setAutoDatesSuggestion(null);
      return;
    }

    // Marcar data como detectada para não recalcular
    lastDetectedDate.current = dateStr;

    // 1ª habilitação = 20 anos + random 2-6 meses
    const habMonthsExtra = Math.floor(Math.random() * 5) + 2;
    const habDate = new Date(year + 20, month + habMonthsExtra, day);

    // CNH definitiva = 1ª hab + 1 ano (provisória dura 1 ano)
    const definitivaDate = new Date(habDate.getFullYear() + 1, habDate.getMonth(), habDate.getDate());

    // Validade: <50 anos = 10 anos, >=50 = 5 anos
    const validadeAnos = age < 50 ? 10 : 5;

    // Calcular a última renovação antes de hoje
    let lastEmissao = new Date(definitivaDate);
    while (true) {
      const nextRenewal = new Date(lastEmissao.getFullYear() + validadeAnos, lastEmissao.getMonth(), lastEmissao.getDate());
      if (nextRenewal > today) break;
      lastEmissao = nextRenewal;
    }

    const validadeDate = new Date(lastEmissao.getFullYear() + validadeAnos, lastEmissao.getMonth(), lastEmissao.getDate());

    const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    setAutoDatesSuggestion({
      hab: fmt(habDate),
      dataEmissao: fmt(lastEmissao),
      dataValidade: fmt(validadeDate),
      cnhDefinitiva: 'sim',
      idade: age,
      validadeAnos,
    });

    // Som de notificação - tocar apenas UMA vez por data
    if (!autoDateSoundPlayed.current) {
      autoDateSoundPlayed.current = true;
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
      } catch {}
    }
  }, [watchedDateNascimento]);

  const applyAutoDatesSuggestion = () => {
    if (!autoDatesSuggestion) return;
    form.setValue('hab', autoDatesSuggestion.hab, { shouldValidate: true });
    form.setValue('dataEmissao', autoDatesSuggestion.dataEmissao, { shouldValidate: true });
    form.setValue('dataValidade', autoDatesSuggestion.dataValidade, { shouldValidate: true });
    form.setValue('cnhDefinitiva', autoDatesSuggestion.cnhDefinitiva, { shouldValidate: true });
    toast.success('Datas aplicadas com sucesso!');
    setAutoDatesSuggestion(null);
  };

  const updateObsField = (selected: string[], custom: string) => {
    const parts = [...selected];
    if (custom.trim()) parts.push(custom.trim());
    form.setValue('obs', parts.join(', '));
  };

  const handleObsToggle = (obs: string) => {
    const newObs = selectedObs.includes(obs)
      ? selectedObs.filter(o => o !== obs)
      : [...selectedObs, obs];
    setSelectedObs(newObs);
    updateObsField(newObs, customObs);
  };

  const handleCustomObsChange = (value: string) => {
    setCustomObs(value);
    updateObsField(selectedObs, value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;

  const handleFormInvalid = (errors: FieldErrors<CnhFormData>) => {
    setTriedSubmit(true);
    const missingFields = Object.keys(errors)
      .map(key => FIELD_LABELS[key] || key)
      .slice(0, 5);
    
    const extraMissing: string[] = [];
    if (!fotoPerfil) extraMissing.push('Foto de Perfil');
    const allMissing = [...missingFields, ...extraMissing];
    if (allMissing.length > 0) {
      toast.error(`Campos obrigatórios não preenchidos: ${allMissing.join(', ')}`, {
        position: 'top-right',
        duration: 5000,
      });
    }
  };

  const handleGeneratePreview = async (data: CnhFormData) => {
    setTriedSubmit(true);
    if (!fotoPerfil) {
      toast.error('Foto de perfil é obrigatória', { position: 'top-right' });
      return;
    }
    if (!assinatura) {
      toast.error('Assinatura digital é obrigatória', { position: 'top-right' });
      return;
    }

    // Combine birth date fields into dataNascimento
    const combinedDateNascimento = `${data.dataNascimentoData}, ${data.localNascimento}, ${data.ufNascimento}`;

    const previewData = {
      ...data,
      dataNascimento: combinedDateNascimento,
      foto: fotoPerfil,
      assinatura: assinatura,
    };

    setCnhPreviewData(previewData);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setCnhPreviewData(null);
  };

  const handleEditFromPreview = () => {
    setShowPreview(false);
  };

  const handleSaveSuccess = () => {
    form.reset();
    setFotoPerfil(null);
    setAssinatura(null);
    setSelectedObs([]);
    setCustomObs('');
  };

  // Se estiver mostrando o preview
  if (showPreview && cnhPreviewData) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-6xl">
          {/* Progress indicator */}
          <div className="flex items-center gap-4 bg-card rounded-full px-6 py-3 border w-fit mx-auto">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">1</div>
              <span className="text-sm font-medium">Preencher</span>
            </div>
            <div className="w-8 h-0.5 bg-border" />
            <div className="flex items-center gap-2 text-primary">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">2</div>
              <span className="text-sm font-medium">Visualizar</span>
            </div>
          </div>

          <CnhPreview
            cnhData={cnhPreviewData}
            onClose={handleClosePreview}
            onEdit={handleEditFromPreview}
            onSaveSuccess={handleSaveSuccess}
            isDemo={isDemo}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Demo banner */}
        {showDemoBanner && (
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl p-4 animate-in fade-in">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">🎓 Modo Tutorial</p>
              <p className="text-xs text-muted-foreground">Os campos estão sendo preenchidos automaticamente com dados de exemplo. Você pode editar qualquer campo!</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setShowDemoBanner(false); searchParams.delete('demo'); setSearchParams(searchParams); }}>
              Fechar
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">CNH Digital 2026</h1>
            <p className="text-sm text-muted-foreground">Preencha os dados para gerar a CNH Digital</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>Saldo: <strong className="text-foreground">{admin?.creditos ?? 0}</strong> créditos</span>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 sm:gap-4 bg-card rounded-full px-4 sm:px-6 py-2 sm:py-3 border w-fit mx-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 text-primary">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground text-sm">1</div>
            <span className="text-xs sm:text-sm font-medium">Preencher</span>
          </div>
          <div className="w-6 sm:w-8 h-0.5 bg-border" />
          <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-muted text-sm">2</div>
            <span className="text-xs sm:text-sm font-medium">Visualizar</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGeneratePreview, handleFormInvalid)} className="space-y-6">
            {/* CPF Header Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IdCard className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem className="max-w-sm">
                      <FormLabel>CPF <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          onChange={(e) => {
                            const formatted = formatCPF(e.target.value);
                            field.onChange(formatted);
                            cpfCheck.checkCpf(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 3 Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* SEÇÃO 1 - Dados Pessoais */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" /> Dados Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="nome" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: PEDRO DA SILVA GOMES"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s]/g, ''))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="uf" render={({ field }) => (
                      <FormItem>
                        <FormLabel>UF <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {BRAZILIAN_STATES.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="sexo" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gênero <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="nacionalidade" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nacionalidade <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="brasileiro">Brasileiro</SelectItem>
                          <SelectItem value="estrangeiro">Estrangeiro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="dataNascimentoData" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="DD/MM/AAAA" maxLength={10}
                          onChange={(e) => field.onChange(formatDate(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <FormField control={form.control} name="localNascimento" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="RIO DE JANEIRO"
                              onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s]/g, ''))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="ufNascimento" render={({ field }) => (
                      <FormItem>
                        <FormLabel>UF <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {BRAZILIAN_STATES.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Banner de sugestão automática de datas */}
                  {autoDatesSuggestion && (
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold text-foreground">Validade detectada automaticamente</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Idade: <strong>{autoDatesSuggestion.idade} anos</strong> → Validade: <strong>{autoDatesSuggestion.validadeAnos} anos</strong>
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-background rounded p-1.5 text-center">
                          <span className="text-muted-foreground block">1ª Hab</span>
                          <strong>{autoDatesSuggestion.hab}</strong>
                        </div>
                        <div className="bg-background rounded p-1.5 text-center">
                          <span className="text-muted-foreground block">Emissão</span>
                          <strong>{autoDatesSuggestion.dataEmissao}</strong>
                        </div>
                        <div className="bg-background rounded p-1.5 text-center">
                          <span className="text-muted-foreground block">Validade</span>
                          <strong>{autoDatesSuggestion.dataValidade}</strong>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setAutoDatesSuggestion(null)} className="flex-1 text-xs h-7">
                          Ignorar
                        </Button>
                        <Button type="button" size="sm" onClick={applyAutoDatesSuggestion} className="flex-1 text-xs h-7 gap-1">
                          <CalendarCheck className="h-3 w-3" /> Aplicar datas
                        </Button>
                      </div>
                    </div>
                  )}

                  <FileUploadField label="Foto de Perfil *" value={fotoPerfil} onChange={setFotoPerfil} onOpenGallery={() => setGalleryType('foto')} error={triedSubmit && !fotoPerfil} />
                  <FileUploadField label="Assinatura Digital *" value={assinatura} onChange={setAssinatura} onOpenGallery={() => setGalleryType('assinatura')} error={triedSubmit && !assinatura} />
                </CardContent>
              </Card>

              {/* SEÇÃO 2 - Dados da CNH */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardList className="h-4 w-4" /> Dados da CNH
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="numeroRegistro" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>Registro da CNH (11 dígitos) <span className="text-destructive">*</span></FormLabel>
                        <WhereIsTooltip description="Número que aparece no campo '5 Nº REGISTRO' da CNH." />
                      </div>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} placeholder="00397731618" maxLength={11}
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))} className="flex-1" />
                          <Button type="button" variant="outline" size="sm" onClick={() => form.setValue('numeroRegistro', generateRegistroCNH())} className="shrink-0">
                            <Shuffle className="h-4 w-4 mr-1" /> Gerar
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="categoria" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {CNH_CATEGORIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="cnhDefinitiva" render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNH Definitiva? <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="sim">Sim</SelectItem>
                            <SelectItem value="nao">Não</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="hab" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de 1ª Habilitação <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="DD/MM/AAAA" maxLength={10}
                          onChange={(e) => field.onChange(formatDate(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="dataEmissao" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Emissão <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="DD/MM/AAAA" maxLength={10}
                            onChange={(e) => field.onChange(formatDate(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="dataValidade" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Validade <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="DD/MM/AAAA" maxLength={10}
                            onChange={(e) => field.onChange(formatDate(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="localEmissao" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>Cidade / Estado <span className="text-destructive">*</span></FormLabel>
                        <WhereIsTooltip description="Cidade e estado onde a CNH foi emitida." />
                      </div>
                      <FormControl>
                        <Input {...field} placeholder="RIO DE JANEIRO, RJ"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ0-9\s,\/]/g, ''))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="estadoExtenso" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>Estado por Extenso <span className="text-destructive">*</span></FormLabel>
                        <WhereIsTooltip description="Nome completo do estado na parte inferior da CNH." />
                      </div>
                      <FormControl>
                        <Input {...field} placeholder="Ex: MINAS GERAIS"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s]/g, ''))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="matrizFinal" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>Zona de Leitura Óptica (MRZ)</FormLabel>
                        <WhereIsTooltip description="Código na parte inferior da CNH. Gerado automaticamente." />
                      </div>
                      <FormControl>
                        <Input {...field} placeholder="FELIPE<<DA<<SILVA<<<<<<"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s<]/g, ''))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="docIdentidade" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>RG <span className="text-destructive">*</span></FormLabel>
                        <Button type="button" variant="outline" size="sm" className="h-6 text-xs"
                          onClick={() => {
                            const uf = form.getValues('uf');
                            if (!uf) { toast.error('Selecione o UF primeiro'); return; }
                            form.setValue('docIdentidade', generateRGByState(uf));
                          }}>
                          <Shuffle className="h-3 w-3 mr-1" /> Gerar
                        </Button>
                      </div>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 3674826 SSP AL"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9\s\/]/g, ''))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="codigo_seguranca" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>Código de Segurança <span className="text-destructive">*</span></FormLabel>
                        <WhereIsTooltip description="Código numérico na lateral direita da CNH." />
                      </div>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} placeholder="Ex: 96972197651" maxLength={11}
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))} className="flex-1" />
                          <Button type="button" variant="outline" size="sm" onClick={() => form.setValue('codigo_seguranca', generateCodigoSeguranca())} className="shrink-0">
                            <Shuffle className="h-4 w-4 mr-1" /> Gerar
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="renach" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>RENACH <span className="text-destructive">*</span></FormLabel>
                        <WhereIsTooltip description="Código RENACH na lateral direita da CNH." />
                      </div>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} placeholder="Ex: SC975697214" maxLength={11}
                            onChange={(e) => {
                              let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                              if (v.length > 2) {
                                const letters = v.slice(0, 2).replace(/[^A-Z]/g, '');
                                const numbers = v.slice(2).replace(/\D/g, '');
                                v = letters + numbers;
                              }
                              field.onChange(v);
                            }} className="flex-1" />
                          <Button type="button" variant="outline" size="sm" className="shrink-0"
                            onClick={() => {
                              const uf = form.getValues('uf');
                              if (!uf) { toast.error('Selecione o UF primeiro'); return; }
                              form.setValue('renach', generateRenach(uf));
                            }}>
                            <Shuffle className="h-4 w-4 mr-1" /> Gerar
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* SEÇÃO 3 - Informações Adicionais */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4" /> Informações Adicionais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="espelho" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>Nº do espelho <span className="text-destructive">*</span></FormLabel>
                        <WhereIsTooltip description="Número do espelho na parte superior da CNH." />
                      </div>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} placeholder="32131277" maxLength={10}
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))} className="flex-1" />
                          <Button type="button" variant="outline" size="sm" onClick={() => form.setValue('espelho', generateEspelhoNumber())} className="shrink-0">
                            <Shuffle className="h-4 w-4 mr-1" /> Gerar
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <FormLabel>Observações</FormLabel>
                      <WhereIsTooltip description="Restrições da CNH. Ex: EAR, A (Óculos), etc." />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {CNH_OBSERVACOES.map(obs => (
                        <div key={obs} className="flex items-center space-x-2">
                          <Checkbox
                            id={`obs-${obs}`}
                            checked={selectedObs.includes(obs)}
                            onCheckedChange={() => handleObsToggle(obs)}
                          />
                          <label htmlFor={`obs-${obs}`} className="text-sm cursor-pointer">{obs}</label>
                        </div>
                      ))}
                    </div>
                    <Input
                      placeholder="Digite observações extras..."
                      value={customObs}
                      onChange={(e) => handleCustomObsChange(e.target.value.toUpperCase())}
                      className="mt-2"
                    />
                    <Input
                      placeholder="Resultado final"
                      value={[...selectedObs, ...(customObs.trim() ? [customObs.trim()] : [])].join(', ')}
                      readOnly
                      className="mt-1 bg-muted text-xs"
                    />
                  </div>

                  <FormField control={form.control} name="pai" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Pai</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: PEDRO DA SILVA GOMES"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s]/g, ''))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="mae" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Mãe</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: MARIA DA SILVA GOMES"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s]/g, ''))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </div>

            {/* Submit - Gerar Preview */}
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-[200px]">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                Gerar Preview da CNH
              </Button>
            </div>
          </form>
        </Form>
      <CpfDuplicateModal
        open={cpfCheck.showDuplicateModal}
        onClose={cpfCheck.dismissModal}
        result={cpfCheck.cpfDuplicate}
        serviceLabel="CNH"
      />
      {admin && galleryType && (
        <ImageGalleryModal
          isOpen={!!galleryType}
          onClose={() => setGalleryType(null)}
          onSelect={(file) => {
            if (galleryType === 'foto') setFotoPerfil(file);
            else setAssinatura(file);
          }}
          type={galleryType}
          adminId={admin.id}
          sessionToken={admin.session_token}
        />
      )}
      </div>
    </DashboardLayout>
  );
}
