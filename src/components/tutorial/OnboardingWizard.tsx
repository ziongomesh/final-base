import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText, Sparkles, ArrowRight, X, PartyPopper, Rocket,
  Home, History, CreditCard, Wrench, Download, FolderOpen,
  Volume2, VolumeX, ChevronRight
} from 'lucide-react';
import { speakAndTrack, stopCurrentAudio } from '@/lib/tts-service';

interface OnboardingWizardProps {
  userName: string;
  adminId: number;
  onClose: () => void;
}

const STEPS = [
  {
    id: 'welcome',
    icon: PartyPopper,
    title: (name: string) => `Olá, ${name}!`,
    subtitle: 'Vou te apresentar como a base funciona',
    audio: (name: string) =>
      `Olá ${name}! Seja muito bem-vindo à base. Eu sou seu assistente e vou te guiar passo a passo. Fique tranquilo, vou explicar tudo com calma. Vamos começar?`,
  },
  {
    id: 'inicio',
    icon: Home,
    title: () => 'Página Inicial',
    subtitle: 'Seu painel principal',
    audio: () =>
      `Esta é a sua página inicial. Aqui você vê seus créditos disponíveis, suas estatísticas de uso e os últimos documentos criados. É o ponto de partida sempre que acessar a base.`,
    highlight: 'Início',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    description: 'Veja créditos, estatísticas e documentos recentes.',
  },
  {
    id: 'servicos',
    icon: FolderOpen,
    title: () => 'Serviços',
    subtitle: 'Onde você cria os documentos',
    audio: () =>
      `Na aba Serviços é onde a mágica acontece. Aqui você encontra todos os módulos disponíveis: CNH Digital, RG, CRLV, Carteira de Estudante, Arrais Náutica e mais. Cada módulo tem um formulário que você preenche e gera o documento na hora.`,
    highlight: 'Serviços',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    description: 'CNH, RG, CRLV, Estudante e mais módulos.',
  },
  {
    id: 'historico',
    icon: History,
    title: () => 'Histórico',
    subtitle: 'Tudo que você já fez',
    audio: () =>
      `O Histórico guarda todos os documentos que você já criou. Você pode consultar, baixar novamente ou visualizar qualquer documento a qualquer momento.`,
    highlight: 'Histórico',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    description: 'Consulte e baixe documentos criados anteriormente.',
  },
  {
    id: 'recarregar',
    icon: CreditCard,
    title: () => 'Recarregar',
    subtitle: 'Compre créditos',
    audio: () =>
      `Na aba Recarregar você compra créditos para criar novos documentos. Cada documento custa uma quantidade de créditos. Quando acabar, é só recarregar aqui.`,
    highlight: 'Recarregar',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    description: 'Adquira créditos para gerar documentos.',
  },
  {
    id: 'ferramentas',
    icon: Wrench,
    title: () => 'Ferramentas',
    subtitle: 'Utilitários extras',
    audio: () =>
      `As Ferramentas são utilitários extras como gerador de assinatura digital, removedor de fundo de imagem e conversor de imagens. São muito úteis no dia a dia.`,
    highlight: 'Ferramentas',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    description: 'Assinatura, remoção de fundo e conversores.',
  },
  {
    id: 'downloads',
    icon: Download,
    title: () => 'Downloads',
    subtitle: 'Aplicativos necessários',
    audio: () =>
      `Na aba Downloads você encontra os aplicativos necessários para usar os documentos criados, tanto para Android quanto para iPhone.`,
    highlight: 'Downloads',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    description: 'Baixe apps para Android e iPhone.',
  },
  {
    id: 'demo',
    icon: Rocket,
    title: () => 'Pronto para criar!',
    subtitle: 'Vamos para a prática',
    audio: () =>
      `Agora que você conhece todas as seções, vou te levar para o módulo da CNH Digital. Lá vou te mostrar como preencher cada campo na prática, explicando tudo em tempo real. Clique em Iniciar demonstração para começar.`,
  },
];

export default function OnboardingWizard({ userName, adminId, onClose }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [waitingAudio, setWaitingAudio] = useState(false);
  const stepRef = useRef(currentStep);

  useEffect(() => { stepRef.current = currentStep; }, [currentStep]);

  const playAudio = useCallback(async (text: string) => {
    if (!audioEnabled) return;
    setIsSpeaking(true);
    setWaitingAudio(true);
    await speakAndTrack(text, 'k3f7zOv6LF88v78QHCNh');
    setIsSpeaking(false);
    setWaitingAudio(false);
  }, [audioEnabled]);

  // Play audio for current step
  useEffect(() => {
    const step = STEPS[currentStep];
    if (step) {
      const text = step.audio(userName);
      playAudio(text);
    }
    return () => stopCurrentAudio();
  }, [currentStep, playAudio, userName]);

  const toggleAudio = () => {
    if (audioEnabled) {
      stopCurrentAudio();
      setIsSpeaking(false);
      setWaitingAudio(false);
    }
    setAudioEnabled(!audioEnabled);
  };

  const handleSkip = async () => {
    stopCurrentAudio();
    try { await api.admins.completeTutorial(adminId); } catch {}
    onClose();
  };

  const handleNext = () => {
    stopCurrentAudio();
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleStartDemo = async () => {
    stopCurrentAudio();
    try { await api.admins.completeTutorial(adminId); } catch {}
    navigate('/servicos/cnh-digital?demo=true');
  };

  const step = STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === STEPS.length - 1;
  const isSectionStep = currentStep >= 1 && currentStep <= 6;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        {/* Controls */}
        <div className="absolute -top-2 -right-2 z-10 flex gap-1.5">
          <button
            onClick={toggleAudio}
            className="bg-card border border-border rounded-full p-1.5 hover:bg-muted transition-colors shadow-lg"
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
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Header */}
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center relative ${isSectionStep ? (step as any).bg || 'bg-primary/20' : 'bg-primary/20'}`}>
                <Icon className={`h-6 w-6 ${isSectionStep ? (step as any).color || 'text-primary' : 'text-primary'}`} />
                {isSpeaking && (
                  <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{step.title(userName)}</h2>
                <p className="text-sm text-muted-foreground">{step.subtitle}</p>
              </div>
            </div>

            {/* Speaking indicator */}
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
            {/* Section description for middle steps */}
            {isSectionStep && (step as any).description && (
              <div className="mb-4 p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-foreground/80">{(step as any).description}</p>
              </div>
            )}

            {/* Welcome step extra info */}
            {currentStep === 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Vou te apresentar cada seção do painel e depois te levar para criar um documento na prática com áudio explicativo.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Duração: ~3 minutos • Você pode pular a qualquer momento
                </p>
              </div>
            )}

            {/* Demo step */}
            {isLastStep && (
              <div className="mb-4 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-foreground">CNH Digital</p>
                    <p className="text-xs text-muted-foreground">Vou preencher cada campo com você e explicar tudo</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step counter */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground">
                Passo {currentStep + 1} de {STEPS.length}
              </span>
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i <= currentStep ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground text-xs">
                Pular
              </Button>
              <div className="flex-1" />
              {isLastStep ? (
                <Button onClick={handleStartDemo} className="gap-2">
                  Iniciar demonstração <Rocket className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleNext} className="gap-2">
                  Próximo <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
