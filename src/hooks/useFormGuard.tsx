import { useState, useCallback, createContext, useContext } from 'react';

interface FormGuardContextType {
  isFormDirty: boolean;
  setFormDirty: (dirty: boolean) => void;
  pendingNavigation: string | null;
  setPendingNavigation: (path: string | null) => void;
  showGuardDialog: boolean;
  setShowGuardDialog: (show: boolean) => void;
  requestNavigation: (path: string) => boolean;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
}

const FormGuardContext = createContext<FormGuardContextType | null>(null);

export function FormGuardProvider({ children }: { children: React.ReactNode }) {
  const [isFormDirty, setFormDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showGuardDialog, setShowGuardDialog] = useState(false);

  const requestNavigation = useCallback((path: string): boolean => {
    if (isFormDirty) {
      setPendingNavigation(path);
      setShowGuardDialog(true);
      return false;
    }
    return true;
  }, [isFormDirty]);

  const confirmNavigation = useCallback(() => {
    setFormDirty(false);
    setShowGuardDialog(false);
  }, []);

  const cancelNavigation = useCallback(() => {
    setPendingNavigation(null);
    setShowGuardDialog(false);
  }, []);

  return (
    <FormGuardContext.Provider value={{
      isFormDirty, setFormDirty,
      pendingNavigation, setPendingNavigation,
      showGuardDialog, setShowGuardDialog,
      requestNavigation, confirmNavigation, cancelNavigation,
    }}>
      {children}
    </FormGuardContext.Provider>
  );
}

export function useFormGuard() {
  const ctx = useContext(FormGuardContext);
  if (!ctx) throw new Error('useFormGuard must be inside FormGuardProvider');
  return ctx;
}
