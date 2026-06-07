import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/success-sound';
import { FileText, Loader2, ArrowLeft, Upload, X } from 'lucide-react';
import { generateCrafImage, canvasToBase64, type CrafData } from '@/lib/craf-generator';

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

function onlyDigits(v: string) { return (v || '').replace(/\D/g, ''); }
function formatCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

async function generateQrCode(cpf: string): Promise<string> {
  const cleanCpf = onlyDigits(cpf);
  const verifyBase = `${window.location.origin.replace(/\/$/, '')}/verificar-craf?cpf=`;
  const densePad = '#REPUBLICA.FEDERATIVA.DO.BRASIL//MINISTERIO.DA.DEFESA//EXERCITO.BRASILEIRO//CERTIFICADO.DE.REGISTRO.DE.ARMA.DE.FOGO//SISFPC//SIGMA//CRAF//v1=ART.24.DECRETO.11615.23//v2=SFPC//v3=DPCA';
  const qrData = verifyBase + cleanCpf + densePad;
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrData)}&format=png&ecc=M`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha QR');
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export default function CrafDigital() {
  const { admin, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const form = useForm<CrafData>({
    defaultValues: {
      nome: 'DATA SYSTEM OFICIAL',
      cpf: '',
      rg: '1234567',
      sfpcVinculacao: 'Cmdo 2º RM',
      amparoLegal: 'art. 24 do Decreto 11.615/23',
      registro: 'ADT ELET SISFPC NR 49 DE 28/02/2024, 2º GAC',
      tipo: 'Pistola',
      marca: 'TAURUS',
      calibre: '9X19mm',
      nSerie: 'T6368-14 B214789',
      nSigma: '2611465',
      dataExpedicao: '28/02/2024',
      gacEmissora: 'SFPC - 2º GAC',
      cidadeUf: 'Cidade/UF, 28/02/2024',
      validade: '28/02/2027',
    },
  });

  const watched = form.watch();
  const cpfReady = onlyDigits(watched.cpf).length >= 11;

  // Live preview
  useEffect(() => {
    if (!cpfReady) return;
    let cancelled = false;
    (async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const qr = await generateQrCode(watched.cpf);
        if (cancelled) return;
        await generateCrafImage(canvas, watched, qr);
        if (cancelled) return;
        setPreviewUrl(canvas.toDataURL('image/png'));
      } catch (e) { console.error('preview err', e); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watched), cpfReady]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!admin) return <Navigate to="/login" replace />;

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      setFotoBase64(r);
      setFotoPreview(r);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: CrafData) => {
    if (!cpfReady) { toast.error('Informe um CPF válido'); return; }
    if (!fotoBase64) { toast.error('Envie uma foto'); return; }
    setSubmitting(true);
    try {
      const canvas = canvasRef.current!;
      const qrcodeBase64 = await generateQrCode(data.cpf);
      await generateCrafImage(canvas, data, qrcodeBase64);
      const imagemBase64 = canvasToBase64(canvas, 'png');

      const payload = {
        admin_id: admin.id,
        session_token: admin.session_token || '',
        cpf: onlyDigits(data.cpf),
        nome: data.nome,
        rg: data.rg,
        sfpc_vinculacao: data.sfpcVinculacao,
        amparo_legal: data.amparoLegal,
        registro: data.registro,
        tipo: data.tipo,
        marca: data.marca,
        calibre: data.calibre,
        n_serie: data.nSerie,
        n_sigma: data.nSigma,
        data_expedicao: data.dataExpedicao,
        gac_emissora: data.gacEmissora,
        cidade_uf: data.cidadeUf,
        validade: data.validade,
        fotoBase64, qrcodeBase64, imagemBase64,
      };

      const runtimeOrigin = `${window.location.origin.replace(/\/$/, '')}/api`;
      const bases = [runtimeOrigin, API_URL].filter((v, i, a) => !!v && a.indexOf(v) === i);
      let result: any = null;
      let lastErr = '';
      for (const base of bases) {
        try {
          const res = await fetch(`${base}/craf/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          if (!res.ok) { lastErr = json?.error || `HTTP ${res.status}`; continue; }
          result = json; break;
        } catch (e: any) { lastErr = e?.message || 'erro'; }
      }
      if (!result?.success) throw new Error(lastErr || 'Falha ao salvar');

      playSuccessSound();
      toast.success('CRAF gerado com sucesso!');
      const root = (bases[0] || '').replace(/\/api\/?$/, '');
      setSavedUrl(`${root}${result.imagem}`);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao gerar CRAF');
    } finally {
      setSubmitting(false);
    }
  };

  const F = ({ name, label }: { name: keyof CrafData; label: string }) => (
    <div className="space-y-0.5">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <Input className="h-7 text-xs" {...form.register(name)} />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="flex items-center gap-2">
          <Link to="/servicos"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-1.5"><FileText className="h-4 w-4 text-primary" /> CRAF — Exército</h1>
            <p className="text-[10px] text-muted-foreground">1 crédito • Certificado de Registro de Arma de Fogo</p>
          </div>
        </div>

        {!cpfReady && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
            <div className="flex-1">
              <p className="text-xs font-medium">Insira o CPF para desbloquear</p>
              <div className="mt-1.5 max-w-[200px]">
                <Input placeholder="000.000.000-00" value={watched.cpf} onChange={(e) => form.setValue('cpf', formatCPF(e.target.value))} maxLength={14} className="h-7 text-xs font-mono" autoFocus />
              </div>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${!cpfReady ? 'opacity-30 pointer-events-none select-none' : ''}`}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1 mb-2">Identificação</p>
              <F name="nome" label="Nome Completo" />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <Label className="text-[10px] text-muted-foreground">CPF</Label>
                  <Input className="h-7 text-xs font-mono" value={watched.cpf} onChange={(e) => form.setValue('cpf', formatCPF(e.target.value))} maxLength={14} />
                </div>
                <F name="rg" label="RG" />
              </div>
              <F name="sfpcVinculacao" label="SFPC de Vinculação" />
              <F name="amparoLegal" label="Amparo Legal" />
              <F name="validade" label="Validade" />
            </div>

            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1 mb-2">Arma</p>
              <F name="registro" label="Registro" />
              <div className="grid grid-cols-2 gap-2">
                <F name="tipo" label="Tipo" />
                <F name="marca" label="Marca" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <F name="calibre" label="Calibre" />
                <F name="nSerie" label="Nº Série" />
                <F name="nSigma" label="Nº SIGMA" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <F name="dataExpedicao" label="Data Expedição" />
                <F name="gacEmissora" label="GAC Emissora" />
              </div>
              <F name="cidadeUf" label="Cidade/UF e Data" />
            </div>

            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1 mb-2">Foto (Detalhamento)</p>
              <input ref={fotoInputRef} type="file" accept="image/*" onChange={handleFoto} className="hidden" />
              {fotoPreview ? (
                <div className="flex items-center gap-2">
                  <img src={fotoPreview} alt="Foto" className="h-20 w-16 object-cover rounded border" />
                  <Button type="button" variant="outline" size="sm" onClick={() => { setFotoBase64(null); setFotoPreview(null); }}>
                    <X className="h-3 w-3 mr-1" /> Remover
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => fotoInputRef.current?.click()} className="w-full">
                  <Upload className="h-3 w-3 mr-1" /> Enviar foto
                </Button>
              )}
            </div>

            <Button type="submit" disabled={submitting || !fotoBase64} className="w-full">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</> : 'Gerar CRAF'}
            </Button>

            {savedUrl && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
                <p className="text-xs font-semibold">CRAF gerado!</p>
                <a href={savedUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary underline break-all">{savedUrl}</a>
                <p className="text-[10px] text-muted-foreground">
                  Verificar: <a className="underline" target="_blank" rel="noreferrer" href={`/verificar-craf?cpf=${onlyDigits(watched.cpf)}`}>/verificar-craf?cpf={onlyDigits(watched.cpf)}</a>
                </p>
              </div>
            )}
          </form>

          <div className="rounded-lg border border-border bg-muted/20 p-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Preview</p>
            <div className="relative bg-white rounded overflow-hidden flex items-center justify-center" style={{ minHeight: 400 }}>
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-[80vh] object-contain" />
              ) : (
                <PreviewLoader label="Renderizando CRAF" />
              )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
