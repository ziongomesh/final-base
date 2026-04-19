/**
 * Helpers para remover metadados identificadores (autor/software) de PDFs
 * gerados via pdf-lib no browser, e de imagens PNG/JPEG (Uint8Array).
 */

import type { PDFDocument } from 'pdf-lib';

export function stripPdfMetadata(pdfDoc: PDFDocument): void {
  try {
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    pdfDoc.setAuthor('');
    pdfDoc.setTitle('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
  } catch {
    /* noop */
  }
}

export function stripPngMetadataU8(buf: Uint8Array): Uint8Array {
  if (buf.length < 8 || buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return buf;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const chunks: Uint8Array[] = [buf.slice(0, 8)];
  let offset = 8;
  while (offset < buf.length) {
    if (offset + 8 > buf.length) break;
    const length = view.getUint32(offset);
    const type = String.fromCharCode(buf[offset + 4], buf[offset + 5], buf[offset + 6], buf[offset + 7]);
    const total = 12 + length;
    if (offset + total > buf.length) break;
    if (type !== 'tEXt' && type !== 'iTXt' && type !== 'zTXt' && type !== 'tIME') {
      chunks.push(buf.slice(offset, offset + total));
    }
    offset += total;
  }
  return concatU8(chunks);
}

export function stripJpegMetadataU8(buf: Uint8Array): Uint8Array {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return buf;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const out: Uint8Array[] = [buf.slice(0, 2)];
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) break;
    const marker = buf[offset + 1];
    if (marker === 0xda) {
      out.push(buf.slice(offset));
      break;
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      out.push(buf.slice(offset, offset + 2));
      offset += 2;
      continue;
    }
    const segLen = view.getUint16(offset + 2);
    const total = 2 + segLen;
    const isAppN = marker >= 0xe0 && marker <= 0xef;
    const isComment = marker === 0xfe;
    if (!isAppN && !isComment) {
      out.push(buf.slice(offset, offset + total));
    }
    offset += total;
  }
  return concatU8(out);
}

export function stripImageMetadataU8(buf: Uint8Array): Uint8Array {
  if (buf.length < 4) return buf;
  if (buf[0] === 0x89 && buf[1] === 0x50) return stripPngMetadataU8(buf);
  if (buf[0] === 0xff && buf[1] === 0xd8) return stripJpegMetadataU8(buf);
  return buf;
}

function concatU8(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
