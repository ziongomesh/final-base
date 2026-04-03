import { useState } from 'react';
import { MessageSquarePlus, Send, X, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function SuggestionButton() {
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const canViewList = role === 'dono' || role === 'sub';

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await (api as any).suggestions.send(message.trim());
      toast.success('Sugestão enviada');
      setMessage('');
      setOpen(false);
    } catch {
      toast.error('Erro ao enviar sugestão');
    } finally {
      setSending(false);
    }
  };

  const loadSuggestions = async () => {
    setLoadingList(true);
    try {
      const data = await (api as any).suggestions.list();
      setSuggestions(data);
    } catch {
      toast.error('Erro ao carregar sugestões');
    } finally {
      setLoadingList(false);
    }
  };

  const markRead = async (id: number) => {
    try {
      await (api as any).suggestions.markRead(id);
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, is_read: 1 } : s));
    } catch {}
  };

  return (
    <>
      {/* Floating buttons */}
      <div className="fixed top-[70px] right-4 z-50 flex items-center gap-2 lg:top-4">
        {canViewList && (
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-full shadow-md bg-background/80 backdrop-blur"
            onClick={() => { setListOpen(true); loadSuggestions(); }}
          >
            <Inbox className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9 rounded-full shadow-md bg-background/80 backdrop-blur"
          onClick={() => setOpen(true)}
        >
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Modal enviar sugestão */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm p-5 gap-4">
          <h3 className="text-sm font-semibold">Enviar sugestão</h3>
          <p className="text-xs text-muted-foreground">
            Sua ideia será enviada para a administração.
          </p>
          <Textarea
            placeholder="Descreva sua sugestão..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="min-h-[100px] text-sm"
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{message.length}/500</span>
            <Button size="sm" onClick={handleSend} disabled={sending || !message.trim()}>
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {sending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
          <div className="border-t pt-3 mt-1 space-y-1">
            <p className="text-xs text-muted-foreground">
              Está com dúvidas ou achou algum bug?
            </p>
            <a
              href="https://wa.me/595986741629"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              Fale com nosso suporte via WhatsApp
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal listar sugestões (dono/sub) */}
      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-w-md p-5 gap-4 max-h-[80vh] overflow-hidden flex flex-col">
          <h3 className="text-sm font-semibold">Sugestões recebidas</h3>
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {loadingList ? (
              <p className="text-xs text-muted-foreground text-center py-8">Carregando...</p>
            ) : suggestions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhuma sugestão ainda.</p>
            ) : (
              suggestions.map(s => (
                <div
                  key={s.id}
                  className={`p-3 rounded-lg border text-sm space-y-1 ${
                    s.is_read ? 'opacity-50' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium">{s.admin_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(s.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {!s.is_read && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        onClick={() => markRead(s.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-foreground/80 whitespace-pre-wrap">{s.message}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
