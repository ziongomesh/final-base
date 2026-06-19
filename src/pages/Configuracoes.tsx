import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navigate } from 'react-router-dom';
import { isUsingMySQL } from '@/lib/db-config';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings, Phone, Save, Loader2, User } from 'lucide-react';

const formatPhone = (raw: string) => {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length > 6) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length > 2) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return digits;
};

export default function Configuracoes() {
  const { admin, role, loading } = useAuth();
  const [telefone, setTelefone] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!admin) return;
    const fetchPhone = async () => {
      try {
        if (isUsingMySQL()) {
          const envUrl = import.meta.env.VITE_API_URL as string | undefined;
          let apiBase = envUrl ? envUrl.replace(/\/+$/, '') : 'http://localhost:4000/api';
          if (!apiBase.endsWith('/api')) apiBase += '/api';
          const resp = await fetch(`${apiBase}/admins/${admin.id}`);
          const data = await resp.json();
          setTelefone(formatPhone(data?.telefone || ''));
        } else {
          const { data, error } = await supabase
            .from('admins')
            .select('telefone')
            .eq('id', admin.id)
            .single();
          if (!error && data) {
            setTelefone(formatPhone((data as any).telefone || ''));
          }
        }
      } catch (err) {
        console.error('Erro ao buscar telefone:', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchPhone();
  }, [admin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;
  if (role !== 'master' && role !== 'dono' && role !== 'sub') return <Navigate to="/dashboard" replace />;

  const handleSave = async () => {
    setSaving(true);
    try {
      const digits = telefone.replace(/\D/g, '');
      if (digits.length > 0 && digits.length < 10) {
        toast.error('Telefone inválido', { description: 'Informe DDD + número (mín. 10 dígitos)' });
        setSaving(false);
        return;
      }
      if (isUsingMySQL()) {
        const envUrl = import.meta.env.VITE_API_URL as string | undefined;
        let apiBase = envUrl ? envUrl.replace(/\/+$/, '') : 'http://localhost:4000/api';
        if (!apiBase.endsWith('/api')) apiBase += '/api';
        const resp = await fetch(`${apiBase}/admins/${admin.id}/telefone`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-id': String(admin.id),
            'x-session-token': admin.session_token || '',
          },
          body: JSON.stringify({ telefone: digits }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Erro ao salvar');
      } else {
        const { error } = await supabase
          .from('admins')
          .update({ telefone: digits } as any)
          .eq('id', admin.id);
        if (error) throw error;
      }
      toast.success('Telefone atualizado');
    } catch (err: any) {
      toast.error('Erro ao salvar', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto px-1">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg glass-card-flat flex items-center justify-center">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h1 className="section-title">Configurações da conta</h1>
            <p className="section-desc">Gerencie suas informações pessoais</p>
          </div>
        </div>

        {/* Identidade */}
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-sky-400/10 border border-sky-400/20 flex items-center justify-center">
            <User className="h-5 w-5 text-sky-300" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{admin.nome}</p>
            <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
          </div>
        </div>

        {/* Telefone */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">Telefone de contato</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exibido aos seus revendedores na tela de recarga, com link direto para WhatsApp.
              </p>
            </div>
          </div>

          {loadingData ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="telefone" className="text-xs text-muted-foreground">Número (WhatsApp)</Label>
                <Input
                  id="telefone"
                  inputMode="tel"
                  placeholder="(11) 91111-1111"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhone(e.target.value))}
                  maxLength={16}
                  className="glass-input h-10"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="sm" className="h-9">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
