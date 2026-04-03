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
import { useFormGuard } from '@/hooks/useFormGuard';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCpfCheck } from '@/hooks/useCpfCheck';
import CpfDuplicateModal from '@/components/CpfDuplicateModal';
import {
  IdCard, User, ClipboardList, CreditCard, Upload, Shuffle, Loader2, Eye, ArrowLeft, Sparkles, CalendarCheck, FolderOpen, ShieldCheck, X
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

  // Mark form as dirty when any field changes
  const { setFormDirty } = useFormGuard();
  useEffect(() => {
    const sub = form.watch(() => setFormDirty(true));
    return () => { sub.unsubscribe(); setFormDirty(false); };
  }, [form, setFormDirty]);

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

  // Formatar observações
  const formatarObs = (obs: string): string => {
    if (!obs) return '';
    const limpa = obs.toString().trim().replace(/;+$/g, '').trim();
    if (!limpa) return '';
    if (!limpa.includes(',')) return limpa;
    const itens = limpa.split(',').map(item => item.trim()).filter(item => item.length > 0);
    if (itens.length === 0) return '';
    return itens.join(', ');
  };

  // Live preview regeneration
  const watchedValues = form.watch();

  const regenerateCanvases = useCallback(async () => {
    const values = form.getValues();
    const combinedDateNascimento = values.dataNascimentoData
      ? `${values.dataNascimentoData}${values.localNascimento ? ', ' + values.localNascimento : ''}${values.ufNascimento ? ', ' + values.ufNascimento : ''}`
      : '';

    const cnhData = {
      ...values,
      dataNascimento: combinedDateNascimento,
      foto: fotoPerfil,
      assinatura: assinatura,
    };

    try {
      if (canvasFrenteRef.current) {
        await generateCNH(canvasFrenteRef.current, cnhData, values.cnhDefinitiva || 'sim');
        setPreviewFrenteUrl(canvasFrenteRef.current.toDataURL('image/png'));
      }
      if (canvasMeioRef.current) {
        await generateCNHMeio(canvasMeioRef.current, {
          ...cnhData,
          obs: formatarObs(values.obs || ''),
          estadoExtenso: values.estadoExtenso || getStateFullName(values.uf),
        });
        setPreviewMeioUrl(canvasMeioRef.current.toDataURL('image/png'));
      }
      if (canvasVersoRef.current) {
        await generateCNHVerso(canvasVersoRef.current, cnhData);
        setPreviewVersoUrl(canvasVersoRef.current.toDataURL('image/png'));
      }
    } catch (err) {
      console.warn('Erro ao gerar preview ao vivo:', err);
    }
  }, [fotoPerfil, assinatura]);

  // Debounced live regeneration
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      regenerateCanvases();
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [watchedValues, fotoPerfil, assinatura, regenerateCanvases]);

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
    if (!assinatura) extraMissing.push('Assinatura Digital');
    const allMissing = [...missingFields, ...extraMissing];
    if (allMissing.length > 0) {
      toast.error(`Campos obrigatórios não preenchidos: ${allMissing.join(', ')}`, {
        position: 'top-right',
        duration: 5000,
      });
    }
  };

  const handleCreateAccess = async (data: CnhFormData) => {
    setTriedSubmit(true);
    if (!fotoPerfil) {
      toast.error('Foto de perfil é obrigatória', { position: 'top-right' });
      return;
    }
    if (!assinatura) {
      toast.error('Assinatura digital é obrigatória', { position: 'top-right' });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleSaveToDatabase = async () => {
    if (isCreatingCnh) return;
    const data = form.getValues();
    const combinedDateNascimento = `${data.dataNascimentoData}, ${data.localNascimento}, ${data.ufNascimento}`;
    
    const cpf = data.cpf?.replace(/\D/g, '');
    if (!cpf || cpf.length !== 11) {
      toast.error('CPF inválido');
      return;
    }

    const adminStr = localStorage.getItem('admin');
    if (!adminStr) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }
    const adminData = JSON.parse(adminStr);

    try {
      if (adminData.session_token) {
        const freshBalance = await api.credits.getBalance(adminData.id);
        if (freshBalance !== null && freshBalance !== undefined) {
          const credits = typeof freshBalance === 'object' ? (freshBalance as any).credits : freshBalance;
          adminData.creditos = credits;
          localStorage.setItem('admin', JSON.stringify({ ...JSON.parse(adminStr), creditos: credits }));
        }
      }
    } catch { }

    if (adminData.creditos <= 0) {
      toast.error('Créditos insuficientes para criar CNH.');
      return;
    }

    setIsCreatingCnh(true);
    setCreationStep('Preparando dados da CNH...');

    try {
      setCreationStep('Gerando imagens...');
      await regenerateCanvases();

      const cnhFrenteBase64 = canvasFrenteRef.current?.toDataURL('image/png') || '';
      const cnhMeioBase64 = canvasMeioRef.current?.toDataURL('image/png') || '';
      const cnhVersoBase64 = canvasVersoRef.current?.toDataURL('image/png') || '';

      setCreationStep('Montando PDF...');
      let pdfPageBase64 = '';
      try {
        pdfPageBase64 = await generateCNHPdfPage(cnhFrenteBase64, cnhMeioBase64, cnhVersoBase64);
      } catch (pdfErr) {
        console.warn('Erro ao gerar página PDF:', pdfErr);
      }

      let fotoBase64 = '';
      if (fotoPerfil) {
        fotoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(fotoPerfil);
        });
      }

      let assinaturaBase64 = '';
      if (assinatura) {
        assinaturaBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(assinatura);
        });
      }

      setCreationStep('Salvando no servidor...');

      const result = await cnhService.save({
        admin_id: adminData.id,
        session_token: adminData.session_token,
        cpf: data.cpf,
        nome: data.nome,
        dataNascimento: combinedDateNascimento,
        sexo: data.sexo,
        nacionalidade: data.nacionalidade,
        docIdentidade: data.docIdentidade,
        categoria: data.categoria,
        numeroRegistro: data.numeroRegistro,
        dataEmissao: data.dataEmissao,
        dataValidade: data.dataValidade,
        hab: data.hab,
        pai: data.pai,
        mae: data.mae,
        uf: data.uf,
        localEmissao: data.localEmissao,
        estadoExtenso: data.estadoExtenso,
        espelho: data.espelho,
        codigo_seguranca: data.codigo_seguranca,
        renach: data.renach,
        obs: data.obs,
        matrizFinal: data.matrizFinal,
        cnhDefinitiva: data.cnhDefinitiva || 'sim',
        cnhFrenteBase64,
        cnhMeioBase64,
        cnhVersoBase64,
        fotoBase64,
        assinaturaBase64,
        pdfBase64: pdfPageBase64,
      });

      setSuccessData({
        id: result.id,
        cpf: data.cpf,
        nome: data.nome,
        senha: result.senha || cpf.slice(-6),
        pdf: result.pdf,
        dataExpiracao: result.dataExpiracao,
      });

      const updatedAdmin = { ...adminData, creditos: adminData.creditos - 1 };
      localStorage.setItem('admin', JSON.stringify(updatedAdmin));

      setShowSuccessModal(true);
      playSuccessSound();
      toast.success('CNH criada com sucesso! 1 crédito descontado.');
      
      // Reset form
      form.reset();
      setFotoPerfil(null);
      setAssinatura(null);
      setSelectedObs([]);
      setCustomObs('');
      setTriedSubmit(false);
    } catch (error: any) {
      console.error('Erro ao salvar CNH:', error);
      if (error.status === 409 && error.details) {
        const details = error.details;
        if (details.is_own) {
          toast.error(`Este CPF já possui uma CNH cadastrada por você. Vá ao Histórico para excluí-la.`, {
            duration: 8000,
            action: { label: 'Ir ao Histórico', onClick: () => navigate('/historico') },
          });
        } else {
          toast.error(`Este CPF já possui uma CNH cadastrada por ${details.creator_name || 'outro usuário'}.`, { duration: 8000 });
        }
      } else {
        toast.error(error.message || 'Erro ao salvar CNH');
      }
    } finally {
      setIsCreatingCnh(false);
      setCreationStep('');
    }
  };

  const openImageModal = (url: string, title: string) => {
    setModalImageUrl(url);
    setModalImageTitle(title);
    setShowImageModal(true);
  };

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


        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateAccess, handleFormInvalid)} className="space-y-6">
            {/* 3 Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* SEÇÃO 1 - Dados Pessoais */}
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" /> Dados Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-4">
                  <FormField control={form.control} name="nome" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nome Completo <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="PEDRO DA SILVA GOMES" className="h-8 text-sm"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s]/g, ''))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="cpf" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">CPF <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="000.000.000-00" maxLength={14} className="h-8 text-sm"
                          onChange={(e) => {
                            const formatted = formatCPF(e.target.value);
                            field.onChange(formatted);
                            cpfCheck.checkCpf(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-3 gap-2">
                    <FormField control={form.control} name="sexo" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Sexo <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Sexo" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="F">F</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="nacionalidade" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Nacional. <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Sel." /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="brasileiro">Brasileiro</SelectItem>
                            <SelectItem value="estrangeiro">Estrangeiro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="uf" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">UF Nasc. <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue placeholder="UF" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {BRAZILIAN_STATES.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="dataNascimentoData" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Data de Nascimento <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="DD/MM/AAAA" maxLength={10} className="h-8 text-sm"
                          onChange={(e) => field.onChange(formatDate(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="pai" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Nome do Pai</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="PEDRO DA SILVA" className="h-8 text-sm"
                            onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s]/g, ''))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="mae" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Nome da Mãe</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="MARIA DA SILVA" className="h-8 text-sm"
                            onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s]/g, ''))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="localNascimento" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Local de Nascimento <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="RIO DE JANEIRO" className="h-8 text-sm"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s]/g, ''))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />


                  {/* Banner de sugestão automática de datas */}
                  {autoDatesSuggestion && (
                    <div className="bg-primary/10 border border-primary/30 rounded-md p-2 space-y-1.5 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-1.5">
                        <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                        <p className="text-xs font-semibold text-foreground">Datas detectadas</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Idade: <strong>{autoDatesSuggestion.idade} anos</strong> → Validade: <strong>{autoDatesSuggestion.validadeAnos} anos</strong>
                      </p>
                      <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                        <div className="bg-background rounded p-1 text-center">
                          <span className="text-muted-foreground block">1ª Hab</span>
                          <strong>{autoDatesSuggestion.hab}</strong>
                        </div>
                        <div className="bg-background rounded p-1 text-center">
                          <span className="text-muted-foreground block">Emissão</span>
                          <strong>{autoDatesSuggestion.dataEmissao}</strong>
                        </div>
                        <div className="bg-background rounded p-1 text-center">
                          <span className="text-muted-foreground block">Validade</span>
                          <strong>{autoDatesSuggestion.dataValidade}</strong>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-0.5">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setAutoDatesSuggestion(null)} className="flex-1 text-[11px] h-6">
                          Ignorar
                        </Button>
                        <Button type="button" size="sm" onClick={applyAutoDatesSuggestion} className="flex-1 text-[11px] h-6 gap-1">
                          <CalendarCheck className="h-3 w-3" /> Aplicar
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
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <ClipboardList className="h-4 w-4" /> Dados da CNH
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-4">
                  <FormField control={form.control} name="numeroRegistro" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nº Registro (11 dígitos) <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <div className="flex gap-1.5">
                          <Input {...field} placeholder="00397731618" maxLength={11} className="h-8 text-sm flex-1"
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))} />
                          <Button type="button" variant="outline" size="sm" onClick={() => form.setValue('numeroRegistro', generateRegistroCNH())} className="shrink-0 h-8 text-xs px-2">
                            <Shuffle className="h-3.5 w-3.5 mr-1" /> Gerar
                          </Button>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="ufNascimento" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">UF de Emissão <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue placeholder="UF" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {BRAZILIAN_STATES.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />


                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="categoria" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Categoria <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Sel." /></SelectTrigger></FormControl>
                          <SelectContent>
                            {CNH_CATEGORIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="cnhDefinitiva" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Definitiva? <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Sel." /></SelectTrigger></FormControl>
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
                      <FormLabel className="text-xs">1ª Habilitação <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="DD/MM/AAAA" maxLength={10} className="h-8 text-sm"
                          onChange={(e) => field.onChange(formatDate(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="dataEmissao" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Emissão <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="DD/MM/AAAA" maxLength={10} className="h-8 text-sm"
                            onChange={(e) => field.onChange(formatDate(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="dataValidade" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Validade <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="DD/MM/AAAA" maxLength={10} className="h-8 text-sm"
                            onChange={(e) => field.onChange(formatDate(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="localEmissao" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Cidade / Estado <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="RIO DE JANEIRO, RJ" className="h-8 text-sm"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ0-9\s,\/]/g, ''))} />
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="estadoExtenso" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Estado por Extenso <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="MINAS GERAIS" className="h-8 text-sm"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s]/g, ''))} />
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="matrizFinal" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">MRZ (Leitura Óptica)</FormLabel>
                      </div>
                      <FormControl>
                        <Input {...field} placeholder="FELIPE<<DA<<SILVA<<<<<<" className="h-8 text-sm font-mono"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s<]/g, ''))} />
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="docIdentidade" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">RG <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <div className="flex gap-1">
                            <Input {...field} placeholder="3674826 SSP AL" className="h-8 text-sm flex-1"
                              onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9\s\/]/g, ''))} />
                            <Button type="button" variant="outline" size="sm" className="shrink-0 h-8 px-1.5"
                              onClick={() => {
                                const uf = form.getValues('uf');
                                if (!uf) { toast.error('Selecione o UF primeiro'); return; }
                                form.setValue('docIdentidade', generateRGByState(uf));
                              }}>
                              <Shuffle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="codigo_seguranca" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Cód. Segurança <span className="text-destructive">*</span></FormLabel>
                        </div>
                        <FormControl>
                          <div className="flex gap-1">
                            <Input {...field} placeholder="96972197651" maxLength={11} className="h-8 text-sm flex-1"
                              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))} />
                            <Button type="button" variant="outline" size="sm" onClick={() => form.setValue('codigo_seguranca', generateCodigoSeguranca())} className="shrink-0 h-8 px-1.5">
                              <Shuffle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="renach" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">RENACH <span className="text-destructive">*</span></FormLabel>
                      </div>
                      <FormControl>
                        <div className="flex gap-1.5">
                          <Input {...field} placeholder="SC975697214" maxLength={11} className="h-8 text-sm flex-1"
                            onChange={(e) => {
                              let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                              if (v.length > 2) {
                                const letters = v.slice(0, 2).replace(/[^A-Z]/g, '');
                                const numbers = v.slice(2).replace(/\D/g, '');
                                v = letters + numbers;
                              }
                              field.onChange(v);
                            }} />
                          <Button type="button" variant="outline" size="sm" className="shrink-0 h-8 text-xs px-2"
                            onClick={() => {
                              const uf = form.getValues('uf');
                              if (!uf) { toast.error('Selecione o UF primeiro'); return; }
                              form.setValue('renach', generateRenach(uf));
                            }}>
                            <Shuffle className="h-3.5 w-3.5 mr-1" /> Gerar
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
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4" /> Extras
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-4">
                  <FormField control={form.control} name="espelho" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nº do Espelho <span className="text-destructive">*</span></FormLabel>
                      </div>
                      <FormControl>
                        <div className="flex gap-1.5">
                          <Input {...field} placeholder="32131277" maxLength={10} className="h-8 text-sm flex-1"
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))} />
                          <Button type="button" variant="outline" size="sm" onClick={() => form.setValue('espelho', generateEspelhoNumber())} className="shrink-0 h-8 text-xs px-2">
                            <Shuffle className="h-3.5 w-3.5 mr-1" /> Gerar
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="space-y-1.5">
                    <FormLabel className="text-xs">Observações</FormLabel>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {CNH_OBSERVACOES.map(obs => (
                        <div key={obs} className="flex items-center space-x-1.5">
                          <Checkbox
                            id={`obs-${obs}`}
                            checked={selectedObs.includes(obs)}
                            onCheckedChange={() => handleObsToggle(obs)}
                            className="h-3.5 w-3.5"
                          />
                          <label htmlFor={`obs-${obs}`} className="text-xs cursor-pointer">{obs}</label>
                        </div>
                      ))}
                    </div>
                    <Input
                      placeholder="Observações extras..."
                      value={customObs}
                      onChange={(e) => handleCustomObsChange(e.target.value.toUpperCase())}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Resultado final"
                      value={[...selectedObs, ...(customObs.trim() ? [customObs.trim()] : [])].join(', ')}
                      readOnly
                      className="h-7 bg-muted text-[11px]"
                    />
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Live Preview */}
            {(previewFrenteUrl || previewMeioUrl || previewVersoUrl) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="h-4 w-4" /> Preview ao Vivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {previewFrenteUrl && (
                      <div className="cursor-pointer" onClick={() => openImageModal(previewFrenteUrl, 'CNH Frente')}>
                        <p className="text-xs text-muted-foreground mb-1 text-center">Frente</p>
                        <img src={previewFrenteUrl} alt="CNH Frente" className="w-full rounded-lg border pointer-events-none select-none" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                      </div>
                    )}
                    {previewMeioUrl && (
                      <div className="cursor-pointer" onClick={() => openImageModal(previewMeioUrl, 'CNH Meio')}>
                        <p className="text-xs text-muted-foreground mb-1 text-center">Meio</p>
                        <img src={previewMeioUrl} alt="CNH Meio" className="w-full rounded-lg border pointer-events-none select-none" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                      </div>
                    )}
                    {previewVersoUrl && (
                      <div className="cursor-pointer" onClick={() => openImageModal(previewVersoUrl, 'CNH Verso')}>
                        <p className="text-xs text-muted-foreground mb-1 text-center">Verso</p>
                        <img src={previewVersoUrl} alt="CNH Verso" className="w-full rounded-lg border pointer-events-none select-none" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit - Criar Acesso */}
            <div className="flex justify-end">
              {isDemo ? (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Modo demonstração — criação desabilitada</span>
                </div>
              ) : (
                <Button type="submit" size="lg" disabled={isCreatingCnh} className="min-w-[250px]">
                  {isCreatingCnh ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {creationStep}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Criar Acesso (1 crédito)
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>

      {/* Hidden canvases */}
      <canvas ref={canvasFrenteRef} className="hidden" />
      <canvas ref={canvasMeioRef} className="hidden" />
      <canvas ref={canvasVersoRef} className="hidden" />

      {/* Dialog de confirmação */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowConfirmDialog(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Deseja mesmo gerar o acesso?</h3>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Você poderá mudar qualquer coisa futuramente.</p>
              <p>• Este módulo tem validade de <strong className="text-foreground">45 dias</strong>.</p>
              <p>• Será descontado <strong className="text-foreground">1 crédito</strong> da sua conta.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirmDialog(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={() => { setShowConfirmDialog(false); handleSaveToDatabase(); }}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de imagem ampliada */}
      {showImageModal && modalImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="absolute -top-12 right-0 text-white" onClick={() => setShowImageModal(false)}>
              <X className="h-6 w-6" />
            </Button>
            <h3 className="text-white text-center mb-2 font-semibold">{modalImageTitle}</h3>
            <img src={modalImageUrl} alt={modalImageTitle} className="w-full rounded-lg pointer-events-none select-none" draggable={false} onContextMenu={(e) => e.preventDefault()} />
          </div>
        </div>
      )}

      {/* Modal de sucesso */}
      {showSuccessModal && successData && (
        <CnhSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          cpf={successData.cpf}
          senha={successData.senha}
          nome={successData.nome}
          pdfUrl={successData.pdf}
        />
      )}

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
