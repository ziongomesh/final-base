import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight, X, PartyPopper, Rocket, CheckCircle, ChevronLeft,
  Users, CreditCard, TrendingUp, Send, UserPlus, Eye, DollarSign, ShieldCheck,
  Volume2, VolumeX
} from 'lucide-react';
import { speakAndTrack, stopCurrentAudio } from '@/lib/tts-service';

interface MasterOnboardingWizardProps {
  userName: string;
  adminId: number;
  onClose: () => void;
}

const AUDIO_SCRIPTS: Record<string, string> = {
  welcome: `Olá {name}! Bem-vindo à base como Master. Vou te explicar como funciona o seu papel aqui. É simples e direto.`,
  whatIsMaster: `Como Master, você é o intermediário entre o sistema e seus revendedores. Você compra créditos por um valor, e revende por um preço maior. Seu lucro é a diferença.`,
  howItWorks: `O fluxo é simples. Primeiro, recarregue seus créditos via PIX. Depois, crie revendedores e dê acesso ao sistema. Transfira créditos para eles conforme necessário. E acompanhe o desempenho da sua equipe pelo painel.`,
  tips: `Algumas dicas importantes: comece criando dois ou três revendedores e acompanhe de perto. Recarregue em volume maior para pagar menos por crédito. Fique de olho nos revendedores inativos. E use o histórico de transferências para definir metas.`,
};

type Step = 'welcome' | 'whatIsMaster' | 'howItWorks' | 'tips';

export default function MasterOnboardingWizard({ userName, adminId, onClose }: MasterOnboardingWizardProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const playStepAudio = useCallback(async (stepKey: string) => {
    if (!audioEnabled) return;
    setIsSpeaking(true);
    const script = AUDIO_SCRIPTS[stepKey]?.replace('{name}', userName) || '';
    await speakAndTrack(script, 'k3f7zOv6LF88v78QHCNh');
    setIsSpeaking(false);
  }, [audioEnabled, userName]);

  useEffect(() => {
    playStepAudio(step);
    return () => stopCurrentAudio();
  }, [step, playStepAudio]);

  const toggleAudio = () => {
    if (audioEnabled) { stopCurrentAudio(); setIsSpeaking(false); }
    setAudioEnabled(!audioEnabled);
  };

  const handleSkip = async () => {
    stopCurrentAudio();
    try { await api.admins.completeTutorial(adminId); } catch {}
    onClose();
  };

  const handleFinish = () => {
    stopCurrentAudio();
    localStorage.setItem(`master_tutorial_completed_${adminId}`, 'true');
    onClose();
  };

  const goToStep = (newStep: Step) => {
    stopCurrentAudio();
    setStep(newStep);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute -top-2 -right-2 z-10 flex gap-1.5">
          <button onClick={toggleAudio} className="bg-card border border-border rounded-full p-1.5 hover:bg-muted transition-colors shadow-lg" title={audioEnabled ? 'Desativar áudio' : 'Ativar áudio'}>
            {audioEnabled ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          </button>
          <button onClick={handleSkip} className="bg-card border border-border rounded-full p-1.5 hover:bg-muted transition-colors shadow-lg">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center relative">
                {step === 'welcome' && <PartyPopper className="h-6 w-6 text-primary" />}
                {step === 'whatIsMaster' && <ShieldCheck className="h-6 w-6 text-primary" />}
                {step === 'howItWorks' && <TrendingUp className="h-6 w-6 text-primary" />}
                {step === 'tips' && <Rocket className="h-6 w-6 text-primary" />}
                {isSpeaking && (
                  <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
              </div>
              <div>
                {step === 'welcome' && <><h2 className="text-xl font-bold text-foreground">Bem-vindo, Master {userName}! 🎉</h2><p className="text-sm text-muted-foreground">Vamos te mostrar como ser um Master</p></>}
                {step === 'whatIsMaster' && <><h2 className="text-xl font-bold text-foreground">O que é ser Master?</h2><p className="text-sm text-muted-foreground">Entenda seu papel no sistema</p></>}
                {step === 'howItWorks' && <><h2 className="text-xl font-bold text-foreground">Como funciona?</h2><p className="text-sm text-muted-foreground">O fluxo do seu negócio</p></>}
                {step === 'tips' && <><h2 className="text-xl font-bold text-foreground">Dicas para começar</h2><p className="text-sm text-muted-foreground">Maximize seus resultados</p></>}
              </div>
            </div>
            {isSpeaking && audioEnabled && (
              <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                <div className="flex gap-0.5 items-end h-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-0.5 bg-primary rounded-full animate-pulse" style={{ height: `${8 + Math.random() * 12}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
                <span>Narrando...</span>
              </div>
            )}
          </div>

          <CardContent className="p-6 pt-4">
            {step === 'welcome' && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div><p className="font-medium text-sm text-foreground">Você é um Master</p><p className="text-xs text-muted-foreground">Gerencia revendedores e lucra com cada crédito vendido</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div><p className="font-medium text-sm text-foreground">Seus módulos de usuário</p><p className="text-xs text-muted-foreground">Acesso a todos os serviços: CNH, RG, CRLV, Arrais e mais</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div><p className="font-medium text-sm text-foreground">Gestão completa</p><p className="text-xs text-muted-foreground">Crie revendedores, transfira créditos e acompanhe tudo</p></div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={handleSkip} className="flex-1">Pular tutorial</Button>
                  <Button onClick={() => goToStep('whatIsMaster')} className="flex-1 gap-2">Continuar <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}

            {step === 'whatIsMaster' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">Como <span className="font-bold text-foreground">Master</span>, você é o intermediário entre o sistema e seus revendedores:</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/10"><DollarSign className="h-5 w-5 text-green-500 shrink-0" /><div><p className="font-medium text-sm">Compra créditos por valor X</p><p className="text-xs text-muted-foreground">Recarregue via PIX</p></div></div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-500/30 bg-blue-500/10"><Send className="h-5 w-5 text-blue-500 shrink-0" /><div><p className="font-medium text-sm">Vende por valor Y ao público</p><p className="text-xs text-muted-foreground">Defina seu próprio preço</p></div></div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10"><TrendingUp className="h-5 w-5 text-amber-500 shrink-0" /><div><p className="font-medium text-sm">Lucro = Y - X</p><p className="text-xs text-muted-foreground">Mais revendedores = mais faturamento</p></div></div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => goToStep('welcome')} className="gap-1"><ChevronLeft className="h-4 w-4" /> Voltar</Button>
                  <Button onClick={() => goToStep('howItWorks')} className="flex-1 gap-2">Continuar <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}

            {step === 'howItWorks' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {[
                    { n: 1, icon: CreditCard, text: <><span className="font-medium">Recarregue</span> seus créditos via PIX</> },
                    { n: 2, icon: UserPlus, text: <><span className="font-medium">Crie revendedores</span> e dê acesso ao sistema</> },
                    { n: 3, icon: Send, text: <><span className="font-medium">Transfira créditos</span> para seus revendedores</> },
                    { n: 4, icon: Eye, text: <><span className="font-medium">Acompanhe</span> o desempenho da equipe</> },
                    { n: 5, icon: Users, text: <><span className="font-medium">Monitore</span> a atividade e mantenha todos engajados</> },
                  ].map(({ n, icon: Icon, text }) => (
                    <div key={n} className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">{n}</span>
                      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary shrink-0" /><p className="text-sm">{text}</p></div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => goToStep('whatIsMaster')} className="gap-1"><ChevronLeft className="h-4 w-4" /> Voltar</Button>
                  <Button onClick={() => goToStep('tips')} className="flex-1 gap-2">Continuar <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}

            {step === 'tips' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">💡 Dica 1</p>
                    <p className="text-xs text-muted-foreground mt-1">Comece criando 2-3 revendedores e acompanhe o desempenho deles</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">💡 Dica 2</p>
                    <p className="text-xs text-muted-foreground mt-1">Recarregue em volume maior para pagar menos por crédito</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">💡 Dica 3</p>
                    <p className="text-xs text-muted-foreground mt-1">Fique de olho nos revendedores inativos - mantê-los ativos é essencial</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20">
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">💡 Dica 4</p>
                    <p className="text-xs text-muted-foreground mt-1">Use o histórico de transferências para definir metas mensais</p>
                  </div>
                </div>
                <Button onClick={handleFinish} className="w-full gap-2"><Rocket className="h-4 w-4" /> Começar a usar!</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
