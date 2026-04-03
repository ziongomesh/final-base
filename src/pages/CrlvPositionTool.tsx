import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useFormGuard } from '@/hooks/useFormGuard';
import { Maximize2, X, FileText, Loader2, Car, MapPin, User, Check, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { crlvService } from '@/lib/crlv-service';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/success-sound';
import CrlvSuccessModal from '@/components/crlv/CrlvSuccessModal';
import openSansFont from '@/assets/OpenSans-VariableFont_wdth_wght.ttf';
import freeMonoBoldFont from '@/assets/FreeMonoBold.otf';

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

interface FieldDef {
  key: string;
  // Coordinates in Photoshop px (same as PDF points at 72dpi)
  tx: number; ty: number;
  size: number; // font size in pt
}

const FIELDS: FieldDef[] = [
  { key: 'uf', tx: 31.20, ty: 54.22, size: 4.42 },
  { key: 'renavam', tx: 31.20, ty: 102.21, size: 10 },
  { key: 'placa', tx: 30.95, ty: 128.58, size: 10 },
  { key: 'exercicio', tx: 102.93, ty: 128.58, size: 10 },
  { key: 'anoFab', tx: 31.20, ty: 154.75, size: 10 },
  { key: 'anoMod', tx: 102.93, ty: 154.75, size: 10 },
  { key: 'numeroCrv', tx: 31.20, ty: 181.14, size: 10 },
  { key: 'codSegCla', tx: 31.67, ty: 258.97, size: 10 },
  { key: 'catObs', tx: 162.67, ty: 259.21, size: 10 },
  { key: 'marcaModelo', tx: 30.95, ty: 293.43, size: 10 },
  { key: 'especieTipo', tx: 30.47, ty: 329.66, size: 10 },
  { key: 'placaAnt', tx: 31.20, ty: 364.00, size: 10 },
  { key: 'chassi', tx: 131.01, ty: 364.46, size: 10 },
  { key: 'cor', tx: 30.47, ty: 400.19, size: 10 },
  { key: 'combustivel', tx: 101.97, ty: 399.47, size: 10 },
  { key: 'categoria', tx: 315.76, ty: 73.67, size: 10 },
  { key: 'capacidade', tx: 510.08, ty: 88.78, size: 10 },
  { key: 'potenciaCil', tx: 316.01, ty: 114.22, size: 10 },
  { key: 'pesoBruto', tx: 510.08, ty: 114.70, size: 10 },
  { key: 'motor', tx: 317.00, ty: 140.86, size: 10 },
  { key: 'cmt', tx: 453.79, ty: 140.62, size: 10 },
  { key: 'eixos', tx: 504.80, ty: 140.62, size: 10 },
  { key: 'lotacao', tx: 538.63, ty: 140.86, size: 10 },
  { key: 'carroceria', tx: 316.01, ty: 166.27, size: 10 },
  { key: 'nomeProprietario', tx: 314.82, ty: 192.18, size: 10 },
  { key: 'cpfCnpj', tx: 463.39, ty: 223.38, size: 10 },
  { key: 'local', tx: 316.49, ty: 259.40, size: 10 },
  { key: 'data', tx: 510.08, ty: 258.20, size: 10 },
  { key: 'observacoes', tx: 26.87, ty: 442.18, size: 10 },
  { key: 'dataQuitacao', tx: 389.63, ty: 323.51, size: 10 },
  { key: 'custoBilhete', tx: 424.18, ty: 360.46, size: 10 },
  { key: 'custoEfetivo', tx: 494.72, ty: 360.46, size: 10 },
  { key: 'valorIof', tx: 424.18, ty: 401.25, size: 10 },
  { key: 'valorTotal', tx: 494.72, ty: 401.25, size: 10 },
  { key: 'catTarif', tx: 316.73, ty: 323.51, size: 10 },
  { key: 'repasseFns', tx: 316.73, ty: 360.46, size: 10 },
  { key: 'repasseDenatran', tx: 316.73, ty: 401.25, size: 10 },
];

const FIELD_LABELS: Record<string, string> = {
  uf: 'UF do CRLV',
  renavam: 'Código Renavam',
  placa: 'Placa',
  exercicio: 'Exercício',
  anoFab: 'Ano Fabricação',
  anoMod: 'Ano Modelo',
  numeroCrv: 'Número do CRV',
  codSegCla: 'Cód. Segurança CLA',
  catObs: 'CAT',
  marcaModelo: 'Marca / Modelo / Versão',
  especieTipo: 'Espécie / Tipo',
  placaAnt: 'Placa Anterior / UF',
  chassi: 'Chassi',
  cor: 'Cor Predominante',
  combustivel: 'Combustível',
  categoria: 'Categoria',
  capacidade: 'Capacidade',
  potenciaCil: 'Potência / Cilindrada',
  pesoBruto: 'Peso Bruto Total',
  motor: 'Motor',
  cmt: 'CMT',
  eixos: 'Eixos',
  lotacao: 'Lotação',
  carroceria: 'Carroceria',
  nomeProprietario: 'Nome do Proprietário',
  cpfCnpj: 'CPF / CNPJ',
  local: 'Local (CIDADE UF)',
  data: 'Data de Emissão',
  observacoes: 'Observações',
  dataQuitacao: 'Data de Quitação',
  custoBilhete: 'Custo do Bilhete',
  custoEfetivo: 'Custo Efetivo do Seguro',
  valorIof: 'Valor do IOF',
  valorTotal: 'Valor Total',
  catTarif: 'CAT Tarif',
  repasseFns: 'Repasse Obrig. FNS',
  repasseDenatran: 'Repasse Obrig. DENATRAN',
};

export interface CrlvCanvasRef {
  getSnapshot: () => string | null;
}

const CrlvCanvas = forwardRef<CrlvCanvasRef, { values: Record<string, string>; qrImage: string | null }>(function CrlvCanvas(
  { values, qrImage },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [defaultQr, setDefaultQr] = useState<HTMLImageElement | null>(null);
  const [customQr, setCustomQr] = useState<HTMLImageElement | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  // Load fonts
  useEffect(() => {
    const openSans = new FontFace('OpenSans', `url(${openSansFont})`);
    const freeMono = new FontFace('FreeMonoBold', `url(${freeMonoBoldFont})`);
    Promise.all([openSans.load(), freeMono.load()]).then(([f1, f2]) => {
      document.fonts.add(f1);
      document.fonts.add(f2);
      setFontLoaded(true);
    }).catch(err => {
      console.error('Erro ao carregar fontes:', err);
      setFontLoaded(true);
    });
  }, []);

  // Load base template
  useEffect(() => {
    const img = new Image();
    img.onload = () => setBgImage(img);
    img.src = '/templates/crlv-template-base.png?v=1';
  }, []);

  // Generate QR from CPF verification URL (or use custom uploaded QR)
  const cpfClean = (values.cpfCnpj || '').replace(/\D/g, '');
  useEffect(() => {
    if (qrImage) {
      // Custom QR uploaded — use it
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { setCustomQr(img); setDefaultQr(null); };
      img.onerror = () => setCustomQr(null);
      img.src = qrImage;
      return;
    }
    setCustomQr(null);

    // Generate real QR from CPF verification URL
    if (cpfClean.length >= 11) {
      const densePad = '#REPUBLICA.FEDERATIVA.DO.BRASIL//CERTIFICADO.DE.REGISTRO.E.LICENCIAMENTO.DE.VEICULO//DETRAN//DENATRAN//CONTRAN//SENATRAN//v1=SERPRO//v2=RENAVAM//v3=REGISTRO.NACIONAL//v4=CERTIFICADO.DIGITAL//v5=ICP-BRASIL//v6=LICENCIAMENTO.ANUAL//v7=SEGURO.DPVAT//v8=IPVA//v9=VISTORIA//v10=CRV';
      const crlvBase = import.meta.env.VITE_CRLV_QR_URL || 'https://qrcode-certificadodigital-vio.info/verificar-crlv?cpf=';
      const qrUrl = `${crlvBase}${cpfClean}${densePad}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrUrl)}&format=png&ecc=M`;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setDefaultQr(img);
      img.onerror = () => {
        // Fallback to sample
        const fallback = new Image();
        fallback.onload = () => setDefaultQr(fallback);
        fallback.src = '/images/qrcode-sample-crlv.png';
      };
      img.src = qrApiUrl;
    } else {
      // CPF not ready — use sample
      const img = new Image();
      img.onload = () => setDefaultQr(img);
      img.src = '/images/qrcode-sample-crlv.png';
    }
  }, [cpfClean, qrImage]);

  const drawCanvas = useCallback((withWatermark: boolean) => {
    if (!bgImage || !fontLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = bgImage.naturalWidth;
    canvas.height = bgImage.naturalHeight;
    ctx.drawImage(bgImage, 0, 0);

    const imgScale = bgImage.naturalWidth / 595;

    // Draw QR code
    const qrToDraw = customQr || defaultQr;
    if (qrToDraw) {
      const qrX = 167.23 * imgScale;
      const qrY = 92.85 * imgScale;
      const qrSize = 97.4 * imgScale;
      ctx.drawImage(qrToDraw, qrX, qrY, qrSize, qrSize);
    }

    for (const f of FIELDS) {
      if (f.tx === 0 && f.ty === 0) continue;
      let val = (values[f.key] || '').toUpperCase();
      if (!val.trim()) continue;
      if (f.key === 'uf') val = `DETRAN-   ${val}`;

      const px = f.tx * imgScale;
      const py = f.ty * imgScale;
      const fontSize = f.size * imgScale;

      ctx.fillStyle = '#000000';
      if (f.key === 'uf') {
        ctx.font = `600 ${fontSize}px "OpenSans", "Open Sans", sans-serif`;
      } else {
        ctx.font = `bold ${fontSize}px "FreeMonoBold", monospace`;
      }
      ctx.textBaseline = 'top';
      ctx.fillText(val, px, py);
    }

    const uf = values.uf || 'SP';
    const hashCode = values.docHash || '364525021238D00';
    const brDate = values.docData || '';
    const brTime = values.docHora || '';
    const docText = `Documento emitido por DETRAN ${uf} (${hashCode}) em ${brDate} às ${brTime}.`;

    const docX = 31.43 * imgScale;
    const docY = 413.00 * imgScale;
    const docFontSize = 4.42 * imgScale;

    ctx.fillStyle = '#000000';
    ctx.font = `normal ${docFontSize}px Arial, "OpenSans", sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(docText, docX, docY);

    // Watermark - marca d'água (apenas no preview visual)
    if (withWatermark) {
      const wmText = 'PREVIEW - DATA SISTEMAS';
      const wmFontSize = Math.round(canvas.width * 0.04);
      const wmSpacingX = canvas.width * 0.65;
      const wmSpacingY = canvas.height * 0.18;
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#000';
      ctx.font = `bold ${wmFontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let row = -1; row <= 6; row++) {
        for (let col = -1; col <= 2; col++) {
          ctx.save();
          const cx = col * wmSpacingX + (row % 2 === 0 ? 0 : wmSpacingX * 0.5);
          const cy = row * wmSpacingY;
          ctx.translate(cx, cy);
          ctx.rotate(-Math.PI / 6);
          ctx.fillText(wmText, 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
    }
  }, [values, bgImage, fontLoaded, defaultQr, customQr]);

  useImperativeHandle(ref, () => ({
    getSnapshot: () => {
      // Redesenha SEM marca d'água, captura, depois redesenha COM
      drawCanvas(false);
      const canvas = canvasRef.current;
      if (!canvas || !canvas.width || !canvas.height) return null;
      let result: string | null = null;
      try {
        result = canvas.toDataURL('image/png');
      } catch {
        result = null;
      }
      // Restaura preview com marca d'água
      drawCanvas(true);
      return result;
    },
  }), [drawCanvas]);

  useEffect(() => {
    drawCanvas(true);
  }, [drawCanvas]);

  return (
    <canvas ref={canvasRef} className="w-full h-auto block" />
  );
});

// Auto-format helpers
function formatDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatTime(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4)}`;
}

function formatPlacaUf(raw: string): string {
  // Remove tudo exceto letras, números e /
  const clean = raw.replace(/[^A-Za-z0-9/]/g, '').toUpperCase();
  // Se já tem /, separa placa e UF
  const parts = clean.split('/');
  if (parts.length >= 2) {
    return `${parts[0].slice(0, 7)}/${parts[1].slice(0, 2)}`;
  }
  // Se digitou 7+ chars sem /, auto-insere /
  if (clean.length > 7) {
    return `${clean.slice(0, 7)}/${clean.slice(7, 9)}`;
  }
  return clean.slice(0, 7);
}

function formatCpfCnpj(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  // CNPJ: 00.000.000/0000-00
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export default function CrlvPositionTool() {
  const now = new Date();
  const defaultDate = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
  const defaultTime = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const { admin } = useAuth();
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [cpfConfirmed, setCpfConfirmed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const [fullscreen, setFullscreen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const previewCanvasRef = useRef<CrlvCanvasRef>(null);
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    placa: string;
    senha: string;
    pdfUrl: string | null;
    nomeProprietario: string;
  }>({ isOpen: false, placa: '', senha: '', pdfUrl: null, nomeProprietario: '' });

  const handleGerarCrlv = async () => {
    if (!admin) {
      toast.error('Você precisa estar logado para gerar o CRLV');
      return;
    }
    const v = watch();
    if (!v.renavam || !v.placa || !v.nomeProprietario || !v.cpfCnpj) {
      toast.error('Preencha os campos obrigatórios: Renavam, Placa, Nome e CPF/CNPJ');
      return;
    }
    setSaving(true);
    try {
      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      let previewImageBase64: string | null = null;
      for (let attempt = 0; attempt < 20; attempt++) {
        const snapshot = previewCanvasRef.current?.getSnapshot() ?? null;
        if (snapshot && snapshot.startsWith('data:image/png;base64,') && snapshot.length > 2000) {
          previewImageBase64 = snapshot;
          break;
        }
        await wait(120);
      }

      if (!previewImageBase64) {
        throw new Error('Preview não pronto. Aguarde o preview carregar e tente novamente.');
      }

      const result = await crlvService.save({
        admin_id: admin.id,
        session_token: admin.session_token!,
        renavam: v.renavam,
        placa: v.placa,
        exercicio: v.exercicio,
        numero_crv: v.numeroCrv,
        seguranca_crv: v.codSegCla,
        cod_seg_cla: v.codSegCla,
        marca_modelo: v.marcaModelo,
        ano_fab: v.anoFab,
        ano_mod: v.anoMod,
        cor: v.cor,
        combustivel: v.combustivel,
        especie_tipo: v.especieTipo,
        categoria: v.categoria,
        cat_obs: v.catObs,
        carroceria: v.carroceria,
        chassi: v.chassi,
        placa_ant: v.placaAnt,
        potencia_cil: v.potenciaCil,
        capacidade: v.capacidade,
        lotacao: v.lotacao,
        peso_bruto: v.pesoBruto,
        motor: v.motor,
        cmt: v.cmt,
        eixos: v.eixos,
        nome_proprietario: v.nomeProprietario,
        cpf_cnpj: v.cpfCnpj,
        local: v.local,
        data: v.data,
        observacoes: v.observacoes,
        uf: v.uf,
        data_quitacao: v.dataQuitacao,
        cat_tarif: v.catTarif,
        repasse_fns: v.repasseFns,
        repasse_denatran: v.repasseDenatran,
        custo_bilhete: v.custoBilhete,
        custo_efetivo: v.custoEfetivo,
        valor_iof: v.valorIof,
        valor_total: v.valorTotal,
        preview_image_base64: previewImageBase64,
      });
      playSuccessSound();
      setSuccessModal({
        isOpen: true,
        placa: v.placa,
        senha: result.senha,
        pdfUrl: result.pdf,
        nomeProprietario: v.nomeProprietario,
      });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar CRLV');
    } finally {
      setSaving(false);
    }
  };

  const { register, watch, setValue } = useForm<Record<string, string>>({
    defaultValues: {
      ...Object.fromEntries(FIELDS.map(f => [f.key, ''])),
      uf: 'SP',
      renavam: '01234567890',
      placa: 'ABC1D23',
      exercicio: '2026',
      anoFab: '2024',
      anoMod: '2025',
      numeroCrv: '123456789',
      codSegCla: '00000000000',
      catObs: '***',
      marcaModelo: 'VW/GOL 1.0 MPI',
      especieTipo: 'PASSAGEIRO/AUTOMOVEL',
      placaAnt: '*******/**',
      chassi: '9BWZZZ377VT004251',
      cor: 'PRATA',
      combustivel: 'ALCOOL/GASOLINA',
      categoria: 'PARTICULAR',
      capacidade: '*.*',
      potenciaCil: '75/999',
      pesoBruto: '1.35',
      motor: 'DHA012345',
      cmt: '1.75',
      eixos: '*',
      lotacao: '05P',
      carroceria: 'NÃO APLICAVEL',
      nomeProprietario: 'NOME DO PROPRIETARIO',
      cpfCnpj: '',
      local: 'SAO PAULO SP',
      data: defaultDate,
      observacoes: 'ALIENAÇÃO FIDUCIÁRIA',
      docData: defaultDate,
      docHora: defaultTime,
      docHash: '364525021238D00',
      dataQuitacao: '*',
      custoBilhete: '*',
      custoEfetivo: '*',
      valorIof: '*',
      valorTotal: '*',
      catTarif: '*',
      repasseFns: '*',
      repasseDenatran: '*',
    },
  });

  const values = watch();
  const cpfDigits = values.cpfCnpj?.replace(/\D/g, '').length ?? 0;
  const cpfReady = cpfConfirmed;

  // Onboarding: highlight key sections after CPF confirmation
  const ONBOARDING_TIPS: Record<string, string> = {
    estado: '⬅ Estado (UF) onde o documento foi emitido',
    emissao: '⬅ Proprietário, local e data de emissão',
    veiculo: '⬅ Dados técnicos do veículo',
    docEmitido: '⬅ Data/hora impressa no rodapé do documento',
  };

  const [onboardingCountdown, setOnboardingCountdown] = useState(0);
  const onboardingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleConfirmCpf = () => {
    setCpfConfirmed(true);
    setShowOnboarding(true);
    setOnboardingCountdown(20);
    // Countdown timer
    if (onboardingTimerRef.current) clearInterval(onboardingTimerRef.current);
    onboardingTimerRef.current = setInterval(() => {
      setOnboardingCountdown(prev => {
        if (prev <= 1) {
          clearInterval(onboardingTimerRef.current!);
          onboardingTimerRef.current = null;
          setShowOnboarding(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    if (onboardingTimerRef.current) {
      clearInterval(onboardingTimerRef.current);
      onboardingTimerRef.current = null;
    }
  };

  const onboardingClass = (id: string) => {
    if (!showOnboarding || !ONBOARDING_TIPS[id]) return '';
    return 'ring-2 ring-primary ring-offset-2 ring-offset-background';
  };

  const onboardingTip = (id: string) => {
    if (!showOnboarding || !ONBOARDING_TIPS[id]) return null;
    return (
      <div className="bg-primary/10 border border-primary/30 text-primary text-[11px] rounded px-2 py-1 mt-1 flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
        <span>{ONBOARDING_TIPS[id]}</span>
      </div>
    );
  };

  // Dados de Emissão do CRLV
  const emissaoFields = [
    'nomeProprietario', 'cpfCnpj', 'local', 'data',
  ];

  // Dados do Veículo
  const veiculoFields = [
    'renavam', 'placa', 'exercicio', 'anoFab', 'anoMod', 'numeroCrv',
    'codSegCla', 'catObs', 'marcaModelo', 'especieTipo', 'placaAnt', 'chassi',
    'cor', 'combustivel', 'categoria', 'capacidade', 'potenciaCil', 'pesoBruto',
    'motor', 'cmt', 'eixos', 'lotacao', 'carroceria',
  ];

  // Dados do Seguro DPVAT
  const seguroFields = ['observacoes'] as const;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Car className="h-7 w-7 text-primary" />
            CRLV Digital 2026
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Preencha os dados do veículo — o preview é atualizado em tempo real.</p>
        </div>

        {!cpfReady && (
          <Card className="mb-4 border-border">
            <CardContent className="pt-4 pb-4">
              <Label className="text-xs text-muted-foreground mb-1.5 block">CPF ou CNPJ do proprietário</Label>
              <div className="flex items-center gap-2 max-w-md">
                <Input
                  value={values.cpfCnpj || ''}
                  onChange={(e) => setValue('cpfCnpj', formatCpfCnpj(e.target.value))}
                  className="h-9 text-sm uppercase flex-1"
                  placeholder="Digite o CPF ou CNPJ"
                  maxLength={18}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter' && cpfDigits >= 11) handleConfirmCpf(); }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-xs gap-1.5 shrink-0"
                  disabled={cpfDigits < 11}
                  onClick={handleConfirmCpf}
                >
                  <Check className="h-3.5 w-3.5" />
                  Confirmar
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {cpfDigits === 0 ? 'CPF (11 dígitos) ou CNPJ (14 dígitos)' :
                 cpfDigits < 11 ? `${cpfDigits}/11 dígitos` :
                 cpfDigits === 11 ? '✓ CPF completo' :
                 cpfDigits < 14 ? `${cpfDigits}/14 dígitos (CNPJ)` :
                 '✓ CNPJ completo'}
              </p>
            </CardContent>
          </Card>
        )}

        {showOnboarding && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 text-xs text-primary flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Campos destacados com dados de exemplo — altere conforme necessário.</span>
            <span className="ml-auto tabular-nums font-mono text-[10px] text-muted-foreground">{onboardingCountdown}s</span>
            <button onClick={dismissOnboarding} className="text-primary hover:underline text-[11px]">Fechar</button>
          </div>
        )}

        <div className="relative">
          <div className={`flex flex-col lg:flex-row gap-6 transition-all duration-200 ${!cpfReady ? 'opacity-40 saturate-50 pointer-events-none select-none' : 'opacity-100'}`}>
          {/* ── FORMULÁRIO ── */}
          <div className="w-full lg:w-1/2 space-y-4">

            {/* Estado */}
            <Card className={`relative transition-all duration-300 ${onboardingClass('estado')}`}>
              {onboardingTip('estado')}
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Estado de Emissão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-xs text-muted-foreground">UF do CRLV</Label>
                  <Select value={values.uf} onValueChange={(val) => setValue('uf', val)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Documento Emitido */}
            <Card className={`relative transition-all duration-300 ${onboardingClass('docEmitido')}`}>
              {onboardingTip('docEmitido')}
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Documento Emitido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Data</Label>
                      <Button type="button" variant="ghost" size="sm" className="h-4 px-1 text-[9px] text-primary"
                        onClick={() => {
                          const now = new Date();
                          setValue('docData', now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }));
                        }}>Definir atual</Button>
                    </div>
                    <Input value={values.docData || ''} onChange={(e) => setValue('docData', formatDate(e.target.value))} className="h-8 text-sm uppercase" placeholder="dd/mm/aaaa" maxLength={10} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Hora</Label>
                      <Button type="button" variant="ghost" size="sm" className="h-4 px-1 text-[9px] text-primary"
                        onClick={() => {
                          const now = new Date();
                          setValue('docHora', now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                        }}>Definir atual</Button>
                    </div>
                    <Input value={values.docHora || ''} onChange={(e) => setValue('docHora', formatTime(e.target.value))} className="h-8 text-sm uppercase" placeholder="hh:mm:ss" maxLength={8} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Código Hash</Label>
                    <Button type="button" variant="ghost" size="sm" className="h-4 px-1 text-[9px] text-primary"
                      onClick={() => {
                        const chars = '0123456789ABCDEF';
                        let hash = '';
                        for (let i = 0; i < 12; i++) hash += chars[Math.floor(Math.random() * chars.length)];
                        setValue('docHash', hash + 'D00');
                      }}>Gerar</Button>
                  </div>
                  <Input {...register('docHash')} className="h-8 text-sm uppercase font-mono" placeholder="364525021238D00" />
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-1">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    O <span className="text-foreground font-medium">QR Code atual</span> é gerado automaticamente a partir do CPF/CNPJ inserido e pode ser lido normalmente.
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Se preferir, você pode <span className="text-foreground font-medium">substituí-lo</span> por um QR Code personalizado enviando sua própria imagem abaixo.
                  </p>
                </div>
                {qrImage && (
                  <img src={qrImage} alt="QR Preview" className="w-20 h-20 object-contain border border-border rounded" />
                )}
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" className="text-xs"
                    onClick={() => document.getElementById('qr-upload-input')?.click()}>
                    {qrImage ? 'Trocar QR Code' : 'Enviar QR Code'}
                  </Button>
                  {qrImage && (
                    <Button type="button" variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => setQrImage(null)}>
                      Remover
                    </Button>
                  )}
                </div>
                <input id="qr-upload-input" type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setQrImage(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
              </CardContent>
            </Card>

            {/* Dados de Emissão */}
            <Card className={`relative transition-all duration-300 ${onboardingClass('emissao')}`}>
              {onboardingTip('emissao')}
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Dados de Emissão do CRLV
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {emissaoFields.map(key => (
                    <div key={key} className={key === 'nomeProprietario' ? 'col-span-2' : ''}>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">{FIELD_LABELS[key]}</Label>
                        {key === 'data' && (
                          <Button type="button" variant="ghost" size="sm" className="h-4 px-1 text-[9px] text-primary"
                            onClick={() => {
                              const now = new Date();
                              setValue('data', now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }));
                            }}>Definir atual</Button>
                        )}
                      </div>
                      {key === 'data' ? (
                        <Input value={values.data || ''} onChange={(e) => setValue('data', formatDate(e.target.value))} className="h-8 text-sm uppercase" placeholder="dd/mm/aaaa" maxLength={10} />
                      ) : key === 'cpfCnpj' ? (
                        <Input value={values.cpfCnpj || ''} onChange={(e) => setValue('cpfCnpj', formatCpfCnpj(e.target.value))} className="h-8 text-sm uppercase" placeholder="000.000.000-00" maxLength={18} />
                      ) : (
                        <Input {...register(key)} className="h-8 text-sm uppercase" placeholder={FIELD_LABELS[key]} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dados do Veículo */}
            <Card className={`relative transition-all duration-300 ${onboardingClass('veiculo')}`}>
              {onboardingTip('veiculo')}
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" /> Dados do Veículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {veiculoFields.map(key => (
                    <div key={key} className={key === 'marcaModelo' || key === 'especieTipo' || key === 'carroceria' ? 'col-span-2' : ''}>
                      <Label className="text-xs text-muted-foreground">{FIELD_LABELS[key]}</Label>
                      {key === 'placaAnt' ? (
                        <Input value={values.placaAnt || ''} onChange={(e) => setValue('placaAnt', formatPlacaUf(e.target.value))} className="h-8 text-sm uppercase" placeholder="ABC1D23/SP" maxLength={10} />
                      ) : (
                        <Input {...register(key)} className="h-8 text-sm uppercase" placeholder={FIELD_LABELS[key]} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dados do Seguro DPVAT */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Dados do Seguro DPVAT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {(['catTarif', 'dataQuitacao', 'repasseFns', 'repasseDenatran', 'custoBilhete', 'custoEfetivo', 'valorIof', 'valorTotal'] as string[]).map(key => (
                    <div key={key}>
                      <Label className="text-xs text-muted-foreground">{FIELD_LABELS[key]}</Label>
                      <Input {...register(key)} className="h-8 text-sm uppercase" placeholder={FIELD_LABELS[key]} />
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Observações</Label>
                  <Textarea {...register('observacoes')} className="text-sm min-h-[80px] uppercase" placeholder="Observações do veículo" />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ── PREVIEW ── */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-6 lg:self-start flex flex-col items-center gap-4">
            <div className="text-xs text-muted-foreground text-center font-medium uppercase tracking-wider">Preview (tempo real)</div>
            <div className="relative w-full flex justify-center">
              <div className="max-w-[550px] w-full">
                <CrlvCanvas ref={previewCanvasRef} values={values} qrImage={qrImage} />
              </div>
            </div>

            {/* Botão Gerar com confirmação */}
            {!confirmGenerate ? (
              <Button
                variant="outline"
                className="w-full max-w-xs h-10 text-sm font-medium"
                onClick={() => {
                  const v = watch();
                  if (!v.renavam || !v.placa || !v.nomeProprietario || !v.cpfCnpj) {
                    toast.error('Preencha os campos obrigatórios: Renavam, Placa, Nome e CPF/CNPJ');
                    return;
                  }
                  setConfirmGenerate(true);
                }}
                disabled={saving}
              >
                Gerar CRLV — 1 crédito
              </Button>
            ) : (
              <div className="w-full max-w-sm space-y-3">
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground">Atenção antes de gerar:</p>
                      <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
                        <li>Após gerado, <span className="text-foreground font-medium">não será possível editar</span></li>
                        <li>Ficará salvo no seu <span className="text-foreground font-medium">histórico de serviços</span></li>
                        <li>Expira automaticamente em <span className="text-foreground font-medium">45 dias</span> e será excluído</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setConfirmGenerate(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => { setConfirmGenerate(false); handleGerarCrlv(); }}
                    disabled={saving}
                  >
                    {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Gerando...</> : 'Confirmar e Gerar'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!cpfReady && (
            <div className="pointer-events-none absolute inset-0 hidden lg:flex items-center justify-center">
              <div className="rounded-lg border border-border bg-background/90 px-4 py-2">
                <p className="text-xs text-foreground">Aguardando CPF/CNPJ para liberar edição</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Fullscreen preview modal (mobile) */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-background overflow-auto">
          <Button type="button" variant="outline" size="icon"
            className="fixed top-3 right-3 z-[60] h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-lg"
            onClick={() => setFullscreen(false)}>
            <X className="h-5 w-5" />
          </Button>
          <div className="p-2">
            <CrlvCanvas ref={previewCanvasRef} values={values} qrImage={qrImage} />
          </div>
        </div>
      )}

      <CrlvSuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
        placa={successModal.placa}
        senha={successModal.senha}
        pdfUrl={successModal.pdfUrl}
        nomeProprietario={successModal.nomeProprietario}
      />
    </DashboardLayout>
  );
}
