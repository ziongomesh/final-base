import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { PdfTextField } from './types';

export async function savePdf(
  originalPdfBytes: ArrayBuffer,
  fields: PdfTextField[],
  pageScales: { width: number; height: number }[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const scale = 1.5; // must match extraction scale

  // Group deleted/modified fields
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width: pageW, height: pageH } = page.getSize();

    // Draw white rectangles over ALL original text (we'll redraw visible ones)
    // This is a simplified approach - draw white over original positions then redraw edited text
  }

  // For a simpler approach: create a new PDF with the background and overlay text
  const newPdf = await PDFDocument.create();
  const newFont = await newPdf.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pages.length; i++) {
    const origPage = pages[i];
    const { width, height } = origPage.getSize();

    // Copy original page as embedded
    const [embeddedPage] = await newPdf.embedPages([origPage]);
    const newPage = newPdf.addPage([width, height]);
    newPage.drawPage(embeddedPage, { x: 0, y: 0, width, height });

    // Draw white boxes over original text positions, then redraw with edits
    const pageFields = fields.filter(f => f.pageIndex === i);

    for (const field of pageFields) {
      const pdfX = field.x / scale;
      const pdfY = height - (field.y / scale) - (field.fontSize / scale);

      // White out original text area
      newPage.drawRectangle({
        x: pdfX - 1,
        y: pdfY - 2,
        width: (field.width / scale) + 2,
        height: (field.fontSize / scale) + 4,
        color: rgb(1, 1, 1),
      });

      // Redraw if visible and has text
      if (field.visible && field.text.trim()) {
        newPage.drawText(field.text, {
          x: pdfX,
          y: pdfY,
          size: field.fontSize / scale,
          font: newFont,
          color: rgb(0, 0, 0),
        });
      }
    }
  }

  return await newPdf.save();
}
