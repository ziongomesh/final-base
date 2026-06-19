import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Play, Home } from 'lucide-react';
import { PinPad } from './PinPad';
import { TurnstileWidget, TURNSTILE_ENABLED } from './TurnstileWidget';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import logoImage from '@/assets/logo-new.png';


interface PendingAdmin {
  id: number;
  nome: string;
  email: string;
  creditos: number;
  rank: string;
  profile_photo: string | null;
  hasPin: boolean;
}

export function LoginForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAdmin, setPendingAdmin] = useState<PendingAdmin | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showRecoverAccount, setShowRecoverAccount] = useState(false);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  const verifyTurnstile = async (token: string): Promise<boolean> => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiUrl}/turnstile/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      return data?.success === true;
    } catch (error) {
      console.error('Erro ao verificar Turnstile:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (TURNSTILE_ENABLED) {
      if (!turnstileToken) {
        toast.error('Por favor, complete a verificação de segurança');
        return;
      }
      setLoading(true);
      const isValid = await verifyTurnstile(turnstileToken);
      if (!isValid) {
        toast.error('Verificação de segurança falhou. Tente novamente.');
        setTurnstileToken(null);
        setTurnstileKey(k => k + 1);
        setLoading(false);
        return;
      }
    } else {
      setLoading(true);
    }

    toast.loading('Carregando...', { id: 'login-loading' });

    try {
      const data = await api.auth.login(email, password);

      if (!data?.admin) {
        toast.dismiss('login-loading');
        toast.error('Erro ao fazer login', { description: 'Email ou senha incorretos' });
        setTurnstileToken(null);
        setTurnstileKey(k => k + 1);
        setLoading(false);
        return;
      }

      const adminData = data.admin;
      const hasPin = !!adminData.pin;

      setPendingAdmin({
        id: adminData.id,
        nome: adminData.nome,
        email: adminData.email,
        creditos: adminData.creditos,
        rank: adminData.rank,
        profile_photo: adminData.profile_photo,
        hasPin,
      });

      toast.dismiss('login-loading');
      setLoading(false);
    } catch (error: any) {
      toast.dismiss('login-loading');
      toast.error('Erro ao fazer login', { description: error.message || 'Email ou senha incorretos' });
      setTurnstileToken(null);
      setTurnstileKey(k => k + 1);
      setLoading(false);
    }
  };

  const handlePinSubmit = async (pin: string) => {
    if (!pendingAdmin) return;
    setPinLoading(true);

    try {
      if (pendingAdmin.hasPin) {
        const result = await api.auth.validatePin(pendingAdmin.id, pin);
        if (!result.valid) {
          toast.error('PIN incorreto');
          setPinLoading(false);
          return;
        }
      } else {
        await api.auth.setPin(pendingAdmin.id, pin);
        toast.success('PIN registrado com sucesso!');
      }
      toast.loading('Carregando...', { id: 'login-loading' });
      const { error } = await signIn(email, password);
      toast.dismiss('login-loading');
      if (error) {
        toast.error('Erro ao fazer login');
      }
    } catch (err: any) {
      toast.error('Erro ao processar PIN', { description: err.message });
    }

    setPinLoading(false);
  };

  const isFormValid = !!email && !!password && (!TURNSTILE_ENABLED || !!turnstileToken);
  const isDisabled = loading || !isFormValid;

  // PIN pad view
  if (pendingAdmin) {
    return (
      <div className="w-full">
        <PinPad
          mode={pendingAdmin.hasPin ? 'verify' : 'register'}
          onSubmit={handlePinSubmit}
          loading={pinLoading}
        />
        <Button
          variant="ghost"
          className="w-full mt-4 text-gray-500 hover:text-gray-300"
          onClick={() => setPendingAdmin(null)}
        >
          Voltar ao login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-8">
        <img
          src={logoImage}
          alt="Logo"
          className="h-20 w-auto invert brightness-200 mb-5"
          draggable={false}
        />
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Iniciar Sessão
        </h1>
        <p className="text-[11px] mt-1 uppercase tracking-widest font-medium text-white/40">
          Painel Administrativo
        </p>
      </div>

      {/* Login Card */}
      <div className="glass-card p-7 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Usuário */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider ml-1">
              Usuário
            </label>
            <Input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder="Digite seu usuário"
              className="glass-input h-11 px-4 text-sm placeholder:text-white/25 shadow-none"
            />
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                Senha
              </label>
              <button
                type="button"
                onClick={() => setShowRecoverAccount(true)}
                className="text-[10px] text-sky-300 hover:text-sky-200 transition-colors"
              >
                Esqueceu o acesso?
              </button>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="glass-input h-11 px-4 text-sm placeholder:text-white/25 shadow-none"
            />
          </div>

          {TURNSTILE_ENABLED && (
            <div className="pt-1">
              <TurnstileWidget
                key={turnstileKey}
                onVerify={handleTurnstileVerify}
                onExpire={handleTurnstileExpire}
              />
            </div>
          )}

          {/* Primary CTA */}
          <Button
            type="submit"
            disabled={isDisabled}
            className={`
              w-full h-12 rounded-xl text-sm font-semibold transition-all duration-200
              ${isDisabled
                ? 'bg-white/5 text-white/30 cursor-not-allowed shadow-none'
                : 'bg-sky-400 hover:bg-sky-300 text-slate-950 shadow-[0_8px_24px_-8px_rgba(91,168,212,0.6)] active:scale-[0.99]'
              }
            `}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Entrar no Painel'
            )}
          </Button>
        </form>

        <div className="mt-7 pt-5 border-t border-white/5 text-center">
          <p className="text-xs text-white/45">
            Não tem uma conta?{' '}
            <button
              type="button"
              onClick={() => setShowCreateAccount(true)}
              className="text-white font-medium hover:text-sky-300 transition-colors"
            >
              Criar Conta
            </button>
          </p>
        </div>
      </div>

      {/* Home link below card */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full glass-pill text-white/40 hover:text-white transition-colors"
          aria-label="Início"
        >
          <Home className="h-4 w-4" />
        </button>
      </div>


      {/* Create Account Modal */}
      {showCreateAccount && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCreateAccount(false)}
        >
          <div
            className="border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 space-y-6 backdrop-blur-xl bg-white/[0.03]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white text-center">Criar uma Conta</h2>
            <p className="text-white/50 text-sm text-center leading-relaxed">
              O acesso à plataforma é feito exclusivamente por um administrador.<br />
              Entre em contato com seu admin para solicitar a criação da sua conta.
            </p>
            <Button
              onClick={() => setShowCreateAccount(false)}
              className="w-full h-11 border-white/15 text-white hover:bg-white/10"
              variant="outline"
            >
              Voltar ao Login
            </Button>
          </div>
        </div>,
        document.body
      )}

      {/* Recover Account Modal */}
      {showRecoverAccount && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowRecoverAccount(false)}
        >
          <div
            className="border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 space-y-6 backdrop-blur-xl bg-white/[0.03]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white text-center">Recuperar Acesso</h2>
            <p className="text-white/50 text-sm text-center leading-relaxed">
              Para recuperar seu acesso, entre em contato com um administrador da plataforma.<br />
              Ele poderá redefinir sua senha e restaurar o acesso à sua conta.
            </p>
            <Button
              onClick={() => setShowRecoverAccount(false)}
              className="w-full h-11 border-white/15 text-white hover:bg-white/10"
              variant="outline"
            >
              Voltar ao Login
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
