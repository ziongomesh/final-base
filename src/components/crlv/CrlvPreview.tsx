import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface CrlvPreviewProps {
  form: UseFormReturn<any>;
  customQrPreview?: string | null;
  showDenseQr?: boolean;
}

export interface CrlvPreviewRef {
  getSnapshot: () => Promise<string | null>;
}

// Each field: formKey, whiteout rect (x, y, w, h), text position (x, y), fontSize
interface FieldDef {
  key: string;
  wx: number; wy: number; ww: number; wh: number;
  tx: number; ty: number;
  size: number;
}

const FIELDS: FieldDef[] = [
  // Left column
  { key: 'renavam', wx: 23, wy: 94, ww: 60, wh: 12, tx: 31.20, ty: 102.21, size: 10 },
  { key: 'placa', wx: 23, wy: 120, ww: 40, wh: 12, tx: 30.95, ty: 128.58, size: 10 },
  { key: 'exercicio', wx: 95, wy: 120, ww: 25, wh: 12, tx: 102.93, ty: 128.58, size: 10 },
  { key: 'anoFab', wx: 23, wy: 146, ww: 25, wh: 12, tx: 31.20, ty: 154.75, size: 10 },
  { key: 'anoMod', wx: 95, wy: 146, ww: 25, wh: 12, tx: 102.93, ty: 154.75, size: 10 },
  { key: 'numeroCrv', wx: 23, wy: 173, ww: 60, wh: 12, tx: 31.20, ty: 181.14, size: 10 },
  { key: 'codSegCla', wx: 23, wy: 250, ww: 60, wh: 12, tx: 31.67, ty: 258.97, size: 10 },
  { key: 'catObs', wx: 155, wy: 250, ww: 20, wh: 12, tx: 162.67, ty: 259.21, size: 10 },
  { key: 'marcaModelo', wx: 23, wy: 284, ww: 120, wh: 12, tx: 30.95, ty: 293.43, size: 10 },
  { key: 'especieTipo', wx: 23, wy: 320, ww: 100, wh: 12, tx: 30.47, ty: 329.66, size: 10 },
  { key: 'placaAnt', wx: 23, wy: 356, ww: 55, wh: 12, tx: 31.20, ty: 364.00, size: 10 },
  { key: 'chassi', wx: 123, wy: 356, ww: 90, wh: 12, tx: 131.01, ty: 364.46, size: 10 },
  { key: 'cor', wx: 23, wy: 391, ww: 40, wh: 12, tx: 30.47, ty: 400.19, size: 10 },
  { key: 'combustivel', wx: 94, wy: 391, ww: 80, wh: 12, tx: 101.97, ty: 399.47, size: 10 },
  // Right column
  { key: 'categoria', wx: 308, wy: 64, ww: 55, wh: 12, tx: 315.76, ty: 73.67, size: 10 },
  { key: 'capacidade', wx: 502, wy: 80, ww: 22, wh: 12, tx: 510.08, ty: 88.78, size: 10 },
  { key: 'potenciaCil', wx: 308, wy: 106, ww: 50, wh: 12, tx: 316.01, ty: 114.22, size: 10 },
  { key: 'pesoBruto', wx: 502, wy: 106, ww: 25, wh: 12, tx: 510.08, ty: 114.70, size: 10 },
  { key: 'motor', wx: 308, wy: 132, ww: 75, wh: 12, tx: 317.00, ty: 140.86, size: 10 },
  { key: 'cmt', wx: 446, wy: 132, ww: 25, wh: 12, tx: 453.79, ty: 140.62, size: 10 },
  { key: 'eixos', wx: 497, wy: 132, ww: 14, wh: 12, tx: 504.80, ty: 140.62, size: 10 },
  { key: 'lotacao', wx: 530, wy: 132, ww: 20, wh: 12, tx: 538.63, ty: 140.86, size: 10 },
  { key: 'carroceria', wx: 308, wy: 158, ww: 80, wh: 12, tx: 316.01, ty: 166.27, size: 10 },
  { key: 'nomeProprietario', wx: 307, wy: 184, ww: 160, wh: 12, tx: 314.82, ty: 192.18, size: 10 },
  { key: 'cpfCnpj', wx: 455, wy: 215, ww: 80, wh: 12, tx: 463.39, ty: 223.38, size: 10 },
  { key: 'local', wx: 308, wy: 251, ww: 80, wh: 12, tx: 316.49, ty: 259.40, size: 10 },
  { key: 'data', wx: 502, wy: 250, ww: 55, wh: 12, tx: 510.08, ty: 258.20, size: 10 },
  { key: 'observacoes', wx: 19, wy: 434, ww: 170, wh: 12, tx: 26.87, ty: 442.18, size: 10 },
];

// Insurance/DPVAT fields
const DPVAT_FIELDS: FieldDef[] = [
  { key: 'catTarif', wx: 308, wy: 315, ww: 40, wh: 12, tx: 316.73, ty: 323.51, size: 10 },
  { key: 'dataQuitacao', wx: 381, wy: 315, ww: 50, wh: 12, tx: 389.63, ty: 323.51, size: 10 },
  { key: 'repasseFns', wx: 308, wy: 352, ww: 50, wh: 12, tx: 316.73, ty: 360.46, size: 10 },
  { key: 'custoBilhete', wx: 416, wy: 352, ww: 40, wh: 12, tx: 424.18, ty: 360.46, size: 10 },
  { key: 'custoEfetivo', wx: 486, wy: 352, ww: 40, wh: 12, tx: 494.72, ty: 360.46, size: 10 },
  { key: 'repasseDenatran', wx: 308, wy: 393, ww: 50, wh: 12, tx: 316.73, ty: 401.25, size: 10 },
  { key: 'valorIof', wx: 416, wy: 393, ww: 40, wh: 12, tx: 424.18, ty: 401.25, size: 10 },
  { key: 'valorTotal', wx: 486, wy: 393, ww: 40, wh: 12, tx: 494.72, ty: 401.25, size: 10 },
];

// Build QR code URL for CRLV verification
function buildCrlvQrUrl(cpfCnpj: string): string {
  const cleanCpf = (cpfCnpj || '').replace(/\D/g, '');
  const baseUrl = import.meta.env.VITE_CRLV_QR_URL || 'https://qrcode-certificadodigital-vio.info/verificar-crlv?cpf=';
  const densePad = '#REPUBLICA.FEDERATIVA.DO.BRASIL//CERTIFICADO.DE.REGISTRO.E.LICENCIAMENTO.DE.VEICULO//DETRAN//DENATRAN//CONTRAN//SENATRAN//v1=SERPRO//v2=RENAVAM//v3=REGISTRO.NACIONAL//v4=CERTIFICADO.DIGITAL//v5=ICP-BRASIL//v6=LICENCIAMENTO.ANUAL//v7=SEGURO.DPVAT//v8=IPVA//v9=VISTORIA//v10=CRV';
  return `${baseUrl}${cleanCpf}${densePad}`;
}

export const CrlvPreview = forwardRef<CrlvPreviewRef, CrlvPreviewProps>(function CrlvPreview(
  { form, customQrPreview, showDenseQr = true }: CrlvPreviewProps,
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [qrImage, setQrImage] = useState<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);
  const rafRef = useRef<number>(0);
  const qrCacheRef = useRef<{ key: string; img: HTMLImageElement | null }>({ key: '', img: null });

  useImperativeHandle(ref, () => ({
    getSnapshot: async () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      // Garante que o último draw via requestAnimationFrame já foi aplicado
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      try {
        return canvas.toDataURL('image/png');
      } catch {
        return null;
      }
    },
  }), []);

  const v = form.watch();

  // Load PNG template once
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      setBgImage(img);
      setReady(true);
    };
    img.onerror = () => {
      console.error('Erro ao carregar template CRLV PNG');
    };
    img.src = '/templates/crlv-template-base.png?v=' + Date.now();
    return () => { cancelled = true; };
  }, []);

  // Generate real QR code when CPF changes and dense QR is enabled
  const cpfCnpj = v.cpfCnpj || '';
  const cleanCpf = cpfCnpj.replace(/\D/g, '');

  useEffect(() => {
    if (customQrPreview) {
      // Custom QR uploaded - load it
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setQrImage(img);
      img.onerror = () => setQrImage(null);
      img.src = customQrPreview;
      return;
    }

    if (!showDenseQr) {
      setQrImage(null);
      return;
    }

    // Generate real QR from verification URL
    if (cleanCpf.length >= 11) {
      const qrUrl = buildCrlvQrUrl(cpfCnpj);
      const cacheKey = qrUrl;
      
      // Use cache if same
      if (qrCacheRef.current.key === cacheKey && qrCacheRef.current.img) {
        setQrImage(qrCacheRef.current.img);
        return;
      }

      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrUrl)}&format=png&ecc=M`;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        qrCacheRef.current = { key: cacheKey, img };
        setQrImage(img);
      };
      img.onerror = () => setQrImage(null);
      img.src = qrApiUrl;
    } else {
      // CPF not complete yet - use sample
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setQrImage(img);
      img.onerror = () => setQrImage(null);
      img.src = '/images/qrcode-dense-sample.png';
    }
  }, [cleanCpf, customQrPreview, showDenseQr]);

  // Redraw on form changes
  useEffect(() => {
    if (!ready || !bgImage) return;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size based on image
      canvas.width = bgImage.naturalWidth;
      canvas.height = bgImage.naturalHeight;

      // Draw background PNG
      ctx.drawImage(bgImage, 0, 0);

      // Calculate scale ratio: image pixels / PDF points (A4 width = 595.28pt)
      const imgScale = bgImage.naturalWidth / 595.28;
      const ps = (val: number) => val * imgScale;

      // Draw data fields
      const allFields = [...FIELDS, ...DPVAT_FIELDS];
      for (const f of allFields) {
        const formValue = v[f.key] || '';

        // White-out original area
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(ps(f.wx), ps(f.wy), ps(f.ww), ps(f.wh));

        // Draw new text
        if (formValue.trim()) {
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${ps(f.size)}px "FreeMono", "Courier New", monospace`;
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(formValue.toUpperCase(), ps(f.tx), ps(f.ty));
        }
      }

      // DETRAN-UF
      if (v.uf) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(ps(23), ps(46), ps(40), ps(12));
        ctx.fillStyle = '#000000';
        ctx.font = `${ps(4.42)}px sans-serif`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`DETRAN-   ${v.uf}`, ps(31.20), ps(54.22));
      }

      // "Documento emitido por DETRAN..."
      const cpfClean = (v.cpfCnpj || '').replace(/\D/g, '');
      const cpfHash = cpfClean.slice(0, 9) || '000000000';
      const hashCode = `${cpfHash.slice(0,3)}${cpfHash.slice(3,5)}f${cpfHash.slice(5,8)}`;
      const now = new Date();
      const brDate = v.data || now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const brTime = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const docText = `Documento emitido por DETRAN ${v.uf || 'SP'} (${hashCode}) em ${brDate} às ${brTime}.`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ps(23), ps(406), ps(400), ps(12));
      ctx.fillStyle = '#000000';
      ctx.font = `${ps(4.42)}px sans-serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(docText, ps(31.43), ps(413.00));

      // QR Code - drawn synchronously from pre-loaded image
      if (qrImage) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(ps(160), ps(85), ps(105), ps(105));
        ctx.drawImage(qrImage, ps(167.23), ps(92.85), ps(97.4), ps(97.4));
      }
    });

    return () => cancelAnimationFrame(rafRef.current);
  }, [v, qrImage, showDenseQr, ready, bgImage]);

  return (
    <div ref={containerRef} className="rounded-lg border border-border overflow-hidden bg-muted">
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
        style={{ display: 'block' }}
      />
      {!ready && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          Carregando preview...
        </div>
      )}
    </div>
  );
});
