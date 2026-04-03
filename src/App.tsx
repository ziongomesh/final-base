import { Suspense, lazy } from "react";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { LoadingScreen } from "./components/LoadingScreen";
import { FormGuardProvider } from "./hooks/useFormGuard";

// Eagerly loaded (lightweight pages)
import Login from "./pages/Login";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
// DashboardDono is now rendered inside Dashboard based on role
import NotFound from "./pages/NotFound";

// Lazy loaded (heavy pages with template assets)
const CnhDigital = lazy(() => import("./pages/CnhDigital"));
const CrlvDigital = lazy(() => import("./pages/CrlvDigital"));
const RgDigital = lazy(() => import("./pages/RgDigital"));
const CnhNautica = lazy(() => import("./pages/CnhNautica"));
const CarteiraEstudante = lazy(() => import("./pages/CarteiraEstudante"));
const PdfPositionTool = lazy(() => import("./pages/PdfPositionTool"));
const RgQrPositionTool = lazy(() => import("./pages/RgQrPositionTool"));
const ChaPositionTool = lazy(() => import("./pages/ChaPositionTool"));
const MockupGenerator = lazy(() => import("./pages/MockupGenerator"));
const CrlvPositionTool = lazy(() => import("./pages/CrlvPositionTool"));
const ChaPdfPositionTool = lazy(() => import("./pages/ChaPdfPositionTool"));
const VerificarCha = lazy(() => import("./pages/VerificarCha"));
const PreviewDetalhamentoCnh = lazy(() => import("./pages/PreviewDetalhamentoCnh"));
const PreviewDetalhamentoCin = lazy(() => import("./pages/PreviewDetalhamentoCin"));
const VerificarCnh = lazy(() => import("./pages/VerificarCnh"));
const VerificarCin = lazy(() => import("./pages/VerificarCin"));
const VerificarCrlv = lazy(() => import("./pages/VerificarCrlv"));
const EditorPdf = lazy(() => import("./pages/EditorPdf"));
const RemoverFundo = lazy(() => import("./pages/RemoverFundo"));
const GeradorAssinatura = lazy(() => import("./pages/GeradorAssinatura"));
const ConverterImagem = lazy(() => import("./pages/ConverterImagem"));
const HistoricoServicos = lazy(() => import("./pages/HistoricoServicos"));
const HapvidaPositionTool = lazy(() => import("./pages/HapvidaPositionTool"));
const AtestadoHapvida = lazy(() => import("./pages/AtestadoHapvida"));


// Lazy loaded (medium pages)
const Recarregar = lazy(() => import("./pages/Recarregar"));
const CriarMaster = lazy(() => import("./pages/CriarMaster"));
const CriarRevendedor = lazy(() => import("./pages/CriarRevendedor"));
const Revendedores = lazy(() => import("./pages/Revendedores"));
const RevendedorDetalhes = lazy(() => import("./pages/RevendedorDetalhes"));
const Transferir = lazy(() => import("./pages/Transferir"));
const Estatisticas = lazy(() => import("./pages/Estatisticas"));
const HistoricoTransferencias = lazy(() => import("./pages/HistoricoTransferencias"));
const Servicos = lazy(() => import("./pages/Servicos"));
const Ferramentas = lazy(() => import("./pages/Ferramentas"));
const Downloads = lazy(() => import("./pages/Downloads"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));

const queryClient = new QueryClient();

function LazyFallback() {
  return <LoadingScreen />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <FormGuardProvider>
            <Suspense fallback={<LazyFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard-dono" element={<Navigate to="/dashboard" replace />} />
                <Route path="/recarregar" element={<Recarregar />} />
                <Route path="/criar-master" element={<CriarMaster />} />
                <Route path="/criar-revendedor" element={<CriarRevendedor />} />
                <Route path="/revendedores" element={<Revendedores />} />
                <Route path="/revendedor/:id" element={<RevendedorDetalhes />} />
                <Route path="/transferir" element={<Transferir />} />
                <Route path="/historico-transferencias" element={<HistoricoTransferencias />} />
                <Route path="/estatisticas" element={<Estatisticas />} />
                <Route path="/servicos" element={<Servicos />} />
                <Route path="/servicos/cnh-digital" element={<CnhDigital />} />
                <Route path="/servicos/crlv-digital" element={<CrlvPositionTool />} />
                <Route path="/servicos/rg-digital" element={<RgDigital />} />
                {/* Rotas de teste desativadas */}
                {/* <Route path="/teste" element={<PdfPositionTool />} /> */}
                {/* <Route path="/teste2" element={<RgQrPositionTool />} /> */}
                {/* <Route path="/teste3" element={<ChaPositionTool />} /> */}
                {/* <Route path="/teste4" element={<MockupGenerator />} /> */}
                {/* <Route path="/teste5" element={<CrlvPositionTool />} /> */}
                {/* <Route path="/teste6" element={<ChaPdfPositionTool />} /> */}
                {/* <Route path="/teste7" element={<HapvidaPositionTool />} /> */}
                <Route path="/ferramentas" element={<Ferramentas />} />
                <Route path="/ferramentas/remover-fundo" element={<RemoverFundo />} />
                <Route path="/ferramentas/editor-pdf" element={<Navigate to="/ferramentas" replace />} />
                <Route path="/ferramentas/gerador-assinatura" element={<GeradorAssinatura />} />
                <Route path="/ferramentas/converter-imagem" element={<ConverterImagem />} />
                <Route path="/historico-servicos" element={<HistoricoServicos />} />
                <Route path="/downloads" element={<Downloads />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/servicos/carteira-estudante" element={<CarteiraEstudante />} />
                <Route path="/servicos/cnh-nautica" element={<CnhNautica />} />
                <Route path="/servicos/atestado-hapvida" element={<AtestadoHapvida />} />
                <Route path="/verificar-cha" element={<VerificarCha />} />
                <Route path="/preview-detalhamento-cnh" element={<PreviewDetalhamentoCnh />} />
                <Route path="/preview-detalhamento-cin" element={<PreviewDetalhamentoCin />} />
                <Route path="/verificar-cnh" element={<VerificarCnh />} />
                <Route path="/verificar-cin" element={<VerificarCin />} />
                <Route path="/verificar-crlv" element={<VerificarCrlv />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </FormGuardProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
