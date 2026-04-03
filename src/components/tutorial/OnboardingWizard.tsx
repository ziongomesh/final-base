import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText, IdCard, Anchor, GraduationCap, Sparkles, ArrowRight, X, PartyPopper, Rocket, CheckCircle,
  Home, History, CreditCard, Wrench, Download, FolderOpen, ChevronLeft
} from 'lucide-react';

interface OnboardingWizardProps {
  userName: string;
  adminId: number;
  onClose: () => void;
}

const PANEL_SECTIONS = [
  {
    icon: Home,
    name: 'Início',
    description: 'Visão geral do painel com seus créditos e informações',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: FolderOpen,
    name: 'Serviços',
    description: 'Crie documentos digitais como CNH, RG, CHA e mais',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: History,
    name: 'Histórico',
    description: 'Veja todos os documentos que você já criou',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: CreditCard,
    name: 'Recarregar',
    description: 'Compre créditos para criar novos documentos',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Wrench,
    name: 'Ferramentas',
    description: 'Gerador de assinatura, remoção de fundo e mais',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: Download,
    name: 'Downloads',
    description: 'Baixe aplicativos e recursos necessários',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
];

const DEMO_SERVICES = [
  {
    id: 'cnh',
    name: 'CNH Digital',
    description: 'Carteira Nacional de Habilitação 2026',
    icon: FileText,
    route: '/servicos/cnh-digital?demo=true',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    id: 'rg',
    name: 'RG Digital (CIN)',
    description: 'Carteira de Identidade Nacional',
    icon: IdCard,
    route: '/servicos/rg-digital?demo=true',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 'nautica',
    name: 'Arrais Náutica',
    description: 'Habilitação Náutica',
    icon: Anchor,
    route: '/servicos/cnh-nautica?demo=true',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    id: 'estudante',
    name: 'Carteira Estudante',
    description: 'Carteira ABAFE',
    icon: GraduationCap,
    route: '/servicos/carteira-estudante?demo=true',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
];

type Step = 'welcome' | 'sections' | 'choose';

export default function OnboardingWizard({ userName, adminId, onClose }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');

  const handleSkip = () => {
    localStorage.setItem(`tutorial_completed_${adminId}`, 'true');
    onClose();
  };

  const handleChooseService = (route: string) => {
    localStorage.setItem(`tutorial_completed_${adminId}`, 'true');
    navigate(route);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute -top-2 -right-2 z-10 bg-card border border-border rounded-full p-1.5 hover:bg-muted transition-colors shadow-lg"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden">
          {/* Header gradient */}
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-4">
            {step === 'welcome' && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <PartyPopper className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Bem-vindo, {userName}! 🎉</h2>
                  <p className="text-sm text-muted-foreground">Vamos te mostrar como usar a base</p>
                </div>
              </div>
            )}
            {step === 'sections' && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Conheça o painel</h2>
                  <p className="text-sm text-muted-foreground">Essas são as seções disponíveis para você</p>
                </div>
              </div>
            )}
            {step === 'choose' && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">O que deseja aprender?</h2>
                  <p className="text-sm text-muted-foreground">Veja uma demonstração de preenchimento</p>
                </div>
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
                      <p className="text-xs text-muted-foreground">Vamos apresentar cada seção do sistema e suas funcionalidades</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-foreground">Preenchimento guiado</p>
                      <p className="text-xs text-muted-foreground">Vamos preencher um documento de exemplo automaticamente para você</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-foreground">Foto e assinatura de exemplo</p>
                      <p className="text-xs text-muted-foreground">Usaremos uma foto e assinatura padrão que podem ser reutilizadas</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={handleSkip} className="flex-1">
                    Pular tutorial
                  </Button>
                  <Button onClick={() => setStep('sections')} className="flex-1 gap-2">
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
                      <div
                        key={section.name}
                        className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-card"
                      >
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
                  <Button variant="ghost" onClick={handleSkip} className="flex-1">
                    Pular
                  </Button>
                  <Button onClick={() => setStep('choose')} className="flex-1 gap-2">
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
                  <Button variant="ghost" onClick={() => setStep('sections')} className="gap-1">
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
