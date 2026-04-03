import { useState, useEffect } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  GraduationCap, User, CreditCard, Upload, Loader2, Copy, CheckCircle, AlertTriangle, Calendar, KeyRound, FolderOpen
} from 'lucide-react';
import iconAbafe from '@/assets/icon-abafe.png';
import { estudanteService } from '@/lib/estudante-service';
import { playSuccessSound } from '@/lib/success-sound';
import { supabase } from '@/integrations/supabase/client';
import { isUsingMySQL } from '@/lib/db-config';
import { mysqlApi } from '@/lib/api-mysql';
import ImageGalleryModal from '@/components/ImageGalleryModal';
import exemploAbafe from '@/assets/exemplo-abafe.png';
import AppExamplePreview from '@/components/AppExamplePreview';

const estudanteSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  cpf: z.string().min(14, 'CPF inválido'),
  rg: z.string().min(1, 'RG obrigatório'),
  dataNascimento: z.string().min(10, 'Data obrigatória'),
  faculdade: z.string().min(1, 'Faculdade obrigatória'),
  graduacao: z.string().min(1, 'Graduação obrigatória'),
});

type EstudanteFormData = z.infer<typeof estudanteSchema>;

const FIELD_LABELS: Record<string, string> = {
  nome: 'Nome Completo',
  cpf: 'CPF',
  rg: 'RG',
  dataNascimento: 'Data de Nascimento',
  faculdade: 'Faculdade',
  graduacao: 'Graduação',
};

const formatCPF = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};
const formatDate = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length >= 5) return d.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
  if (d.length >= 3) return d.replace(/(\d{2})(\d{0,2})/, '$1/$2');
  return d;
};

export default function CarteiraEstudante() {
  const { admin, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [resultInfo, setResultInfo] = useState<{ cpf: string; senha: string; qrcode: string | null } | null>(null);
  const [abafeApk, setAbafeApk] = useState('');
  const [abafeIphone, setAbafeIphone] = useState('');
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    const loadLinks = async () => {
      try {
        if (isUsingMySQL()) {
          const data = await mysqlApi.downloads.fetch();
          if (data) {
            setAbafeApk(data.abafe_apk || '');
            setAbafeIphone(data.abafe_iphone || '');
          }
        } else {
          const { data } = await supabase.from('downloads').select('abafe_apk, abafe_iphone').eq('id', 1).maybeSingle();
          if (data) {
            setAbafeApk((data as any).abafe_apk || '');
            setAbafeIphone((data as any).abafe_iphone || '');
          }
        }
      } catch (err) {
        console.error('Erro ao carregar links:', err);
      }
    };
    loadLinks();
  }, []);

  const form = useForm<EstudanteFormData>({
    resolver: zodResolver(estudanteSchema),
    mode: 'onChange',
    defaultValues: {
      nome: '', cpf: '', rg: '', dataNascimento: '', faculdade: '', graduacao: '',
    },
  });

  const handleFileUpload = (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Formato inválido. Use PNG ou JPG.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFotoPerfil(file);
      setFotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!admin) return <Navigate to="/login" replace />;

  const handleFormInvalid = (errors: FieldErrors<EstudanteFormData>) => {
    const missing = Object.keys(errors).map(k => FIELD_LABELS[k] || k);
    if (!fotoPerfil) missing.push('Foto do Estudante');
    toast.error(`Campos obrigatórios não preenchidos: ${missing.join(', ')}`, { position: 'top-right' });
  };

  const handleSubmit = async (data: EstudanteFormData) => {
    if (!fotoPerfil) {
      toast.error('Foto de perfil é obrigatória', { position: 'top-right' });
      return;
    }

    setIsSubmitting(true);
    try {
      let fotoBase64 = '';
      fotoBase64 = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.readAsDataURL(fotoPerfil);
      });

      const convertDate = (d: string) => {
        const [day, month, year] = d.split('/');
        return `${year}-${month}-${day}`;
      };

      const result = await estudanteService.save({
        admin_id: admin.id,
        session_token: admin.session_token,
        nome: data.nome.toUpperCase(),
        cpf: data.cpf.replace(/\D/g, ''),
        rg: data.rg.toUpperCase(),
        data_nascimento: convertDate(data.dataNascimento),
        faculdade: data.faculdade.toUpperCase(),
        graduacao: data.graduacao.toUpperCase(),
        fotoBase64,
      });

      playSuccessSound();
      setResultInfo({
        cpf: data.cpf.replace(/\D/g, ''),
        senha: result.senha,
        qrcode: result.qrcode,
      });
      setShowSuccess(true);
    } catch (err: any) {
      if (err.status === 409) {
        toast.error(err.message || 'CPF já cadastrado neste serviço');
      } else {
        toast.error(err.message || 'Erro ao salvar Carteira Estudante');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, msg = 'Copiado!') => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(msg);
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success(msg);
    });
  };

  const formatCpfDisplay = (cpf: string) => {
    const clean = cpf.replace(/\D/g, '');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const getDataText = () => {
    if (!resultInfo) return '';
    return `Carteira Estudante ✅
👤 CPF: ${formatCpfDisplay(resultInfo.cpf)}
🔑 Senha: ${resultInfo.senha}
📅 Validade: 45 dias
⚠️ Mantenha suas credenciais seguras`;
  };

  const expirationDate = (() => {
    const now = new Date();
    now.setDate(now.getDate() + 45);
    return now.toLocaleDateString('pt-BR');
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Carteira de Estudante</h1>
            <p className="text-sm text-muted-foreground">ABAFE - Preencha os dados do estudante</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>Saldo: <strong className="text-foreground">{admin?.creditos ?? 0}</strong> créditos</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, handleFormInvalid)} className="space-y-6">
            {/* Dados Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" /> Dados do Estudante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="nome" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="NOME COMPLETO" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cpf" render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} onChange={(e) => field.onChange(formatCPF(e.target.value))} maxLength={14} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="rg" render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG</FormLabel>
                      <FormControl>
                        <Input placeholder="Número do RG" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="dataNascimento" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input placeholder="DD/MM/AAAA" {...field} onChange={(e) => field.onChange(formatDate(e.target.value))} maxLength={10} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* Dados Acadêmicos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-4 w-4" /> Dados Acadêmicos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="faculdade" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faculdade / Instituição</FormLabel>
                      <FormControl>
                        <Input placeholder="UNIVERSIDADE..." {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="graduacao" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Graduação / Curso</FormLabel>
                      <FormControl>
                        <Input placeholder="ENGENHARIA, DIREITO..." {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* Foto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Upload className="h-4 w-4" /> Foto do Estudante</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-3 bg-accent/30 border border-accent rounded-lg mb-4">
                  <AlertTriangle className="h-4 w-4 text-accent-foreground shrink-0" />
                  <p className="text-xs text-accent-foreground">A foto deve ter <strong>fundo branco</strong> obrigatoriamente.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Foto de Perfil <span className="text-destructive">*</span></span>
                    <Button type="button" variant="ghost" size="sm" className="text-primary" onClick={() => setShowGallery(true)}>
                      <FolderOpen className="h-4 w-4 mr-1" /> Acervo
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    {fotoPreview && (
                      <img src={fotoPreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover border" />
                    )}
                    <label className="flex-1 flex items-center gap-3 px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{fotoPerfil ? fotoPerfil.name : 'Selecionar foto'}</p>
                        <p className="text-xs text-muted-foreground">PNG ou JPG - Fundo branco</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full h-12" disabled={isSubmitting || (admin?.creditos ?? 0) <= 0}>
              {isSubmitting ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processando...</>
              ) : (
                <><GraduationCap className="h-5 w-5 mr-2" /> Gerar Carteira de Estudante (1 crédito)</>
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={(open) => { setShowSuccess(open); if (!open) { form.reset(); setFotoPerfil(null); setFotoPreview(null); } }}>
        <DialogContent className="max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <span>Carteira Gerada com Sucesso!</span>
                <div className="text-sm text-muted-foreground mt-1">
                  Carteira de Estudante ABAFE pronta para uso
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {resultInfo && (
              <>
                {/* Dados de Acesso */}
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <KeyRound className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">Dados de Acesso</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>👤</span>
                        <span className="text-muted-foreground">CPF:</span>
                      </div>
                      <span className="font-mono font-semibold">{formatCpfDisplay(resultInfo.cpf)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>🔑</span>
                        <span className="text-muted-foreground">Senha:</span>
                      </div>
                      <span className="font-mono font-semibold">{resultInfo.senha}</span>
                    </div>
                  </div>
                </div>

                {/* Validade */}
                <div className="bg-green-500/5 rounded-xl p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <h4 className="font-semibold">Validade: 45 dias</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Expira em: <strong>{expirationDate}</strong></p>
                </div>

                <AppExamplePreview appName="ABAFE" exampleImage={exemploAbafe} />

                {/* Ações */}
                <div className="space-y-3">
                  <Button
                    onClick={() => copyToClipboard(getDataText(), 'Dados copiados!')}
                    className="w-full"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Dados
                  </Button>

                  <Button
                    onClick={() => {
                      if (!abafeIphone) { toast.error('Link iPhone não configurado'); return; }
                      copyToClipboard(abafeIphone, 'Link iPhone copiado!');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                     <Copy className="w-4 h-4 mr-2" />
                    Copiar Link iPhone
                  </Button>

                  <Button
                    onClick={() => {
                      if (!abafeApk) { toast.error('Link APK não configurado'); return; }
                      copyToClipboard(abafeApk, 'Link APK copiado!');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Link Android
                  </Button>
                </div>

                <Button className="w-full" onClick={() => {
                  setShowSuccess(false);
                  form.reset();
                  setFotoPerfil(null);
                  setFotoPreview(null);
                }}>
                  Criar Outra Carteira
                </Button>
              </>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowSuccess(false)} variant="outline">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {admin && (
        <ImageGalleryModal
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          onSelect={(file) => handleFileUpload(file)}
          type="foto"
          adminId={admin.id}
          sessionToken={admin.session_token}
        />
      )}
    </DashboardLayout>
  );
}
