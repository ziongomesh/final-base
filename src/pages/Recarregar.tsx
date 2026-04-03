import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isUsingMySQL } from '@/lib/db-config';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import { Navigate } from 'react-router-dom';
import api from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, Tag, QrCode, Loader2, Clock, CheckCircle, XCircle, History, RefreshCw, TrendingDown, Bitcoin, Star, Crown, Gem, Info, MessageCircle, User, Smartphone, ChevronRight, Zap } from 'lucide-react';
import ReactCanvasConfetti from 'react-canvas-confetti';
import RechargeWeeklyGoal from '@/components/recharge/RechargeWeeklyGoal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Default packages (fallback)
const DEFAULT_POPULAR = [
  { credits: 5, unitPrice: 14.00, total: 70 },
  { credits: 10, unitPrice: 14.00, total: 140 },
  { credits: 25, unitPrice: 13.50, total: 337.50 },
  { credits: 50, unitPrice: 13.00, total: 650 },
];
const DEFAULT_INTERMEDIATE = [
  { credits: 75, unitPrice: 12.50, total: 937.50 },
  { credits: 100, unitPrice: 12.00, total: 1200 },
  { credits: 150, unitPrice: 11.50, total: 1725 },
  { credits: 200, unitPrice: 10.00, total: 2000 },
];
const DEFAULT_LARGE = [
  { credits: 250, unitPrice: 9.50, total: 2375 },
  { credits: 300, unitPrice: 9.00, total: 2700 },
  { credits: 400, unitPrice: 8.50, total: 3400 },
  { credits: 500, unitPrice: 8.00, total: 4000 },
  { credits: 1000, unitPrice: 7.00, total: 7000 },
];

const DEFAULT_ALL = [...DEFAULT_POPULAR, ...DEFAULT_INTERMEDIATE, ...DEFAULT_LARGE].map(pkg => ({
  ...pkg,
  popular: [50, 100, 200].includes(pkg.credits),
}));

type CreditPackage = { credits: number; unitPrice: number; total: number; popular?: boolean };

function splitPackages(all: CreditPackage[]) {
  if (all.length <= 4) return { popular: all, intermediate: [], large: [] };
  if (all.length <= 8) return { popular: all.slice(0, 4), intermediate: all.slice(4), large: [] };
  return { popular: all.slice(0, 4), intermediate: all.slice(4, 8), large: all.slice(8) };
}

function calculateSavings(pkg: CreditPackage, basePrice: number) {
  const fullPrice = pkg.credits * basePrice;
  const savings = fullPrice - pkg.total;
  const percentOff = fullPrice > 0 ? ((savings / fullPrice) * 100).toFixed(0) : '0';
  return { savings, percentOff };
}

function getPackageFromSlider(value: number, packages: CreditPackage[]): CreditPackage {
  return packages[Math.min(value, packages.length - 1)] || packages[0];
}

interface PixPayment {
  transactionId: string;
  qrCode: string;
  qrCodeBase64: string;
}

interface PaymentHistory {
  id: number;
  amount: number;
  credits: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export default function Recarregar() {
  const { admin, role, credits, loading, updateAdmin } = useAuth();
  const [allPackages, setAllPackages] = useState<CreditPackage[]>(DEFAULT_ALL);
  const [basePrice, setBasePrice] = useState(14);
  const [sliderValue, setSliderValue] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(DEFAULT_ALL[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<PixPayment | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const { popular: POPULAR_PACKAGES, intermediate: INTERMEDIATE_PACKAGES, large: LARGE_PACKAGES } = splitPackages(allPackages);
  const CREDIT_PACKAGES = allPackages;
  const BASE_PRICE = basePrice;

  const hasPlayedSound = useRef(false);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refAnimationInstance = useRef<any>(null);

  const handleInit = useCallback(({ confetti }: { confetti: any }) => {
    refAnimationInstance.current = confetti;
  }, []);

  const fire = useCallback(() => {
    if (!refAnimationInstance.current) return;
    
    const makeShot = (particleRatio: number, opts: any) => {
      refAnimationInstance.current({
        ...opts,
        origin: { y: 0.7 },
        particleCount: Math.floor(200 * particleRatio),
      });
    };

    makeShot(0.25, { spread: 26, startVelocity: 55 });
    makeShot(0.2, { spread: 60 });
    makeShot(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    makeShot(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    makeShot(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  const playNotificationSound = useCallback(() => {
    if (hasPlayedSound.current) return;
    hasPlayedSound.current = true;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Erro ao tocar som:', error);
    }
  }, []);

  const fetchPaymentHistory = useCallback(async () => {
    if (!admin) return;
    
    try {
      const data = await api.payments.getHistory(admin.id);
      setPaymentHistory(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [admin]);

  // Load packages from API
  useEffect(() => {
    if (admin) {
      fetchPaymentHistory();
      // Load dynamic pricing
      (api as any).settings?.get?.().then((settings: any) => {
        if (settings?.credit_packages?.length > 0) {
          const pkgs = settings.credit_packages.map((p: any) => ({
            credits: p.credits,
            unitPrice: p.unitPrice,
            total: p.total,
            popular: [50, 100, 200].includes(p.credits),
          }));
          setAllPackages(pkgs);
          setSelectedPackage(pkgs[0]);
          setSliderValue(0);
          // Base price = highest unitPrice
          const maxPrice = Math.max(...pkgs.map((p: any) => p.unitPrice));
          setBasePrice(maxPrice);
        }
      }).catch(() => { /* use defaults */ });
    }
  }, [admin, fetchPaymentHistory]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    
    if (showPixModal && !paymentConfirmed && !paymentExpired && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setPaymentExpired(true);
            setCheckingPayment(false);
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showPixModal, paymentConfirmed, paymentExpired, timeRemaining]);

  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  // Revendedor: mostrar tela de contato com master
  if (role === 'revendedor') {
    return <ResellerRechargeView adminId={admin.id} sessionToken={admin.session_token} credits={credits} />;
  }

  if (role !== 'master' && role !== 'dono' && role !== 'sub') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSliderChange = (value: number[]) => {
    const newValue = value[0];
    setSliderValue(newValue);
    setSelectedPackage(getPackageFromSlider(newValue, CREDIT_PACKAGES));
  };

  const handleSelectPackage = (pkg: typeof CREDIT_PACKAGES[0], index: number) => {
    setSliderValue(index);
    setSelectedPackage(pkg);
  };

  const handleRecharge = async () => {
    if (!selectedPackage || !admin?.session_token) {
      toast.error('Selecione um pacote de créditos');
      return;
    }

    setIsProcessing(true);
    hasPlayedSound.current = false;
    
    try {
      const pixPayment = await api.payments.createPix(
        selectedPackage.credits,
        admin.id,
        admin.nome,
        admin.session_token
      );

      if (pixPayment.error) throw new Error(pixPayment.details || pixPayment.error);

      setPixData(pixPayment);
      setShowPixModal(true);
      setPaymentConfirmed(false);
      setPaymentExpired(false);
      setTimeRemaining(600);
      setCheckingPayment(true);

      startPaymentVerification(pixPayment.transactionId);

      toast.success('PIX Gerado!', {
        description: `PIX de R$ ${selectedPackage.total.toFixed(2)} criado com sucesso`
      });
    } catch (error: any) {
      toast.error('Erro ao gerar PIX', {
        description: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startPaymentVerification = (transactionId: string) => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    const checkPayment = async () => {
      try {
        const payment = await api.payments.checkStatus(transactionId);

        // Confirmação: aceita PAID/COMPLETED (VizzionPay pode usar COMPLETED)
        if (payment?.status === 'PAID' || payment?.status === 'COMPLETED') {
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }

          setPaymentConfirmed(true);
          setCheckingPayment(false);

          playNotificationSound();
          fire();

          // Atualizar créditos do admin
          const balanceData = await api.credits.getBalance(admin.id);
          if (balanceData) {
            updateAdmin({ ...admin, creditos: balanceData.credits });
          }

          fetchPaymentHistory();

          toast.success('Pagamento confirmado!', {
            description: `${payment.credits} créditos adicionados à sua conta`,
          });

          setTimeout(() => {
            setShowPixModal(false);
            setPixData(null);
            setSelectedPackage(CREDIT_PACKAGES[0]);
          }, 3000);
          return;
        }
      } catch (error) {
        console.log('Erro ao verificar pagamento:', error);
      }
    };

    checkPayment();
    checkIntervalRef.current = setInterval(checkPayment, 3000);
  };

  const copyPixCode = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      toast.success('Código copiado!');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'PENDING':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
        <div className="space-y-3 animate-fade-in max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-extrabold text-foreground tracking-tight">Recarregar Créditos</h1>
              <p className="text-[10px] text-muted-foreground">Escolha um pacote via PIX</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Saldo</p>
              <p className="text-sm font-bold text-primary">{credits} créditos</p>
            </div>
          </div>

        {/* Credit Packages */}
        <Card>
          <CardHeader className="p-2.5 sm:p-3">
            <CardTitle className="flex items-center gap-2 text-xs">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Pacotes de Créditos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2.5 sm:p-3 pt-0 sm:pt-0 space-y-3">
            {/* Package Cards Grid */}
            {/* Section 1: Pacotes Populares */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Star className="h-3 w-3 text-primary fill-primary" />
                <h3 className="font-semibold text-xs text-foreground">Populares</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <TooltipProvider>
                  {POPULAR_PACKAGES.map((pkg) => {
                    const { savings, percentOff } = calculateSavings(pkg, BASE_PRICE);
                    const index = CREDIT_PACKAGES.findIndex(p => p.credits === pkg.credits);
                    return (
                      <Tooltip key={pkg.credits}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSelectPackage({ ...pkg, popular: false }, index)}
                            className={`p-2 rounded-lg border-2 transition-all text-left relative ${
                              selectedPackage.credits === pkg.credits
                                ? 'border-primary bg-primary/10'
                                : 'border-primary/30 bg-primary/5 hover:border-primary'
                            }`}
                          >
                            {savings > 0 && (
                              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                -{percentOff}%
                              </div>
                            )}
                            <div className="text-base font-bold text-foreground">{pkg.credits}</div>
                            <div className="text-[10px] text-muted-foreground">créditos</div>
                            <div className="mt-0.5">
                              <Badge variant="secondary" className="text-[10px]">
                                R$ {pkg.unitPrice.toFixed(2)}/un
                              </Badge>
                            </div>
                            <div className="mt-0.5 text-xs font-semibold text-primary">
                              R$ {pkg.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="text-sm space-y-1">
                            <p className="font-semibold">{pkg.credits} créditos</p>
                            <p className="text-muted-foreground">Preço por unidade: R$ {pkg.unitPrice.toFixed(2)}</p>
                            {savings > 0 && (
                              <>
                                <p className="text-green-500">Economia: R$ {savings.toFixed(2)}</p>
                                <p className="text-green-500 font-medium">{percentOff}% de desconto!</p>
                              </>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
            </div>

            {/* Section 2: Pacotes Intermediários */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingDown className="h-3 w-3 text-green-500" />
                <h3 className="font-semibold text-xs text-foreground">Intermediários</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <TooltipProvider>
                  {INTERMEDIATE_PACKAGES.map((pkg) => {
                    const { savings, percentOff } = calculateSavings(pkg, BASE_PRICE);
                    const index = CREDIT_PACKAGES.findIndex(p => p.credits === pkg.credits);
                    return (
                      <Tooltip key={pkg.credits}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSelectPackage({ ...pkg, popular: false }, index)}
                            className={`p-2 rounded-lg border-2 transition-all text-left relative ${
                              selectedPackage.credits === pkg.credits
                                ? 'border-primary bg-primary/10'
                                : 'border-muted hover:border-primary/50'
                            }`}
                          >
                            {savings > 0 && (
                              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                -{percentOff}%
                              </div>
                            )}
                            <div className="text-base font-bold text-foreground">{pkg.credits}</div>
                            <div className="text-[10px] text-muted-foreground">créditos</div>
                            <div className="mt-0.5">
                              <Badge variant="secondary" className="text-[10px]">
                                R$ {pkg.unitPrice.toFixed(2)}/un
                              </Badge>
                            </div>
                            <div className="mt-0.5 text-xs font-semibold text-primary">
                              R$ {pkg.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="text-sm space-y-1">
                            <p className="font-semibold">{pkg.credits} créditos</p>
                            <p className="text-muted-foreground">Preço por unidade: R$ {pkg.unitPrice.toFixed(2)}</p>
                            {savings > 0 && (
                              <>
                                <p className="text-green-500">Economia: R$ {savings.toFixed(2)}</p>
                                <p className="text-green-500 font-medium">{percentOff}% de desconto!</p>
                              </>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
            </div>

            {/* Section 3: Grandes Volumes */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <CreditCard className="h-3 w-3 text-amber-500" />
                <h3 className="font-semibold text-xs text-foreground">Grandes Volumes</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                <TooltipProvider>
                  {LARGE_PACKAGES.map((pkg) => {
                    const { savings, percentOff } = calculateSavings(pkg, BASE_PRICE);
                    const index = CREDIT_PACKAGES.findIndex(p => p.credits === pkg.credits);
                    const isPremium = pkg.credits === 1000;
                    
                    return (
                      <Tooltip key={pkg.credits}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSelectPackage({ ...pkg, popular: false }, index)}
                            className={`p-2 rounded-lg border-2 transition-all text-left relative ${
                              isPremium
                                ? selectedPackage.credits === pkg.credits
                                  ? 'border-amber-400 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20'
                                  : 'border-amber-400/50 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20'
                                : selectedPackage.credits === pkg.credits
                                  ? 'border-primary bg-primary/10'
                                  : 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500'
                            }`}
                          >
                            {isPremium && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                                <Crown className="h-3 w-3" />
                                PREMIUM
                              </div>
                            )}
                            {savings > 0 && !isPremium && (
                              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                -{percentOff}%
                              </div>
                            )}
                            {isPremium && (
                              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                -{percentOff}%
                              </div>
                            )}
                            <div className={`text-base font-bold ${isPremium ? 'text-amber-500' : 'text-foreground'}`}>
                              {isPremium && <Gem className="h-3 w-3 inline mr-0.5 text-amber-500" />}
                              {pkg.credits}
                            </div>
                            <div className="text-[10px] text-muted-foreground">créditos</div>
                            <div className="mt-0.5">
                              <Badge variant={isPremium ? "default" : "secondary"} className={`text-[9px] ${isPremium ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0' : ''}`}>
                                R$ {pkg.unitPrice.toFixed(2)}/un
                              </Badge>
                            </div>
                            <div className={`mt-0.5 text-xs font-semibold ${isPremium ? 'text-amber-500' : 'text-primary'}`}>
                              R$ {pkg.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="text-sm space-y-1">
                            <p className="font-semibold">{pkg.credits} créditos</p>
                            <p className="text-muted-foreground">Preço por unidade: R$ {pkg.unitPrice.toFixed(2)}</p>
                            {savings > 0 && (
                              <>
                                <p className="text-green-500">Economia: R$ {savings.toFixed(2)}</p>
                                <p className="text-green-500 font-medium">{percentOff}% de desconto!</p>
                              </>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
            </div>

            {/* Slider Section */}
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground mb-2">Ou arraste para selecionar:</p>
              <div className="px-2">
                <Slider
                  value={[sliderValue]}
                  onValueChange={handleSliderChange}
                  min={0}
                  max={CREDIT_PACKAGES.length - 1}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                {CREDIT_PACKAGES.map((pkg, index) => (
                  <button
                    key={pkg.credits}
                    onClick={() => handleSelectPackage(pkg, index)}
                    className={`min-w-[1.5rem] text-center hover:text-primary transition-colors ${
                      sliderValue === index ? 'text-primary font-bold' : ''
                    }`}
                  >
                    {pkg.credits}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="p-2.5 rounded-lg gradient-green text-success-foreground">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <p className="text-[10px] opacity-90">Selecionado</p>
                  <p className="text-sm font-bold">{selectedPackage.credits} créditos</p>
                  <p className="text-[10px] opacity-80">R$ {selectedPackage.unitPrice.toFixed(2)}/un</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] opacity-90">Total</p>
                  <p className="text-sm font-bold">
                    R$ {selectedPackage.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {calculateSavings(selectedPackage, BASE_PRICE).savings > 0 && (
                    <p className="text-[10px] font-medium flex items-center justify-end gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Economia: R$ {calculateSavings(selectedPackage, BASE_PRICE).savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
              <Button 
                className="w-full h-10 text-sm bg-white/20 hover:bg-white/30 text-white" 
                onClick={handleRecharge} 
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                {isProcessing ? 'Gerando PIX...' : 'Pagar com PIX'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Histórico de Recargas
              </div>
              <Button variant="ghost" size="sm" onClick={fetchPaymentHistory}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma recarga encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {payment.created_at ? new Date(payment.created_at).toLocaleString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">R$ {(Number(payment.amount) || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-medium">{payment.credits ?? 0}</TableCell>
                      <TableCell>{getStatusBadge(payment.status || 'PENDING')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPixModal} onOpenChange={(open) => {
        if (!open && checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        setCheckingPayment(false);
        setShowPixModal(open);
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pagamento PIX</DialogTitle>
          </DialogHeader>
          
          {!paymentConfirmed && !paymentExpired && (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${timeRemaining < 60 ? 'text-red-600' : 'text-orange-600'}`}>
                  <Clock className="inline-block mr-2 h-6 w-6" />
                  {formatTime(timeRemaining)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Tempo restante para pagamento</p>
              </div>

              {pixData?.qrCodeBase64 && (
                <div className="text-center">
                  <img 
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                    alt="QR Code PIX" 
                    className="mx-auto max-w-[200px] border rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Escaneie o QR Code com o app do seu banco
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Ou copie o código PIX:</p>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 text-xs bg-muted rounded break-all max-h-20 overflow-y-auto">
                    {pixData?.qrCode}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyPixCode}>
                    Copiar
                  </Button>
                </div>
              </div>

              {checkingPayment && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aguardando confirmação do pagamento...
                </div>
              )}
            </div>
          )}

          {paymentConfirmed && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-600">Pagamento Confirmado!</h3>
              <p className="text-muted-foreground mt-2">
                Seus créditos foram adicionados à sua conta
              </p>
            </div>
          )}

          {paymentExpired && (
            <div className="text-center py-8">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-600">Pagamento Expirado</h3>
              <p className="text-muted-foreground mt-2">
                O tempo para pagamento expirou. Gere um novo PIX.
              </p>
              <Button className="mt-4" onClick={() => {
                setShowPixModal(false);
                setPixData(null);
              }}>
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReactCanvasConfetti
        onInit={handleInit}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          zIndex: 9999
        }}
      />
    </DashboardLayout>
  );
}

// ======== Reseller Recharge View ========

const RESELLER_UNIT_PRICE = 20; // R$20 por crédito avulso

const RESELLER_PACKAGES = [
  { name: 'Plano Simples', credits: 3, baseCredits: 3, bonus: 0, total: 50, badge: 'INICIANTE', badgeColor: 'bg-orange-500' },
  { name: 'Pacote Básico', credits: 7, baseCredits: 6, bonus: 1, total: 100, badge: 'POPULAR', badgeColor: 'bg-purple-500' },
  { name: 'Pacote Premium', credits: 13, baseCredits: 10, bonus: 3, total: 200, badge: 'MELHOR CUSTO', badgeColor: 'bg-green-500' },
  { name: 'Pacote Mega', credits: 25, baseCredits: 20, bonus: 5, total: 320, badge: 'MAIS VANTAGEM', badgeColor: 'bg-emerald-500' },
];

const RESELLER_PROMO_PACKAGES = [
  { name: 'Super Combo', credits: 35, baseCredits: 28, bonus: 7, total: 420, badge: '🔥 SUPER PROMO', badgeColor: 'bg-gradient-to-r from-orange-500 to-red-500' },
  { name: 'Mega Pack', credits: 50, baseCredits: 38, bonus: 12, total: 550, badge: '⚡ EXCLUSIVO', badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-500' },
];

function ResellerRechargeView({ adminId, sessionToken, credits }: { adminId: number; sessionToken: string; credits: number }) {
  const { admin, updateAdmin } = useAuth();
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [creatorPhone, setCreatorPhone] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<number | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(true);

  // PIX states
  const [selectedPkg, setSelectedPkg] = useState<typeof RESELLER_PACKAGES[0] | null>(null);
  const [customCredits, setCustomCredits] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<PixPayment | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab] = useState<'packages' | 'unit'>('packages');
  const [showHistory, setShowHistory] = useState(false);
  const [recargaDobro, setRecargaDobro] = useState(false);

  const hasPlayedSound = useRef(false);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refAnimationInstance = useRef<any>(null);

  const handleInit = useCallback(({ confetti }: { confetti: any }) => {
    refAnimationInstance.current = confetti;
  }, []);

  const fire = useCallback(() => {
    if (!refAnimationInstance.current) return;
    const makeShot = (particleRatio: number, opts: any) => {
      refAnimationInstance.current({ ...opts, origin: { y: 0.7 }, particleCount: Math.floor(200 * particleRatio) });
    };
    makeShot(0.25, { spread: 26, startVelocity: 55 });
    makeShot(0.2, { spread: 60 });
    makeShot(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    makeShot(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    makeShot(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  const playNotificationSound = useCallback(() => {
    if (hasPlayedSound.current) return;
    hasPlayedSound.current = true;
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Erro ao tocar som:', error);
    }
  }, []);

  const fetchPaymentHistory = useCallback(async () => {
    try {
      const data = await api.payments.getHistory(adminId);
      setPaymentHistory(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [adminId]);

  useEffect(() => {
    const fetchCreator = async () => {
      try {
        // Sempre usar backend Node.js para buscar criador
        const stored = localStorage.getItem('admin');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            headers['X-Admin-Id'] = String(parsed.id);
            headers['X-Session-Token'] = parsed.session_token;
          } catch {}
        }
        
        const envUrl = import.meta.env.VITE_API_URL as string | undefined;
        let apiBase = envUrl ? envUrl.replace(/\/+$/, '') : (window.location.origin + '/api');
        if (!apiBase.endsWith('/api')) apiBase += '/api';
        
        const resp = await fetch(`${apiBase}/admins/creator/${adminId}`, { headers });
        if (resp.ok) {
          const data = await resp.json();
          console.log('[Recarregar] Creator data:', data);
          if (data?.creator_name) {
            setCreatorName(data.creator_name);
            setCreatorPhone(data.creator_telefone || null);
            setCreatorId(data.creator_id || null);
          }
        } else {
          console.error('[Recarregar] Erro ao buscar criador, status:', resp.status);
        }
      } catch (err) {
        console.error('Erro ao buscar criador:', err);
      } finally {
        setLoadingCreator(false);
      }
    };
    fetchCreator();
    fetchPaymentHistory();
    // Load recarga em dobro setting
    (api as any).settings?.get?.().then((s: any) => {
      if (s?.recarga_em_dobro) setRecargaDobro(true);
    }).catch(() => {});
  }, [adminId, sessionToken, fetchPaymentHistory]);

  // Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (showPixModal && !paymentConfirmed && !paymentExpired && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setPaymentExpired(true);
            setCheckingPayment(false);
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [showPixModal, paymentConfirmed, paymentExpired, timeRemaining]);

  useEffect(() => {
    return () => { if (checkIntervalRef.current) clearInterval(checkIntervalRef.current); };
  }, []);

  const canRechargeDirectly = creatorId === 3;

  const startPaymentVerification = (transactionId: string) => {
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);

    const checkPayment = async () => {
      try {
        const payment = await api.payments.checkStatus(transactionId);
        if (payment?.status === 'PAID' || payment?.status === 'COMPLETED') {
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
          setPaymentConfirmed(true);
          setCheckingPayment(false);
          playNotificationSound();
          fire();
          const balanceData = await api.credits.getBalance(adminId);
          if (balanceData && admin) {
            updateAdmin({ ...admin, creditos: balanceData.credits });
          }
          fetchPaymentHistory();
          toast.success('Pagamento confirmado!', { description: 'Créditos adicionados à sua conta' });
          setTimeout(() => {
            setShowPixModal(false);
            setPixData(null);
          }, 3000);
        }
      } catch (error) {
        console.log('Erro ao verificar pagamento:', error);
      }
    };
    checkPayment();
    checkIntervalRef.current = setInterval(checkPayment, 3000);
  };

  const handleRechargePackage = async (pkg: typeof RESELLER_PACKAGES[0]) => {
    if (!admin?.session_token) return;
    setSelectedPkg(pkg);
    setIsProcessing(true);
    hasPlayedSound.current = false;
    try {
      const pixPayment = await api.payments.createPix(pkg.credits, adminId, admin.nome, admin.session_token);
      if (pixPayment.error) throw new Error(pixPayment.details || pixPayment.error);
      setPixData(pixPayment);
      setShowPixModal(true);
      setPaymentConfirmed(false);
      setPaymentExpired(false);
      setTimeRemaining(600);
      setCheckingPayment(true);
      startPaymentVerification(pixPayment.transactionId);
      toast.success('PIX Gerado!', { description: `PIX de R$ ${pkg.total.toFixed(2)} criado` });
    } catch (error: any) {
      toast.error('Erro ao gerar PIX', { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRechargeUnit = async () => {
    if (!admin?.session_token || customCredits < 1) return;
    setIsProcessing(true);
    hasPlayedSound.current = false;
    const total = customCredits * RESELLER_UNIT_PRICE;
    try {
      const pixPayment = await api.payments.createPix(customCredits, adminId, admin.nome, admin.session_token);
      if (pixPayment.error) throw new Error(pixPayment.details || pixPayment.error);
      setPixData(pixPayment);
      setShowPixModal(true);
      setPaymentConfirmed(false);
      setPaymentExpired(false);
      setTimeRemaining(600);
      setCheckingPayment(true);
      startPaymentVerification(pixPayment.transactionId);
      toast.success('PIX Gerado!', { description: `PIX de R$ ${total.toFixed(2)} criado` });
    } catch (error: any) {
      toast.error('Erro ao gerar PIX', { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      toast.success('Código copiado!');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'PENDING': return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'EXPIRED': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Se não é do admin 3, mostrar view padrão de contato com master
  if (loadingCreator) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!canRechargeDirectly) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Recarregar Créditos</h1>
            <p className="text-sm text-muted-foreground mt-1">Solicite créditos ao seu master</p>
          </div>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Seu saldo atual</p>
                <p className="text-3xl font-bold text-primary">{credits}</p>
                <p className="text-xs text-muted-foreground">créditos disponíveis</p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-7 w-7 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-5 w-5 text-primary" />
                Como recarregar?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-5 space-y-3">
                <p className="text-sm text-foreground leading-relaxed">
                  Para recarregar seus créditos, entre em contato com o <strong>master</strong> que criou o seu acesso e solicite a recarga.
                </p>
                {creatorName ? (
                  <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Seu Master</p>
                        <p className="font-semibold text-foreground">{creatorName}</p>
                      </div>
                    </div>
                    {creatorPhone && (
                      <div className="flex items-center gap-2 pl-13 text-sm">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <a href={`https://wa.me/55${creatorPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                          {(() => {
                            const digits = creatorPhone.replace(/\D/g, '');
                            if (digits.length === 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
                            if (digits.length === 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
                            return creatorPhone;
                          })()}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Não foi possível identificar o master responsável.</p>
                )}
                <div className="border-t border-border pt-3 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Passos para recarregar:</p>
                  <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                    <li>Entre em contato com seu master</li>
                    <li>Informe a quantidade de créditos desejada</li>
                    <li>Realize o pagamento conforme combinado</li>
                    <li>Aguarde a transferência dos créditos</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ===== REVENDEDOR DO ADMIN 3: RECARGA VIA PIX =====
  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-foreground tracking-tight">Recarregar Créditos</h1>
            <p className="text-xs text-muted-foreground">Escolha um pacote ou compre créditos avulsos via PIX</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Saldo atual</p>
            <p className="text-lg font-bold text-primary">{credits} créditos</p>
          </div>
        </div>

        {/* Recarga em Dobro Banner */}
        {recargaDobro && (
          <div className="relative overflow-hidden rounded-xl border-2 border-green-500/50 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20 animate-pulse">
                <Zap className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                  🔥 RECARGA EM DOBRO ATIVA!
                </p>
                <p className="text-xs text-muted-foreground">
                  Todos os créditos recarregados serão <strong className="text-green-500">dobrados</strong> automaticamente!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Goal */}
        <RechargeWeeklyGoal adminId={adminId} />

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'packages' ? 'default' : 'outline'}
            onClick={() => setActiveTab('packages')}
            className="flex-1 text-xs sm:text-sm"
          >
            <Tag className="mr-1.5 h-4 w-4" />
            Pacotes
          </Button>
          <Button
            variant={activeTab === 'unit' ? 'default' : 'outline'}
            onClick={() => setActiveTab('unit')}
            className="flex-1 text-xs sm:text-sm"
          >
            <CreditCard className="mr-1.5 h-4 w-4" />
            Avulso
          </Button>
        </div>

        {activeTab === 'packages' && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Tag className="h-5 w-5 text-primary" />
                🎁 Pacotes Promocionais
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Compre pacotes com bônus e economize
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              {RESELLER_PACKAGES.map((pkg) => {
                const bonusValue = pkg.bonus * RESELLER_UNIT_PRICE;
                const isSelected = selectedPkg?.name === pkg.name;
                return (
                  <button
                    key={pkg.name}
                    onClick={() => setSelectedPkg(pkg)}
                    disabled={isProcessing}
                    className={`w-full py-3 px-4 rounded-lg border-2 transition-all text-center relative bg-card hover:bg-muted/30 group ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60'
                    }`}
                  >
                    <Badge className={`${pkg.badgeColor} text-white text-[10px] absolute -top-2.5 left-1/2 -translate-x-1/2`}>
                      {pkg.badge}
                    </Badge>
                    <p className="text-lg font-bold text-primary">{pkg.credits} créditos</p>
                    <p className="text-sm text-foreground font-medium">
                      por R$ {pkg.total.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      R$ {(pkg.total / pkg.credits).toFixed(2).replace('.', ',')} / crédito
                    </p>
                    {bonusValue > 0 && (
                      <p className="text-xs text-green-500 font-medium mt-0.5">
                        +{pkg.bonus} bônus (R$ {bonusValue.toFixed(2).replace('.', ',')} grátis!)
                      </p>
                    )}
                  </button>
                );
              })}

              {/* Pacotes Super Promoções */}
              <div className="pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-foreground">Super Promoções</span>
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] border-0">LIMITADO</Badge>
                </div>
                {RESELLER_PROMO_PACKAGES.map((pkg) => {
                  const bonusValue = pkg.bonus * RESELLER_UNIT_PRICE;
                  const isSelected = selectedPkg?.name === pkg.name;
                  const savingsPercent = Math.round((1 - pkg.total / (pkg.credits * RESELLER_UNIT_PRICE)) * 100);
                  return (
                    <button
                      key={pkg.name}
                      onClick={() => setSelectedPkg(pkg)}
                      disabled={isProcessing}
                      className={`w-full py-3 px-4 rounded-lg border-2 transition-all text-center relative bg-card hover:bg-muted/30 group mb-3 ${
                        isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'border-amber-500/40 hover:border-amber-500'
                      }`}
                    >
                      <Badge className={`${pkg.badgeColor} text-white text-[10px] absolute -top-2.5 left-1/2 -translate-x-1/2 border-0`}>
                        {pkg.badge}
                      </Badge>
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        -{savingsPercent}%
                      </div>
                      <p className="text-lg font-bold text-primary">{pkg.credits} créditos</p>
                      <p className="text-sm text-foreground font-medium">
                        por R$ {pkg.total.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        R$ {(pkg.total / pkg.credits).toFixed(2).replace('.', ',')} / crédito
                      </p>
                      <p className="text-xs text-green-500 font-medium mt-0.5">
                        +{pkg.bonus} bônus (R$ {bonusValue.toFixed(2).replace('.', ',')} grátis!)
                      </p>
                    </button>
                  );
                })}
              </div>

              {selectedPkg && (
                <Button
                  className="w-full h-12 text-lg"
                  onClick={() => handleRechargePackage(selectedPkg)}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <QrCode className="mr-2 h-5 w-5" />}
                  {isProcessing ? 'Gerando PIX...' : `Pagar R$ ${selectedPkg.total.toFixed(2).replace('.', ',')} com PIX`}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'unit' && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Crédito Avulso
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                R$ {RESELLER_UNIT_PRICE.toFixed(2).replace('.', ',')} por crédito
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setCustomCredits(Math.max(1, customCredits - 1))}>-</Button>
                <div className="flex-1 text-center">
                  <input
                    type="number"
                    min={1}
                    value={customCredits}
                    onChange={(e) => setCustomCredits(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 text-center text-2xl font-bold bg-transparent border-b-2 border-primary outline-none text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">créditos</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCustomCredits(customCredits + 1)}>+</Button>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {(customCredits * RESELLER_UNIT_PRICE).toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {customCredits} × R$ {RESELLER_UNIT_PRICE.toFixed(2).replace('.', ',')}
                </p>
              </div>

              <Button
                className="w-full h-12 text-lg"
                onClick={handleRechargeUnit}
                disabled={isProcessing || customCredits < 1}
              >
                {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <QrCode className="mr-2 h-5 w-5" />}
                {isProcessing ? 'Gerando PIX...' : 'Pagar com PIX'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setShowHistory(!showHistory)}>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Histórico de Recargas
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); fetchPaymentHistory(); }}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showHistory ? 'rotate-90' : ''}`} />
              </div>
            </CardTitle>
          </CardHeader>
          {showHistory && (
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma recarga encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Créditos</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(payment.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>R$ {Number(payment.amount).toFixed(2)}</TableCell>
                        <TableCell className="font-medium">{payment.credits}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* PIX Modal */}
      <Dialog open={showPixModal} onOpenChange={(open) => {
        if (!open && checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        setCheckingPayment(false);
        setShowPixModal(open);
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pagamento PIX</DialogTitle>
          </DialogHeader>
          
          {!paymentConfirmed && !paymentExpired && (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${timeRemaining < 60 ? 'text-red-600' : 'text-orange-600'}`}>
                  <Clock className="inline-block mr-2 h-6 w-6" />
                  {formatTime(timeRemaining)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Tempo restante para pagamento</p>
              </div>
              {pixData?.qrCodeBase64 && (
                <div className="text-center">
                  <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="mx-auto max-w-[200px] border rounded-lg" />
                  <p className="text-sm text-muted-foreground mt-2">Escaneie o QR Code com o app do seu banco</p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm font-medium">Ou copie o código PIX:</p>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 text-xs bg-muted rounded break-all max-h-20 overflow-y-auto">{pixData?.qrCode}</code>
                  <Button variant="outline" size="sm" onClick={copyPixCode}>Copiar</Button>
                </div>
              </div>
              {checkingPayment && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aguardando confirmação do pagamento...
                </div>
              )}
            </div>
          )}
          {paymentConfirmed && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-600">Pagamento Confirmado!</h3>
              <p className="text-muted-foreground mt-2">Seus créditos foram adicionados à sua conta</p>
            </div>
          )}
          {paymentExpired && (
            <div className="text-center py-8">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-600">Pagamento Expirado</h3>
              <p className="text-muted-foreground mt-2">O tempo expirou. Gere um novo PIX.</p>
              <Button className="mt-4" onClick={() => { setShowPixModal(false); setPixData(null); }}>Fechar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReactCanvasConfetti onInit={handleInit} style={{ position: 'fixed', pointerEvents: 'none', width: '100%', height: '100%', top: 0, left: 0, zIndex: 9999 }} />
    </DashboardLayout>
  );
}