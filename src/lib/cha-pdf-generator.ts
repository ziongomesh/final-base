import { PDFDocument } from 'pdf-lib';

// Coordenadas calibradas (% do PDF) - da ferramenta /teste6
const POSITIONS = {
  matrizFrente: { x: 6.3, y: 1.6, w: 49.0, h: 37.8 },
  matrizVerso:  { x: 6.1, y: 31.5, w: 49.3, h: 28.6 },
  qrcode:       { x: 67.0, y: 9.7, w: 21.1, h: 18.0 },
};

// A4 dimensions in points
const PAGE_W = 595;
const PAGE_H = 842;

async function loadImageBytes(src: string): Promise<Uint8Array> {
  // Handle base64 data URLs
  if (src.startsWith('data:')) {
    const base64 = src.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  // Handle regular URLs
  const resp = await fetch(src);
  return new Uint8Array(await resp.arrayBuffer());
}

function isPng(bytes: Uint8Array): boolean {
  return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
}

export async function generateChaPdf(
  baseImageUrl: string,
  matrizFrenteBase64: string,
  matrizVersoBase64: string,
  qrcodeBase64: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

  // 1. Embed base image as full-page background
  const baseBytes = await loadImageBytes(baseImageUrl);
  const baseImg = isPng(baseBytes)
    ? await pdfDoc.embedPng(baseBytes)
    : await pdfDoc.embedJpg(baseBytes);
  page.drawImage(baseImg, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });

  // Helper: convert % position to PDF coordinates, preserving aspect ratio (contain)
  const placeContain = (
    pos: { x: number; y: number; w: number; h: number },
    imgNatW: number,
    imgNatH: number,
  ) => {
    const areaW = (pos.w / 100) * PAGE_W;
    const areaH = (pos.h / 100) * PAGE_H;
    const areaX = (pos.x / 100) * PAGE_W;
    const areaY = (pos.y / 100) * PAGE_H;

    const imgRatio = imgNatW / imgNatH;
    const areaRatio = areaW / areaH;

    let drawW: number, drawH: number;
    if (imgRatio > areaRatio) {
      drawW = areaW;
      drawH = areaW / imgRatio;
    } else {
      drawH = areaH;
      drawW = areaH * imgRatio;
    }

    const offsetX = (areaW - drawW) / 2;
    const offsetY = (areaH - drawH) / 2;

    return {
      x: areaX + offsetX,
      y: PAGE_H - areaY - offsetY - drawH,
      width: drawW,
      height: drawH,
    };
  };

  // 2. Embed Matriz Frente
  if (matrizFrenteBase64) {
    try {
      const frenteBytes = await loadImageBytes(matrizFrenteBase64);
      const frenteImg = isPng(frenteBytes)
        ? await pdfDoc.embedPng(frenteBytes)
        : await pdfDoc.embedJpg(frenteBytes);
      page.drawImage(frenteImg, placeContain(POSITIONS.matrizFrente, frenteImg.width, frenteImg.height));
    } catch (e) {
      console.error('Erro ao embutir matriz frente:', e);
    }
  }

  // 3. Embed Matriz Verso
  if (matrizVersoBase64) {
    try {
      const versoBytes = await loadImageBytes(matrizVersoBase64);
      const versoImg = isPng(versoBytes)
        ? await pdfDoc.embedPng(versoBytes)
        : await pdfDoc.embedJpg(versoBytes);
      page.drawImage(versoImg, placeContain(POSITIONS.matrizVerso, versoImg.width, versoImg.height));
    } catch (e) {
      console.error('Erro ao embutir matriz verso:', e);
    }
  }

  // 4. Embed QR Code
  if (qrcodeBase64) {
    try {
      const qrBytes = await loadImageBytes(qrcodeBase64);
      const qrImg = isPng(qrBytes)
        ? await pdfDoc.embedPng(qrBytes)
        : await pdfDoc.embedJpg(qrBytes);
      page.drawImage(qrImg, placeContain(POSITIONS.qrcode, qrImg.width, qrImg.height));
    } catch (e) {
      console.error('Erro ao embutir QR code:', e);
    }
  }

  return await pdfDoc.save();
}

export function downloadPdfBlob(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
