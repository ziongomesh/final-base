import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight, X, PartyPopper, Rocket, CheckCircle, ChevronLeft,
  Users, CreditCard, TrendingUp, Send, UserPlus, Eye, DollarSign, ShieldCheck
} from 'lucide-react';

interface MasterOnboardingWizardProps {
  userName: string;
  adminId: number;
  onClose: () => void;
}

type Step = 'welcome' | 'whatIsMaster' | 'howItWorks' | 'tips';

export default function MasterOnboardingWizard({ userName, adminId, onClose }: MasterOnboardingWizardProps) {
  const [step, setStep] = useState<Step>('welcome');

  const handleSkip = () => {
    localStorage.setItem(`master_tutorial_completed_${adminId}`, 'true');
    onClose();
  };

  const handleFinish = () => {
    localStorage.setItem(`master_tutorial_completed_${adminId}`, 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={handleSkip}
          className="absolute -top-2 -right-2 z-10 bg-card border border-border rounded-full p-1.5 hover:bg-muted transition-colors shadow-lg"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-4">
            {step === 'welcome' && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <PartyPopper className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Bem-vindo, Master {userName}! 🎉</h2>
                  <p className="text-sm text-muted-foreground">Vamos te mostrar como ser um Master</p>
                </div>
              </div>
            )}
            {step === 'whatIsMaster' && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">O que é ser Master?</h2>
                  <p className="text-sm text-muted-foreground">Entenda seu papel no sistema</p>
                </div>
              </div>
            )}
            {step === 'howItWorks' && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Como funciona?</h2>
                  <p className="text-sm text-muted-foreground">O fluxo do seu negócio</p>
                </div>
              </div>
            )}
            {step === 'tips' && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Dicas para começar</h2>
                  <p className="text-sm text-muted-foreground">Maximize seus resultados</p>
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
                      <p className="font-medium text-sm text-foreground">Você é um Master</p>
                      <p className="text-xs text-muted-foreground">Isso significa que você gerencia revendedores e lucra com cada crédito vendido</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-foreground">Seus módulos de usuário</p>
                      <p className="text-xs text-muted-foreground">Você tem acesso a todos os serviços: CNH, RG, CRLV, Arrais e Carteira Estudante</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-foreground">Gestão completa</p>
                      <p className="text-xs text-muted-foreground">Crie revendedores, transfira créditos e acompanhe tudo pelo painel</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={handleSkip} className="flex-1">Pular tutorial</Button>
                  <Button onClick={() => setStep('whatIsMaster')} className="flex-1 gap-2">
                    Continuar <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'whatIsMaster' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Como <span className="font-bold text-foreground">Master</span>, você é o intermediário entre o sistema e seus revendedores. Seu modelo de negócio é simples:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-500 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Compra créditos por valor X</p>
                      <p className="text-xs text-muted-foreground">Recarregue créditos pelo sistema de pagamento PIX</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-500/30 bg-blue-500/10">
                    <Send className="h-5 w-5 text-blue-500 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Vende por valor Y ao público</p>
                      <p className="text-xs text-muted-foreground">Defina seu próprio preço e margem de lucro</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
                    <TrendingUp className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Lucro = Y - X</p>
                      <p className="text-xs text-muted-foreground">Quanto mais revendedores, maior seu faturamento</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setStep('welcome')} className="gap-1">
                    <ChevronLeft className="h-4 w-4" /> Voltar
                  </Button>
                  <Button onClick={() => setStep('howItWorks')} className="flex-1 gap-2">
                    Continuar <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'howItWorks' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-sm"><span className="font-medium">Recarregue</span> seus créditos via PIX</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-sm"><span className="font-medium">Crie revendedores</span> e dê acesso ao sistema</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-sm"><span className="font-medium">Transfira créditos</span> para seus revendedores</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">4</span>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-sm"><span className="font-medium">Acompanhe</span> o desempenho da sua equipe</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">5</span>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-sm"><span className="font-medium">Monitore</span> a atividade e mantenha todos engajados</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setStep('whatIsMaster')} className="gap-1">
                    <ChevronLeft className="h-4 w-4" /> Voltar
                  </Button>
                  <Button onClick={() => setStep('tips')} className="flex-1 gap-2">
                    Continuar <ArrowRight className="h-4 w-4" />
                  </Button>
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
                <Button onClick={handleFinish} className="w-full gap-2">
                  <Rocket className="h-4 w-4" /> Começar a usar!
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
