import { useEffect, useRef, useState, useCallback } from 'react';
import { useFormGuard } from '@/hooks/useFormGuard';
import { useCpfCheck } from '@/hooks/useCpfCheck';
import CpfDuplicateModal from '@/components/CpfDuplicateModal';
import { loadWatermarkLogo, drawLogoWatermarks } from '@/lib/watermark-utils';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, FileText, Hospital, User, Stethoscope, Info, Shuffle, Clock, CheckCircle, Download, Calendar } from 'lucide-react';
import { getUnidadesPorUF, UF_LABELS, UFS_DISPONIVEIS } from '@/lib/hapvida-unidades';
import { buscarMedicos, getCidadesPorEstado, getEstadosMedicos, type MedicoHapvida } from '@/lib/hapvida-medicos';
import logoHapvida from '@/assets/logo-hapvida.png';
import hapvidaFolha from '@/assets/hapvida-folha.png';
import { hapvidaService } from '@/lib/hapvida-service';

// ── CID-10 list (abridged import from HapvidaPositionTool) ─────────────────
const CID_LIST: { codigo: string; descricao: string }[] = [
  { codigo: 'A09', descricao: 'Diarreia e gastroenterite de origem infecciosa presumível' },
  { codigo: 'A90', descricao: 'Dengue (dengue clássica)' },
  { codigo: 'B01.9', descricao: 'Varicela sem complicações (catapora)' },
  { codigo: 'B02.9', descricao: 'Herpes zoster sem complicações (cobreiro)' },
  { codigo: 'E03.9', descricao: 'Hipotireoidismo não especificado' },
  { codigo: 'E10.9', descricao: 'Diabetes mellitus tipo 1 sem complicações' },
  { codigo: 'E11.9', descricao: 'Diabetes mellitus tipo 2 sem complicações' },
  { codigo: 'E66.9', descricao: 'Obesidade não especificada' },
  { codigo: 'E78.0', descricao: 'Hipercolesterolemia pura (colesterol alto)' },
  { codigo: 'F32.0', descricao: 'Episódio depressivo leve' },
  { codigo: 'F32.1', descricao: 'Episódio depressivo moderado' },
  { codigo: 'F32.9', descricao: 'Episódio depressivo não especificado' },
  { codigo: 'F41.0', descricao: 'Transtorno do pânico (síndrome do pânico)' },
  { codigo: 'F41.1', descricao: 'Transtorno de ansiedade generalizada' },
  { codigo: 'F41.2', descricao: 'Transtorno misto ansioso e depressivo' },
  { codigo: 'F48.0', descricao: 'Neurastenia (esgotamento nervoso / burnout)' },
  { codigo: 'G43.9', descricao: 'Enxaqueca não especificada' },
  { codigo: 'G44.2', descricao: 'Cefaleia tensional' },
  { codigo: 'G47.0', descricao: 'Insônia' },
  { codigo: 'G51.0', descricao: 'Paralisia de Bell (paralisia facial)' },
  { codigo: 'G56.0', descricao: 'Síndrome do túnel do carpo' },
  { codigo: 'H10.9', descricao: 'Conjuntivite não especificada' },
  { codigo: 'H66.9', descricao: 'Otite média supurativa não especificada' },
  { codigo: 'H81.1', descricao: 'Vertigem paroxística benigna (tontura)' },
  { codigo: 'I10', descricao: 'Hipertensão essencial (pressão alta)' },
  { codigo: 'I50.9', descricao: 'Insuficiência cardíaca não especificada' },
  { codigo: 'I84.9', descricao: 'Hemorroidas não especificadas' },
  { codigo: 'J00', descricao: 'Rinofaringite aguda (resfriado comum / gripe)' },
  { codigo: 'J01.9', descricao: 'Sinusite aguda não especificada' },
  { codigo: 'J02.9', descricao: 'Faringite aguda não especificada' },
  { codigo: 'J03.9', descricao: 'Amigdalite aguda não especificada' },
  { codigo: 'J06.9', descricao: 'Infecção aguda das vias aéreas superiores' },
  { codigo: 'J18.9', descricao: 'Pneumonia não especificada' },
  { codigo: 'J20.9', descricao: 'Bronquite aguda não especificada' },
  { codigo: 'J30.4', descricao: 'Rinite alérgica não especificada' },
  { codigo: 'J45.9', descricao: 'Asma não especificada' },
  { codigo: 'K21.0', descricao: 'Refluxo gastroesofágico com esofagite (DRGE)' },
  { codigo: 'K29.7', descricao: 'Gastrite não especificada' },
  { codigo: 'K30', descricao: 'Dispepsia (má digestão / azia)' },
  { codigo: 'K35.9', descricao: 'Apendicite aguda não especificada' },
  { codigo: 'K58.9', descricao: 'Síndrome do intestino irritável' },
  { codigo: 'K59.0', descricao: 'Constipação intestinal (prisão de ventre)' },
  { codigo: 'K80.2', descricao: 'Colelitíase (cálculo na vesícula)' },
  { codigo: 'L20.9', descricao: 'Dermatite atópica não especificada (eczema)' },
  { codigo: 'L50.9', descricao: 'Urticária não especificada' },
  { codigo: 'M06.9', descricao: 'Artrite reumatoide não especificada' },
  { codigo: 'M10.9', descricao: 'Gota não especificada' },
  { codigo: 'M17.9', descricao: 'Gonartrose (artrose do joelho) não especificada' },
  { codigo: 'M47.9', descricao: 'Espondilose não especificada (artrose da coluna)' },
  { codigo: 'M51.1', descricao: 'Hérnia de disco lombar com radiculopatia' },
  { codigo: 'M54.2', descricao: 'Cervicalgia (dor no pescoço)' },
  { codigo: 'M54.4', descricao: 'Lumbago com ciática' },
  { codigo: 'M54.5', descricao: 'Dor lombar baixa (lombalgia)' },
  { codigo: 'M54.59', descricao: 'Dor lombar crônica não especificada' },
  { codigo: 'M65.9', descricao: 'Sinovite e tenossinovite não especificadas' },
  { codigo: 'M75.1', descricao: 'Síndrome do manguito rotador (ombro)' },
  { codigo: 'M79.3', descricao: 'Paniculite não especificada' },
  { codigo: 'N10', descricao: 'Nefrite tubulointersticial aguda (infecção renal)' },
  { codigo: 'N30.0', descricao: 'Cistite aguda (infecção urinária)' },
  { codigo: 'N39.0', descricao: 'Infecção do trato urinário sem localização especificada' },
  { codigo: 'N94.6', descricao: 'Dismenorreia não especificada (cólica menstrual)' },
  { codigo: 'R05', descricao: 'Tosse' },
  { codigo: 'R10.4', descricao: 'Outras dores abdominais e as não especificadas' },
  { codigo: 'R11', descricao: 'Náusea e vômitos' },
  { codigo: 'R50.9', descricao: 'Febre não especificada' },
  { codigo: 'R51', descricao: 'Cefaleia / dor de cabeça não especificada' },
  { codigo: 'S06.0', descricao: 'Concussão cerebral (traumatismo craniano)' },
  { codigo: 'S52.5', descricao: 'Fratura da extremidade distal do rádio' },
  { codigo: 'S82.9', descricao: 'Fratura da perna não especificada' },
  { codigo: 'T14.0', descricao: 'Ferimento superficial de região do corpo não especificada' },
  { codigo: 'Z76.9', descricao: 'Contato com serviços de saúde por razão não especificada' },
];

// ── Canvas config ──────────────────────────────────────────────────────────
const ORIG_W = 2090;
const ORIG_H = 2734;
const CANVAS_W = 650;
const CANVAS_H = Math.round(650 * (ORIG_H / ORIG_W));
const SCALE = CANVAS_W / ORIG_W;

function gerarCodigo() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 11 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const DIAS_EXTENSO: Record<number, string> = {
  1: 'UM', 2: 'DOIS', 3: 'TRÊS', 4: 'QUATRO', 5: 'CINCO',
  6: 'SEIS', 7: 'SETE', 8: 'OITO', 9: 'NOVE', 10: 'DEZ',
  11: 'ONZE', 12: 'DOZE', 13: 'TREZE', 14: 'QUATORZE', 15: 'QUINZE',
  20: 'VINTE', 30: 'TRINTA',
};
function diasExt(n: number) { return DIAS_EXTENSO[n] ?? String(n); }

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function nowStr() {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${p(n.getDate())}/${p(n.getMonth()+1)}/${n.getFullYear()} ${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function AtestadoHapvida() {
  const { admin, loading, refreshCredits } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiResCanvasRef = useRef<HTMLCanvasElement>(null);

  // Form state
  const [nomePaciente, setNomePaciente] = useState('');
  const [cpfPaciente, setCpfPaciente] = useState('');
  const [diasAfastamento, setDiasAfastamento] = useState(1);
  const [dataApartir, setDataApartir] = useState(() => {
    const n = new Date(); const p=(x:number)=>String(x).padStart(2,'0');
    return `${p(n.getDate())}/${p(n.getMonth()+1)}/${n.getFullYear()}`;
  });
  const [horario, setHorario] = useState(() => {
    const n = new Date(); const p=(x:number)=>String(x).padStart(2,'0');
    return `${p(n.getHours())}:${p(n.getMinutes())}`;
  });
  const [cidBusca, setCidBusca] = useState('');
  const [cidDropdown, setCidDropdown] = useState(false);
  const [codigoCid, setCodigoCid] = useState('N30.0');
  const [ufSelecionada, setUfSelecionada] = useState('AM');
  const [cidadeUnidadeSel, setCidadeUnidadeSel] = useState('');
  const [nomeHospital, setNomeHospital] = useState('HOSPITAL RIO NEGRO');
  const [enderecoHospital, setEnderecoHospital] = useState('R. TAPAJOS, 561 - CENTRO');
  const [cidadeHospital, setCidadeHospital] = useState('MANAUS- AM, CEP 69010-150');
  const [nomeMedico, setNomeMedico] = useState('');
  const [crm, setCrm] = useState('');
  const [linkValidacao, setLinkValidacao] = useState('https://webhap.hapvida-validacao.info/');

  // Médico
  const [medicoManual, setMedicoManual] = useState(false);
  const [ufMedico, setUfMedico] = useState('AM');
  const [cidadeMedicoSel, setCidadeMedicoSel] = useState('');
  const [cidadeMedico, setCidadeMedico] = useState('');
  const [medicoBusca, setMedicoBusca] = useState('');
  const [medicoDropdown, setMedicoDropdown] = useState(false);
  const medicoDropdownRef = useRef<HTMLDivElement>(null);
  const [ip, setIp] = useState('10.200.125.141');
  const [dataHora, setDataHora] = useState(nowStr);
  const [codigoAuth, setCodigoAuth] = useState(gerarCodigo);
  const [assinaturaUrl, setAssinaturaUrl] = useState<string | null>('/images/hapvida-carimbo-default.png');
  const [carimboPadrao, setCarimboPadrao] = useState(true);
  const [criando, setCriando] = useState(false);

  // Modal de sucesso
  const [successModal, setSuccessModal] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [criadoEm, setCriadoEm] = useState('');

  // Form guard
  const { setFormDirty } = useFormGuard();
  useEffect(() => {
    if (nomePaciente || cpfPaciente) setFormDirty(true);
    else setFormDirty(false);
    return () => setFormDirty(false);
  }, [nomePaciente, cpfPaciente, setFormDirty]);

  // CPF duplicate check
  const cpfCheck = useCpfCheck({
    admin_id: admin?.id || 0,
    session_token: admin?.session_token || '',
    service_type: 'hapvida',
  });

  useEffect(() => {
    if (cpfPaciente.replace(/\D/g, '').length === 11) {
      cpfCheck.checkCpf(cpfPaciente);
    }
  }, [cpfPaciente]);

  // Toast inicial ao entrar no módulo
  useEffect(() => {
    toast.info('Preencha os dados do paciente, hospital e médico para gerar o atestado.', { duration: 5000 });
  }, []);

  // Fechar dropdown de médicos ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (medicoDropdownRef.current && !medicoDropdownRef.current.contains(e.target as Node)) {
        setMedicoDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Render canvas sem marca d'água (para PDF) ──────────────────────────
  const renderCanvas = useCallback((
    canvas: HTMLCanvasElement,
    scale: number,
    withWatermark: boolean
  ) => {
    return new Promise<void>((resolve) => {
      const ctx = canvas.getContext('2d')!;
      const S = scale;

      const logo = new Image();
      logo.onload = () => {
        const folha = new Image();
        folha.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(folha, 0, 0, canvas.width, canvas.height);

          // Borda cabeçalho
          ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
          ctx.strokeRect(63.47*S, 178.75*S, 1963.05*S, 220.42*S);

          // Logo
          ctx.drawImage(logo, 99*S, 250*S, 394*S, 91*S);

          // Nome hospital
          const cX = (555 + 973/2)*S;
          const fH1 = Math.round(47*S);
          ctx.font = `bold ${fH1}px Arial`; ctx.fillStyle='#000'; ctx.textAlign='center';
          const bY1 = (216+47)*S;
          ctx.fillText(nomeHospital, cX, bY1);
          const w1 = ctx.measureText(nomeHospital).width;
          ctx.strokeStyle='#000'; ctx.lineWidth=Math.max(1,1.5*S);
          ctx.beginPath(); ctx.moveTo(cX-w1/2, bY1+3*S); ctx.lineTo(cX+w1/2, bY1+3*S); ctx.stroke();
          const fH2 = Math.round(35*S); ctx.font=`${fH2}px Arial`;
          ctx.fillText(enderecoHospital, cX, bY1+fH2*1.4);
          ctx.fillText(cidadeHospital, cX, bY1+fH2*1.4*2);

          // Título
          const fT = Math.round(40*S); ctx.font=`bold ${fT}px Arial`;
          ctx.fillStyle='#000'; ctx.textAlign='left';
          ctx.fillText('ATESTADO MÉDICO', 798*S, (499+38)*S);

          // Corpo
          const fC = Math.round(43*S); ctx.font=`${fC}px Arial`;
          ctx.fillStyle='#000'; ctx.textAlign='left';
          const texto = `Atesto que atendi nesta data o (a) Sr (a) ${nomePaciente}, CPF ${cpfPaciente} ás ${horario}, sendo necessário o seu afastamento das atividades laborativas ou academicas por ${diasAfastamento} (${diasExt(diasAfastamento)}) dia (s), apartir de ${dataApartir}, tendo como causa do atendimento o código abaixo:`;
          const linhas = wrapText(ctx, texto, 1815*S);
          const lH = fC*1.35;
          linhas.forEach((l,i) => ctx.fillText(l, 133*S, (726+fC)*S + i*lH));

          // Linha rodapé
          ctx.strokeStyle='#000'; ctx.lineWidth=Math.max(1,4.3*S);
          ctx.beginPath(); ctx.moveTo(102.69*S,2461.97*S); ctx.lineTo((102.69+1887.44)*S,2461.97*S); ctx.stroke();

          // Linha interna
          ctx.lineWidth=Math.max(1,1.67*S);
          ctx.beginPath(); ctx.moveTo(150.5*S,1201.84*S); ctx.lineTo((150.5+733.54)*S,1201.84*S); ctx.stroke();

          // Linha tracejada
          ctx.lineWidth=Math.max(1,0.83*S); ctx.setLineDash([6*S,4*S]);
          ctx.beginPath(); ctx.moveTo(149.91*S,1073.25*S); ctx.lineTo((149.91+331.22)*S,1073.25*S); ctx.stroke();
          ctx.setLineDash([]);

          // Labels
          const fLabel = Math.round(36*S); ctx.font=`${fLabel}px Arial`;
          ctx.fillText('Código da Doença', 149*S, (1093+36)*S);
          const fCod = Math.round(43*S); ctx.font=`bold ${fCod}px Arial`;
          ctx.fillText(codigoCid, 150*S, (1017+32)*S);
          const fLoc = Math.round(28*S); ctx.font=`${fLoc}px Arial`;
          ctx.fillText('Local e Data', 388*S, (1218+28)*S);

          // Médico / CRM
          ctx.font=`${Math.round(43*S)}px Arial`;
          ctx.fillText(nomeMedico, 150*S, (1448+33)*S);
          ctx.fillText(crm, 149*S, (1564+33)*S);

          // Linha_4
          ctx.strokeStyle='#000'; ctx.lineWidth=Math.max(1,1.67*S);
          ctx.beginPath(); ctx.moveTo(150.5*S,1515.5*S); ctx.lineTo((150.5+733.54)*S,1515.5*S); ctx.stroke();

          // Aceito CID / Auth / Link
          const fA = Math.round(43*S); ctx.font=`${fA}px Arial`;
          ctx.fillText('Aceito a Colocação do CID. Assinado us ___________________', 130*S, (1742+33)*S);
          ctx.fillText(`Código de Autenticação: ${codigoAuth}`, 132*S, (1824+33)*S);
          ctx.fillText(`Solicitação da senha: ${dataHora}`, 132*S, (1875+33)*S);
          ctx.fillText('Link para validação do Atestado Médico:', 133*S, (1987+33)*S);
          ctx.fillText(linkValidacao, 133*S, (1987+33+43)*S);

          // Rodapé data/ip
          const fR = Math.round(43*S); ctx.font=`${fR}px Arial`;
          ctx.textAlign='left'; ctx.fillText(dataHora, 574*S, (2481+33)*S);
          ctx.textAlign='right'; ctx.fillText(ip, (574+1014)*S, (2481+33)*S);
          ctx.textAlign='left';

          // Carimbo + marca d'água
          const finalRender = (carImg: HTMLImageElement | null) => {
            if (carimboPadrao) {
              // Carimbo padrão: texto do médico rotacionado + carimbo por cima
              if (nomeMedico || crm) {
                const fMed = Math.round(40*S);
                const lineH = fMed * 1.45;
                const toTitleCase = (str: string) =>
                  str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
                const nomeLower = nomeMedico.trim().toLowerCase();
                const jaTemPrefixo = nomeLower.startsWith('dr.') || nomeLower.startsWith('dra.');
                const nomeRaw = jaTemPrefixo ? nomeMedico.trim() : `Dr. ${nomeMedico.trim()}`;
                const nomeDisplay = toTitleCase(nomeRaw);
                const centerX = (1400 + 422 / 2) * S;
                const centerY = (1356 + 263 / 2) * S;
                const angle = -22.39 * Math.PI / 180;
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(angle);
                ctx.fillStyle = '#000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `bold ${fMed}px Arial`;
                ctx.fillText(nomeDisplay, 0, -lineH);
                ctx.fillText('Médico', 0, 0);
                ctx.fillText(crm, 0, lineH);
                ctx.restore();
              }
              // Carimbo padrão redimensionado
              if (carImg) ctx.drawImage(carImg, 1413*S, 1364*S, 394*S, 256*S);
            } else {
              // Carimbo personalizado: sem texto do médico, imagem no tamanho real
              if (carImg) ctx.drawImage(carImg, 1413*S, 1364*S, carImg.naturalWidth*S, carImg.naturalHeight*S);
            }

            if (withWatermark) {
              loadWatermarkLogo().then(logo => {
                drawLogoWatermarks(ctx, canvas.width, canvas.height, logo, { opacity: 0.08 });
              });
            }

            resolve();
          };

          if (assinaturaUrl) {
            const carImg = new Image();
            carImg.onload = () => finalRender(carImg);
            carImg.onerror = () => finalRender(null);
            carImg.src = assinaturaUrl;
          } else {
            finalRender(null);
          }
        };
        folha.src = hapvidaFolha;
      };
      logo.src = logoHapvida;
    });
  }, [nomePaciente, cpfPaciente, horario, diasAfastamento, dataApartir, codigoCid,
      nomeHospital, enderecoHospital, cidadeHospital, nomeMedico, crm,
      codigoAuth, dataHora, linkValidacao, ip, assinaturaUrl, carimboPadrao]);

  // ── Preview (com marca d'água) ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCanvas(canvas, SCALE, true);
  }, [renderCanvas]);

  // ── Criar Atestado ─────────────────────────────────────────────────────
  const criarAtestado = useCallback(async () => {
    if (!admin) return;
    if (!nomePaciente.trim()) { toast.error('Informe o nome do paciente'); return; }
    if (!cpfPaciente.trim()) { toast.error('Informe o CPF do paciente'); return; }
    if (!nomeMedico.trim()) { toast.error('Informe o nome do médico'); return; }

    setCriando(true);
    try {
      // 1. Gerar imagem em alta resolução (sem marca d'água)
      const hiResCanvas = hiResCanvasRef.current!;
      hiResCanvas.width = ORIG_W;
      hiResCanvas.height = ORIG_H;
      await renderCanvas(hiResCanvas, 1, false);

      // 2. Converter canvas → PNG blob → PDF via pdf-lib
      const { PDFDocument } = await import('pdf-lib');
      const imgData = hiResCanvas.toDataURL('image/png');
      const resp = await fetch(imgData);
      const imgBytes = await resp.arrayBuffer();
      const pdfDoc = await PDFDocument.create();
      const pngImg = await pdfDoc.embedPng(imgBytes);
      const page = pdfDoc.addPage([595, 842]);
      page.drawImage(pngImg, { x: 0, y: 0, width: 595, height: 842 });
      const pdfBytes = await pdfDoc.save();

      // 3. Converter PDF para base64 para envio ao backend
      // Convert in chunks to avoid "Maximum call stack size exceeded"
      const uint8 = new Uint8Array(pdfBytes);
      let pdfBinary = '';
      const CHUNK = 8192;
      for (let i = 0; i < uint8.length; i += CHUNK) {
        pdfBinary += String.fromCharCode(...uint8.subarray(i, i + CHUNK));
      }
      const pdfBase64 = btoa(pdfBinary);

      // 4. Salvar no banco (desconta crédito) + enviar PDF
      const cidItem = CID_LIST.find(c => c.codigo === codigoCid);
      await hapvidaService.save({
        admin_id: admin.id,
        session_token: admin.session_token,
        nome_paciente: nomePaciente,
        cpf_paciente: cpfPaciente,
        dias_afastamento: diasAfastamento,
        data_apartir: dataApartir,
        horario_atendimento: horario,
        codigo_doenca: codigoCid,
        descricao_doenca: cidItem?.descricao || null,
        nome_hospital: nomeHospital,
        endereco_hospital: enderecoHospital,
        cidade_hospital: cidadeHospital,
        nome_medico: nomeMedico,
        crm,
        codigo_autenticacao: codigoAuth,
        data_hora: dataHora,
        ip,
        link_validacao: linkValidacao,
        pdf_base64: `data:application/pdf;base64,${pdfBase64}`,
      });

      // 5. Guardar blob para modal
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const previewUrl = URL.createObjectURL(blob);
      const agora = new Date();
      const criadoStr = agora.toLocaleString('pt-BR');

      setPdfBlob(blob);
      setPdfPreviewUrl(previewUrl);
      setCriadoEm(criadoStr);

      await refreshCredits();

      // 5. Limpar campos
      setNomePaciente('');
      setCpfPaciente('');
      setDiasAfastamento(1);
      setHorario(() => { const n = new Date(); const p=(x:number)=>String(x).padStart(2,'0'); return `${p(n.getHours())}:${p(n.getMinutes())}`; });
      setCodigoCid('N30.0');
      setCidBusca('');
      setNomeMedico('');
      setCrm('');
      setMedicoBusca('');
      setCidadeMedico('');
      setCodigoAuth(gerarCodigo());
      setDataHora(nowStr());
      setAssinaturaUrl('/images/hapvida-carimbo-default.png');
      setCarimboPadrao(true);

      // 6. Abrir modal de sucesso
      setSuccessModal(true);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao gerar atestado');
    } finally {
      setCriando(false);
    }
  }, [admin, nomePaciente, cpfPaciente, diasAfastamento, dataApartir, horario,
      codigoCid, nomeHospital, enderecoHospital, cidadeHospital, nomeMedico, crm,
      codigoAuth, dataHora, ip, linkValidacao, renderCanvas, refreshCredits]);

  const handleDownloadPdf = useCallback(() => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hapvida.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }, [pdfBlob]);

  const handleCloseModal = useCallback(() => {
    setSuccessModal(false);
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    setPdfBlob(null);
  }, [pdfPreviewUrl]);

  const handleUploadCarimbo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setAssinaturaUrl(reader.result as string); setCarimboPadrao(false); };
    reader.readAsDataURL(file);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!admin) return <Navigate to="/login" replace />;

  const cidFiltrados = cidBusca.length >= 2
    ? CID_LIST.filter(c => c.descricao.toLowerCase().includes(cidBusca.toLowerCase()) || c.codigo.toLowerCase().includes(cidBusca.toLowerCase())).slice(0, 10)
    : [];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Hospital className="h-7 w-7 text-primary" />
            Atestado Médico Hapvida
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Preencha os dados abaixo — o preview é atualizado em tempo real.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── FORMULÁRIO ── */}
          <div className="w-full lg:w-1/2 space-y-4">

            {/* Paciente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Dados do Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nome Completo</Label>
                  <Input value={nomePaciente} onChange={e => setNomePaciente(e.target.value.toUpperCase())} placeholder="NOME DO PACIENTE" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">CPF</Label>
                    <Input value={cpfPaciente} onChange={e => setCpfPaciente(formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Horário Atendimento</Label>
                    <Input value={horario} onChange={e => setHorario(e.target.value)} placeholder="HH:MM" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Dias de Afastamento</Label>
                    <Input type="number" min={1} max={30} value={diasAfastamento} onChange={e => setDiasAfastamento(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">A partir de</Label>
                    <Input value={dataApartir} onChange={e => setDataApartir(e.target.value)} placeholder="DD/MM/AAAA" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Doença CID */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Código da Doença (CID-10)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Label className="text-xs text-muted-foreground">Buscar doença ou código</Label>
                  <Input
                    value={cidBusca}
                    onChange={e => { setCidBusca(e.target.value); setCidDropdown(true); }}
                    onFocus={() => setCidDropdown(true)}
                    placeholder="Ex: lombalgia, gripe, J00..."
                    className="mt-1"
                  />
                  {cidDropdown && cidFiltrados.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
                      {cidFiltrados.map(c => (
                        <div
                          key={c.codigo}
                          className="flex items-baseline gap-2 px-3 py-2 cursor-pointer hover:bg-accent text-sm border-b border-border last:border-0"
                          onClick={() => { setCodigoCid(c.codigo); setCidBusca(`${c.codigo} — ${c.descricao}`); setCidDropdown(false); }}
                        >
                          <span className="font-mono font-bold text-primary min-w-[60px]">{c.codigo}</span>
                          <span className="text-muted-foreground text-xs">{c.descricao}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Código CID selecionado</Label>
                  <Input value={codigoCid} onChange={e => setCodigoCid(e.target.value.toUpperCase())} className="font-mono font-bold text-primary" />
                </div>
              </CardContent>
            </Card>

            {/* Hospital */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Hospital className="h-4 w-4 text-primary" /> Hospital / Unidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Seletor de Estado */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Estado (UF)</Label>
                  <select
                    value={ufSelecionada}
                    onChange={e => {
                      setUfSelecionada(e.target.value);
                      setCidadeUnidadeSel('');
                      setNomeHospital('');
                      setEnderecoHospital('');
                      setCidadeHospital('');
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {UFS_DISPONIVEIS.map(uf => (
                      <option key={uf} value={uf}>{uf} — {UF_LABELS[uf] ?? uf}</option>
                    ))}
                  </select>
                </div>
                {/* Seletor de Cidade */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Cidade</Label>
                  <select
                    value={cidadeUnidadeSel}
                    onChange={e => {
                      setCidadeUnidadeSel(e.target.value);
                      setNomeHospital('');
                      setEnderecoHospital('');
                      setCidadeHospital('');
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Todas as cidades —</option>
                    {[...new Set(getUnidadesPorUF(ufSelecionada).map(u => u.cidade))].sort().map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {/* Seletor de Unidade */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Unidade</Label>
                  <select
                    value={nomeHospital}
                    onChange={e => {
                      const unidade = getUnidadesPorUF(ufSelecionada).find(u => u.nome.toUpperCase() === e.target.value);
                      if (unidade) {
                        setNomeHospital(unidade.nome.toUpperCase());
                        setEnderecoHospital(unidade.endereco.toUpperCase());
                        setCidadeHospital(unidade.cidade.toUpperCase());
                      }
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Selecione uma unidade —</option>
                    {getUnidadesPorUF(ufSelecionada)
                      .filter(u => !cidadeUnidadeSel || u.cidade === cidadeUnidadeSel)
                      .map(u => (
                        <option key={u.nome} value={u.nome.toUpperCase()}>
                          [{u.tipo.slice(0, 3).toUpperCase()}] {u.nome}
                        </option>
                      ))}
                  </select>
                </div>
                {/* Campos somente leitura após seleção */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nome do Hospital</Label>
                  <Input value={nomeHospital} readOnly className="bg-muted/50 cursor-default focus:ring-0" placeholder="Selecione uma unidade acima" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Endereço</Label>
                  <Input value={enderecoHospital} readOnly className="bg-muted/50 cursor-default focus:ring-0" placeholder="—" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Cidade</Label>
                  <Input value={cidadeHospital} readOnly className="bg-muted/50 cursor-default focus:ring-0" placeholder="—" />
                </div>
                <p className="text-xs text-muted-foreground italic mt-1">⚠️ Esse local é oficial e exato.</p>
              </CardContent>
            </Card>

            {/* Médico */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" /> Dados do Médico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Toggle base / manual */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMedicoManual(false)}
                    className={`flex-1 text-xs font-semibold py-1.5 rounded-md border transition-colors ${!medicoManual ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
                  >
                    🗂️ Da base
                  </button>
                  <button
                    type="button"
                    onClick={() => setMedicoManual(true)}
                    className={`flex-1 text-xs font-semibold py-1.5 rounded-md border transition-colors ${medicoManual ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
                  >
                    ✏️ Manual
                  </button>
                </div>

                {!medicoManual ? (
                  <>
                    {/* Seletor UF do médico */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Estado (UF)</Label>
                      <select
                        value={ufMedico}
                        onChange={e => { setUfMedico(e.target.value); setCidadeMedicoSel(''); }}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {getEstadosMedicos().map(uf => (
                          <option key={uf} value={uf}>{uf} — {UF_LABELS[uf] ?? uf}</option>
                        ))}
                      </select>
                    </div>
                    {/* Seletor Cidade */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Cidade</Label>
                      <select
                        value={cidadeMedicoSel}
                        onChange={e => setCidadeMedicoSel(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">— Selecione a cidade —</option>
                        {getCidadesPorEstado(ufMedico).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    {/* Seletor Médico */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Médico</Label>
                      <select
                        value=""
                        onChange={e => {
                          const idx = Number(e.target.value);
                          const list = buscarMedicos('', ufMedico).filter(m => !cidadeMedicoSel || m.cidade === cidadeMedicoSel);
                          const m = list[idx];
                          if (m) {
                            setNomeMedico(m.nome.toUpperCase());
                            setCrm(`CRM ${m.crm}`);
                            setCidadeMedico(`${m.cidade} - ${m.uf}`.toUpperCase());
                          }
                        }}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">— Selecione um médico —</option>
                        {buscarMedicos('', ufMedico)
                          .filter(m => !cidadeMedicoSel || m.cidade === cidadeMedicoSel)
                          .map((m, i) => (
                            <option key={i} value={i}>{m.nome} — CRM {m.crm}</option>
                          ))}
                      </select>
                    </div>
                  </>
                ) : null}

                <p className="text-xs text-muted-foreground italic">ℹ️ Esse médico é da região e não exato da Hapvida. Se quiser, coloque um de sua preferência.</p>
                {/* Campos sempre visíveis (preenchidos pela base ou manualmente) */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nome do Médico</Label>
                  <Input value={nomeMedico} onChange={e => setNomeMedico(e.target.value.toUpperCase())} placeholder="DR. NOME COMPLETO" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">CRM</Label>
                  <Input value={crm} onChange={e => setCrm(e.target.value.toUpperCase())} placeholder="CRM 00000-UF" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Local</Label>
                  <Input value={cidadeMedico} onChange={e => setCidadeMedico(e.target.value.toUpperCase())} placeholder="EX: MANAUS - AM" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Carimbo / Assinatura</Label>
                  <label className="block cursor-pointer">
                    <div className="border border-dashed border-border rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors">
                      {assinaturaUrl && assinaturaUrl !== '/images/hapvida-carimbo-default.png'
                        ? '✅ Carimbo personalizado — clique para trocar'
                        : 'Carimbo padrão — clique para substituir'}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadCarimbo} />
                  </label>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    ⚠️ Ao inserir um carimbo, preencha os dados do médico acima (Nome, CRM e Local) com as informações que constam no carimbo.
                  </p>
                  {!carimboPadrao && (
                    <button
                      type="button"
                      onClick={() => { setAssinaturaUrl('/images/hapvida-carimbo-default.png'); setCarimboPadrao(true); }}
                      className="text-xs text-primary hover:underline mt-1"
                    >
                      ↩ Voltar ao carimbo da pesquisa
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informativos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" /> Dados Informativos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">IP</Label>
                    <Input value={ip} onChange={e => setIp(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Cód. Autenticação</Label>
                    <div className="flex gap-1">
                      <Input value={codigoAuth} onChange={e => setCodigoAuth(e.target.value.toUpperCase())} className="font-mono text-xs" maxLength={16} />
                      <Button variant="outline" size="sm" onClick={() => setCodigoAuth(gerarCodigo())} className="shrink-0 px-2"><Shuffle className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Data/Hora</Label>
                  <div className="flex gap-1">
                    <Input value={dataHora} onChange={e => setDataHora(e.target.value)} className="text-xs" />
                    <Button variant="outline" size="sm" onClick={() => setDataHora(nowStr())} className="shrink-0 px-2"><Clock className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ── PREVIEW ── */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-6 lg:self-start flex flex-col items-center gap-4">
            <div className="text-xs text-muted-foreground text-center font-medium uppercase tracking-wider">Preview (com marca d'água)</div>
            <div
              className="relative w-full overflow-x-auto"
              style={{ maxWidth: CANVAS_W }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="rounded-lg shadow-xl border border-border bg-white block mx-auto"
                style={{ width: '100%', maxWidth: CANVAS_W, height: 'auto', aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
              />
              {!nomePaciente.trim() && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg pointer-events-none" style={{ background: 'rgba(255,255,255,0.82)' }}>
                  <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-center font-bold text-sm text-muted-foreground leading-snug px-4 uppercase tracking-wide">
                    Insira qualquer informação<br />para aparecer o preview
                  </p>
                </div>
              )}
            </div>

            {/* Botão Gerar */}
            <Button
              size="lg"
              className="w-full max-w-sm text-base font-bold h-12"
              onClick={criarAtestado}
              disabled={criando}
            >
              {criando ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Gerando atestado...</>
              ) : (
                '📄 Criar Atestado — 1 crédito'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas oculto para geração do PDF em alta resolução */}
      <canvas ref={hiResCanvasRef} style={{ display: 'none' }} />

      {/* Modal de Sucesso */}
      <Dialog open={successModal} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <CheckCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span>Atestado Gerado!</span>
                <div className="text-sm text-muted-foreground font-normal mt-0.5">
                  1 crédito descontado com sucesso
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Data de criação */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Criado em</p>
                <p className="font-semibold text-sm">{criadoEm}</p>
              </div>
            </div>

            {/* Preview miniatura do PDF */}
            {pdfPreviewUrl && (
              <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
                <p className="text-xs text-muted-foreground text-center py-1.5 border-b border-border font-medium uppercase tracking-wider">
                  📄 PDF Gerado
                </p>
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full"
                  style={{ height: 320 }}
                  title="Preview do Atestado"
                />
              </div>
            )}

            {/* Botão download */}
            <Button
              onClick={handleDownloadPdf}
              className="w-full h-11 text-base font-bold"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Baixar PDF — hapvida.pdf
            </Button>

            <Button
              onClick={handleCloseModal}
              variant="outline"
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CpfDuplicateModal
        open={cpfCheck.showDuplicateModal}
        onClose={cpfCheck.dismissModal}
        result={cpfCheck.cpfDuplicate}
        serviceLabel="Atestado Hapvida"
      />
    </DashboardLayout>
  );
}
