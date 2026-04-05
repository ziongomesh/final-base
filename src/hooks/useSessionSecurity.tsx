import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import api from '@/lib/api';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/success-sound';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos
const WARNING_BEFORE = 2 * 60 * 1000; // aviso 2 min antes

export function useSessionSecurity() {
  const { admin, signOut } = useAuth();
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef(false);

  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;

    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    if (!admin) return;

    // Aviso de inatividade 2 min antes do logout
    warningTimerRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true;
        playSuccessSound();
        toast.warning('⚠️ Você está ausente!', {
          description: 'Sessão será encerrada em 2 minutos por inatividade. Mova o mouse para continuar.',
          duration: 30000,
        });
      }
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

    inactivityTimerRef.current = setTimeout(() => {
      signOut();
      window.location.href = '/login?reason=inactivity';
    }, INACTIVITY_TIMEOUT);
  }, [admin, signOut]);

  useEffect(() => {
    if (!admin) return;

    // Disable right-click
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable F12 and other dev keys
    const disableDevKeys = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        signOut();
        window.location.href = '/login';
        return false;
      }
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault();
        signOut();
        window.location.href = '/login';
        return false;
      }
      if (e.ctrlKey && e.key.toUpperCase() === 'U') {
        e.preventDefault();
        return false;
      }
    };

    // Validate session against database
    const validateSession = async () => {
      if (!admin?.session_token) return;
      try {
        const data = await api.auth.validateSession(admin.id, admin.session_token);
        if (!data.valid) {
          signOut();
          window.location.href = '/login?reason=session_expired';
        }
      } catch (error) {
        console.error('Session validation error:', error);
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const handleActivity = () => resetInactivityTimer();

    document.addEventListener('contextmenu', disableRightClick);
    document.addEventListener('keydown', disableDevKeys);
    activityEvents.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));

    resetInactivityTimer();
    checkIntervalRef.current = setInterval(validateSession, 5000);

    return () => {
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('keydown', disableDevKeys);
      activityEvents.forEach(evt => window.removeEventListener(evt, handleActivity));
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [admin, signOut, resetInactivityTimer]);
}
