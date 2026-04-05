import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FileText, CheckCircle, Clock, CreditCard, AlertTriangle, Anchor, IdCard, Car, Home, Stethoscope, Eye, ChevronDown, ChevronUp, Crown, Globe, Lock, History, Wrench, Banknote, Receipt, Camera, Zap, Target, Trophy, Sparkles, Star } from 'lucide-react';

import exemploCnh from '@/assets/exemplo-cnh.png';
import exemploGovbr from '@/assets/exemplo-govbr.png';
import exemploAbafe from '@/assets/exemplo-abafe.png';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

interface Service {
  id: string;
  name: string;
  description: string;
  credits: number;
  available: boolean;
  route: string;
  icon?: React.ElementType;
  iconImage?: string;
  faIcon?: string;
  exampleImage?: string;
  isHot?: boolean;
  specs?: string[];
  hasQr?: boolean;
  pdfGroup?: 'comprovante' | 'certidao';
  atestadoGroup?: 'privado' | 'publico';
  fotoGroup?: 'documentos' | 'cartoes';
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
      { id: 'cnh-digital-2026', name: 'CNH DIGITAL (2026)', description: 'Carteira Nacional de Habilitação', credits: 1, available: true, route: '/servicos/cnh-digital', icon: FileText, faIcon: 'fa-solid fa-id-card', exampleImage: exemploCnh, specs: ['QR Code: Sim', 'PDF: Sim', 'App: Sim'] },
      { id: 'cnh-digital-2022', name: 'CNH DIGITAL (2022)', description: 'Modelo anterior da CNH Digital', credits: 1, available: false, route: '#', icon: FileText, faIcon: 'fa-solid fa-id-card', specs: ['QR Code: Sim', 'PDF: Sim', 'App: Sim'] },
      { id: 'rg-digital', name: 'CIN (RG DIGITAL)', description: 'Carteira de Identidade Nacional', credits: 1, available: true, route: '/servicos/rg-digital', icon: FileText, faIcon: 'fa-solid fa-user', exampleImage: exemploGovbr, specs: ['QR Code: Sim', 'PDF: Sim', 'App: Sim'] },
      { id: 'cnh-arrais-nautica', name: 'ARRAIS NÁUTICA', description: 'Habilitação Náutica', credits: 1, available: true, route: '/servicos/cnh-nautica', icon: Anchor, faIcon: 'fa-solid fa-anchor', exampleImage: exemploGovbr, specs: ['QR Code: Sim', 'PDF: Não', 'App: Sim'] },
    ],
  },
  {
    title: 'Carteira Estudantil',
    icon: IdCard,
    services: [
      { id: 'carteira-abafe', name: 'ABAFE', description: 'Carteira de Estudante', credits: 1, available: true, route: '/servicos/carteira-estudante', icon: IdCard, faIcon: 'fa-solid fa-graduation-cap', exampleImage: exemploAbafe, specs: ['QR Code: Sim', 'PDF: Não', 'App: Sim'] },
      { id: 'dne-digital', name: 'DNE', description: 'Documento Nacional do Estudante', credits: 1, available: false, route: '#', icon: IdCard, faIcon: 'fa-solid fa-graduation-cap', specs: ['QR Code: Sim', 'PDF: Não', 'App: Sim'] },
      { id: 'cie-estudante', name: 'CIE', description: 'Carteira de Identidade Estudantil', credits: 1, available: false, route: '#', icon: IdCard, faIcon: 'fa-solid fa-graduation-cap', specs: ['QR Code: Sim', 'PDF: Não', 'App: Sim'] },
      { id: 'pagmeia-estudante', name: 'PAGMEIA', description: 'Carteira de Estudante PagMeia', credits: 1, available: false, route: '#', icon: IdCard, faIcon: 'fa-solid fa-graduation-cap', specs: ['QR Code: Sim', 'PDF: Não', 'App: Sim'] },
    ],
  },
  {
    title: 'Veículos',
    icon: Car,
    services: [
      { id: 'crlv-digital', name: 'CRLV QRCODE ON', description: 'Certificado de Registro e Licenciamento de Veículo', credits: 1, available: true, route: '/servicos/crlv-digital', icon: Car, faIcon: 'fa-solid fa-car', hasQr: true },
    ],
  },
  {
    title: 'PDF',
    icon: FileText,
    services: [
      { id: 'comprovante-residencia', name: 'COMPROVANTE DE RESIDÊNCIA', description: 'Comprovante de endereço', credits: 1, available: false, route: '#', icon: Home, faIcon: 'fa-solid fa-house', pdfGroup: 'comprovante' },
      { id: 'certidao-nascimento-qr-on', name: 'CERTIDÃO DE NASCIMENTO', description: 'Certidão de nascimento com QR Code', credits: 1, available: false, route: '#', icon: FileText, faIcon: 'fa-solid fa-file-lines', hasQr: true, pdfGroup: 'certidao' },
      { id: 'certidao-nascimento-qr-off', name: 'CERTIDÃO DE NASCIMENTO', description: 'Certidão de nascimento sem QR Code', credits: 1, available: false, route: '#', icon: FileText, faIcon: 'fa-solid fa-file-lines', hasQr: false, pdfGroup: 'certidao' },
      { id: 'certidao-obito', name: 'CERTIDÃO DE ÓBITO', description: 'Certidão de óbito digital', credits: 1, available: false, route: '#', icon: FileText, faIcon: 'fa-solid fa-cross', pdfGroup: 'certidao' },
      { id: 'certidao-casamento', name: 'CERTIDÃO DE CASAMENTO', description: 'Certidão de casamento digital', credits: 1, available: false, route: '#', icon: FileText, faIcon: 'fa-solid fa-ring', pdfGroup: 'certidao' },
    ],
  },
  {
    title: 'Comprovantes',
    icon: Receipt,
    services: [
      { id: 'pix-bradesco', name: 'BRADESCO PIX', description: 'Comprovante de transferência PIX Bradesco', credits: 1, available: true, route: '/servicos/comprovante-bradesco', icon: Receipt, faIcon: 'fa-solid fa-money-bill-transfer' },
      { id: 'pix-picpay', name: 'PICPAY PIX', description: 'Comprovante de transferência PIX PicPay', credits: 1, available: true, route: '/servicos/comprovante-picpay', icon: Receipt, faIcon: 'fa-solid fa-money-bill-transfer' },
      { id: 'pix-itau', name: 'ITAÚ PIX', description: 'Comprovante de transferência PIX Itaú', credits: 1, available: false, route: '#', icon: Receipt, faIcon: 'fa-solid fa-money-bill-transfer' },
      { id: 'pix-nubank', name: 'NUBANK PIX', description: 'Comprovante de transferência PIX Nubank', credits: 1, available: false, route: '#', icon: Receipt, faIcon: 'fa-solid fa-money-bill-transfer' },
      { id: 'pix-c6', name: 'C6 PIX', description: 'Comprovante de transferência PIX C6 Bank', credits: 1, available: false, route: '#', icon: Receipt, faIcon: 'fa-solid fa-money-bill-transfer' },
      { id: 'pix-99pay', name: '99PAY PIX', description: 'Comprovante de transferência PIX 99Pay', credits: 1, available: false, route: '#', icon: Receipt, faIcon: 'fa-solid fa-money-bill-transfer' },
      { id: 'pix-inter', name: 'INTER PIX', description: 'Comprovante de transferência PIX Inter', credits: 1, available: false, route: '#', icon: Receipt, faIcon: 'fa-solid fa-money-bill-transfer' },
    ],
  },
  {
    title: 'Atestados',
    icon: Stethoscope,
    services: [
      { id: 'atestado-hapvida', name: 'HAPVIDA', description: 'Atestado médico - Todos os estados', credits: 1, available: true, route: '/servicos/atestado-hapvida', icon: Stethoscope, faIcon: 'fa-solid fa-stethoscope', specs: ['PDF: Sim'], atestadoGroup: 'privado' },
      { id: 'atestado-unimed', name: 'UNIMED', description: 'Atestado médico - Todos os estados', credits: 1, available: false, route: '#', icon: Stethoscope, faIcon: 'fa-solid fa-stethoscope', specs: ['PDF: Sim'], atestadoGroup: 'privado' },
      { id: 'atestado-upa24h', name: 'UPA 24H', description: 'Atestado médico - Todos os estados', credits: 1, available: false, route: '#', icon: Stethoscope, faIcon: 'fa-solid fa-hospital', specs: ['PDF: Sim'], atestadoGroup: 'publico' },
      { id: 'atestado-umpa', name: 'UMPA', description: 'Atestado médico - Todos os estados', credits: 1, available: false, route: '#', icon: Stethoscope, faIcon: 'fa-solid fa-hospital', specs: ['PDF: Sim'], atestadoGroup: 'publico' },
      { id: 'atestado-ubs', name: 'UBS', description: 'Atestado médico - Todos os estados', credits: 1, available: false, route: '#', icon: Stethoscope, faIcon: 'fa-solid fa-clinic-medical', specs: ['PDF: Sim'], atestadoGroup: 'publico' },
      { id: 'atestado-caps', name: 'CAPS', description: 'Atestado médico - Todos os estados', credits: 1, available: false, route: '#', icon: Stethoscope, faIcon: 'fa-solid fa-brain', specs: ['PDF: Sim'], atestadoGroup: 'publico' },
    ],
  },
];

// ─── Mesa (Foto Documento) services — VIP Exclusivo ───
const mesaServices: Service[] = [
  { id: 'mesa-cnh', name: 'CNH NA MESA', description: 'CNH em foto sobre mesa/superfície', credits: 1, available: false, route: '#', icon: Camera, faIcon: 'fa-solid fa-id-card', specs: ['Foto: Sim'], fotoGroup: 'documentos' },
  { id: 'mesa-rg', name: 'RG NA MESA', description: 'RG em foto sobre mesa/superfície', credits: 1, available: false, route: '#', icon: Camera, faIcon: 'fa-solid fa-user', specs: ['Foto: Sim'], fotoGroup: 'documentos' },
  { id: 'mesa-oab', name: 'OAB NA MESA', description: 'Carteira OAB em foto sobre mesa/superfície', credits: 1, available: false, route: '#', icon: Camera, faIcon: 'fa-solid fa-scale-balanced', specs: ['Foto: Sim'], fotoGroup: 'documentos' },
  { id: 'mesa-crm', name: 'CRM NA MESA', description: 'Carteira CRM em foto sobre mesa/superfície', credits: 1, available: false, route: '#', icon: Camera, faIcon: 'fa-solid fa-user-doctor', specs: ['Foto: Sim'], fotoGroup: 'documentos' },
  { id: 'mesa-cartoes', name: 'CARTÕES NA MESA', description: 'Cartões de crédito em foto sobre mesa/superfície', credits: 1, available: false, route: '#', icon: CreditCard, faIcon: 'fa-solid fa-credit-card', specs: ['Foto: Sim'], fotoGroup: 'cartoes' },
];

// ─── VIP Services ───
const vipFotoServices: Service[] = [
  { id: 'foto-crm', name: 'CARTEIRA CRM', description: 'Carteira do Conselho Regional de Medicina', credits: 4, available: false, route: '#', icon: IdCard, specs: ['Foto: Sim'], fotoGroup: 'documentos' },
  { id: 'foto-oab', name: 'CARTEIRA OAB', description: 'Carteira da Ordem dos Advogados do Brasil', credits: 4, available: false, route: '#', icon: IdCard, specs: ['Foto: Sim'], fotoGroup: 'documentos' },
  { id: 'foto-cnh', name: 'CARTEIRA DE HABILITAÇÃO', description: 'CNH em formato foto', credits: 4, available: false, route: '#', icon: FileText, specs: ['Foto: Sim'], fotoGroup: 'documentos' },
  { id: 'cc-itau', name: 'ITAÚ', description: 'Cartão de crédito Itaú', credits: 4, available: false, route: '#', icon: CreditCard, fotoGroup: 'cartoes' },
  { id: 'cc-bradesco', name: 'BRADESCO', description: 'Cartão de crédito Bradesco', credits: 4, available: false, route: '#', icon: CreditCard, fotoGroup: 'cartoes' },
  { id: 'cc-nubank', name: 'NUBANK', description: 'Cartão de crédito Nubank', credits: 4, available: false, route: '#', icon: CreditCard, fotoGroup: 'cartoes' },
  { id: 'cc-picpay', name: 'PICPAY', description: 'Cartão de crédito PicPay', credits: 4, available: false, route: '#', icon: CreditCard, fotoGroup: 'cartoes' },
  { id: 'cc-santander', name: 'SANTANDER', description: 'Cartão de crédito Santander', credits: 4, available: false, route: '#', icon: CreditCard, fotoGroup: 'cartoes' },
  { id: 'cc-amex', name: 'AMERICAN EXPRESS', description: 'Cartão de crédito Amex', credits: 4, available: false, route: '#', icon: CreditCard, fotoGroup: 'cartoes' },
  { id: 'cc-c6', name: 'C6 BANK', description: 'Cartão de crédito C6 Bank', credits: 4, available: false, route: '#', icon: CreditCard, fotoGroup: 'cartoes' },
];

// ─── VIP tier helpers ───
type VipTier = 'none' | 'vip' | 'super_vip';

function getVipTier(weeklyServices: number): VipTier {
  if (weeklyServices >= 100) return 'super_vip';
  if (weeklyServices >= 50) return 'vip';
  return 'none';
}

function getVipLabel(tier: VipTier): string {
  if (tier === 'super_vip') return 'SUPER VIP';
  if (tier === 'vip') return 'VIP';
  return 'NORMAL';
}

function getVipCredits(tier: VipTier): number {
  if (tier === 'super_vip') return 2;
  if (tier === 'vip') return 3;
  return 4;
}

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
        className={`bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3 transition-shadow ${isMaintenance ? 'opacity-50 cursor-not-allowed' : service.available ? (canAccess ? 'hover:shadow-md hover:border-primary/30 cursor-pointer' : 'cursor-default') : 'opacity-50 cursor-default'}`}
        onClick={() => !isMaintenance && canAccess && navigate(service.route)}
      >
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
          {service.faIcon ? (
            <i className={`${service.faIcon} text-lg text-primary`} />
          ) : (
            <Icon className="h-7 w-7 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-white truncate">{service.name}</h3>
          <p className="text-xs text-white/40 truncate">{service.description}</p>
          {service.specs && service.specs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {service.specs.map((spec) => (
                <span key={spec} className="text-[9px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{spec}</span>
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
          <span className="text-xs text-white/30 hidden sm:inline">{service.credits} cred.</span>
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
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-white/10 bg-[#0d1520] shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
  const isComprovantes = cat.title === 'Comprovantes';
  const isAtestados = cat.title === 'Atestados';
  const sorted = [...cat.services.filter(s => s.available), ...cat.services.filter(s => !s.available)];

  const certidoes = cat.services.filter(s => s.pdfGroup === 'certidao');
  const pdfOthers = cat.services.filter(s => !s.pdfGroup || s.pdfGroup === 'comprovante');
  const atestadoPrivados = cat.services.filter(s => s.atestadoGroup === 'privado');
  const atestadoPublicos = cat.services.filter(s => s.atestadoGroup === 'publico');
  const sortGroup = (arr: Service[]) => [...arr.filter(s => s.available), ...arr.filter(s => !s.available)];

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/5 hover:bg-white/10 font-semibold text-sm transition-colors"
      >
        <Icon className="h-5 w-5 text-white/40" />
        <span className="flex-1 text-left text-white">{cat.title}</span>
        {activeCount > 0 && (
          <Badge variant="secondary" className="text-[10px] border-0">{activeCount} ativo{activeCount > 1 ? 's' : ''}</Badge>
        )}
        {open ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
      </button>
      {open && (
        <div className="p-2 bg-transparent">
          {isAtestados ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-white/30 uppercase tracking-wider px-2 pb-1 border-b border-white/10 flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> Privados
                </h4>
                {sortGroup(atestadoPrivados).map((service) => (
                  <ServiceCard key={service.id} service={service} hasCredits={hasCredits} isMaintenance={!!maintenanceMap[service.id]} />
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-white/30 uppercase tracking-wider px-2 pb-1 border-b border-white/10 flex items-center gap-1.5">
                  <Globe className="h-3 w-3" /> Públicos
                </h4>
                {sortGroup(atestadoPublicos).map((service) => (
                  <ServiceCard key={service.id} service={service} hasCredits={hasCredits} isMaintenance={!!maintenanceMap[service.id]} />
                ))}
              </div>
            </div>
          ) : isPdfCategory && certidoes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pdfOthers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-white/30 uppercase tracking-wider px-2 pb-1 border-b border-white/10 flex items-center gap-1.5">
                    <Home className="h-3 w-3" /> Comprovantes
                  </h4>
                  {sortGroup(pdfOthers).map((service) => (
                    <ServiceCard key={service.id} service={service} hasCredits={hasCredits} isMaintenance={!!maintenanceMap[service.id]} />
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-white/30 uppercase tracking-wider px-2 pb-1 border-b border-white/10 flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> Certidões
                </h4>
                {sortGroup(certidoes).map((service) => (
                  <ServiceCard key={service.id} service={service} hasCredits={hasCredits} isMaintenance={!!maintenanceMap[service.id]} />
                ))}
              </div>
            </div>
          ) : isComprovantes ? (
            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1 scrollbar-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(210 20% 25%) transparent' }}>
              {sorted.map((service) => (
                <ServiceCard key={service.id} service={service} hasCredits={hasCredits} isMaintenance={!!maintenanceMap[service.id]} />
              ))}
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

// ─── VIP Service Card (no icons, clean) ───
function VipServiceCard({ service, tier, hasCredits }: { service: Service; tier: VipTier; hasCredits: boolean }) {
  const navigate = useNavigate();
  const creditCost = getVipCredits(tier);
  const canAccess = service.available && hasCredits;

  return (
    <div
      className={`relative overflow-hidden rounded-lg p-3 flex items-center gap-3 transition-all ${
        service.available
          ? canAccess ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'
          : 'opacity-60 cursor-default'
      }`}
      style={{
        background: service.available
          ? 'linear-gradient(135deg, hsla(43, 50%, 20%, 0.6) 0%, hsla(38, 40%, 15%, 0.4) 100%)'
          : 'hsla(0, 0%, 100%, 0.03)',
        border: service.available
          ? '1px solid hsla(43, 60%, 40%, 0.4)'
          : '1px solid hsla(0, 0%, 100%, 0.08)',
      }}
      onClick={() => service.available && canAccess && navigate(service.route)}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate" style={{ color: service.available ? 'hsl(43, 80%, 80%)' : 'hsl(0, 0%, 60%)' }}>
          {service.name}
        </h3>
        <p className="text-xs truncate" style={{ color: service.available ? 'hsla(43, 40%, 60%, 0.8)' : 'hsla(0, 0%, 100%, 0.3)' }}>
          {service.description}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
          background: service.available
            ? (tier === 'super_vip' ? 'hsla(43, 80%, 50%, 0.2)' : tier === 'vip' ? 'hsla(43, 60%, 40%, 0.2)' : 'hsla(0, 0%, 100%, 0.05)')
            : 'hsla(0, 0%, 100%, 0.05)',
          color: service.available
            ? (tier === 'super_vip' ? 'hsl(43, 90%, 70%)' : tier === 'vip' ? 'hsl(43, 70%, 65%)' : 'hsl(0, 0%, 60%)')
            : 'hsl(0, 0%, 50%)',
        }}>
          {creditCost} cred.
        </span>
        {service.available ? (
          <Badge className="text-[10px] px-1.5 py-0 border-0" style={{ background: 'hsla(43, 60%, 40%, 0.3)', color: 'hsl(43, 80%, 70%)' }}>
            <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Ativo
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            <Clock className="h-2.5 w-2.5 mr-0.5" /> Breve
          </Badge>
        )}
      </div>
    </div>
  );
}

// ─── VIP Progress Bar ───
function VipProgressBar({ current, target, label, color }: { current: number; target: number; label: string; color: string }) {
  const pct = Math.min((current / target) * 100, 100);
  const achieved = current >= target;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold" style={{ color }}>{label}</span>
        <span className="text-[11px] font-mono" style={{ color: achieved ? color : 'hsla(0, 0%, 100%, 0.4)' }}>
          {current}/{target}
        </span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'hsla(0, 0%, 100%, 0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: achieved
              ? `linear-gradient(90deg, ${color}, ${color}dd)`
              : `linear-gradient(90deg, ${color}88, ${color}44)`,
            boxShadow: achieved ? `0 0 12px ${color}60` : 'none',
          }}
        />
      </div>
    </div>
  );
}

// ─── International Teaser ───
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
  code: string;
}

const internationalFlags = [
  { name: 'Estados Unidos', code: 'us' }, { name: 'Reino Unido', code: 'gb' }, { name: 'Canadá', code: 'ca' },
  { name: 'Austrália', code: 'au' }, { name: 'Japão', code: 'jp' }, { name: 'Alemanha', code: 'de' },
  { name: 'França', code: 'fr' }, { name: 'Itália', code: 'it' }, { name: 'Portugal', code: 'pt' },
  { name: 'México', code: 'mx' }, { name: 'Espanha', code: 'es' }, { name: 'Suíça', code: 'ch' },
];

// ─── Page ───
export default function Servicos() {
  const { admin, credits, loading } = useAuth();
  const navigate = useNavigate();
  const hasCredits = credits > 0;
  const [maintenanceMap, setMaintenanceMap] = useState<Record<string, boolean>>({});
  const [weeklyServices, setWeeklyServices] = useState(0);

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

  useEffect(() => {
    if (!admin) return;
    api.admins.getMyDocumentStats(admin.id)
      .then((stats: any) => setWeeklyServices(stats?.week || 0))
      .catch(() => {});
  }, [admin]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!admin) return <Navigate to="/login" replace />;

  const allServicesNacional = categories.flatMap(c => c.services);
  const totalServices = allServicesNacional.length;
  const activeServices = allServicesNacional.filter(s => s.available).length;
  const pendingServices = totalServices - activeServices;

  const tier = getVipTier(weeklyServices);
  const tierLabel = getVipLabel(tier);
  const tierCredits = getVipCredits(tier);


  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Serviços</h1>
          <p className="text-white/40 mt-1">Escolha um serviço para começar</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-400">
              <CheckCircle className="h-3 w-3" /> {activeServices} ativos
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-white/40">
              <Clock className="h-3 w-3" /> {pendingServices} em breve
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
              {totalServices} total
            </span>
          </div>
          <button
            onClick={() => navigate('/historico-servicos')}
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <History className="h-3.5 w-3.5" />
            Histórico de Serviços
          </button>
        </div>

        {!hasCredits && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-semibold text-white">Você está sem créditos</p>
              <p className="text-sm text-white/50">Recarregue com seu master para continuar utilizando os serviços.</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="nacional" className="w-full">
          <TabsList className="w-full mb-4 h-11 bg-white/5 border border-white/10">
            <TabsTrigger value="nacional" className="flex-1 gap-2 text-sm font-semibold">
              <Globe className="h-4 w-4" /> Nacional
            </TabsTrigger>
            <TabsTrigger value="vip" className="flex-1 gap-2 text-sm font-semibold">
              <Crown className="h-4 w-4" /> Exclusivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nacional" className="space-y-3 mt-0">
            {categories.map((cat) => (
              <CategoryAccordion key={cat.title} cat={cat} hasCredits={hasCredits} maintenanceMap={maintenanceMap} />
            ))}
          </TabsContent>

          <TabsContent value="vip" className="space-y-5 mt-0">
            {/* ── Como funciona ── */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, hsl(43, 60%, 15%) 0%, hsl(38, 50%, 22%) 40%, hsl(48, 70%, 30%) 100%)',
                border: '1px solid hsl(43, 60%, 35%)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Crown className="h-6 w-6" style={{ color: 'hsl(43, 90%, 70%)' }} />
                <div>
                  <h2 className="text-lg font-extrabold" style={{ color: 'hsl(43, 90%, 80%)' }}>
                    Como funciona o VIP?
                  </h2>
                  <p className="text-xs" style={{ color: 'hsl(43, 40%, 55%)' }}>
                    Área exclusiva — não se compra, se conquista
                  </p>
                </div>
                {tier !== 'none' && (
                  <div
                    className="ml-auto px-3 py-1 rounded-full text-xs font-extrabold animate-pulse"
                    style={{
                      background: tier === 'super_vip'
                        ? 'linear-gradient(135deg, hsl(43, 90%, 50%), hsl(38, 80%, 40%))'
                        : 'linear-gradient(135deg, hsl(43, 60%, 40%), hsl(38, 50%, 30%))',
                      color: 'hsl(43, 90%, 95%)',
                      boxShadow: tier === 'super_vip'
                        ? '0 0 20px hsla(43, 90%, 50%, 0.4)'
                        : '0 0 12px hsla(43, 60%, 40%, 0.3)',
                    }}
                  >
                    {tierLabel}
                  </div>
                )}
              </div>

              {/* Explicação passo a passo */}
              <div className="space-y-3 mb-5">
                <div className="flex items-start gap-3 rounded-lg p-3" style={{ background: 'hsla(0, 0%, 100%, 0.04)' }}>
                  <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 font-extrabold text-xs" style={{ background: 'hsla(43, 60%, 40%, 0.3)', color: 'hsl(43, 90%, 70%)' }}>1</div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'hsl(43, 80%, 80%)' }}>Faça serviços durante a semana</p>
                    <p className="text-[11px]" style={{ color: 'hsl(43, 30%, 55%)' }}>Cada CNH, RG, CIN, Náutica ou qualquer serviço realizado conta para sua meta semanal.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg p-3" style={{ background: 'hsla(0, 0%, 100%, 0.04)' }}>
                  <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 font-extrabold text-xs" style={{ background: 'hsla(43, 60%, 40%, 0.3)', color: 'hsl(43, 90%, 70%)' }}>2</div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'hsl(43, 80%, 80%)' }}>Bata a meta e suba de nível</p>
                    <p className="text-[11px]" style={{ color: 'hsl(43, 30%, 55%)' }}>50 serviços na semana = VIP. 100 serviços na semana = Super VIP. Simples assim.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg p-3" style={{ background: 'hsla(0, 0%, 100%, 0.04)' }}>
                  <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 font-extrabold text-xs" style={{ background: 'hsla(43, 60%, 40%, 0.3)', color: 'hsl(43, 90%, 70%)' }}>3</div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'hsl(43, 80%, 80%)' }}>Pague menos por cada serviço</p>
                    <p className="text-[11px]" style={{ color: 'hsl(43, 30%, 55%)' }}>Quanto maior seu nível, menos créditos você gasta. Todos os serviços VIP ficam mais baratos.</p>
                  </div>
                </div>
              </div>

              {/* Tabela comparativa */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsla(43, 50%, 35%, 0.4)' }}>
                <div className="grid grid-cols-4 text-center text-[11px] font-bold" style={{ background: 'hsla(43, 50%, 25%, 0.5)' }}>
                  <div className="p-2" style={{ color: 'hsl(43, 60%, 60%)' }}>Nível</div>
                  <div className="p-2" style={{ color: 'hsl(43, 60%, 60%)' }}>Meta Semanal</div>
                  <div className="p-2" style={{ color: 'hsl(43, 60%, 60%)' }}>Custo/Serviço</div>
                  <div className="p-2" style={{ color: 'hsl(43, 60%, 60%)' }}>Economia</div>
                </div>
                {[
                  { label: 'Normal', meta: '—', cost: '4 cred.', save: '—', active: tier === 'none' },
                  { label: 'VIP', meta: '50/sem', cost: '3 cred.', save: '-25%', active: tier === 'vip' },
                  { label: 'Super VIP', meta: '100/sem', cost: '2 cred.', save: '-50%', active: tier === 'super_vip' },
                ].map((row, i) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-4 text-center text-[11px]"
                    style={{
                      background: row.active
                        ? 'linear-gradient(90deg, hsla(43, 70%, 45%, 0.25), hsla(43, 60%, 30%, 0.15))'
                        : i % 2 === 0 ? 'hsla(0, 0%, 100%, 0.02)' : 'transparent',
                      borderTop: '1px solid hsla(43, 40%, 30%, 0.2)',
                    }}
                  >
                    <div className="p-2.5 font-bold" style={{ color: row.active ? 'hsl(43, 90%, 80%)' : 'hsl(0, 0%, 60%)' }}>
                      {row.label} {row.active && '●'}
                    </div>
                    <div className="p-2.5" style={{ color: row.active ? 'hsl(43, 70%, 70%)' : 'hsl(0, 0%, 50%)' }}>{row.meta}</div>
                    <div className="p-2.5 font-bold" style={{ color: row.active ? 'hsl(43, 90%, 75%)' : 'hsl(0, 0%, 55%)' }}>{row.cost}</div>
                    <div className="p-2.5 font-bold" style={{ color: row.save !== '—' ? 'hsl(120, 60%, 55%)' : 'hsl(0, 0%, 40%)' }}>{row.save}</div>
                  </div>
                ))}
              </div>

              {/* Progress bars */}
              <div className="space-y-3 mt-5">
                <p className="text-[11px] font-bold" style={{ color: 'hsl(43, 70%, 65%)' }}>Seu progresso esta semana:</p>
                <VipProgressBar current={weeklyServices} target={50} label="VIP — 50 serviços/semana" color="hsl(43, 70%, 55%)" />
                <VipProgressBar current={weeklyServices} target={100} label="SUPER VIP — 100 serviços/semana" color="hsl(43, 90%, 65%)" />
              </div>
            </div>


            {/* ── Docs em Foto ── */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold" style={{ color: 'hsl(43, 80%, 75%)' }}>
                Documentos em Foto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider px-2 pb-1" style={{ color: 'hsla(43, 40%, 55%, 0.7)', borderBottom: '1px solid hsla(43, 40%, 30%, 0.3)' }}>
                    Documentos
                  </h4>
                  {vipFotoServices.filter(s => s.fotoGroup === 'documentos').map((service) => (
                    <VipServiceCard key={service.id} service={service} tier={tier} hasCredits={hasCredits} />
                  ))}
                </div>
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider px-2 pb-1" style={{ color: 'hsla(43, 40%, 55%, 0.7)', borderBottom: '1px solid hsla(43, 40%, 30%, 0.3)' }}>
                    Cartões de Crédito
                  </h4>
                  <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(43 30% 25%) transparent' }}>
                    {vipFotoServices.filter(s => s.fotoGroup === 'cartoes').map((service) => (
                      <VipServiceCard key={service.id} service={service} tier={tier} hasCredits={hasCredits} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Internacional — Em Breve ── */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid hsla(43, 50%, 30%, 0.5)' }}
            >
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{
                  background: 'linear-gradient(135deg, hsla(43, 40%, 18%, 0.8) 0%, hsla(38, 35%, 15%, 0.6) 100%)',
                }}
              >
                <Globe className="h-5 w-5" style={{ color: 'hsl(43, 60%, 55%)' }} />
                <span className="flex-1 font-semibold text-sm" style={{ color: 'hsl(43, 60%, 65%)' }}>Internacional</span>
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5" style={{ background: 'hsla(43, 40%, 25%, 0.5)', color: 'hsl(43, 60%, 55%)' }}>
                  <Clock className="h-2.5 w-2.5 mr-1" /> Em Breve
                </Badge>
              </div>
              <div className="p-3" style={{ background: 'hsla(0, 0%, 100%, 0.02)' }}>
                <div className="flex flex-wrap gap-2 justify-center mb-3">
                  {internationalFlags.map((flag) => (
                    <div key={flag.code} className="flex items-center gap-1.5 px-2 py-1 rounded-md opacity-50" style={{ background: 'hsla(0, 0%, 100%, 0.04)', border: '1px solid hsla(0, 0%, 100%, 0.06)' }}>
                      <img src={`https://flagcdn.com/w20/${flag.code}.png`} alt={flag.name} className="h-3 w-5 rounded-sm object-cover" loading="lazy" />
                      <span className="text-[10px] text-white/40">{flag.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/30 text-center">
                  Passaportes, carteiras de motorista, identidades e muito mais de +60 países
                </p>
              </div>
            </div>

            {/* ── Motivacional ── */}
            <div
              className="rounded-xl p-4"
              style={{
                background: 'linear-gradient(135deg, hsla(43, 50%, 15%, 0.5) 0%, hsla(260, 30%, 15%, 0.3) 100%)',
                border: '1px solid hsla(43, 40%, 30%, 0.3)',
              }}
            >
              <h4 className="font-bold text-sm mb-2" style={{ color: 'hsl(43, 80%, 75%)' }}>
                Em breve, milhares de serviços adicionais
              </h4>
              <p className="text-[11px] leading-relaxed" style={{ color: 'hsla(43, 30%, 55%, 0.8)' }}>
                Serviços super exclusivos estão chegando. Imagina fazer seus docs sem sentar no computador...
                A área VIP é algo exclusivo da base. Não se compra — se conquista batendo metas.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
