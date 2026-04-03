import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
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

interface FormGuardContextType {
  isFormDirty: boolean;
  setFormDirty: (dirty: boolean) => void;
  guardedNavigate: (path: string) => void;
}

const FormGuardContext = createContext<FormGuardContextType>({
  isFormDirty: false,
  setFormDirty: () => {},
  guardedNavigate: () => {},
});

export function useFormGuard() {
  return useContext(FormGuardContext);
}

export function FormGuardProvider({ children }: { children: ReactNode }) {
  const [isFormDirty, setFormDirty] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const navigate = useNavigate();

  const guardedNavigate = useCallback((path: string) => {
    if (isFormDirty) {
      setPendingPath(path);
    } else {
      navigate(path);
    }
  }, [isFormDirty, navigate]);

  const handleConfirm = () => {
    setFormDirty(false);
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  };

  const handleCancel = () => {
    setPendingPath(null);
  };

  return (
    <FormGuardContext.Provider value={{ isFormDirty, setFormDirty, guardedNavigate }}>
      {children}
      <AlertDialog open={!!pendingPath} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Formulário em preenchimento
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Você está em uma área de preenchimento. Tem certeza que deseja sair? Os dados não salvos serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Continuar preenchendo</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sair e descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormGuardContext.Provider>
  );
}
