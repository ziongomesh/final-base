import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, Upload, AlertTriangle } from 'lucide-react';
import { estudanteService, type EstudanteRecord } from '@/lib/estudante-service';

interface Props {
  registro: EstudanteRecord;
  onClose: () => void;
  onSaved: () => void;
}

const formatDate = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length >= 5) return d.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
  if (d.length >= 3) return d.replace(/(\d{2})(\d{0,2})/, '$1/$2');
  return d;
};

export default function EstudanteEditView({ registro, onClose, onSaved }: Props) {
  const { admin } = useAuth();
  const [nome, setNome] = useState(registro.nome);
  const [rg, setRg] = useState(registro.rg);
  const [dataNascimento, setDataNascimento] = useState(
    registro.data_nascimento?.includes('-')
      ? registro.data_nascimento.split('-').reverse().join('/')
      : registro.data_nascimento || ''
  );
  const [faculdade, setFaculdade] = useState(registro.faculdade);
  const [graduacao, setGraduacao] = useState(registro.graduacao);
  const [newFoto, setNewFoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Build photo preview URL
  const cleanCpf = registro.cpf.replace(/\D/g, '');
  const isMySQL = import.meta.env.VITE_USE_MYSQL === 'true';
  const fotoPreviewUrl = (() => {
    if (registro.perfil_imagem) {
      if (registro.perfil_imagem.startsWith('http')) return registro.perfil_imagem;
      if (isMySQL) {
        const envUrl = import.meta.env.VITE_API_URL as string | undefined;
        let baseUrl = 'http://localhost:4000';
        if (envUrl) baseUrl = envUrl.replace(/\/api\/?$/, '');
        else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') baseUrl = window.location.origin;
        return `${baseUrl}${registro.perfil_imagem}`;
      }
    }
    return null;
  })();

  const handleSave = async () => {
    if (!admin) return;
    setSaving(true);
    try {
      let fotoBase64: string | undefined;
      if (newFoto) {
        fotoBase64 = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsDataURL(newFoto);
        });
      }

      const convertDate = (d: string) => {
        if (!d || !d.includes('/')) return d;
        const [day, month, year] = d.split('/');
        return `${year}-${month}-${day}`;
      };

      await estudanteService.update({
        admin_id: admin.id,
        session_token: admin.session_token,
        estudante_id: registro.id,
        nome: nome.toUpperCase(),
        rg: rg.toUpperCase(),
        data_nascimento: convertDate(dataNascimento),
        faculdade: faculdade.toUpperCase(),
        graduacao: graduacao.toUpperCase(),
        fotoBase64,
      });

      onSaved();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <h1 className="text-xl font-bold">Editar Carteira de Estudante</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do Estudante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Nome Completo</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value.toUpperCase())} />
            </div>
            <div>
              <Label className="text-xs">CPF</Label>
              <Input value={registro.cpf} disabled className="bg-muted" />
            </div>
            <div>
              <Label className="text-xs">RG</Label>
              <Input value={rg} onChange={(e) => setRg(e.target.value.toUpperCase())} />
            </div>
            <div>
              <Label className="text-xs">Data de Nascimento</Label>
              <Input value={dataNascimento} onChange={(e) => setDataNascimento(formatDate(e.target.value))} maxLength={10} />
            </div>
            <div>
              <Label className="text-xs">Faculdade</Label>
              <Input value={faculdade} onChange={(e) => setFaculdade(e.target.value.toUpperCase())} />
            </div>
            <div>
              <Label className="text-xs">Graduação</Label>
              <Input value={graduacao} onChange={(e) => setGraduacao(e.target.value.toUpperCase())} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Foto do Estudante</Label>
            <div className="flex items-center gap-2 p-2 bg-accent/30 border border-accent rounded-lg mb-2 mt-1">
              <AlertTriangle className="h-3 w-3 text-accent-foreground shrink-0" />
              <p className="text-[10px] text-accent-foreground">A foto deve ter fundo branco.</p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {(newFoto || fotoPreviewUrl) && (
                <img
                  src={newFoto ? URL.createObjectURL(newFoto) : fotoPreviewUrl!}
                  alt="Foto"
                  className="h-16 w-16 object-cover rounded border"
                />
              )}
              <label className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors text-xs text-muted-foreground">
                <Upload className="h-4 w-4" />
                {newFoto ? newFoto.name : 'Trocar foto'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setNewFoto(file);
                  }}
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>}
      </Button>
    </div>
  );
}
