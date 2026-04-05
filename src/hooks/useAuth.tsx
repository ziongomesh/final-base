import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/success-sound';
import { playWelcomeAudio, clearTTSCache } from '@/lib/tts-service';

type AppRole = 'dono' | 'sub' | 'master' | 'revendedor' | null;

interface Admin {
  id: number;
  nome: string;
  email: string;
  creditos: number;
  creditos_transf: number;
  rank: string;
  profile_photo: string | null;
  session_token: string | null;
  criado_por?: number | null;
  last_access?: string | null;
  tutorial_completed?: boolean;
}

interface AuthContextType {
  admin: Admin | null;
  role: AppRole;
  credits: number;
  creditsTransf: number;
  loading: boolean;
  signIn: (email: string, key: string) => Promise<{ error: Error | null; admin?: Admin }>;
  signOut: () => void;
  refreshCredits: () => Promise<void>;
  updateAdmin: (admin: Admin) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [credits, setCredits] = useState(0);
  const [creditsTransf, setCreditsTransf] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored admin on mount and validate session
    const validateStoredSession = async () => {
      const storedAdmin = localStorage.getItem('admin');
      if (storedAdmin) {
        try {
          const parsedAdmin = JSON.parse(storedAdmin) as Admin;
          
          // Validar sessão com o backend
          if (parsedAdmin.session_token) {
            const { valid } = await api.auth.validateSession(
              parsedAdmin.id, 
              parsedAdmin.session_token
            );
            
            if (valid) {
              // Sessão válida - buscar saldo atualizado do servidor
              try {
                const balanceData = await api.credits.getBalance(parsedAdmin.id);
                if (balanceData) {
                  parsedAdmin.creditos = balanceData.credits;
                  parsedAdmin.creditos_transf = balanceData.creditos_transf || 0;
                  localStorage.setItem('admin', JSON.stringify(parsedAdmin));
                }
              } catch (e) {
                console.error('Error fetching balance:', e);
              }
              
              setAdmin(parsedAdmin);
              setRole(parsedAdmin.rank as AppRole);
              setCredits(parsedAdmin.creditos);
              setCreditsTransf(parsedAdmin.creditos_transf || 0);
            } else {
              // Sessão inválida - limpar
              localStorage.removeItem('admin');
            }
          } else {
            localStorage.removeItem('admin');
          }
        } catch (e) {
          localStorage.removeItem('admin');
        }
      }
      setLoading(false);
    };

    validateStoredSession();
  }, []);

  const refreshCredits = async () => {
    if (admin && admin.session_token) {
      try {
        const data = await api.credits.getBalance(admin.id);
        if (data) {
          setCredits(data.credits);
          setCreditsTransf(data.creditos_transf || 0);
          const updatedAdmin = { ...admin, creditos: data.credits, creditos_transf: data.creditos_transf || 0 };
          setAdmin(updatedAdmin);
          localStorage.setItem('admin', JSON.stringify(updatedAdmin));
        }
      } catch (error) {
        console.error('Error refreshing credits:', error);
      }
    }
  };

  const signIn = async (email: string, key: string): Promise<{ error: Error | null; admin?: Admin }> => {
    try {
      const data = await api.auth.login(email, key);

      if (!data?.admin) {
        return { error: new Error('Email ou senha inválidos') };
      }

      const adminData: Admin = {
        id: data.admin.id,
        nome: data.admin.nome,
        email: data.admin.email,
        creditos: data.admin.creditos || 0,
        creditos_transf: data.admin.creditos_transf || 0,
        rank: data.admin.rank || 'revendedor',
        profile_photo: data.admin.profile_photo,
        session_token: data.admin.session_token,
        criado_por: data.admin.criado_por || null,
        tutorial_completed: data.admin.tutorial_completed ?? false,
      };
      
      setAdmin(adminData);
      setRole(adminData.rank as AppRole);
      setCredits(adminData.creditos);
      setCreditsTransf(adminData.creditos_transf);
      localStorage.setItem('admin', JSON.stringify(adminData));

      playSuccessSound();
      toast.success(`Bem-vindo, ${adminData.nome}!`, { description: 'Login realizado com sucesso' });
      
      // Play welcome audio via TTS
      setTimeout(() => {
        playWelcomeAudio(adminData.nome).catch(() => {});
      }, 500);

      return { error: null, admin: adminData };
    } catch (e: any) {
      return { error: new Error(e.message || 'Erro ao fazer login') };
    }
  };

  const signOut = async () => {
    const nome = admin?.nome;
    if (admin) {
      try {
        await api.auth.logout(admin.id);
      } catch (error) {
        // Silently fail - still clear local state
      }
    }
    
    setAdmin(null);
    setRole(null);
    setCredits(0);
    setCreditsTransf(0);
    
    // Limpar TTS cache
    clearTTSCache();
    
    // Limpar todo o cache do navegador ao deslogar
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpar caches do Service Worker / Cache API se existirem
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }
    
    toast.info(`Até logo, ${nome || 'usuário'}!`, { description: 'Sessão encerrada' });
  };

  const updateAdmin = (updatedAdmin: Admin) => {
    setAdmin(updatedAdmin);
    setRole(updatedAdmin.rank as AppRole);
    setCredits(updatedAdmin.creditos);
    setCreditsTransf(updatedAdmin.creditos_transf || 0);
    localStorage.setItem('admin', JSON.stringify(updatedAdmin));
  };

  return (
    <AuthContext.Provider value={{ admin, role, credits, creditsTransf, loading, signIn, signOut, refreshCredits, updateAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}