---
name: PDF/Image Metadata Stripping
description: Padrão de remoção de metadados identificadores (Producer/Creator/Author/EXIF/XMP/tEXt) em todos os PDFs e imagens gerados pelo sistema
type: feature
---
Todos os PDFs e imagens gerados pelo sistema (backend Node.js e frontend) devem ter metadados identificadores removidos antes da gravação/download.

**Helpers centrais:**
- Backend: `server/utils/sanitize.ts` → `stripPdfMetadata(pdfDoc)`, `stripImageMetadata(buf)`
- Frontend: `src/lib/strip-metadata.ts` → `stripPdfMetadata(pdfDoc)`, `stripImageMetadataU8(buf)`

**Pontos de aplicação:**
- PDFs (`pdf-lib`): chamar `stripPdfMetadata(pdfDoc)` imediatamente antes de `pdfDoc.save()`. Limpa Producer/Creator/Author/Title/Subject/Keywords.
- Imagens (PNG/JPEG): em `saveFile`/`saveBuffer` dos routes (CNH, RG, CRLV, estudante, cnh-nautica), aplicar `stripImageMetadata` quando `ext` for `png/jpg/jpeg`. Remove chunks `tEXt/iTXt/zTXt/tIME` (PNG) e segmentos `APPn/COM` (JPEG, inclui EXIF/XMP/Photoshop).
- Hapvida: PDF recebido do frontend é re-carregado via `PDFDocument.load`, limpo e re-salvo.

Regra: preserva datas/CreationDate e estrutura — remove apenas identificadores (autor, software, ferramenta, EXIF).
