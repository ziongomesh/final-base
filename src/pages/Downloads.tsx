import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Download, Smartphone, Apple, Copy, Check, Loader2, Wrench, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isUsingMySQL } from '@/lib/db-config';
import { mysqlApi } from '@/lib/api-mysql';
import { supabase } from '@/integrations/supabase/client';

import iconCnh from '@/assets/icon-cnh.png';
import iconGovbr from '@/assets/icon-govbr.png';
import iconAbafe from '@/assets/icon-abafe.png';

interface AppInfo {
  id: string;
  title: string;
  description: string;
  icon: string;
  iphoneLink: string;
  apkLink: string;
  color: string;
}

export default function Downloads() {
  const { admin, loading, role } = useAuth();
  const [links, setLinks] = useState({
    cnh_iphone: '', cnh_apk: '',
    govbr_iphone: '', govbr_apk: '',
    abafe_iphone: '', abafe_apk: '',
  });
  const [loadingData, setLoadingData] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => { fetchLinks(); }, []);

  const fetchLinks = async () => {
    setLoadingData(true);
    try {
      let data: any = null;
      if (isUsingMySQL()) {
        data = await mysqlApi.downloads.fetch();
      } else {
        const res = await supabase
          .from('downloads')
          .select('cnh_iphone, cnh_apk, govbr_iphone, govbr_apk, abafe_apk, abafe_iphone')
          .eq('id', 1)
          .maybeSingle();
        data = res.data;
      }
      if (data) {
        setLinks({
          cnh_iphone: data.cnh_iphone || '',
          cnh_apk: data.cnh_apk || '',
          govbr_iphone: data.govbr_iphone || '',
          govbr_apk: data.govbr_apk || '',
          abafe_iphone: data.abafe_iphone || '',
          abafe_apk: data.abafe_apk || '',
        });
      }
    } catch (err) {
      console.error('Erro ao carregar links:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    if (!text) { toast.error('Nenhum link disponível'); return; }
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;

  const apps: AppInfo[] = [
    {
      id: 'cnh',
      title: 'CNH DIGITAL 2026',
      description: 'Carteira Nacional de Habilitação Digital',
      icon: iconCnh,
      iphoneLink: links.cnh_iphone,
      apkLink: links.cnh_apk,
      color: 'from-blue-500/20 to-blue-600/5',
    },
    {
      id: 'govbr',
      title: 'GOV.BR',
      description: 'RG Digital e CNH Náutica Arrais',
      icon: iconGovbr,
      iphoneLink: links.govbr_iphone,
      apkLink: links.govbr_apk,
      color: 'from-emerald-500/20 to-emerald-600/5',
    },
    {
      id: 'abafe',
      title: 'ABAFE',
      description: 'Carteira de Estudante Digital',
      icon: iconAbafe,
      iphoneLink: links.abafe_iphone,
      apkLink: links.abafe_apk,
      color: 'from-orange-500/20 to-orange-600/5',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Download className="h-6 w-6" /> Downloads
          </h1>
          <p className="text-muted-foreground mt-1">Copie os links dos aplicativos para instalar</p>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-5">
            {apps.map((app) => (
              <AppDownloadCard
                key={app.id}
                app={app}
                copiedField={copiedField}
                onCopy={copyToClipboard}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function AppDownloadCard({
  app,
  copiedField,
  onCopy,
}: {
  app: AppInfo;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasAnyLink = !!app.iphoneLink || !!app.apkLink;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header - clickable */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-4 p-5 bg-gradient-to-r ${app.color} text-left transition-colors hover:brightness-110`}
      >
        <img
          src={app.icon}
          alt={app.title}
          className="h-14 w-14 rounded-2xl shadow-lg border-2 border-background/50 shrink-0 object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-foreground">{app.title}</h3>
            {!hasAnyLink && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Wrench className="h-3 w-3" /> Manutenção
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{app.description}</p>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />}
      </button>

      {/* Expandable content */}
      {open && (
        hasAnyLink ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            <DownloadButton
              label="iPhone"
              sublabel="iOS App"
              icon={<Apple className="h-5 w-5" />}
              link={app.iphoneLink}
              field={`${app.id}_iphone`}
              copiedField={copiedField}
              onCopy={onCopy}
            />
            <DownloadButton
              label="Android"
              sublabel="APK Download"
              icon={<Smartphone className="h-5 w-5" />}
              link={app.apkLink}
              field={`${app.id}_apk`}
              copiedField={copiedField}
              onCopy={onCopy}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Wrench className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Em Manutenção</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Links serão disponibilizados em breve.</p>
          </div>
        )
      )}
    </div>
  );
}

function DownloadButton({
  label,
  sublabel,
  icon,
  link,
  field,
  copiedField,
  onCopy,
}: {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  link: string;
  field: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  const available = !!link;
  const isCopied = copiedField === field;

  return (
    <button
      onClick={() => onCopy(link, field)}
      disabled={!available}
      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all w-full ${
        available
          ? 'bg-card hover:bg-muted/40 hover:border-primary/30 cursor-pointer active:scale-[0.98]'
          : 'bg-muted/20 opacity-50 cursor-not-allowed'
      }`}
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
        available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">
          {available ? sublabel : 'Indisponível'}
        </p>
      </div>
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
        isCopied ? 'bg-green-500/10 text-green-500' : available ? 'bg-muted text-muted-foreground' : ''
      }`}>
        {isCopied ? <Check className="h-4 w-4" /> : available ? <Copy className="h-4 w-4" /> : null}
      </div>
    </button>
  );
}
