import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Eye } from 'lucide-react';
import WatermarkOverlay from '@/components/cnh/WatermarkOverlay';
import { generateCnhMesa, type CnhMesaData } from '@/lib/cnh-mesa-generator';
import { BRAZILIAN_STATES, formatCPF, formatDate } from '@/lib/cnh-utils';

const cnhMesaSchema = z.object({
  nome: z.string().min(3, 'Nome obrigatório'),
  cpf: z.string().min(14, 'CPF inválido'),
  dataNascimentoData: z.string().min(10, 'Data de nascimento obrigatória'),
  localNascimento: z.string().min(2, 'Local de nascimento obrigatório'),
  ufNascimento: z.string().min(2, 'UF de nascimento obrigatório'),
  nacionalidade: z.string().min(1, 'Nacionalidade obrigatória'),
  sexo: z.string().min(1, 'Sexo obrigatório'),
  pai: z.string().optional(),
  mae: z.string().optional(),
});

type CnhMesaFormData = z.infer<typeof cnhMesaSchema>;

export default function CnhMesa() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);

  const form = useForm<CnhMesaFormData>({
    resolver: zodResolver(cnhMesaSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      dataNascimentoData: '',
      localNascimento: '',
      ufNascimento: '',
      nacionalidade: 'BRASILEIRA',
      sexo: '',
      pai: '',
      mae: '',
    },
  });

  if (!user) return <Navigate to="/login" />;

  const watchedValues = form.watch();

  const updatePreview = useCallback(async () => {
    if (!canvasRef.current) return;

    const dataNasc = watchedValues.dataNascimentoData ? formatDate(watchedValues.dataNascimentoData) : '';

    const data: CnhMesaData = {
      nome: watchedValues.nome,
      cpf: watchedValues.cpf,
      dataNascimento: dataNasc,
      localNascimento: watchedValues.localNascimento,
      ufNascimento: watchedValues.ufNascimento,
      nacionalidade: watchedValues.nacionalidade,
      pai: watchedValues.pai,
      mae: watchedValues.mae,
    };

    try {
      await generateCnhMesa(canvasRef.current, data);
    } catch (e) {
      console.error('Preview error:', e);
    }
  }, [watchedValues]);

  useEffect(() => {
    const timer = setTimeout(updatePreview, 150);
    return () => clearTimeout(timer);
  }, [updatePreview]);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/servicos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">CNH na Mesa</h1>
            <p className="text-sm text-muted-foreground">Carteira Nacional de Habilitação — Formato Físico</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4">
                  {/* Nome */}
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome e Sobrenome"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CPF */}
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000.000.000-00"
                            maxLength={14}
                            {...field}
                            onChange={(e) => field.onChange(formatCPF(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Data Nascimento + UF Nasc */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="dataNascimentoData"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ufNascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF Nasc.</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="UF" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BRAZILIAN_STATES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Local Nascimento */}
                  <FormField
                    control={form.control}
                    name="localNascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local de Nascimento</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Cidade"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sexo + Nacionalidade */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="sexo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sexo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="M">Masculino</SelectItem>
                              <SelectItem value="F">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nacionalidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nacionalidade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="BRASILEIRA">Brasileira</SelectItem>
                              <SelectItem value="ESTRANGEIRA">Estrangeira</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Filiação */}
                  <FormField
                    control={form.control}
                    name="pai"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Pai (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do Pai"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mae"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Mãe (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome da Mãe"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted/30 rounded-lg p-2 flex justify-center">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto rounded border border-border cursor-pointer"
                    onClick={() => setPreviewExpanded(true)}
                  />
                  <WatermarkOverlay />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Clique na imagem para expandir
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expanded preview modal */}
      {previewExpanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewExpanded(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-auto">
            <canvas
              ref={(el) => {
                if (el) {
                  generateCnhMesa(el, {
                    nome: watchedValues.nome,
                    cpf: watchedValues.cpf,
                    dataNascimento: watchedValues.dataNascimentoData ? formatDate(watchedValues.dataNascimentoData) : '',
                    localNascimento: watchedValues.localNascimento,
                    ufNascimento: watchedValues.ufNascimento,
                    nacionalidade: watchedValues.nacionalidade,
                    pai: watchedValues.pai,
                    mae: watchedValues.mae,
                  });
                }
              }}
              className="max-w-full h-auto rounded"
            />
            <WatermarkOverlay />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
