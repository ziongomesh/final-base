import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Eye, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateCNH, generateCNHPdfPage } from "@/lib/cnh-generator";
import { generateCNHMeio } from "@/lib/cnh-generator-meio";
import { generateCNHVerso } from "@/lib/cnh-generator-verso";

import { toast } from "sonner";
import { getStateFullName } from "@/lib/cnh-utils";
import CnhSuccessModal from "./CnhSuccessModal";
import CnhDetalhamento from "./CnhDetalhamento";
import { cnhService } from "@/lib/cnh-service";
import { playSuccessSound } from "@/lib/success-sound";
import api from "@/lib/api";

interface CnhPreviewProps {
  cnhData: any;
  onClose: () => void;
  onSaveSuccess?: () => void;
  onEdit?: () => void;
  isDemo?: boolean;
}

export default function CnhPreview({ cnhData, onClose, onSaveSuccess, onEdit, isDemo }: CnhPreviewProps) {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasMeioRef = useRef<HTMLCanvasElement>(null);
  const canvasVersoRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMeioUrl, setPreviewMeioUrl] = useState<string | null>(null);
  const [previewVersoUrl, setPreviewVersoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingCnh, setIsCreatingCnh] = useState(false);
  const [creationStep, setCreationStep] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [modalImageTitle, setModalImageTitle] = useState('');

  // Formatar observações
  const formatarObs = (obs: string): string => {
    if (!obs) return '';
    const limpa = obs.toString().trim().replace(/;+$/g, '').trim();
    if (!limpa) return '';
    if (!limpa.includes(',')) return limpa + ';';
    const itens = limpa.split(',').map(item => item.trim()).filter(item => item.length > 0);
    if (itens.length === 0) return '';
    return itens.join(', ') + ';';
  };

  useEffect(() => {
    const generatePreviews = async () => {
      if (!canvasRef.current || !canvasMeioRef.current || !canvasVersoRef.current || !cnhData) return;

      try {
        setLoading(true);

        // Frente
        const canvas = canvasRef.current;
        const cnhDefinitivaValue = cnhData.cnhDefinitiva || 'sim';
        await generateCNH(canvas, cnhData, cnhDefinitivaValue);
        setPreviewUrl(canvas.toDataURL('image/png'));

        // Meio
        const canvasMeio = canvasMeioRef.current;
        const meioData = {
          ...cnhData,
          obs: formatarObs(cnhData.obs),
          estadoExtenso: cnhData.estadoExtenso || getStateFullName(cnhData.uf),
        };
        await generateCNHMeio(canvasMeio, meioData);
        setPreviewMeioUrl(canvasMeio.toDataURL('image/png'));

        // Verso
        const canvasVerso = canvasVersoRef.current;
        await generateCNHVerso(canvasVerso, cnhData);
        setPreviewVersoUrl(canvasVerso.toDataURL('image/png'));
      } catch (error) {
        console.error('Erro ao gerar previews:', error);
        toast.error('Erro ao gerar preview da CNH');
      } finally {
        setLoading(false);
      }
    };

    generatePreviews();
  }, [cnhData]);

  // Download de PNGs removido por segurança

  const handleSaveToDatabase = async () => {
    if (isCreatingCnh) return;

    const cpf = cnhData.cpf?.replace(/\D/g, '');
    if (!cpf || cpf.length !== 11) {
      toast.error('CPF inválido');
      return;
    }

    // Verificar créditos - buscar saldo atualizado do servidor para evitar dado desatualizado
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }
    const admin = JSON.parse(adminStr);

    // Atualizar créditos do servidor antes de verificar (evita problema de admin ficar muito tempo no formulário)
    try {
      if (admin.session_token) {
        const freshBalance = await api.credits.getBalance(admin.id);
        if (freshBalance !== null && freshBalance !== undefined) {
          const credits = typeof freshBalance === 'object' ? (freshBalance as any).credits : freshBalance;
          admin.creditos = credits;
          // Atualizar localStorage com saldo real
          const updatedAdmin = { ...JSON.parse(adminStr), creditos: credits };
          localStorage.setItem('admin', JSON.stringify(updatedAdmin));
        }
      }
    } catch (e) {
      // Se falhar, usa o saldo local como fallback
      console.warn('Não foi possível atualizar créditos antes de salvar:', e);
    }

    if (admin.creditos <= 0) {
      toast.error('Créditos insuficientes para criar CNH.');
      return;
    }

    setIsCreatingCnh(true);
    setCreationStep('Preparando dados da CNH...');

    try {
      setCreationStep('Gerando imagens...');

      // Usar os base64 já gerados nos previews
      const cnhFrenteBase64 = previewUrl || canvasRef.current?.toDataURL('image/png') || '';
      const cnhMeioBase64 = previewMeioUrl || canvasMeioRef.current?.toDataURL('image/png') || '';
      const cnhVersoBase64 = previewVersoUrl || canvasVersoRef.current?.toDataURL('image/png') || '';

      console.log('Base64 lengths:', {
        frente: cnhFrenteBase64.length,
        meio: cnhMeioBase64.length,
        verso: cnhVersoBase64.length,
      });

      // Gerar página A4 completa no cliente (base.png + 3 matrizes posicionadas)
      setCreationStep('Montando PDF...');
      let pdfPageBase64 = '';
      try {
        pdfPageBase64 = await generateCNHPdfPage(cnhFrenteBase64, cnhMeioBase64, cnhVersoBase64);
        console.log('PDF page base64 length:', pdfPageBase64.length);
      } catch (pdfErr) {
        console.warn('Erro ao gerar página PDF no cliente:', pdfErr);
      }


      // Converter foto para base64 se for File
      let fotoBase64 = '';
      if (cnhData.foto instanceof File) {
        fotoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(cnhData.foto as File);
        });
      }

      // Converter assinatura para base64 se for File
      let assinaturaBase64 = '';
      if (cnhData.assinatura instanceof File) {
        assinaturaBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(cnhData.assinatura as File);
        });
      }

      setCreationStep('Salvando no servidor...');

      // Chamar serviço unificado (Supabase ou MySQL)
      const result = await cnhService.save({
        admin_id: admin.id,
        session_token: admin.session_token,
        cpf: cnhData.cpf,
        nome: cnhData.nome,
        dataNascimento: cnhData.dataNascimento,
        sexo: cnhData.sexo,
        nacionalidade: cnhData.nacionalidade,
        docIdentidade: cnhData.docIdentidade,
        categoria: cnhData.categoria,
        numeroRegistro: cnhData.numeroRegistro,
        dataEmissao: cnhData.dataEmissao,
        dataValidade: cnhData.dataValidade,
        hab: cnhData.hab,
        pai: cnhData.pai,
        mae: cnhData.mae,
        uf: cnhData.uf,
        localEmissao: cnhData.localEmissao,
        estadoExtenso: cnhData.estadoExtenso,
        espelho: cnhData.espelho,
        codigo_seguranca: cnhData.codigo_seguranca,
        renach: cnhData.renach,
        obs: cnhData.obs,
        matrizFinal: cnhData.matrizFinal,
        cnhDefinitiva: cnhData.cnhDefinitiva || 'sim',
        cnhFrenteBase64,
        cnhMeioBase64,
        cnhVersoBase64,
        fotoBase64,
        assinaturaBase64,
        pdfBase64: pdfPageBase64,
      });


      // Sucesso
      setSuccessData({
        id: result.id,
        cpf: cnhData.cpf,
        nome: cnhData.nome,
        senha: result.senha || cpf.slice(-6),
        pdf: result.pdf,
        dataExpiracao: result.dataExpiracao,
      });

      // Atualizar créditos localmente
      const updatedAdmin = { ...admin, creditos: admin.creditos - 1 };
      localStorage.setItem('admin', JSON.stringify(updatedAdmin));

      setShowSuccessModal(true);
      playSuccessSound();
      toast.success('CNH criada com sucesso! 1 crédito descontado.');
      onSaveSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar CNH:', error);
      if (error.status === 409 && error.details) {
        const details = error.details;
        if (details.is_own) {
          toast.error(`Este CPF já possui uma CNH cadastrada por você. Vá ao Histórico para excluí-la antes de criar novamente.`, {
            duration: 8000,
            action: {
              label: 'Ir ao Histórico',
              onClick: () => navigate('/historico'),
            },
          });
        } else {
          toast.error(`Este CPF já possui uma CNH cadastrada por ${details.creator_name || 'outro usuário'}. Não é possível criar duplicado.`, {
            duration: 8000,
          });
        }
      } else {
        toast.error(error.message || 'Erro ao salvar CNH');
      }
    } finally {
      setIsCreatingCnh(false);
      setCreationStep('');
    }
  };

  const openImageModal = (url: string, title: string) => {
    setModalImageUrl(url);
    setModalImageTitle(title);
    setShowImageModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Canvas ocultos para geração */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={canvasMeioRef} className="hidden" />
      <canvas ref={canvasVersoRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Preview da CNH</h2>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              Editar Dados
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Gerando preview...</span>
        </div>
      ) : (
        <>
          {/* Preview das 3 imagens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Frente */}
            <Card className="cursor-pointer transition-all" onClick={() => previewUrl && openImageModal(previewUrl, 'CNH Frente')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Frente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewUrl && (
                  <img src={previewUrl} alt="CNH Frente" className="w-full rounded-lg border pointer-events-none select-none" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                )}
              </CardContent>
            </Card>

            {/* Meio */}
            <Card className="cursor-pointer transition-all" onClick={() => previewMeioUrl && openImageModal(previewMeioUrl, 'CNH Meio')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Meio
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewMeioUrl && (
                  <img src={previewMeioUrl} alt="CNH Meio" className="w-full rounded-lg border pointer-events-none select-none" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                )}
              </CardContent>
            </Card>

            {/* Verso */}
            <Card className="cursor-pointer transition-all" onClick={() => previewVersoUrl && openImageModal(previewVersoUrl, 'CNH Verso')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Verso
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewVersoUrl && (
                  <img src={previewVersoUrl} alt="CNH Verso" className="w-full rounded-lg border pointer-events-none select-none" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                )}
              </CardContent>
            </Card>
          </div>


          {/* Botão criar */}
          {isDemo ? (
            <div className="flex flex-col items-center gap-2 pt-4">
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Modo demonstração — criação desabilitada</span>
              </div>
              <Button variant="outline" onClick={onClose}>
                Voltar ao formulário
              </Button>
            </div>
          ) : (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={isCreatingCnh}
                size="lg"
                className="min-w-[280px]"
              >
                {isCreatingCnh ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {creationStep}
                  </>
                ) : (
                  <>
                    <CreditCardIcon className="h-4 w-4 mr-2" />
                    Criar CNH Digital (1 crédito)
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Dialog de confirmação */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowConfirmDialog(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Deseja mesmo gerar o acesso?</h3>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Você poderá mudar qualquer coisa futuramente.</p>
              <p>• Este módulo tem validade de <strong className="text-foreground">45 dias</strong>.</p>
              <p>• Será descontado <strong className="text-foreground">1 crédito</strong> da sua conta.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirmDialog(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={() => { setShowConfirmDialog(false); handleSaveToDatabase(); }}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de imagem ampliada */}
      {showImageModal && modalImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="absolute -top-12 right-0 text-white" onClick={() => setShowImageModal(false)}>
              <X className="h-6 w-6" />
            </Button>
            <h3 className="text-white text-center mb-2 font-semibold">{modalImageTitle}</h3>
            <img src={modalImageUrl} alt={modalImageTitle} className="w-full rounded-lg pointer-events-none select-none" draggable={false} onContextMenu={(e) => e.preventDefault()} />
          </div>
        </div>
      )}

      {/* Modal de sucesso */}
      {showSuccessModal && successData && (
        <CnhSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            onClose();
          }}
          cpf={successData.cpf}
          senha={successData.senha}
          nome={successData.nome}
          pdfUrl={successData.pdf}
        />
      )}
    </div>
  );
}

// Helper icon component
function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

