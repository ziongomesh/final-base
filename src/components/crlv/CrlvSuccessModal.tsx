import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CrlvSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  placa: string;
  senha: string;
  pdfUrl: string | null;
  nomeProprietario?: string;
  createdAt?: string;
}

export default function CrlvSuccessModal({ isOpen, onClose, placa, pdfUrl, createdAt }: CrlvSuccessModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const cleanPlaca = placa.replace(/[^A-Za-z0-9]/g, '');

  const handleDownloadPdf = async () => {
    if (!pdfUrl) {
      toast.error('PDF não disponível');
      return;
    }
    try {
      setIsDownloading(true);
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error('Erro ao baixar');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `CRLV_${cleanPlaca}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      toast.success('Download iniciado');
    } catch {
      toast.error('Erro ao baixar PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    : new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xs mx-auto p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-medium">
            <Check className="w-4 h-4 text-green-500" />
            CRLV gerado
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{dateStr}</p>
        </DialogHeader>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-2.5 text-xs text-amber-700 dark:text-amber-400">
          ⚠️ <strong>Importante:</strong> Baixe e salve o arquivo. O PDF não fica armazenado permanentemente por segurança.
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloading || !pdfUrl}
            className="w-full text-xs"
          >
            {isDownloading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            CRLV_{cleanPlaca}.pdf
          </Button>
        </div>

        <div className="flex justify-end pt-3 border-t">
          <Button onClick={onClose} variant="ghost" size="sm" className="text-xs">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
