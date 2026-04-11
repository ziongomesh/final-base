import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserPlus, Loader2, Check } from 'lucide-react';
import api from '@/lib/api';

export default function CriarRevendedor() {
  const { admin, role, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;
  if (role !== 'master' && role !== 'sub') return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      await api.admins.createReseller({
        nome: formData.name,
        email: formData.email.toLowerCase().trim(),
        key: formData.password,
        criadoPor: admin.id,
      });

      setCreated(true);
      toast.success('Revendedor criado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao criar revendedor', { description: error.message });
    } finally {
      setIsCreating(false);
    }
  };

  if (created) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto animate-fade-in">
          <Card className="border-emerald-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Check className="h-4 w-4 text-emerald-500" />
                Revendedor Criado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-1 text-muted-foreground">
                <p><span className="text-foreground font-medium">{formData.name}</span></p>
                <p>{formData.email}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setCreated(false); setFormData({ name: '', email: '', password: '' }); }}>
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Criar outro
                </Button>
                <Button size="sm" className="flex-1" onClick={() => navigate('/revendedores')}>
                  Ver revendedores
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto animate-fade-in">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4 text-primary" />
              Novo Revendedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Nome</Label>
                <Input id="name" placeholder="Nome do revendedor" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" type="email" placeholder="email@exemplo.com" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} required className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} required minLength={6} className="h-9" />
              </div>
              <Button type="submit" className="w-full h-9 text-sm" disabled={isCreating}>
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Criar Revendedor
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
