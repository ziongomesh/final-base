import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FileText, CheckCircle, Clock, CreditCard, AlertTriangle, Anchor, IdCard, Car, Home, Stethoscope, Eye, ChevronDown, ChevronUp, Crown, Globe, Lock, History, Wrench } from 'lucide-react';

import exemploCnh from '@/assets/exemplo-cnh.png';
import exemploGovbr from '@/assets/exemplo-govbr.png';
import exemploAbafe from '@/assets/exemplo-abafe.png';
import iconCnh from '@/assets/icon-cnh.png';
import iconGovbr from '@/assets/icon-govbr.png';
import iconAbafe from '@/assets/icon-abafe.png';
import iconHapvida from '@/assets/icon-hapvida.png';
import iconCnh2022 from '@/assets/icon-cnh-2022.jpg';
import iconMarinha from '@/assets/icon-marinha-new.png';
import iconDne from '@/assets/icon-dne.png';
import iconCie from '@/assets/icon-cie.png';
import iconPagmeia from '@/assets/icon-pagmeia.png';
import iconUpa24h from '@/assets/icon-upa24h.png';
import iconUnimed from '@/assets/icon-unimed.png';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface Service {
  id: string;
  name: string;
  description: string;
  credits: number;
  available: boolean;
  route: string;
  icon?: React.ElementType;
  iconImage?: string;
  exampleImage?: string;
  isHot?: boolean;
  specs?: string[];
  hasQr?: boolean;
  pdfGroup?: 'comprovante' | 'certidao';
}

interface ServiceCategory {
  title: string;
  icon: React.ElementType;
  services: Service[];
}

const categories: ServiceCategory[] = [
  {
    title: 'Documentos Digitais',
    icon: FileText,
    services: [
      { id: 'cnh-digital-2026', name: 'CNH DIGITAL (2026)', description: 'Carteira Nacional de Habilitação', credits: 1, available: true, route: '/servicos/cnh-digital', icon: FileText, iconImage: iconCnh, exampleImage: exemploCnh, specs: ['QR Code: Sim', 'PDF: Sim', 'App: Sim'] },
      { id: 'cnh-digital-2022', name: 'CNH DIGITAL (2022)', description: 'Modelo anterior da CNH Digital', credits: 1, available: false, route: '#', icon: FileText, iconImage: iconCnh2022, specs: ['QR Code: Sim', 'PDF: Sim', 'App: Sim'] },
      { id: 'rg-digital', name: 'CIN (RG DIGITAL)', description: 'Carteira de Identidade Nacional', credits: 1, available: true, route: '/servicos/rg-digital', icon: FileText, iconImage: iconGovbr, exampleImage: exemploGovbr, specs: ['QR Code: Sim', 'PDF: Sim', 'App: Sim'] },
      { id: 'cnh-arrais-nautica', name: 'ARRAIS NÁUTICA', description: 'Habilitação Náutica', credits: 1, available: true, route: '/servicos/cnh-nautica', icon: Anchor, iconImage: iconMarinha, exampleImage: exemploGovbr, specs: ['QR Code: Sim', 'PDF: Não', 'App: Sim'] },
    ],
  },
  {
    title: 'Carteira Estudantil',
    icon: IdCard,
    services: [
      { id: 'carteira-abafe', name: 'ABAFE', description: 'Carteira de Estudante', credits: 1, available: true, route: '/servicos/carteira-estudante', icon: IdCard, iconImage: iconAbafe, exampleImage: exemploAbafe, specs: ['QR Code: Sim', 'PDF: Não', 'App: Sim'] },
      { id: 'dne-digital', name: 'DNE', description: 'Documento Nacional do Estudante', credits: 1, available: false, route: '#', icon: IdCard, iconImage: iconDne, specs: ['QR Code: Sim', 'PDF: Não', 'App: Sim'] },
      { id: 'cie-estudante', name: 'CIE', description: 'Carteira de Identidade Estudantil', credits: 1, available: false, route: '#', icon: IdCard, iconImage: iconCie, specs: ['QR Code: Sim', 'PDF: Não', 'App: Sim'] },
      { id: 'pagmeia-estudante', name: 'PAGMEIA', description: 'Carteira de Estudante PagMeia', credits: 1, available: false, route: '#', icon: IdCard, iconImage: iconPagmeia, specs: ['QR Code: Sim', 'PDF: Não', 'App: Sim'] },
    ],
  },
  {
    title: 'PDF',
    icon: FileText,
    services: [
      { id: 'crlv-digital', name: 'CRLV QRCODE ON', description: 'Certificado de Registro e Licenciamento de Veículo', credits: 1, available: true, route: '/servicos/crlv-digital', icon: Car, hasQr: true, pdfGroup: 'comprovante' },
      { id: 'comprovante-residencia', name: 'COMPROVANTE DE RESIDÊNCIA', description: 'Comprovante de endereço', credits: 1, available: false, route: '#', icon: Home, pdfGroup: 'comprovante' },
      { id: 'certidao-nascimento-qr-on', name: 'CERTIDÃO DE NASCIMENTO', description: 'Certidão de nascimento com QR Code', credits: 1, available: false, route: '#', icon: FileText, hasQr: true, pdfGroup: 'certidao' },
      { id: 'certidao-nascimento-qr-off', name: 'CERTIDÃO DE NASCIMENTO', description: 'Certidão de nascimento sem QR Code', credits: 1, available: false, route: '#', icon: FileText, hasQr: false, pdfGroup: 'certidao' },
      { id: 'certidao-obito', name: 'CERTIDÃO DE ÓBITO', description: 'Certidão de óbito digital', credits: 1, available: false, route: '#', icon: FileText, pdfGroup: 'certidao' },
      { id: 'certidao-casamento', name: 'CERTIDÃO DE CASAMENTO', description: 'Certidão de casamento digital', credits: 1, available: false, route: '#', icon: FileText, pdfGroup: 'certidao' },
    ],
  },
  {
    title: 'Atestados',
    icon: Stethoscope,
    services: [
      { id: 'atestado-upa24h', name: 'UPA 24H', description: 'Atestado médico - Todos os estados', credits: 1, available: false, route: '#', icon: Stethoscope, iconImage: iconUpa24h, specs: ['PDF: Sim'] },
      { id: 'atestado-unimed', name: 'UNIMED', description: 'Atestado médico - Todos os estados', credits: 1, available: false, route: '#', icon: Stethoscope, iconImage: iconUnimed, specs: ['PDF: Sim'] },
      { id: 'atestado-hapvida', name: 'HAPVIDA', description: 'Atestado médico - Todos os estados', credits: 1, available: true, route: '/servicos/atestado-hapvida', icon: Stethoscope, iconImage: iconHapvida, specs: ['PDF: Sim'] },
    ],
  },
];

const documentTypes = [
  'Carteira Motorista',
  'Passaporte',
  'Declaração Bancos',
  'Faturas',
  'Cheques Bancos',
  'Carteira Militar',
  'Cartão de Seguro',
  'Carta de Residência',
];

interface VipCountry {
  name: string;
  code: string; // ISO 3166-1 alpha-2 lowercase for flagcdn
}

interface VipCategory {
  title: string;
  countries: VipCountry[];
}

const passportCountries: VipCountry[] = [
  { name: 'Estados Unidos', code: 'us' }, { name: 'Reino Unido', code: 'gb' }, { name: 'Canadá', code: 'ca' },
  { name: 'Austrália', code: 'au' }, { name: 'Japão', code: 'jp' }, { name: 'Alemanha', code: 'de' },
  { name: 'França', code: 'fr' }, { name: 'Itália', code: 'it' }, { name: 'Portugal', code: 'pt' },
  { name: 'México', code: 'mx' },
];

const idCountries: VipCountry[] = [
  { name: 'Eslováquia', code: 'sk' }, { name: 'Alemanha', code: 'de' }, { name: 'Ucrânia', code: 'ua' },
  { name: 'Noruega', code: 'no' }, { name: 'Armênia', code: 'am' }, { name: 'Áustria', code: 'at' },
  { name: 'Bangladesh', code: 'bd' }, { name: 'Bulgária', code: 'bg' }, { name: 'Bélgica', code: 'be' },
  { name: 'Camarões', code: 'cm' }, { name: 'Chile', code: 'cl' }, { name: 'Croácia', code: 'hr' },
  { name: 'Tcheco', code: 'cz' }, { name: 'Chipre', code: 'cy' }, { name: 'Dinamarca', code: 'dk' },
  { name: 'Dominicano', code: 'do' }, { name: 'Egito', code: 'eg' }, { name: 'Estônia', code: 'ee' },
  { name: 'Finlândia', code: 'fi' }, { name: 'Geórgia', code: 'ge' }, { name: 'Grécia', code: 'gr' },
  { name: 'Hungria', code: 'hu' }, { name: 'Índia', code: 'in' }, { name: 'Indonésia', code: 'id' },
  { name: 'Irlanda', code: 'ie' }, { name: 'Israel', code: 'il' }, { name: 'Itália', code: 'it' },
  { name: 'Costa do Marfim', code: 'ci' }, { name: 'Cazaquistão', code: 'kz' }, { name: 'Quênia', code: 'ke' },
  { name: 'Quirguistão', code: 'kg' }, { name: 'Letônia', code: 'lv' }, { name: 'Lituânia', code: 'lt' },
  { name: 'Malásia', code: 'my' }, { name: 'Malta', code: 'mt' }, { name: 'Holanda', code: 'nl' },
  { name: 'Nova Zelândia', code: 'nz' }, { name: 'Nigéria', code: 'ng' }, { name: 'Macedônia do Norte', code: 'mk' },
  { name: 'Peru', code: 'pe' }, { name: 'Portugal', code: 'pt' }, { name: 'Polônia', code: 'pl' },
  { name: 'Romênia', code: 'ro' }, { name: 'Sérvia', code: 'rs' }, { name: 'Cingapura', code: 'sg' },
  { name: 'Eslovênia', code: 'si' }, { name: 'África do Sul', code: 'za' }, { name: 'Coreia do Sul', code: 'kr' },
  { name: 'Espanha', code: 'es' }, { name: 'Suécia', code: 'se' }, { name: 'Suíça', code: 'ch' },
  { name: 'Taiwan', code: 'tw' }, { name: 'Tailândia', code: 'th' }, { name: 'Emirados Árabes Unidos', code: 'ae' },
  { name: 'Turquia', code: 'tr' }, { name: 'Venezuela', code: 've' }, { name: 'Vietnã', code: 'vn' },
  { name: 'Luxemburgo', code: 'lu' },
];

const dlCountries: VipCountry[] = [
  { name: 'Estados Unidos', code: 'us' }, { name: 'Reino Unido', code: 'gb' }, { name: 'China', code: 'cn' },
  { name: 'Hong Kong', code: 'hk' }, { name: 'França', code: 'fr' }, { name: 'Canadá', code: 'ca' },
  { name: 'Alemanha', code: 'de' }, { name: 'Japão', code: 'jp' }, { name: 'Austrália', code: 'au' },
  { name: 'México', code: 'mx' },
];

const billCountries: VipCountry[] = [
  { name: 'Estados Unidos', code: 'us' }, { name: 'Reino Unido', code: 'gb' },
  { name: 'Canadá', code: 'ca' }, { name: 'Austrália', code: 'au' }, { name: 'Alemanha', code: 'de' },
];

const vipCategories: VipCategory[] = [
  { title: 'Passaportes', countries: passportCountries },
  { title: 'Carteiras de Identidade', countries: idCountries },
  { title: 'Carteiras de Motorista', countries: dlCountries },
  { title: 'Extratos Bancários', countries: billCountries },
];

// ─── Service Card (Nacional) ───
function ServiceCard({ service, hasCredits, isMaintenance }: { service: Service; hasCredits: boolean; isMaintenance?: boolean }) {
  const navigate = useNavigate();
  const canAccess = service.available && hasCredits && !isMaintenance;
  const Icon = service.icon || FileText;
  const [showExample, setShowExample] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showExample) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) setShowExample(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExample]);

  return (
    <div ref={cardRef} className="relative">
      <div
        className={`bg-card border border-border rounded-lg p-3 flex items-center gap-3 transition-shadow ${isMaintenance ? 'opacity-50 cursor-not-allowed' : service.available ? (canAccess ? 'hover:shadow-md hover:border-primary/30 cursor-pointer' : 'cursor-default') : 'opacity-50 cursor-default'}`}
        onClick={() => !isMaintenance && canAccess && navigate(service.route)}
      >
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden" style={{ clipPath: 'circle(50%)' }}>
          {service.iconImage
            ? <img src={service.iconImage} alt={service.name} className={`object-center ${service.id === 'cnh-arrais-nautica' ? 'h-full w-full object-contain' : 'h-[140%] w-[140%] object-cover'}`} />
            : <Icon className="h-7 w-7 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">{service.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{service.description}</p>
          {service.specs && service.specs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {service.specs.map((spec) => (
                <span key={spec} className="text-[9px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">{spec}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {service.exampleImage && (
            <button onClick={(e) => { e.stopPropagation(); setShowExample(!showExample); }} className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-medium transition-colors px-1.5 py-0.5 rounded bg-primary/5 hover:bg-primary/10">
              <Eye className="h-2.5 w-2.5" /> Exemplo
            </button>
          )}
          <span className="text-xs text-muted-foreground hidden sm:inline">{service.credits} cred.</span>
          {isMaintenance ? (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
              <Wrench className="h-2.5 w-2.5" /> Manutenção
            </Badge>
          ) : service.available ? (
            <Badge variant="default" className="bg-success text-success-foreground text-[10px] px-1.5 py-0">
              <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Ativo
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              <Clock className="h-2.5 w-2.5 mr-0.5" /> Breve
            </Badge>
          )}
        </div>
      </div>
      {showExample && service.exampleImage && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <img src={service.exampleImage} alt={`Exemplo ${service.name}`} className="w-full object-contain max-h-[300px]" draggable={false} onContextMenu={(e) => e.preventDefault()} />
        </div>
      )}
    </div>
  );
}

// ─── Accordion Category (Nacional) ───
function CategoryAccordion({ cat, hasCredits, maintenanceMap }: { cat: ServiceCategory; hasCredits: boolean; maintenanceMap: Record<string, boolean> }) {
  const [open, setOpen] = useState(false);
  const Icon = cat.icon;
  const activeCount = cat.services.filter(s => s.available).length;
  const isPdfCategory = cat.title === 'PDF';
  const sorted = [...cat.services.filter(s => s.available), ...cat.services.filter(s => !s.available)];

  const comprovantes = cat.services.filter(s => s.pdfGroup === 'comprovante');
  const certidoes = cat.services.filter(s => s.pdfGroup === 'certidao');
  const sortGroup = (arr: Service[]) => [...arr.filter(s => s.available), ...arr.filter(s => !s.available)];

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-card hover:bg-muted/50 font-semibold text-sm transition-colors"
      >
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="flex-1 text-left text-foreground">{cat.title}</span>
        {activeCount > 0 && (
          <Badge variant="secondary" className="text-[10px] border-0">{activeCount} ativo{activeCount > 1 ? 's' : ''}</Badge>
        )}
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="p-2 bg-card">
          {isPdfCategory && comprovantes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1 border-b border-border">Comprovantes</h4>
                {sortGroup(comprovantes).map((service) => (
                  <ServiceCard key={service.id} service={service} hasCredits={hasCredits} isMaintenance={!!maintenanceMap[service.id]} />
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1 border-b border-border">Certidões</h4>
                {sortGroup(certidoes).map((service) => (
                  <ServiceCard key={service.id} service={service} hasCredits={hasCredits} isMaintenance={!!maintenanceMap[service.id]} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map((service) => (
                <ServiceCard key={service.id} service={service} hasCredits={hasCredits} isMaintenance={!!maintenanceMap[service.id]} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Country Card (expande docs) ───
function CountryCard({ country }: { country: VipCountry }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors ${open ? 'bg-amber-900/30' : 'bg-card hover:bg-muted/50'}`}
      >
        <img src={`https://flagcdn.com/w40/${country.code}.png`} alt={country.name} className="h-5 w-7 rounded-sm object-cover" loading="lazy" />
        <span className="flex-1 text-left font-medium text-sm text-foreground">{country.name}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="p-2 space-y-1 bg-card">
          {documentTypes.map((doc) => (
            <div key={doc} className="flex items-center gap-3 px-3 py-2 rounded-md border border-border/40 bg-muted/30 opacity-60 cursor-default">
              <span className="flex-1 text-xs text-foreground">{doc}</span>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                <Clock className="h-2 w-2 mr-0.5" /> Breve
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── VIP Category Accordion (gold) ───
function VipCategoryAccordion({ cat }: { cat: VipCategory }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(43, 50%, 35%)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 font-semibold text-sm transition-colors"
        style={{
          background: 'linear-gradient(135deg, hsl(43, 60%, 25%) 0%, hsl(38, 55%, 30%) 50%, hsl(43, 60%, 25%) 100%)',
          color: 'hsl(43, 80%, 75%)',
        }}
      >
        <span className="flex-1 text-left">{cat.title}</span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: 'hsl(43, 50%, 20%)', color: 'hsl(43, 80%, 70%)' }}
        >
          {cat.countries.length}
        </span>
        {open
          ? <ChevronUp className="h-4 w-4" style={{ color: 'hsl(43, 80%, 65%)' }} />
          : <ChevronDown className="h-4 w-4" style={{ color: 'hsl(43, 80%, 65%)' }} />
        }
      </button>
      {open && (
        <div className="p-2 space-y-1.5 bg-card">
          {cat.countries.map((country) => (
            <CountryCard key={country.name} country={country} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ───
export default function Servicos() {
  const { admin, credits, loading } = useAuth();
  const navigate = useNavigate();
  const hasCredits = credits > 0;
  const [maintenanceMap, setMaintenanceMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!admin) return;
    const fetchMaintenance = async () => {
      try {
        const envUrl = import.meta.env.VITE_API_URL as string | undefined;
        let apiBase = envUrl ? envUrl.replace(/\/+$/, '') : 'http://localhost:4000/api';
        if (!apiBase.endsWith('/api')) apiBase += '/api';
        const resp = await fetch(`${apiBase}/maintenance`, {
          headers: {
            'x-admin-id': String(admin.id),
            'x-session-token': admin.session_token || '',
          },
        });
        if (resp.ok) {
          setMaintenanceMap(await resp.json());
        }
      } catch {}
    };
    fetchMaintenance();
  }, [admin]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!admin) return <Navigate to="/login" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground mt-1">Escolha um serviço para começar</p>
          <button
            onClick={() => navigate('/historico-servicos')}
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/50 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <History className="h-3.5 w-3.5" />
            Histórico de Serviços
          </button>
        </div>

        {!hasCredits && (
          <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Você está sem créditos</p>
              <p className="text-sm text-muted-foreground">Recarregue com seu master para continuar utilizando os serviços.</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="nacional" className="w-full">
          <TabsList className="w-full mb-4 h-11">
            <TabsTrigger value="nacional" className="flex-1 gap-2 text-sm font-semibold">
              <Globe className="h-4 w-4" /> Nacional
            </TabsTrigger>
            <TabsTrigger value="internacional" className="flex-1 gap-2 text-sm font-semibold">
              <Crown className="h-4 w-4" /> Internacional VIP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nacional" className="space-y-3 mt-0">
            {categories.map((cat) => (
              <CategoryAccordion key={cat.title} cat={cat} hasCredits={hasCredits} maintenanceMap={maintenanceMap} />
            ))}
          </TabsContent>

          <TabsContent value="internacional" className="space-y-3 mt-0">
            {/* VIP Banner - Gold compact */}
            <div
              className="relative overflow-hidden rounded-xl p-3"
              style={{
                background: 'linear-gradient(135deg, hsl(43, 60%, 22%) 0%, hsl(38, 55%, 30%) 40%, hsl(48, 70%, 40%) 100%)',
                border: '1px solid hsl(43, 60%, 40%)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(43, 50%, 30%)' }}>
                  <Crown className="h-5 w-5" style={{ color: 'hsl(43, 80%, 70%)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'hsl(43, 80%, 80%)' }}>
                    Internacional VIP
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'hsl(43, 50%, 25%)', color: 'hsl(43, 80%, 70%)' }}>VIP</span>
                  </h3>
                  <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'hsl(43, 40%, 60%)' }}>Em breve disponível.</p>
                </div>
              </div>
              <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full" style={{ background: 'hsla(43, 60%, 50%, 0.1)' }} />
            </div>

            {/* Observação */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold text-foreground mb-1">ℹ️ Como funciona?</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Após todos os módulos do Brasil nativos da base estiverem disponíveis, iremos disponibilizar o internacional.
                Você poderá gerar passaportes em foto, extratos, PDFs, licenças de dirigir, militares — idênticas 100% ao original.
              </p>
            </div>

            {vipCategories.map((cat) => (
              <VipCategoryAccordion key={cat.title} cat={cat} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}