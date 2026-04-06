// Gerador de RG Digital (Canvas client-side)
import { loadTemplate } from './template-loader';

export interface RgData {
  nomeCompleto: string;
  nomeSocial?: string;
  cpf: string;
  dataNascimento: string;
  naturalidade: string;
  genero: string;
  nacionalidade: string;
  validade: string;
  uf: string;
  dataEmissao: string;
  local: string;
  orgaoExpedidor: string;
  pai?: string;
  mae?: string;
  foto?: File | string;
  assinatura?: File | string;
}

// Estado por extenso
export function textoEstado(uf: string): string {
  const estados: Record<string, string> = {
    AC: 'Estado do Acre', AL: 'Estado de Alagoas', AP: 'Estado do Amapá',
    AM: 'Estado do Amazonas', BA: 'Estado da Bahia', CE: 'Estado do Ceará',
    DF: 'Distrito Federal', ES: 'Estado do Espírito Santo', GO: 'Estado de Goiás',
    MA: 'Estado do Maranhão', MT: 'Estado do Mato Grosso', MS: 'Estado do Mato Grosso do Sul',
    MG: 'Estado de Minas Gerais', PA: 'Estado do Pará', PB: 'Estado da Paraíba',
    PR: 'Estado do Paraná', PE: 'Estado de Pernambuco', PI: 'Estado do Piauí',
    RJ: 'Estado do Rio de Janeiro', RN: 'Estado do Rio Grande do Norte',
    RS: 'Estado do Rio Grande do Sul', RO: 'Estado de Rondônia', RR: 'Estado de Roraima',
    SC: 'Estado de Santa Catarina', SP: 'Estado de São Paulo', SE: 'Estado de Sergipe',
    TO: 'Estado do Tocantins',
  };
  return estados[uf?.toUpperCase()] || `Estado de ${uf?.toUpperCase()}`;
}

export function formatCPFDisplay(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadFonts(): Promise<void> {
  try {
    if (!document.querySelector('link[href*="Tahoma"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }

    // Load OCR-B font for MRZ
    try {
      const ocrBUrl = (await import('../assets/OCR-B_10_BT_Regular.ttf')).default;
      const ocrBFont = new FontFace('OCR-B-RG', `url(${ocrBUrl})`);
      const loaded = await ocrBFont.load();
      document.fonts.add(loaded);
    } catch { /* fallback */ }

    await document.fonts.ready;
  } catch {
    // fallback
  }
}

// =================== FRENTE ===================
export async function generateRGFrente(
  canvas: HTMLCanvasElement,
  data: RgData
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  await loadFonts();

  const templateBitmap = await loadTemplate('rg-frente.png');
  canvas.width = templateBitmap.width;
  canvas.height = templateBitmap.height;

  ctx.drawImage(templateBitmap, 0, 0, canvas.width, canvas.height);

  // Estado em cinza centralizado
  ctx.font = '21px "Noto Sans", Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#4A4A4D';
  ctx.textAlign = 'center';
  ctx.fillText(textoEstado(data.uf), canvas.width / 2 + 30, 150);
  ctx.fillText('Secretaria de Segurança Pública da Unidade de Federação', canvas.width / 2, 175);

  // Foto
  if (data.foto) {
    try {
      let fotoSrc: string;
      if (data.foto instanceof File) {
        fotoSrc = await readFileAsDataURL(data.foto);
      } else {
        fotoSrc = data.foto;
      }
      const fotoImg = await loadImage(fotoSrc);
      ctx.drawImage(fotoImg, 159, 287, 241, 299);
    } catch (e) { console.error('RG Frente: erro ao desenhar foto:', e); }
  } else {
    console.warn('RG Frente: nenhuma foto fornecida');
  }

  // Textos
  ctx.textAlign = 'left';
  ctx.font = '21px "Noto Sans", Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#000000';

  ctx.fillText(data.nomeCompleto || '', 436, 275);
  ctx.fillText(data.nomeSocial || '', 436, 365);
  ctx.fillText(formatCPFDisplay(data.cpf || ''), 436, 455);
  ctx.fillText(formatDateBR(data.dataNascimento || ''), 436, 515);
  ctx.fillText(data.naturalidade || '', 436, 575);
  ctx.fillText(data.genero || '', 829, 455);
  ctx.fillText(data.nacionalidade || 'BRA', 829, 515);
  ctx.fillText(formatDateBR(data.validade || ''), 829, 583);

  // Assinatura
  if (data.assinatura) {
    try {
      let assSrc: string;
      if (data.assinatura instanceof File) {
        assSrc = await readFileAsDataURL(data.assinatura);
      } else {
        assSrc = data.assinatura;
      }
      const assImg = await loadImage(assSrc);
      const escala = Math.min(279 / assImg.width, 52 / assImg.height);
      ctx.drawImage(assImg, 491, 640, assImg.width * escala, assImg.height * escala);
    } catch (e) { console.error('RG Frente: erro ao desenhar assinatura:', e); }
  } else {
    console.warn('RG Frente: nenhuma assinatura fornecida');
  }
}

// =================== VERSO ===================
export async function generateRGVerso(
  canvas: HTMLCanvasElement,
  data: RgData,
  qrCodeDataUrl?: string
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  await loadFonts();

  const templateBitmap = await loadTemplate('rg-verso.png');
  canvas.width = templateBitmap.width;
  canvas.height = templateBitmap.height;

  ctx.drawImage(templateBitmap, 0, 0, canvas.width, canvas.height);

  // Textos
  ctx.font = '21px "Noto Sans", Tahoma, Arial, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';

  ctx.fillText(data.pai || '', 338.89, 170);
  ctx.fillText(data.mae || '', 338.89, 230);
  ctx.fillText(data.orgaoExpedidor || '', 338.89, 328);
  ctx.fillText(data.local || '', 338.89, 432);
  ctx.fillText(formatDateBR(data.dataEmissao || ''), 728, 432);

  // QR Code no verso - posição calibrada via /teste2
  // Proporção: x=5.36%, y=17.03%, size=22.88% da imagem
  if (qrCodeDataUrl) {
    try {
      const qrImg = await loadImage(qrCodeDataUrl);
      const qrX = canvas.width * 0.0536;
      const qrY = canvas.height * 0.1703;
      const qrSize = canvas.width * 0.2288;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    } catch { /* silencioso */ }
  }
}

// MRZ - Linha 3: nome completo com < entre cada parte, truncado/padded a 30 chars
export function formatarNomeMRZ(nome: string): string {
  const MRZ_LEN = 30;
  const parts = nome.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return '<'.repeat(MRZ_LEN);

  // Format: <NOME<PARTE<PARTE<...< (each word separated by <)
  const content = '<' + parts.join('<') + '<';

  if (content.length >= MRZ_LEN) {
    return content.slice(0, MRZ_LEN);
  }
  return content + '<'.repeat(MRZ_LEN - content.length);
}

// Gera número aleatório de N dígitos
function randomDigits(n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

// MRZ Linha 1: IDBRA + 21 dígitos + <<< + check = 30 chars
function gerarMRZLinha1(): string {
  return `IDBRA${randomDigits(21)}<<<${Math.floor(Math.random() * 10)}`;
}

// MRZ Linha 2: 5d + sexo + 10d + BRA + 10< + check = 30 chars
function gerarMRZLinha2(dataNasc: string, genero: string): string {
  const formatMRZDate = (d: string): string => {
    if (!d) return '000000';
    if (d.includes('/')) {
      const [dd, mm, yyyy] = d.split('/');
      return (yyyy?.slice(2) || '00') + (mm || '00') + (dd || '00');
    }
    if (d.includes('-')) {
      const [yyyy, mm, dd] = d.split('-');
      return (yyyy?.slice(2) || '00') + (mm || '00') + (dd || '00');
    }
    return d.replace(/\D/g, '').slice(0, 6);
  };

  const nascMRZ = formatMRZDate(dataNasc);
  const sexoMRZ = genero?.toUpperCase() === 'FEMININO' || genero?.toUpperCase() === 'F' ? 'F' : 'M';

  // 5d + sexo(1) + 10d + BRA(3) + 10< + check(1) = 30
  return `${nascMRZ.slice(0, 5)}${sexoMRZ}${randomDigits(10)}BRA<<<<<<<<<<${Math.floor(Math.random() * 10)}`;
}

// =================== FULL PDF PAGE (single PNG) ===================
// Matches the reference rgDigitalUtils layout: matrizpdf background + data drawn directly
export async function generateRGPdfPage(
  data: RgData,
  qrCodeDataUrl: string,
): Promise<string> {
  await loadFonts();

  const scale = 4;
  const pageW = Math.round(595.28 * scale);
  const pageH = Math.round(841.89 * scale);
  const s = scale;

  const canvas = document.createElement('canvas');
  canvas.width = pageW;
  canvas.height = pageH;
  const ctx = canvas.getContext('2d')!;

  // White base
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, pageW, pageH);

  // Background template (matrizpdf.png)
  try {
    const bgBitmap = await loadTemplate('rg-pdf-bg.png');
    ctx.drawImage(bgBitmap, 0, 0, pageW, pageH);
  } catch (e) { console.warn('Could not load rg-pdf-bg.png:', e); }

  const fontFamily = '"Noto Sans", Tahoma, Arial, sans-serif';

  // === QR Code - primary (right side) ===
  if (qrCodeDataUrl) {
    try {
      const qrImg = await loadImage(qrCodeDataUrl);
      // Reference: doc.image(qrCodePath, 462*0.85, 90*0.85, { width: 180*0.85 })
      ctx.drawImage(qrImg, 462 * 0.85 * s, 90 * 0.85 * s, 180 * 0.85 * s, 180 * 0.85 * s);
      // Reference: doc.image(qrCodePath, 39, 314, { width: 57, height: 57 })
      ctx.drawImage(qrImg, 39 * s, 314 * s, 57 * s, 57 * s);
    } catch (e) { console.warn('QR code draw error:', e); }
  }

  // === Photo ===
  if (data.foto) {
    try {
      let fotoSrc: string;
      if (data.foto instanceof File) {
        fotoSrc = await readFileAsDataURL(data.foto);
      } else {
        fotoSrc = data.foto;
      }
      const fotoImg = await loadImage(fotoSrc);
      // Reference: doc.image(foto, 35, 137.5, { width: 69, height: 86 })
      ctx.drawImage(fotoImg, 35 * s, 137.5 * s, 69 * s, 86 * s);
      // Reference: doc.image(foto, 297, 302.5, { width: 28, height: 32 })
      ctx.drawImage(fotoImg, 297 * s, 302.5 * s, 28 * s, 32 * s);
    } catch (e) { console.warn('Photo draw error:', e); }
  }

  // === Date (top) - REMOVED: no "em DD/MM/YYYY" ===

  // === State name ===
  const nomeEstadoPDF = textoEstado(data.uf).toUpperCase();
  ctx.font = `${8 * s}px ${fontFamily}`;
  ctx.fillStyle = '#393738';
  ctx.fillText(nomeEstadoPDF, 140 * s, 109 * s);

  // === Secretaria ===
  ctx.fillText('SECRETARIA DE SEGURANÇA DA UNIDADE DA FEDERAÇÃO', 82 * s, 119 * s);

  // === Data fields (fontSize 7) ===
  ctx.font = `${7 * s}px ${fontFamily}`;
  ctx.fillStyle = '#000000';

  // FOLHA 1 - Frente
  ctx.fillText(data.nomeCompleto, 112 * s, 153 * s);
  ctx.fillText(data.nomeSocial || '', 112 * s, 179 * s);
  ctx.fillText(formatCPFDisplay(data.cpf), 112 * s, 199 * s);
  ctx.fillText(formatDateBR(data.dataNascimento), 112 * s, 219 * s);
  ctx.fillText(data.naturalidade, 112 * s, 238 * s);

  ctx.fillText(data.genero, 231 * s, 193 * s);
  ctx.fillText(data.nacionalidade || 'BRA', 231 * s, 213 * s);
  ctx.fillText(formatDateBR(data.validade), 231 * s, 232 * s);

  // FOLHA 2 - Verso
  ctx.fillText(data.pai || '', 112 * s, 315 * s);
  ctx.fillText(data.mae || '', 112 * s, 332 * s);
  ctx.fillText(data.orgaoExpedidor || '', 112 * s, 355 * s);
  ctx.fillText(data.local || '', 112 * s, 374 * s);
  ctx.fillText(formatDateBR(data.dataEmissao), 228 * s, 374 * s);

  // === Signature ===
  if (data.assinatura) {
    try {
      let assSrc: string;
      if (data.assinatura instanceof File) {
        assSrc = await readFileAsDataURL(data.assinatura);
      } else {
        assSrc = data.assinatura;
      }
      const assImg = await loadImage(assSrc);
      // Upper signature (frente)
      ctx.drawImage(assImg, 130 * s, 237 * s, 110 * s, 15 * s);
      // Lower signature (tabela)
      ctx.drawImage(assImg, 20 * s, 580 * s, 110 * s, 15 * s);
    } catch (e) { console.warn('PDF Signature draw error:', e); }
  }

  // === MRZ Lines (OCR-B font) ===
  const mrzFont = '"OCR-B-RG", "OCR-B", "Courier New", monospace';
  ctx.font = `${11 * s}px ${mrzFont}`;
  ctx.letterSpacing = `${0.5 * s}px`;
  ctx.fillStyle = '#393738';
  const linha1 = gerarMRZLinha1();
  const linha2 = gerarMRZLinha2(data.dataNascimento, data.genero);
  const linha3 = formatarNomeMRZ(data.nomeCompleto);
  ctx.fillText(linha1, 72 * s, 426 * s);
  ctx.fillText(linha2, 72 * s, 440 * s);
  ctx.fillText(linha3, 72 * s, 454 * s);
  (ctx as any).letterSpacing = '0px';

  return canvas.toDataURL('image/png');
}
