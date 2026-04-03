import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { nauticaService, type NauticaRecord } from '@/lib/cnh-nautica-service';
import ChaPreview, { type ChaPreviewHandle } from '@/components/cha/ChaPreview';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, Save, Loader2, Eye, Upload, User, Ship, Anchor
} from 'lucide-react';

interface ChaEditViewProps {
  registro: NauticaRecord;
  onClose: () => void;
  onSaved: () => void;
}

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

// Convert ISO date or yyyy-mm-dd to DD/MM/YYYY
function isoToBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) return dateStr;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return dateStr;
}

const getNavLimit = (cat1: string, cat2: string) => {
  const cats = [cat1, cat2].filter(c => c && c !== 'NENHUMA');
  const hasCapitao = cats.includes('CAPITÃO-AMADOR');
  const hasMestre = cats.includes('MESTRE-AMADOR');
  const hasMotonauta = cats.includes('MOTONAUTA');

  if (hasCapitao) return 'NAVEGAÇÃO OCEÂNICA\nOCEAN NAVIGATION';
  if (hasMestre) return 'NAVEGAÇÃO COSTEIRA\nCOASTAL NAVIGATION';
  if (hasMotonauta) return 'NAVEGAÇÃO INTERIOR. QUANDO PILOTANDO MOTO AQUÁTICA, INTERIOR.\nINLAND NAVIGATION. WHEN PILOTING PERSONAL WATERCRAFT, INLAND WATERS.';
  return 'NAVEGAÇÃO INTERIOR\nINLAND NAVIGATION.';
};

// Parse category string: may contain " E " for dual categories
function parseCategories(cat: string | null): { cat1: string; cat2: string } {
  if (!cat) return { cat1: 'ARRAIS-AMADOR', cat2: 'NENHUMA' };
  const parts = cat.split(' E ').map(s => s.trim());
  return { cat1: parts[0] || 'ARRAIS-AMADOR', cat2: parts[1] || 'NENHUMA' };
}

export default function ChaEditView({ registro, onClose, onSaved }: ChaEditViewProps) {
  const { admin } = useAuth();
  const chaPreviewRef = useRef<ChaPreviewHandle>(null);
  const [saving, setSaving] = useState(false);
  const [newFoto, setNewFoto] = useState<File | null>(null);

  const { cat1, cat2 } = parseCategories(registro.categoria);

  const [form, setForm] = useState({
    nome: registro.nome || '',
    cpf: formatCPF(registro.cpf || ''),
    dataNascimento: isoToBR(registro.data_nascimento),
    categoria: cat1,
    categoria2: cat2,
    validade: registro.validade || '',
    emissao: registro.emissao || '',
    numeroInscricao: registro.numero_inscricao || '',
    limiteNavegacao: registro.limite_navegacao || '',
    requisitos: registro.requisitos || '',
    orgaoEmissao: registro.orgao_emissao || '',
  });

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Build foto preview URL
  const fotoPreviewUrl = (() => {
    if (newFoto) return URL.createObjectURL(newFoto);
    if (registro.foto) {
      // foto may be relative URL like /uploads/xxx.png
      if (registro.foto.startsWith('http')) return registro.foto;
      const envUrl = import.meta.env.VITE_API_URL as string | undefined;
      let baseUrl = 'http://localhost:4000';
      if (envUrl) baseUrl = envUrl.replace(/\/api\/?$/, '');
      else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') baseUrl = window.location.origin;
      return `${baseUrl}${registro.foto}`;
    }
    return null;
  })();

  const handleSave = async () => {
    if (!admin) return;
    setSaving(true);
    try {
      let fotoBase64 = '';
      if (newFoto) {
        fotoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(newFoto);
        });
      }

      // Build combined categoria
      const combinedCategoria = form.categoria2 && form.categoria2 !== 'NENHUMA'
        ? `${form.categoria} E ${form.categoria2}`
        : form.categoria;

      const matrizFrenteBase64 = chaPreviewRef.current?.getFrenteBase64() || '';
      const matrizVersoBase64 = chaPreviewRef.current?.getVersoBase64() || '';

      await nauticaService.update({
        admin_id: admin.id,
        session_token: admin.session_token,
        nautica_id: registro.id,
        nome: form.nome.toUpperCase(),
        data_nascimento: form.dataNascimento,
        categoria: combinedCategoria.toUpperCase(),
        validade: form.validade,
        emissao: form.emissao,
        numero_inscricao: form.numeroInscricao.toUpperCase(),
        limite_navegacao: form.limiteNavegacao.toUpperCase(),
        requisitos: (form.requisitos || '').toUpperCase(),
        orgao_emissao: form.orgaoEmissao.toUpperCase(),
        fotoBase64: fotoBase64 || undefined,
        matrizFrenteBase64: matrizFrenteBase64 || undefined,
        matrizVersoBase64: matrizVersoBase64 || undefined,
      });

      onSaved();
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      toast.error(err.message || 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Anchor className="h-5 w-5" /> Editar CHA Náutica
          </h2>
          <p className="text-sm text-muted-foreground">CPF: {formatCPF(registro.cpf)} — {registro.nome}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column - Form */}
        <div className="lg:w-[380px] flex-shrink-0 min-w-0 space-y-4">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" /> Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Nome Completo</Label>
                <Input value={form.nome} onChange={(e) => updateField('nome', e.target.value.toUpperCase())} />
              </div>
              <div>
                <Label className="text-xs">Data de Nascimento</Label>
                <Input value={form.dataNascimento} onChange={(e) => updateField('dataNascimento', formatDate(e.target.value))} maxLength={10} placeholder="DD/MM/AAAA" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Categoria</Label>
                  <Select value={form.categoria} onValueChange={(val) => {
                    updateField('categoria', val);
                    updateField('limiteNavegacao', getNavLimit(val, form.categoria2));
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARRAIS-AMADOR">ARRAIS-AMADOR</SelectItem>
                      <SelectItem value="MOTONAUTA">MOTONAUTA</SelectItem>
                      <SelectItem value="MESTRE-AMADOR">MESTRE-AMADOR</SelectItem>
                      <SelectItem value="CAPITÃO-AMADOR">CAPITÃO-AMADOR</SelectItem>
                      <SelectItem value="VELEIRO">VELEIRO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Categoria 2</Label>
                  <Select value={form.categoria2} onValueChange={(val) => {
                    updateField('categoria2', val);
                    updateField('limiteNavegacao', getNavLimit(form.categoria, val));
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NENHUMA">NENHUMA</SelectItem>
                      <SelectItem value="MOTONAUTA">MOTONAUTA</SelectItem>
                      <SelectItem value="ARRAIS-AMADOR">ARRAIS-AMADOR</SelectItem>
                      <SelectItem value="MESTRE-AMADOR">MESTRE-AMADOR</SelectItem>
                      <SelectItem value="CAPITÃO-AMADOR">CAPITÃO-AMADOR</SelectItem>
                      <SelectItem value="VELEIRO">VELEIRO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Foto Upload */}
              <div>
                <Label className="text-xs">Foto 3x4</Label>
                <div className="flex items-center gap-3 mt-1">
                  {fotoPreviewUrl && (
                    <img src={fotoPreviewUrl} alt="Foto" className="h-16 w-16 object-cover rounded-full border" />
                  )}
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors text-xs text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    {newFoto ? newFoto.name : 'Trocar foto'}
                    <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={(e) => setNewFoto(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Documento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Ship className="h-4 w-4" /> Dados da Habilitação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Número de Inscrição</Label>
                <Input value={form.numeroInscricao} onChange={(e) => updateField('numeroInscricao', e.target.value.toUpperCase())} />
              </div>
              <div>
                <Label className="text-xs">Limite de Navegação</Label>
                <Textarea value={form.limiteNavegacao} onChange={(e) => updateField('limiteNavegacao', e.target.value.toUpperCase())} className="min-h-[80px] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Data de Emissão</Label>
                  <Input value={form.emissao} onChange={(e) => updateField('emissao', formatDate(e.target.value))} maxLength={10} placeholder="DD/MM/AAAA" />
                </div>
                <div>
                  <Label className="text-xs">Validade</Label>
                  <Input value={form.validade} onChange={(e) => updateField('validade', formatDate(e.target.value))} maxLength={10} placeholder="DD/MM/AAAA" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Local de Emissão</Label>
                <Select value={form.orgaoEmissao} onValueChange={(val) => updateField('orgaoEmissao', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Sudeste</SelectLabel>
                      <SelectItem value="CPSP (SP)">CPSP (SP)</SelectItem>
                      <SelectItem value="CPRJ (RJ)">CPRJ (RJ)</SelectItem>
                      <SelectItem value="CPES (ES)">CPES (ES)</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Sul</SelectLabel>
                      <SelectItem value="CPPR (PR)">CPPR (PR)</SelectItem>
                      <SelectItem value="CPSC (SC)">CPSC (SC)</SelectItem>
                      <SelectItem value="CPRS (RS)">CPRS (RS)</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Nordeste</SelectLabel>
                      <SelectItem value="CPBA (BA)">CPBA (BA)</SelectItem>
                      <SelectItem value="CPSE (SE)">CPSE (SE)</SelectItem>
                      <SelectItem value="CPAL (AL)">CPAL (AL)</SelectItem>
                      <SelectItem value="CPPE (PE)">CPPE (PE)</SelectItem>
                      <SelectItem value="CPPB (PB)">CPPB (PB)</SelectItem>
                      <SelectItem value="CPRN (RN)">CPRN (RN)</SelectItem>
                      <SelectItem value="CPCE (CE)">CPCE (CE)</SelectItem>
                      <SelectItem value="CPPI (PI)">CPPI (PI)</SelectItem>
                      <SelectItem value="CPMA (MA)">CPMA (MA)</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Norte/Centro-Oeste</SelectLabel>
                      <SelectItem value="CPMS (MS)">CPMS (MS)</SelectItem>
                      <SelectItem value="CPMT (MT)">CPMT (MT)</SelectItem>
                      <SelectItem value="CPGO (GO)">CPGO (GO)</SelectItem>
                      <SelectItem value="CPDF (DF)">CPDF (DF)</SelectItem>
                      <SelectItem value="CPAM (AM)">CPAM (AM)</SelectItem>
                      <SelectItem value="CPPA (PA)">CPPA (PA)</SelectItem>
                      <SelectItem value="CPAP (AP)">CPAP (AP)</SelectItem>
                      <SelectItem value="CPRO (RO)">CPRO (RO)</SelectItem>
                      <SelectItem value="CPRR (RR)">CPRR (RR)</SelectItem>
                      <SelectItem value="CPTO (TO)">CPTO (TO)</SelectItem>
                      <SelectItem value="CPAC (AC)">CPAC (AC)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Requisitos (opcional)</Label>
                <Textarea value={form.requisitos} onChange={(e) => updateField('requisitos', e.target.value.toUpperCase())} className="min-h-[60px] resize-none" />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* Right column - Preview */}
        <div className="flex-1 min-w-0">
          <div className="lg:sticky lg:top-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Eye className="h-4 w-4" /> Pré-visualização</CardTitle>
              </CardHeader>
              <CardContent>
                <ChaPreview
                  ref={chaPreviewRef}
                  nome={form.nome}
                  cpf={form.cpf}
                  dataNascimento={form.dataNascimento}
                  categoria={form.categoria}
                  categoria2={form.categoria2 || ''}
                  validade={form.validade}
                  emissao={form.emissao}
                  numeroInscricao={form.numeroInscricao}
                  limiteNavegacao={form.limiteNavegacao}
                  requisitos={form.requisitos}
                  orgaoEmissao={form.orgaoEmissao}
                  fotoPreview={fotoPreviewUrl}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
