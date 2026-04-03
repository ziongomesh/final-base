import { useState, useRef, useEffect, useCallback } from 'react';
import { isUsingMySQL } from '@/lib/db-config';

function resolveUploadUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  if (url.startsWith('/uploads/') && isUsingMySQL()) {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined;
    let base = '';
    if (envUrl) base = envUrl.replace(/\/+$/, '').replace(/\/api$/, '');
    else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') base = window.location.origin;
    else base = 'http://localhost:4000';
    return `${base}${url}`;
  }
  return url;
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cnhService } from '@/lib/cnh-service';
import { generateCNH, generateCNHPdfPage } from '@/lib/cnh-generator';
import { generateCNHMeio } from '@/lib/cnh-generator-meio';
import { generateCNHVerso } from '@/lib/cnh-generator-verso';

import {
  getStateFullName, getStateCapital, BRAZILIAN_STATES, CNH_CATEGORIES, CNH_OBSERVACOES, formatCPF, formatDate, generateMRZ,
  generateRegistroCNH, generateEspelhoNumber, generateCodigoSeguranca, generateRenach, generateRGByState
} from '@/lib/cnh-utils';
import {
  ArrowLeft, Save, Loader2, Eye, RefreshCw, User, ClipboardList, CreditCard, Shuffle, Upload
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface UsuarioRecord {
  id: number;
  cpf: string;
  nome: string;
  categoria: string | null;
  uf: string | null;
  data_emissao: string | null;
  data_validade: string | null;
  created_at: string | null;
  data_expiracao: string | null;
  pdf_url: string | null;
  cnh_frente_url: string | null;
  cnh_meio_url: string | null;
  cnh_verso_url: string | null;
  foto_url: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  nacionalidade: string | null;
  doc_identidade: string | null;
  numero_registro: string | null;
  hab: string | null;
  pai: string | null;
  mae: string | null;
  local_emissao: string | null;
  estado_extenso: string | null;
  espelho: string | null;
  codigo_seguranca: string | null;
  renach: string | null;
  obs: string | null;
  matriz_final: string | null;
  cnh_definitiva: string | null;
  senha: string | null;
  admin_id: number;
}

interface CnhEditViewProps {
  usuario: UsuarioRecord;
  onClose: () => void;
  onSaved: () => void;
}

// Converte datas ISO (2001-04-12T03:00:00.000Z ou 2001-04-12) para DD/MM/YYYY
function isoToBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  // Já no formato DD/MM/YYYY (possivelmente com texto após)
  if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) return dateStr;
  // ISO format
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return dateStr;
}

// Extrai apenas a parte de data de uma string composta "DD/MM/YYYY, CIDADE, UF"
function extractDatePart(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const formatted = isoToBR(dateStr);
  const match = formatted.match(/^(\d{2}\/\d{2}\/\d{4})/);
  return match ? match[1] : formatted;
}

export default function CnhEditView({ usuario, onClose, onSaved }: CnhEditViewProps) {
  const { admin } = useAuth();
  const canvasFrenteRef = useRef<HTMLCanvasElement>(null);
  const canvasMeioRef = useRef<HTMLCanvasElement>(null);
  const canvasVersoRef = useRef<HTMLCanvasElement>(null);

  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [newFoto, setNewFoto] = useState<File | null>(null);
  const [newAssinatura, setNewAssinatura] = useState<File | null>(null);
  const [previewUrls, setPreviewUrls] = useState({
    frente: resolveUploadUrl(usuario.cnh_frente_url),
    meio: resolveUploadUrl(usuario.cnh_meio_url),
    verso: resolveUploadUrl(usuario.cnh_verso_url),
  });

  // Build signature preview URL
  const assinaturaPreviewUrl = (() => {
    const cleanCpf = usuario.cpf.replace(/\D/g, '');
    const isMySQL = import.meta.env.VITE_USE_MYSQL === 'true';
    if (isMySQL) {
      const envUrl = import.meta.env.VITE_API_URL as string | undefined;
      let baseUrl = 'http://localhost:4000';
      if (envUrl) baseUrl = envUrl.replace(/\/api\/?$/, '');
      else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') baseUrl = window.location.origin;
      return `${baseUrl}/uploads/${cleanCpf}assinatura.png`;
    }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) return `${supabaseUrl}/storage/v1/object/public/uploads/${cleanCpf}assinatura.png`;
    return null;
  })();

  // Track which matrices changed
  const [changedMatrices, setChangedMatrices] = useState<Set<'frente' | 'meio' | 'verso'>>(new Set());
  const [previewLoading, setPreviewLoading] = useState(true);
  // Cache fetched foto/assinatura to avoid re-fetching on every keystroke
  const cachedFotoRef = useRef<File | null>(null);
  const cachedAssinaturaRef = useRef<File | string | undefined>(undefined);
  const filesLoadedRef = useRef(false);

  // Parse dataNascimento: pode ser "DD/MM/YYYY, CIDADE, UF" ou ISO date
  const parsedDataNasc = (() => {
    const raw = usuario.data_nascimento || '';
    const formatted = isoToBR(raw);
    // Try to split "DD/MM/YYYY, CIDADE, UF" or "DD/MM/YYYY, CIDADE"
    const parts = formatted.split(',').map(p => p.trim());
    return {
      date: parts[0] || '',
      local: parts.length > 1 ? parts.slice(1).join(', ') : '',
    };
  })();

  // Editable fields
  const [form, setForm] = useState({
    nome: usuario.nome || '',
    cpf: usuario.cpf || '',
    uf: usuario.uf || '',
    sexo: usuario.sexo || '',
    nacionalidade: usuario.nacionalidade || '',
    dataNascimento: parsedDataNasc.date + (((usuario as any).local_nascimento || parsedDataNasc.local) ? `, ${(usuario as any).local_nascimento || parsedDataNasc.local}` : ''),
    numeroRegistro: usuario.numero_registro || '',
    categoria: usuario.categoria || '',
    cnhDefinitiva: usuario.cnh_definitiva || 'sim',
    hab: isoToBR(usuario.hab),
    dataEmissao: isoToBR(usuario.data_emissao),
    dataValidade: isoToBR(usuario.data_validade),
    localEmissao: usuario.local_emissao || '',
    estadoExtenso: usuario.estado_extenso || '',
    matrizFinal: usuario.matriz_final || '',
    docIdentidade: usuario.doc_identidade || '',
    codigo_seguranca: usuario.codigo_seguranca || '',
    renach: usuario.renach || '',
    espelho: usuario.espelho || '',
    obs: usuario.obs || '',
    pai: usuario.pai || '',
    mae: usuario.mae || '',
  });

  const computedDataNascimento = form.dataNascimento;

  // Track original values to detect changes
  const [originalForm] = useState({ ...form });

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Determine which matrices are affected by a field change
  const getAffectedMatrices = (fieldName: string): ('frente' | 'meio' | 'verso')[] => {
    const frenteFields = ['nome', 'cpf', 'dataNascimento', 'sexo', 'nacionalidade', 'docIdentidade', 'categoria', 'numeroRegistro', 'dataEmissao', 'dataValidade', 'hab', 'localEmissao', 'cnhDefinitiva', 'espelho', 'pai', 'mae'];
    const meioFields = ['obs', 'estadoExtenso', 'uf', 'localEmissao', 'categoria', 'dataValidade', 'espelho', 'codigo_seguranca', 'renach'];
    const versoFields = ['nome', 'matrizFinal', 'codigo_seguranca', 'renach', 'espelho', 'numeroRegistro'];
    const affected: ('frente' | 'meio' | 'verso')[] = [];
    if (frenteFields.includes(fieldName)) affected.push('frente');
    if (meioFields.includes(fieldName)) affected.push('meio');
    if (versoFields.includes(fieldName)) affected.push('verso');
    return affected;
  };

  // Recalculate changed matrices whenever form changes
  useEffect(() => {
    const changed = new Set<'frente' | 'meio' | 'verso'>();
    for (const key of Object.keys(form) as (keyof typeof form)[]) {
      if (form[key] !== originalForm[key]) {
        const affected = getAffectedMatrices(key);
        affected.forEach(m => changed.add(m));
      }
    }
    if (newFoto) changed.add('frente');
    if (newAssinatura) changed.add('frente');
    setChangedMatrices(changed);
  }, [form, newFoto, newAssinatura]);

  const formatarObs = (obs: string): string => {
    if (!obs) return '';
    const limpa = obs.toString().trim().replace(/;+$/g, '').trim();
    if (!limpa) return '';
    if (!limpa.includes(',')) return limpa;
    const itens = limpa.split(',').map(item => item.trim()).filter(item => item.length > 0);
    if (itens.length === 0) return '';
    return itens.join(', ');
  };

  const fetchWithTimeout = async (url: string, timeoutMs = 5000): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { signal: controller.signal });
      return resp;
    } finally {
      clearTimeout(timer);
    }
  };

  // Fetch and cache foto/assinatura files once
  const loadFiles = useCallback(async () => {
    if (filesLoadedRef.current) return;
    filesLoadedRef.current = true;

    if (usuario.foto_url) {
      try {
        const resp = await fetchWithTimeout(resolveUploadUrl(usuario.foto_url));
        if (resp.ok) {
          const blob = await resp.blob();
          if (blob.size > 0) cachedFotoRef.current = new File([blob], 'foto.png', { type: 'image/png' });
        }
      } catch (e) { console.warn('Could not fetch foto:', e); }
    }

    const cleanCpf = form.cpf.replace(/\D/g, '');
    const isMySQL = import.meta.env.VITE_USE_MYSQL === 'true';
    const candidateUrls: string[] = [];
    if (isMySQL) {
      const envUrl = import.meta.env.VITE_API_URL as string | undefined;
      let baseUrl = 'http://localhost:4000';
      if (envUrl) baseUrl = envUrl.replace(/\/api\/?$/, '');
      else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') baseUrl = window.location.origin;
      candidateUrls.push(`${baseUrl}/uploads/${cleanCpf}assinatura.png`);
    }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) candidateUrls.push(`${supabaseUrl}/storage/v1/object/public/uploads/${cleanCpf}assinatura.png`);
    for (const url of candidateUrls) {
      try {
        const resp = await fetchWithTimeout(url);
        if (resp.ok) {
          const blob = await resp.blob();
          if (blob.size > 0) { cachedAssinaturaRef.current = new File([blob], 'assinatura.png', { type: 'image/png' }); break; }
        }
      } catch { /* skip */ }
    }
  }, []);

  // Regenerate canvases using cached files
  const regenerateCanvases = useCallback(async (currentForm: typeof form) => {
    const cnhData = {
      ...currentForm,
      dataNascimento: currentForm.dataNascimento,
      foto: newFoto || cachedFotoRef.current,
      assinatura: newAssinatura || cachedAssinaturaRef.current,
    };

    const generateFrente = async () => {
      if (canvasFrenteRef.current) {
        await generateCNH(canvasFrenteRef.current, cnhData, currentForm.cnhDefinitiva);
        setPreviewUrls(prev => ({ ...prev, frente: canvasFrenteRef.current!.toDataURL('image/png') }));
      }
    };
    const generateMeio = async () => {
      if (canvasMeioRef.current) {
        await generateCNHMeio(canvasMeioRef.current, {
          ...cnhData,
          obs: formatarObs(currentForm.obs),
          estadoExtenso: currentForm.estadoExtenso || getStateFullName(currentForm.uf),
        });
        setPreviewUrls(prev => ({ ...prev, meio: canvasMeioRef.current!.toDataURL('image/png') }));
      }
    };
    const generateVerso = async () => {
      if (canvasVersoRef.current) {
        await generateCNHVerso(canvasVersoRef.current, cnhData);
        setPreviewUrls(prev => ({ ...prev, verso: canvasVersoRef.current!.toDataURL('image/png') }));
      }
    };

    await Promise.allSettled([generateFrente(), generateMeio(), generateVerso()]);
  }, [newFoto, newAssinatura]);

  // Initial load: fetch files then generate
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setPreviewLoading(true);
      await loadFiles();
      if (cancelled) return;
      await regenerateCanvases(form);
      if (!cancelled) setPreviewLoading(false);
    };
    init();
    return () => { cancelled = true; };
  }, []); // only on mount

  // Live regeneration on form/photo changes (debounced)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Skip the very first render (handled by mount effect)
    if (!filesLoadedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await regenerateCanvases(form);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form, newFoto, newAssinatura]);

  const regenerateAllOnMount = async () => {
    setPreviewLoading(true);
    try {
      await loadFiles();
      await regenerateCanvases(form);
    } catch (err) {
      console.error('Erro ao gerar preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setPreviewLoading(true);
    try {
      await regenerateAllOnMount();
      toast.success('Preview regenerado: frente, meio, verso');
    } catch (err: any) {
      console.error('Erro ao regenerar:', err);
      toast.error('Erro ao regenerar preview');
    } finally {
      setRegenerating(false);
      setPreviewLoading(false);
    }
  };

  const handleSave = async () => {
    if (!admin) return;

    setSaving(true);
    try {
      // ALWAYS regenerate ALL 3 matrices before saving to ensure PDF has all of them
      await regenerateCanvases(form);

      // Get base64 from ALL canvases (not just changed ones)
      const cnhFrenteBase64 = canvasFrenteRef.current
        ? canvasFrenteRef.current.toDataURL('image/png') : '';
      const cnhMeioBase64 = canvasMeioRef.current
        ? canvasMeioRef.current.toDataURL('image/png') : '';
      const cnhVersoBase64 = canvasVersoRef.current
        ? canvasVersoRef.current.toDataURL('image/png') : '';

      // Gerar página A4 completa no cliente (base.png + 3 matrizes)
      let pdfBase64 = '';
      try {
        pdfBase64 = await generateCNHPdfPage(cnhFrenteBase64, cnhMeioBase64, cnhVersoBase64);
        console.log('📄 PDF page gerada no cliente, length:', pdfBase64.length);
      } catch (pdfErr) {
        console.warn('Erro ao gerar página PDF no cliente:', pdfErr);
      }


      // Convert new photo to base64 if changed
      let fotoBase64 = '';
      if (newFoto) {
        fotoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(newFoto);
        });
      }

      // Convert new signature to base64 if changed
      let assinaturaBase64 = '';
      if (newAssinatura) {
        assinaturaBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(newAssinatura);
        });
      }

      // Always send all 3 matrices as changed so the edge function uses the fresh base64
      const data = await cnhService.update({
        admin_id: admin.id,
        session_token: admin.session_token,
        usuario_id: usuario.id,
        cpf: form.cpf,
        nome: form.nome,
        dataNascimento: computedDataNascimento,
        sexo: form.sexo,
        nacionalidade: form.nacionalidade,
        docIdentidade: form.docIdentidade,
        categoria: form.categoria,
        numeroRegistro: form.numeroRegistro,
        dataEmissao: form.dataEmissao,
        dataValidade: form.dataValidade,
        hab: form.hab,
        pai: form.pai,
        mae: form.mae,
        uf: form.uf,
        localEmissao: form.localEmissao,
        estadoExtenso: form.estadoExtenso,
        espelho: form.espelho,
        codigo_seguranca: form.codigo_seguranca,
        renach: form.renach,
        obs: form.obs,
        matrizFinal: form.matrizFinal,
        cnhDefinitiva: form.cnhDefinitiva,
        changedMatrices: ['frente', 'meio', 'verso'], // Always send all 3
        cnhFrenteBase64,
        cnhMeioBase64,
        cnhVersoBase64: cnhVersoBase64 || '',
        fotoBase64: fotoBase64 || '',
        assinaturaBase64: assinaturaBase64 || '',
        pdfBase64,
      });

      console.log('Update result:', JSON.stringify(data));

      if ((data as any).pdfDebug) {
        console.log('PDF Debug:', (data as any).pdfDebug);
      }
      onSaved();
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      toast.error(err.message || 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Hidden canvases for regeneration */}
      <canvas ref={canvasFrenteRef} className="hidden" />
      <canvas ref={canvasMeioRef} className="hidden" />
      <canvas ref={canvasVersoRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">Editar CNH</h2>
            <p className="text-sm text-muted-foreground">CPF: {formatCPF(usuario.cpf)} — {usuario.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {changedMatrices.size > 0 && (
            <Badge variant="outline" className="text-xs">
              Matrizes alteradas: {[...changedMatrices].join(', ')}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SEÇÃO 1 - Dados Pessoais */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" /> Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div>
              <Label className="text-xs">Nome Completo</Label>
              <Input value={form.nome} className="h-8 text-sm" onChange={(e) => {
                const v = e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s]/g, '');
                updateField('nome', v);
                updateField('matrizFinal', generateMRZ(v));
              }} />
            </div>
            <div>
              <Label className="text-xs">CPF</Label>
              <Input value={form.cpf} className="h-8 text-sm" readOnly />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Sexo</Label>
                <Select value={form.sexo || undefined} onValueChange={(v) => updateField('sexo', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Sexo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Nacional.</Label>
                <Select value={form.nacionalidade || undefined} onValueChange={(v) => updateField('nacionalidade', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Sel." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brasileiro">Brasileiro</SelectItem>
                    <SelectItem value="estrangeiro">Estrangeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">UF Nasc.</Label>
                <Select value={form.uf || undefined} onValueChange={(v) => {
                  updateField('uf', v);
                  updateField('estadoExtenso', getStateFullName(v));
                  updateField('localEmissao', getStateCapital(v));
                }}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Data Nasc., Cidade, UF</Label>
              <Input 
                value={form.dataNascimento} 
                placeholder="DD/MM/AAAA, CIDADE, UF"
                className="h-8 text-sm"
                onChange={(e) => updateField('dataNascimento', e.target.value.toUpperCase())} 
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Nome do Pai</Label>
                <Input value={form.pai} className="h-8 text-sm" onChange={(e) => updateField('pai', e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s]/g, ''))} />
              </div>
              <div>
                <Label className="text-xs">Nome da Mãe</Label>
                <Input value={form.mae} className="h-8 text-sm" onChange={(e) => updateField('mae', e.target.value.toUpperCase().replace(/[^A-ZÁÀÂÃÇÉÊÍÓÔÕÚÜ\s]/g, ''))} />
              </div>
            </div>

            {/* Foto Upload */}
            <div>
              <Label className="text-xs">Foto de Perfil</Label>
              <div className="flex items-center gap-3 mt-1">
                {(newFoto || usuario.foto_url) && (
                  <img
                    src={newFoto ? URL.createObjectURL(newFoto) : resolveUploadUrl(usuario.foto_url)}
                    alt="Foto"
                    className="h-14 w-14 object-cover rounded-full border"
                  />
                )}
                <label className="flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors text-xs text-muted-foreground">
                  <Upload className="h-3.5 w-3.5" />
                  {newFoto ? newFoto.name : 'Trocar foto'}
                  <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={(e) => setNewFoto(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            {/* Assinatura Upload */}
            <div>
              <Label className="text-xs">Assinatura Digital</Label>
              <div className="flex items-center gap-3 mt-1">
                {(newAssinatura || assinaturaPreviewUrl) && (
                  <img
                    src={newAssinatura ? URL.createObjectURL(newAssinatura) : assinaturaPreviewUrl!}
                    alt="Assinatura"
                    className="h-10 w-20 object-contain border rounded"
                  />
                )}
                <label className="flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors text-xs text-muted-foreground">
                  <Upload className="h-3.5 w-3.5" />
                  {newAssinatura ? newAssinatura.name : 'Trocar assinatura'}
                  <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={(e) => setNewAssinatura(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 2 - Dados da CNH */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Dados da CNH
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div>
              <Label className="text-xs">Nº Registro (11 dígitos)</Label>
              <div className="flex gap-1.5">
                <Input value={form.numeroRegistro} className="h-8 text-sm flex-1" onChange={(e) => updateField('numeroRegistro', e.target.value.replace(/\D/g, ''))} maxLength={11} />
                <Button type="button" variant="outline" size="sm" onClick={() => updateField('numeroRegistro', generateRegistroCNH())} className="shrink-0 h-8 text-xs px-2">
                  <Shuffle className="h-3.5 w-3.5 mr-1" /> Gerar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={form.categoria || undefined} onValueChange={(v) => updateField('categoria', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CNH_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Definitiva?</Label>
                <Select value={form.cnhDefinitiva || undefined} onValueChange={(v) => updateField('cnhDefinitiva', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">1ª Habilitação</Label>
              <Input value={form.hab} className="h-8 text-sm" onChange={(e) => updateField('hab', formatDate(e.target.value))} maxLength={10} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Emissão</Label>
                <Input value={form.dataEmissao} className="h-8 text-sm" onChange={(e) => updateField('dataEmissao', formatDate(e.target.value))} maxLength={10} />
              </div>
              <div>
                <Label className="text-xs">Validade</Label>
                <Input value={form.dataValidade} className="h-8 text-sm" onChange={(e) => updateField('dataValidade', formatDate(e.target.value))} maxLength={10} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Cidade / Estado</Label>
              <Input value={form.localEmissao} className="h-8 text-sm" onChange={(e) => updateField('localEmissao', e.target.value.toUpperCase())} />
            </div>
            <div>
              <Label className="text-xs">Estado por Extenso</Label>
              <Input value={form.estadoExtenso} className="h-8 text-sm" onChange={(e) => updateField('estadoExtenso', e.target.value.toUpperCase())} />
            </div>
            <div>
              <Label className="text-xs">MRZ (Leitura Óptica)</Label>
              <Input value={form.matrizFinal} className="h-8 text-sm font-mono" onChange={(e) => updateField('matrizFinal', e.target.value.toUpperCase())} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">RG</Label>
                <div className="flex gap-1">
                  <Input value={form.docIdentidade} className="h-8 text-sm flex-1" onChange={(e) => updateField('docIdentidade', e.target.value.toUpperCase())} />
                  <Button type="button" variant="outline" size="sm" className="shrink-0 h-8 px-1.5" onClick={() => {
                    if (!form.uf) { toast.error('Selecione o UF primeiro'); return; }
                    updateField('docIdentidade', generateRGByState(form.uf));
                  }}>
                    <Shuffle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Cód. Segurança</Label>
                <div className="flex gap-1">
                  <Input value={form.codigo_seguranca} className="h-8 text-sm flex-1" onChange={(e) => updateField('codigo_seguranca', e.target.value.replace(/\D/g, ''))} maxLength={11} />
                  <Button type="button" variant="outline" size="sm" className="shrink-0 h-8 px-1.5" onClick={() => updateField('codigo_seguranca', generateCodigoSeguranca())}>
                    <Shuffle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">RENACH</Label>
              <div className="flex gap-1.5">
                <Input value={form.renach} className="h-8 text-sm flex-1" maxLength={11} onChange={(e) => {
                  let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  if (v.length > 2) {
                    const letters = v.slice(0, 2).replace(/[^A-Z]/g, '');
                    const numbers = v.slice(2).replace(/\D/g, '');
                    v = letters + numbers;
                  }
                  updateField('renach', v);
                }} />
                <Button type="button" variant="outline" size="sm" className="shrink-0 h-8 text-xs px-2" onClick={() => {
                  if (!form.uf) { toast.error('Selecione o UF primeiro'); return; }
                  updateField('renach', generateRenach(form.uf));
                }}>
                  <Shuffle className="h-3.5 w-3.5 mr-1" /> Gerar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 3 - Extras */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Extras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div>
              <Label className="text-xs">Nº do Espelho</Label>
              <div className="flex gap-1.5">
                <Input value={form.espelho} className="h-8 text-sm flex-1" onChange={(e) => updateField('espelho', e.target.value.replace(/\D/g, ''))} maxLength={10} />
                <Button type="button" variant="outline" size="sm" onClick={() => updateField('espelho', generateEspelhoNumber())} className="shrink-0 h-8 text-xs px-2">
                  <Shuffle className="h-3.5 w-3.5 mr-1" /> Gerar
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {CNH_OBSERVACOES.map(obs => {
                  const currentObs = (form.obs || '').split(',').map(s => s.trim()).filter(Boolean);
                  const fixedObs = currentObs.filter(o => CNH_OBSERVACOES.includes(o));
                  const customParts = currentObs.filter(o => !CNH_OBSERVACOES.includes(o));
                  const isChecked = fixedObs.includes(obs);
                  return (
                    <div key={obs} className="flex items-center space-x-1.5">
                      <Checkbox
                        id={`edit-obs-${obs}`}
                        checked={isChecked}
                        className="h-3.5 w-3.5"
                        onCheckedChange={() => {
                          const newFixed = isChecked ? fixedObs.filter(o => o !== obs) : [...fixedObs, obs];
                          const combined = [...newFixed, ...customParts].filter(Boolean);
                          updateField('obs', combined.join(', '));
                        }}
                      />
                      <label htmlFor={`edit-obs-${obs}`} className="text-xs cursor-pointer">{obs}</label>
                    </div>
                  );
                })}
              </div>
              <Input
                placeholder="Observações extras..."
                className="h-8 text-sm"
                value={(() => {
                  const parts = (form.obs || '').split(',').map(s => s.trim()).filter(Boolean);
                  return parts.filter(o => !CNH_OBSERVACOES.includes(o)).join(', ');
                })()}
                onChange={(e) => {
                  const currentObs = (form.obs || '').split(',').map(s => s.trim()).filter(Boolean);
                  const fixedObs = currentObs.filter(o => CNH_OBSERVACOES.includes(o));
                  const custom = e.target.value.toUpperCase();
                  const combined = [...fixedObs, ...(custom.trim() ? [custom.trim()] : [])].filter(Boolean);
                  updateField('obs', combined.join(', '));
                }}
              />
              <Input
                value={form.obs}
                readOnly
                className="h-7 bg-muted text-[11px]"
                placeholder="Resultado final"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview das matrizes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4" /> Preview ao Vivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {previewLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Gerando matrizes...</span>
            </div>
          ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                Frente {changedMatrices.has('frente') && <Badge variant="destructive" className="text-[10px] px-1">alterada</Badge>}
              </p>
              {previewUrls.frente && <img src={previewUrls.frente} alt="Frente" className="w-full rounded border pointer-events-none select-none" draggable={false} onDragStart={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()} />}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                Meio {changedMatrices.has('meio') && <Badge variant="destructive" className="text-[10px] px-1">alterada</Badge>}
              </p>
              {previewUrls.meio && <img src={previewUrls.meio} alt="Meio" className="w-full rounded border pointer-events-none select-none" draggable={false} onDragStart={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()} />}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                Verso {changedMatrices.has('verso') && <Badge variant="destructive" className="text-[10px] px-1">alterada</Badge>}
              </p>
              {previewUrls.verso && <img src={previewUrls.verso} alt="Verso" className="w-full rounded border pointer-events-none select-none" draggable={false} onDragStart={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()} />}
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || changedMatrices.size === 0}
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}

function Badge({ variant, className, children }: { variant?: string; className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
    } ${className || ''}`}>
      {children}
    </span>
  );
}
