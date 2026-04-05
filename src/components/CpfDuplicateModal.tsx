import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import type { CpfCheckResult } from '@/hooks/useCpfCheck';

interface CpfDuplicateModalProps {
  open: boolean;
  onClose: () => void;
  result: CpfCheckResult | null;
  serviceLabel: string; // "RG" ou "CNH"
}

export default function CpfDuplicateModal({ open, onClose, result, serviceLabel }: CpfDuplicateModalProps) {
  const navigate = useNavigate();

  if (!result) return null;

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            CPF já cadastrado
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-left">
            <p>
              Este CPF já possui um(a) <strong>{serviceLabel}</strong> cadastrado(a) em nome de{' '}
              <strong>{result.record_name}</strong>.
            </p>
            {result.is_own ? (
              <p>
                Criado por <strong>você</strong>. Para criar novamente, vá ao Histórico e exclua o registro existente.
              </p>
            ) : (
              <p>
                Criado por <strong>{result.creator_name || 'outro usuário'}</strong>. Não é possível criar duplicado.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Fechar</AlertDialogCancel>
          {result.is_own && (
            <AlertDialogAction onClick={() => navigate('/historico-servicos')}>
              Ir ao Histórico
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
