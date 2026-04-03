import { useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Download, Loader2, FileText, ArrowLeft, Layers, PanelRightClose } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PdfTextField } from '@/components/pdf-editor/types';
import { extractPdfData } from '@/components/pdf-editor/pdf-utils';
import { PdfCanvas } from '@/components/pdf-editor/PdfCanvas';
import { LayersPanel } from '@/components/pdf-editor/LayersPanel';
import { savePdf } from '@/components/pdf-editor/pdf-save';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function EditorPdf() {
  const { admin, loading: authLoading } = useAuth();
  const [fields, setFields] = useState<PdfTextField[]>([]);
  const [pages, setPages] = useState<{ width: number; height: number; canvas: HTMLCanvasElement; bgCanvas: HTMLCanvasElement }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showLayers, setShowLayers] = useState(false);


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast.error('Selecione um arquivo PDF');
      return;
    }

    setLoading(true);
    setFileName(file.name);

    try {
      const { pages: extractedPages, fields: extractedFields, arrayBuffer } = await extractPdfData(file);
      setPages(extractedPages);
      setFields(extractedFields);
      setPdfBytes(arrayBuffer);
      setCurrentPage(0);
      toast.success(`PDF carregado! ${extractedFields.length} campos identificados.`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar PDF');
    } finally {
      setLoading(false);
    }
  };

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

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!admin) return <Navigate to="/login" replace />;

  const handleSave = async () => {
    if (!pdfBytes) return;

    try {
      const pageScales = pages.map(p => ({ width: p.width, height: p.height }));
      const savedBytes = await savePdf(pdfBytes, fields, pageScales);

      const blob = new Blob([savedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.replace('.pdf', '_editado.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('PDF salvo com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar PDF');
    }
  };

  const handleReset = () => {
    setFields([]);
    setPages([]);
    setSelectedId(null);
    setPdfBytes(null);
    setFileName('');
    setCurrentPage(0);
  };

  const currentPageFields = fields.filter(f => f.pageIndex === currentPage);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/ferramentas">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Editor de PDF
              </h1>
              <p className="text-muted-foreground">Edite campos de texto, mova ou exclua elementos</p>
            </div>
          </div>
          {pages.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={() => setShowLayers(v => !v)} variant={showLayers ? 'default' : 'outline'} className="gap-2">
                {showLayers ? <PanelRightClose className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                Camadas
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Download className="h-4 w-4" /> Salvar PDF
              </Button>
              <Button onClick={handleReset} variant="outline">Novo PDF</Button>
            </div>
          )}
        </div>

        {/* Upload */}
        {pages.length === 0 && !loading && (
          <Card className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <label className="cursor-pointer flex flex-col items-center gap-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-lg font-medium">Clique para enviar um PDF</p>
                  <p className="text-sm text-muted-foreground">O editor vai identificar todos os campos de texto</p>
                </div>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
              </label>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Analisando PDF e identificando campos...</p>
          </div>
        )}

        {/* Editor */}
        {pages.length > 0 && (
          <div className="flex gap-0 border border-border rounded-lg overflow-hidden bg-muted/30" style={{ height: 'calc(100vh - 200px)' }}>
            {/* Canvas Area */}
            <div className="flex-1 overflow-auto">
              {/* Page tabs */}
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
                <div className="p-6 flex justify-center">
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

            {/* Layers Panel */}
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

        {/* Instructions */}
        {pages.length > 0 && (
          <div className="text-xs text-muted-foreground text-center space-x-4">
            <span>🖱️ Clique no texto para editar</span>
            <span>🗑️ Exclua no painel de camadas</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
