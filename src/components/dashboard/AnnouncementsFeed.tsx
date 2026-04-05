import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Zap, Sparkles, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Announcement {
  id: number;
  title: string;
  content: string | null;
  type: string;
  is_highlight: boolean;
  created_at: string;
}

export default function AnnouncementsFeed() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('id, title, content, type, is_highlight, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      setAnnouncements((data as any) || []);
      setLoading(false);
    };
    fetchAnnouncements();
  }, []);

  if (loading) return null;
  if (announcements.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Anúncios</h3>
      </div>

      <div className="space-y-2">
        {announcements.map((item) => (
          <AnnouncementCard key={item.id} announcement={item} />
        ))}
      </div>
    </div>
  );
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const isRecharge = announcement.type === 'recharge';
  const isHighlight = announcement.is_highlight;

  return (
    <Card
      className={`overflow-hidden border transition-all duration-300 ${
        isRecharge && isHighlight
          ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] animate-pulse-glow'
          : isRecharge
          ? 'border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
          : 'border-border/50'
      }`}
      style={
        isRecharge && isHighlight
          ? {
              background: `linear-gradient(135deg, hsl(220 25% 8%) 0%, hsl(45 80% 10%) 50%, hsl(220 25% 8%) 100%)`,
            }
          : undefined
      }
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${
              isRecharge
                ? isHighlight
                  ? 'bg-yellow-500/20'
                  : 'bg-emerald-500/15'
                : 'bg-primary/10'
            }`}
          >
            {isRecharge ? (
              isHighlight ? (
                <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
              ) : (
                <Zap className="h-4 w-4 text-emerald-400" />
              )
            ) : (
              <Megaphone className="h-4 w-4 text-primary" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`text-sm font-semibold truncate ${
                  isRecharge && isHighlight
                    ? 'text-yellow-300'
                    : 'text-foreground'
                }`}
              >
                {announcement.title}
              </span>
              {isRecharge && (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 shrink-0 ${
                    isHighlight
                      ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
                      : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                  }`}
                >
                  {isHighlight ? '🔥 PROMO' : 'Recarga'}
                </Badge>
              )}
            </div>
            {announcement.content && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {announcement.content}
              </p>
            )}
            <span className="text-[10px] text-muted-foreground/60 mt-1 block">
              {format(new Date(announcement.created_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}
