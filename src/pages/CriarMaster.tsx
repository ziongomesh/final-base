import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/success-sound';
import { UserPlus, Loader2, Shield, Users, Coins, Crown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function CriarMaster() {
  const { admin, role, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [selectedRole, setSelectedRole] = useState<'sub' | 'master' | 'revendedor'>(role === 'sub' ? 'revendedor' : 'master');
  const [withCredits, setWithCredits] = useState(false);
  const [credits, setCredits] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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

  // Sub só pode criar revendedor, não master
  if (role !== 'dono' && role !== 'sub') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const params = {
        nome: formData.name,
        email: formData.email.toLowerCase().trim(),
        key: formData.password,
        criadoPor: admin.id,
        ...(withCredits && credits ? { creditos: parseInt(credits) } : {}),
      };

      if (selectedRole === 'sub') {
        await (api as any).admins.createSub(params);
      } else if (selectedRole === 'master') {
        await api.admins.createMaster(params);
      } else {
        await api.admins.createReseller(params);
      }

      const roleLabel = selectedRole === 'sub' ? 'Sub Dono' : selectedRole === 'master' ? 'Master' : 'Revendedor';
      playSuccessSound();
      toast.success(`Conta ${roleLabel} criada com sucesso!`, {
        description: `Email: ${formData.email}${withCredits && credits ? ` | Créditos: ${credits}` : ''}`
      });

      setFormData({ name: '', email: '', password: '' });
      setCredits('');
      setWithCredits(false);
    } catch (error: any) {
      toast.error('Erro ao criar conta', {
        description: error.message
      });
    } finally {
      setIsCreating(false);
    }
  };

  const roleLabel = selectedRole === 'sub' ? 'Sub Dono' : selectedRole === 'master' ? 'Master' : 'Revendedor';

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in max-w-xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Criar Usuário</h1>
          <p className="text-muted-foreground">
            Crie uma nova conta de Master ou Revendedor
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Novo Usuário
            </CardTitle>
            <CardDescription>
              Selecione o tipo de conta e preencha os dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <div className={`grid gap-3 ${role === 'dono' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                  {role === 'dono' && (
                    <button
                      type="button"
                      onClick={() => setSelectedRole('sub')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        selectedRole === 'sub'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <Crown className="h-6 w-6" />
                      <span className="font-medium text-sm">Sub Dono</span>
                    </button>
                  )}
                  {role === 'dono' && (
                    <button
                      type="button"
                      onClick={() => setSelectedRole('master')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        selectedRole === 'master'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <Shield className="h-6 w-6" />
                      <span className="font-medium text-sm">Master</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('revendedor')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      selectedRole === 'revendedor'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <Users className="h-6 w-6" />
                    <span className="font-medium text-sm">Revendedor</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder={`Nome do ${roleLabel}`}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>

              {/* Credits Toggle */}
              <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    <Label htmlFor="with-credits" className="cursor-pointer">Adicionar créditos iniciais</Label>
                  </div>
                  <Switch
                    id="with-credits"
                    checked={withCredits}
                    onCheckedChange={setWithCredits}
                  />
                </div>
                {withCredits && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="credits">Quantidade de créditos</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="1"
                      placeholder="Ex: 10"
                      value={credits}
                      onChange={(e) => setCredits(e.target.value)}
                      required={withCredits}
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Conta {roleLabel}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
