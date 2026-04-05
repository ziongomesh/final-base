import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Megaphone, Plus, Pencil, Trash2, Sparkles, Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Announcement {
  id: number;
  admin_id: number;
  title: string;
  content: string | null;
  type: string;
  is_highlight: boolean;
  is_active: boolean;
  created_at: string;
}

interface Props {
  adminId: number;
}

export default function AnnouncementsManager({ adminId }: Props) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', content: '', type: 'news', is_highlight: false, is_active: true });

  const fetchAll = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({ title: '', content: '', type: 'news', is_highlight: false, is_active: true });
    setShowDialog(true);
  };

  const openEdit = (item: Announcement) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content || '',
      type: item.type,
      is_highlight: item.is_highlight,
      is_active: item.is_active,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Título obrigatório'); return; }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('announcements')
          .update({
            title: form.title,
            content: form.content || null,
            type: form.type,
            is_highlight: form.is_highlight,
            is_active: form.is_active,
          } as any)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Anúncio atualizado');
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert({
            admin_id: adminId,
            title: form.title,
            content: form.content || null,
            type: form.type,
            is_highlight: form.is_highlight,
            is_active: form.is_active,
          } as any);
        if (error) throw error;
        toast.success('Anúncio criado');
      }
      setShowDialog(false);
      fetchAll();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este anúncio?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Anúncio excluído');
    fetchAll();
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Anúncios</CardTitle>
          </div>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Novo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum anúncio criado</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                !item.is_active ? 'opacity-50 border-border/30' : 'border-border/50'
              }`}
            >
              <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${
                item.type === 'recharge'
                  ? item.is_highlight ? 'bg-yellow-500/20' : 'bg-emerald-500/15'
                  : 'bg-primary/10'
              }`}>
                {item.type === 'recharge' ? (
                  item.is_highlight ? <Sparkles className="h-4 w-4 text-yellow-400" /> : <Zap className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Megaphone className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{item.title}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                    {item.type === 'recharge' ? 'Recarga' : 'Notícia'}
                  </Badge>
                  {!item.is_active && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inativo</Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(item.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Anúncio' : 'Novo Anúncio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Promoção de recarga 2x"
              />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Descrição do anúncio..."
                rows={3}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">📢 Notícia</SelectItem>
                  <SelectItem value="recharge">⚡ Evento de Recarga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === 'recharge' && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">Destaque brilhante</span>
                </div>
                <Switch
                  checked={form.is_highlight}
                  onCheckedChange={(v) => setForm({ ...form, is_highlight: v })}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
