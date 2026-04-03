import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isUsingMySQL } from '@/lib/db-config';

export interface CpfCheckResult {
  exists: boolean;
  record_name: string;
  creator_name: string;
  creator_admin_id: number | null;
  is_own: boolean;
}

interface UseCpfCheckOptions {
  admin_id: number;
  session_token: string;
  service_type: 'rg' | 'cnh' | 'nautica' | 'estudante';
}

export function useCpfCheck({ admin_id, session_token, service_type }: UseCpfCheckOptions) {
  const [cpfDuplicate, setCpfDuplicate] = useState<CpfCheckResult | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [checking, setChecking] = useState(false);
  const lastCheckedCpf = useRef('');

  const checkCpf = useCallback(async (cpf: string) => {
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setCpfDuplicate(null);
      setShowDuplicateModal(false);
      return;
    }

    // Don't re-check the same CPF
    if (cleanCpf === lastCheckedCpf.current) return;
    lastCheckedCpf.current = cleanCpf;

    setChecking(true);
    try {
      if (isUsingMySQL()) {
        const envUrl = import.meta.env.VITE_API_URL as string | undefined;
        let apiUrl = 'http://localhost:4000/api';
        if (envUrl) {
          const base = envUrl.replace(/\/+$/, '');
          apiUrl = base.endsWith('/api') ? base : `${base}/api`;
        } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          apiUrl = `${window.location.origin}/api`;
        }
        const res = await fetch(`${apiUrl}/check-cpf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cpf: cleanCpf, admin_id, session_token, service_type }),
        });
        const data = await res.json();
        if (data.exists) {
          setCpfDuplicate(data);
          setShowDuplicateModal(true);
        } else {
          setCpfDuplicate(null);
          setShowDuplicateModal(false);
        }
      } else {
        const { data, error } = await supabase.functions.invoke('check-cpf', {
          body: { cpf: cleanCpf, admin_id, session_token, service_type },
        });
        if (!error && data?.exists) {
          setCpfDuplicate(data);
          setShowDuplicateModal(true);
        } else {
          setCpfDuplicate(null);
          setShowDuplicateModal(false);
        }
      }
    } catch (e) {
      console.error('CPF check error:', e);
    } finally {
      setChecking(false);
    }
  }, [admin_id, session_token, service_type]);

  const dismissModal = useCallback(() => {
    setShowDuplicateModal(false);
  }, []);

  const resetCheck = useCallback(() => {
    setCpfDuplicate(null);
    setShowDuplicateModal(false);
    lastCheckedCpf.current = '';
  }, []);

  return { cpfDuplicate, showDuplicateModal, checking, checkCpf, dismissModal, resetCheck };
}
