import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText, IdCard, Anchor, GraduationCap, Sparkles, ArrowRight, X, PartyPopper, Rocket, CheckCircle,
  Home, History, CreditCard, Wrench, Download, FolderOpen, ChevronLeft, Volume2, VolumeX, Loader2
} from 'lucide-react';
import { speakAndTrack, stopCurrentAudio } from '@/lib/tts-service';

interface OnboardingWizardProps {
  userName: string;
  adminId: number;
  onClose: () => void;
}

const PANEL_SECTIONS = [
  { icon: Home, name: 'Início', description: 'Visão geral do painel com seus créditos e informações', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: FolderOpen, name: 'Serviços', description: 'Crie documentos digitais como CNH, RG, CHA e mais', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: History, name: 'Histórico', description: 'Veja todos os documentos que você já criou', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: CreditCard, name: 'Recarregar', description: 'Compre créditos para criar novos documentos', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { icon: Wrench, name: 'Ferramentas', description: 'Gerador de assinatura, remoção de fundo e mais', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { icon: Download, name: 'Downloads', description: 'Baixe aplicativos e recursos necessários', color: 'text-rose-500', bg: 'bg-rose-500/10' },
];

const DEMO_SERVICES = [
  { id: 'cnh', name: 'CNH Digital', description: 'Carteira Nacional de Habilitação 2026', icon: FileText, route: '/servicos/cnh-digital?demo=true', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'rg', name: 'RG Digital (CIN)', description: 'Carteira de Identidade Nacional', icon: IdCard, route: '/servicos/rg-digital?demo=true', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'nautica', name: 'Arrais Náutica', description: 'Habilitação Náutica', icon: Anchor, route: '/servicos/cnh-nautica?demo=true', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { id: 'estudante', name: 'Carteira Estudante', description: 'Carteira ABAFE', icon: GraduationCap, route: '/servicos/carteira-estudante?demo=true', color: 'text-purple-500', bg: 'bg-purple-500/10' },
];

// Audio scripts for each step
const AUDIO_SCRIPTS: Record<string, string> = {
  welcome: `Olá {name}! Bem-vindo à base. Vou te apresentar rapidamente como tudo funciona aqui. É simples, rápido e prático. Vamos lá?`,
  sections: `Essas são as seções do seu painel. Na aba Início você vê seus créditos e estatísticas. Em Serviços, você cria os documentos. O Histórico mostra tudo que já criou. Recarregar é onde compra créditos. Ferramentas tem utilitários como gerador de assinatura. E Downloads tem os aplicativos necessários.`,
  choose: `Agora vou te mostrar como preencher um documento na prática. Escolha qual módulo quer aprender. Recomendo começar pela CNH Digital, é o mais completo. Ao entrar, cada campo vai ser explicado passo a passo para você.`,
};

type Step = 'welcome' | 'sections' | 'choose';

export default function OnboardingWizard({ userName, adminId, onClose }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const playStepAudio = useCallback(async (stepKey: string) => {
    if (!audioEnabled) return;
    setIsSpeaking(true);
    const script = AUDIO_SCRIPTS[stepKey]?.replace('{name}', userName) || '';
    await speakAndTrack(script);
    setIsSpeaking(false);
  }, [audioEnabled, userName]);

  useEffect(() => {
    playStepAudio(step);
    return () => stopCurrentAudio();
  }, [step, playStepAudio]);

  const toggleAudio = () => {
    if (audioEnabled) {
      stopCurrentAudio();
      setIsSpeaking(false);
    }
    setAudioEnabled(!audioEnabled);
  };

  const handleSkip = () => {
    stopCurrentAudio();
    localStorage.setItem(`tutorial_completed_${adminId}`, 'true');
    onClose();
  };

  const handleChooseService = (route: string) => {
    stopCurrentAudio();
    localStorage.setItem(`tutorial_completed_${adminId}`, 'true');
    navigate(route);
  };

  const goToStep = (newStep: Step) => {
    stopCurrentAudio();
    setStep(newStep);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
        {/* Audio toggle & close */}
        <div className="absolute -top-2 -right-2 z-10 flex gap-1.5">
          <button
            onClick={toggleAudio}
            className="bg-card border border-border rounded-full p-1.5 hover:bg-muted transition-colors shadow-lg"
            title={audioEnabled ? 'Desativar áudio' : 'Ativar áudio'}
          >
            {audioEnabled ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={handleSkip}
            className="bg-card border border-border rounded-full p-1.5 hover:bg-muted transition-colors shadow-lg"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden">
          {/* Header gradient */}
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center relative">
                {step === 'welcome' && <PartyPopper className="h-6 w-6 text-primary" />}
                {step === 'sections' && <Sparkles className="h-6 w-6 text-primary" />}
                {step === 'choose' && <Rocket className="h-6 w-6 text-primary" />}
                {isSpeaking && (
                  <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
              </div>
              <div>
                {step === 'welcome' && (
                  <>
                    <h2 className="text-xl font-bold text-foreground">Bem-vindo, {userName}! 🎉</h2>
                    <p className="text-sm text-muted-foreground">Vamos te mostrar como usar a base</p>
                  </>
                )}
                {step === 'sections' && (
                  <>
                    <h2 className="text-xl font-bold text-foreground">Conheça o painel</h2>
                    <p className="text-sm text-muted-foreground">Essas são as seções disponíveis</p>
                  </>
                )}
                {step === 'choose' && (
                  <>
                    <h2 className="text-xl font-bold text-foreground">Demonstração guiada</h2>
                    <p className="text-sm text-muted-foreground">Escolha um módulo para aprender</p>
                  </>
                )}
              </div>
            </div>

            {/* Audio indicator bar */}
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
                    <div>
                      <p className="font-medium text-sm text-foreground">Conheça o painel</p>
                      <p className="text-xs text-muted-foreground">Vamos apresentar cada seção do sistema</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-foreground">Preenchimento guiado com áudio</p>
                      <p className="text-xs text-muted-foreground">Cada campo será explicado por voz em tempo real</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-foreground">Regras importantes</p>
                      <p className="text-xs text-muted-foreground">Validade da CNH, categorias e dicas do DETRAN</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={handleSkip} className="flex-1">Pular tutorial</Button>
                  <Button onClick={() => goToStep('sections')} className="flex-1 gap-2">
                    Começar <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'sections' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {PANEL_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    return (
                      <div key={section.name} className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-card">
                        <div className={`h-8 w-8 rounded-lg ${section.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-4 w-4 ${section.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-foreground">{section.name}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">{section.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={handleSkip} className="flex-1">Pular</Button>
                  <Button onClick={() => goToStep('choose')} className="flex-1 gap-2">
                    Ver demonstração <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'choose' && (
              <div className="space-y-3">
                {DEMO_SERVICES.map((svc) => {
                  const Icon = svc.icon;
                  return (
                    <button
                      key={svc.id}
                      onClick={() => handleChooseService(svc.route)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                    >
                      <div className={`h-10 w-10 rounded-lg ${svc.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-5 w-5 ${svc.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{svc.name}</p>
                        <p className="text-xs text-muted-foreground">{svc.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  );
                })}
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => goToStep('sections')} className="gap-1">
                    <ChevronLeft className="h-4 w-4" /> Voltar
                  </Button>
                  <Button variant="ghost" onClick={handleSkip} className="flex-1 text-muted-foreground">
                    Pular tutorial
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
