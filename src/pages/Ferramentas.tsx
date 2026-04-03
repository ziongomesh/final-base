import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageMinus, FileText, PenLine, Clock, Palette } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const tools = [
  {
    title: 'Removedor de Fundo',
    description: 'Remova o fundo de fotos 3x4 automaticamente com IA',
    icon: ImageMinus,
    href: '/ferramentas/remover-fundo',
    color: 'text-blue-500',
    available: true,
  },
  {
    title: 'Editor de PDF',
    description: 'Edite campos de texto, mova ou exclua elementos de qualquer PDF',
    icon: FileText,
    href: '/ferramentas/editor-pdf',
    color: 'text-orange-500',
    available: false,
  },
  {
    title: 'Gerador de Assinatura',
    description: 'Gere assinaturas manuscritas com diferentes fontes cursivas',
    icon: PenLine,
    href: '/ferramentas/gerador-assinatura',
    color: 'text-purple-500',
    available: true,
  },
  {
    title: 'Converter Imagem',
    description: 'Converta imagens para tons de cinza ou somente preto e branco',
    icon: Palette,
    href: '/ferramentas/converter-imagem',
    color: 'text-emerald-500',
    available: true,
  },
];

export default function Ferramentas() {
  const { admin, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!admin) return <Navigate to="/login" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Ferramentas</h1>
          <p className="text-muted-foreground">Ferramentas úteis para o dia a dia</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            tool.available ? (
              <Link key={tool.href} to={tool.href}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className={`p-2 rounded-lg bg-primary/10 ${tool.color}`}>
                      <tool.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <div key={tool.href}>
                <Card className="opacity-50 h-full">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className={`p-2 rounded-lg bg-primary/10 ${tool.color}`}>
                      <tool.icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        <Clock className="h-2.5 w-2.5 mr-0.5" /> Em Breve
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardContent>
                </Card>
              </div>
            )
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
