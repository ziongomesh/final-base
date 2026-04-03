import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navigate } from 'react-router-dom';
import api from '@/lib/api';
import { playSuccessSound } from '@/lib/success-sound';
import { toast } from 'sonner';
import { Send, Loader2, CreditCard, ArrowDownRight, Clock } from 'lucide-react';

interface Reseller {
  id: number;
  email: string;
  nome: string;
}

interface Transfer {
  id: number;
  amount: number;
  to_admin_id: number;
  to_admin_name?: string;
  created_at: string;
}

export default function Transferir() {
  const { admin, role, credits, creditsTransf, loading, refreshCredits } = useAuth();
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [selectedReseller, setSelectedReseller] = useState('');
  const [amount, setAmount] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [loadingResellers, setLoadingResellers] = useState(true);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(true);

  const minTransfer = 3;

  useEffect(() => {
    if (admin && (role === 'master' || role === 'sub')) {
      fetchResellers();
      fetchTransfers();
    }
  }, [admin?.id, role]);

  const fetchTransfers = async () => {
    try {
      setLoadingTransfers(true);
      const data = await api.credits.getMasterTransfers(admin!.id);
      setTransfers(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoadingTransfers(false);
    }
  };

  const fetchResellers = async () => {
    try {
      const data = await api.admins.getResellers(admin!.id);
      setResellers(data || []);
    } catch (error) {
      console.error('Error fetching resellers:', error);
    } finally {
      setLoadingResellers(false);
    }
  };

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

  if (role !== 'master' && role !== 'sub') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleTransfer = async () => {
    if (!selectedReseller || amount < minTransfer) {
      toast.error(`Quantidade mínima: ${minTransfer} créditos`);
      return;
    }

    if (amount > creditsTransf) {
      toast.error('Saldo de transferência insuficiente');
      return;
    }

    setIsTransferring(true);

    try {
      const result = await api.credits.transfer(admin.id, parseInt(selectedReseller), amount);

      if (!result.success) throw new Error('Saldo insuficiente');

      await refreshCredits();
      playSuccessSound();
      toast.success('Transferência realizada com sucesso!', {
        description: `${amount} créditos transferidos`
      });
      
      setAmount(0);
      setSelectedReseller('');
      fetchTransfers();
    } catch (error: any) {
      toast.error('Erro na transferência', {
        description: error.message
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const formatDate = (d: string) => {
    try {
      const date = new Date(d);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return d; }
  };

  const getResellerName = (t: Transfer) => {
    if (t.to_admin_name) return t.to_admin_name;
    if ((t as any).reseller_name) return (t as any).reseller_name;
    const r = resellers.find(r => r.id === t.to_admin_id);
    return r ? (r.nome || r.email) : `#${t.to_admin_id}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Transferir Créditos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Envie créditos para seus revendedores
          </p>
        </div>

        {/* Balance Card */}
        <Card className="gradient-green text-success-foreground">
          <CardContent className="p-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm opacity-90">Saldo para Transferência</p>
                <p className="text-2xl sm:text-3xl font-bold">{creditsTransf.toLocaleString('pt-BR')}</p>
                <p className="text-xs sm:text-sm opacity-80">créditos disponíveis para enviar</p>
              </div>
              <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Nova Transferência
            </CardTitle>
            <CardDescription>
              Selecione o revendedor e a quantidade de créditos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingResellers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : resellers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>Você não possui revendedores cadastrados</p>
                <p className="text-sm">Crie um revendedor primeiro</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Revendedor</Label>
                  <Select value={selectedReseller} onValueChange={setSelectedReseller}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um revendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {resellers.map((reseller) => (
                        <SelectItem key={reseller.id} value={reseller.id.toString()}>
                          {reseller.nome || reseller.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Quantidade de Créditos</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={minTransfer}
                    max={creditsTransf}
                    value={amount || ''}
                    onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    * Quantidade mínima: 3 créditos
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleTransfer}
                  disabled={isTransferring || !selectedReseller || amount < minTransfer || amount > creditsTransf}
                >
                  {isTransferring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Transferir Créditos
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Últimas Transferências */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Últimas Transferências
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTransfers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : transfers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transferência realizada</p>
            ) : (
              <div className="space-y-2">
                {transfers.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ArrowDownRight className="h-4 w-4 text-orange-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{getResellerName(t)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(t.created_at)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-orange-500 shrink-0">-{t.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
