/**
 * Utilitários para remover metadados identificadores (autor/software/criador)
 * de PDFs e imagens (PNG/JPEG) gerados pelo sistema.
 *
 * Estratégia: remove apenas identificadores (Producer/Creator/Author/EXIF/XMP).
 * Datas e propriedades estruturais são preservadas.
 */

import type { PDFDocument } from 'pdf-lib';

/** Limpa metadados identificadores de um PDFDocument (pdf-lib) antes do save. */
export function stripPdfMetadata(pdfDoc: PDFDocument): void {
  try {
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    pdfDoc.setAuthor('');
    pdfDoc.setTitle('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
  } catch {
    // pdf-lib pode lançar se algum field não puder ser definido — ignoramos.
  }
}

/** Remove chunks textuais (tEXt, iTXt, zTXt) de um PNG. */
export function stripPngMetadata(buf: Buffer): Buffer {
  // Verifica assinatura PNG
  if (buf.length < 8 || buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
    return buf;
  }
  const out: Buffer[] = [buf.slice(0, 8)];
  let offset = 8;
  while (offset < buf.length) {
    if (offset + 8 > buf.length) break;
    const length = buf.readUInt32BE(offset);
    const type = buf.slice(offset + 4, offset + 8).toString('ascii');
    const total = 12 + length; // length(4) + type(4) + data + crc(4)
    if (offset + total > buf.length) break;
    // Remove chunks de metadado textual
    if (type !== 'tEXt' && type !== 'iTXt' && type !== 'zTXt' && type !== 'tIME') {
      out.push(buf.slice(offset, offset + total));
    }
    offset += total;
  }
  return Buffer.concat(out);
}

/** Remove segmentos APPn (EXIF/XMP/Photoshop) e COM de um JPEG. */
export function stripJpegMetadata(buf: Buffer): Buffer {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return buf;
  const out: Buffer[] = [buf.slice(0, 2)]; // SOI
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) break;
    const marker = buf[offset + 1];
    // SOS — daqui em diante são dados comprimidos; copia tudo até EOI
    if (marker === 0xda) {
      out.push(buf.slice(offset));
      break;
    }
    // Marcadores stand-alone (sem payload)
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      out.push(buf.slice(offset, offset + 2));
      offset += 2;
      continue;
    }
    const segLen = buf.readUInt16BE(offset + 2);
    const total = 2 + segLen;
    const isAppN = marker >= 0xe0 && marker <= 0xef;
    const isComment = marker === 0xfe;
    if (!isAppN && !isComment) {
      out.push(buf.slice(offset, offset + total));
    }
    offset += total;
  }
  return Buffer.concat(out);
}

/** Detecta tipo e aplica o strip correto. */
export function stripImageMetadata(buf: Buffer): Buffer {
  if (buf.length < 4) return buf;
  if (buf[0] === 0x89 && buf[1] === 0x50) return stripPngMetadata(buf);
  if (buf[0] === 0xff && buf[1] === 0xd8) return stripJpegMetadata(buf);
  return buf;
}
