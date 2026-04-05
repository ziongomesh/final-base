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
    <div className="w-full space-y-10">
      {/* Home icon - top left */}
      <button
        onClick={() => navigate('/')}
        className="text-white/40 hover:text-white transition-colors"
      >
        <Home className="h-5 w-5" />
      </button>

      {/* Logo + Title - centered */}
      <div className="flex flex-col items-center text-center">
        <img src={logoImage} alt="Logo" className="h-32 w-auto invert brightness-200" draggable={false} />
        <h1 className="mt-6 text-[28px] font-extrabold leading-none text-white">
          Iniciar Sessão
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {/* Usuário input */}
        <div className="rounded-sm bg-white/[0.08] border border-white/10 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]">
          <div className="px-4 pt-2 text-[11px] tracking-wider text-white/50">
            Usuário
          </div>
          <Input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            className="h-8 bg-transparent border-0 px-4 py-1 text-white placeholder:text-white/25 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {/* Senha input */}
        <div className="rounded-sm bg-white/[0.08] border border-white/10 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]">
          <div className="px-4 pt-2 text-[11px] tracking-wider text-white/50">
            Senha
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-8 bg-transparent border-0 px-4 py-1 text-white placeholder:text-white/25 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {TURNSTILE_ENABLED && (
          <div className="mt-6">
            <TurnstileWidget
              key={turnstileKey}
              onVerify={handleTurnstileVerify}
              onExpire={handleTurnstileExpire}
            />
          </div>
        )}

        {/* Play button */}
        <div className="pt-10 flex flex-col items-center gap-6">
          <div className="relative">
            {!isDisabled && (
              <div className="absolute -inset-3 rounded-[28px] bg-sky-300/20 blur-xl pointer-events-none animate-pulse" />
            )}
            <Button
              type="submit"
              disabled={isDisabled}
              className={`
                relative h-20 w-20 rounded-3xl border border-white/15 transition-all
                ${isDisabled
                  ? 'bg-gray-500/25 text-gray-300 opacity-40 cursor-not-allowed shadow-none'
                  : 'bg-sky-300/70 text-black hover:bg-sky-300/80 active:scale-[0.98] shadow-[0_18px_40px_rgba(0,0,0,0.35)]'
                }
              `}
              size="icon"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Play className="h-7 w-7 ml-0.5" />
              )}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setShowRecoverAccount(true)}
            className="text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            Esqueceu o acesso?
          </button>

          <p className="text-sm text-white/55 text-center">
            Não tem uma conta?{' '}
            <button
              type="button"
              onClick={() => setShowCreateAccount(true)}
              className="text-sky-300 hover:underline font-medium"
            >
              Criar Conta
            </button>
          </p>
        </div>
      </form>

      {/* Create Account Modal */}
      {showCreateAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
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
        </div>
      )}

      {/* Recover Account Modal */}
      {showRecoverAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
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
        </div>
      )}
    </div>
  );
}
