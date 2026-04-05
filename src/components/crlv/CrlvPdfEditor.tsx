import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Loader2, Pencil, Layers, PanelRightClose, X, Eye, FileText } from 'lucide-react';
import { PdfTextField } from '@/components/pdf-editor/types';
import { extractPdfData } from '@/components/pdf-editor/pdf-utils';
import { PdfCanvas } from '@/components/pdf-editor/PdfCanvas';
import { LayersPanel } from '@/components/pdf-editor/LayersPanel';
import { savePdf } from '@/components/pdf-editor/pdf-save';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CrlvPdfEditorProps {
  pdfUrl: string;
  senha: string | null;
  onClose: () => void;
}

export function CrlvPdfEditor({ pdfUrl, senha, onClose }: CrlvPdfEditorProps) {
  const [mode, setMode] = useState<'preview' | 'editor'>('preview');
  const [fields, setFields] = useState<PdfTextField[]>([]);
  const [pages, setPages] = useState<{ width: number; height: number; canvas: HTMLCanvasElement; bgCanvas: HTMLCanvasElement }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [loadingEditor, setLoadingEditor] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showLayers, setShowLayers] = useState(false);

  const handleOpenEditor = useCallback(async () => {
    setLoadingEditor(true);
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const file = new File([blob], 'crlv.pdf', { type: 'application/pdf' });
      const { pages: extractedPages, fields: extractedFields, arrayBuffer } = await extractPdfData(file);
      setPages(extractedPages);
      setFields(extractedFields);
      setPdfBytes(arrayBuffer);
      setCurrentPage(0);
      setMode('editor');
      toast.success(`Editor aberto! ${extractedFields.length} campos identificados.`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao abrir editor');
    } finally {
      setLoadingEditor(false);
    }
  }, [pdfUrl]);

  const handleUpdateField = useCallback((id: string, updates: Partial<PdfTextField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const handleToggleVisibility = useCallback((id: string) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, visible: !f.visible } : f));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const handleSave = async () => {
    if (!pdfBytes) return;
    try {
      const pageScales = pages.map(p => ({ width: p.width, height: p.height }));
      const savedBytes = await savePdf(pdfBytes, fields, pageScales);
      const blob = new Blob([savedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'crlv_editado.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('PDF editado salvo com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar PDF');
    }
  };

  const currentPageFields = fields.filter(f => f.pageIndex === currentPage);

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            {mode === 'preview' ? 'Preview do CRLV Gerado' : 'Editor de PDF — CRLV'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {senha && (
              <span className="text-xs text-muted-foreground">Senha: <strong>{senha}</strong></span>
            )}

            {mode === 'preview' && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1"
                  onClick={handleOpenEditor}
                  disabled={loadingEditor}
                >
                  {loadingEditor ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Abrindo...</>
                  ) : (
                    <><Pencil className="h-3.5 w-3.5" /> Editar PDF</>
                  )}
                </Button>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1">
                    <FileText className="h-3.5 w-3.5" /> Abrir PDF
                  </Button>
                </a>
              </>
            )}

            {mode === 'editor' && (
              <>
                <Button onClick={() => setShowLayers(v => !v)} variant={showLayers ? 'default' : 'outline'} size="sm" className="gap-1">
                  {showLayers ? <PanelRightClose className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
                  Camadas
                </Button>
                <Button onClick={handleSave} size="sm" className="gap-1">
                  <Download className="h-3.5 w-3.5" /> Salvar Editado
                </Button>
                <Button onClick={() => setMode('preview')} variant="outline" size="sm">
                  Voltar ao Preview
                </Button>
              </>
            )}

            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mode === 'preview' && (
          <iframe
            src={pdfUrl}
            className="w-full rounded-lg border border-border"
            style={{ height: '80vh' }}
            title="Preview CRLV"
          />
        )}

        {mode === 'editor' && pages.length > 0 && (
          <div className="flex gap-0 border border-border rounded-lg overflow-hidden bg-muted/30" style={{ height: '75vh' }}>
            <div className="flex-1 overflow-auto">
              {pages.length > 1 && (
                <div className="flex gap-1 p-2 bg-card border-b border-border">
                  {pages.map((_, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant={currentPage === i ? 'default' : 'ghost'}
                      onClick={() => setCurrentPage(i)}
                    >
                      Página {i + 1}
                    </Button>
                  ))}
                </div>
              )}
              <ScrollArea className="h-full">
                <div className="p-4 flex justify-center">
                  <PdfCanvas
                    pageCanvas={pages[currentPage]?.canvas || null}
                    bgCanvas={pages[currentPage]?.bgCanvas || null}
                    fields={fields}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onUpdateField={handleUpdateField}
                    pageIndex={currentPage}
                  />
                </div>
              </ScrollArea>
            </div>

            {showLayers && (
              <LayersPanel
                fields={currentPageFields}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onToggleVisibility={handleToggleVisibility}
                onDelete={handleDelete}
              />
            )}
          </div>
        )}

        {mode === 'editor' && pages.length > 0 && (
          <div className="text-xs text-muted-foreground text-center mt-2 space-x-4">
            <span>🖱️ Clique no texto para editar</span>
            <span>🗑️ Exclua no painel de camadas</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
