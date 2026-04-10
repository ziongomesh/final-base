import { useState, useEffect, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/success-sound';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { mysqlApi } from '@/lib/api-mysql';
import { isUsingMySQL } from '@/lib/db-config';
import { supabase } from '@/integrations/supabase/client';
import AnnouncementsManager from '@/components/dashboard/AnnouncementsManager';
import {
  Crown, Users, CreditCard, FileText, Shield, Eye, KeyRound, Send,
  Car, IdCard, GraduationCap, Truck, Ship, Trophy, Medal, Award,
  TrendingUp, DollarSign, Activity,
  Search, RefreshCw, Clock, AlertTriangle, Zap, ChevronRight,
  UserPlus, Download, Save, Loader2, Trash2, Megaphone, Plus, Pencil,
  WifiOff, CircleDot, Wrench, Power
} from 'lucide-react';

// ===== TYPES =====
interface Overview {
  totalMasters: number;
  totalResellers: number;
  totalCredits: number;
  totalTransactions: number;
  totalRevenue: number;
  documents: { cnh: number; rg: number; carteira: number; crlv: number; cha: number; total: number; };
}

interface AdminItem {
  id: number;
  nome: string;
  email: string;
  creditos: number;
  rank: string;
  profile_photo: string | null;
  created_at: string;
  last_active: string | null;
  criado_por: number | null;
  criado_por_nome: string | null;
  total_cnh: number;
  total_rg: number;
  total_carteira: number;
  total_crlv: number;
  total_cha: number;
  total_services: number;
  last_service: {
    tipo: string;
    nome: string;
    cpf: string;
    created_at: string;
    saldo_antes: number;
    saldo_depois: number;
  } | null;
  key_plain?: string | null;
}

interface TopEntry {
  id: number;
  nome: string;
  email: string;
  creditos: number;
  total_services: number;
  last_active: string | null;
  rank: string;
}

interface LastService {
  tipo: string;
  nome: string;
  cpf: string;
  created_at: string;
  admin_id: number;
  admin_nome: string;
  saldo_antes: number;
  saldo_depois: number;
  saldo_atual: number;
}

export default function DashboardDono() {
  const { admin, role, credits, creditsTransf, loading, refreshCredits } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [allAdmins, setAllAdmins] = useState<AdminItem[]>([]);
  const [topEntries, setTopEntries] = useState<TopEntry[]>([]);
  const [lastService, setLastService] = useState<LastService | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [adminSearch, setAdminSearch] = useState('');

  // Daily history state
  const [dailyHistory, setDailyHistory] = useState<Record<string, any[]>>({});
  const [dailyTotal, setDailyTotal] = useState(0);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyFilterAdmin, setDailyFilterAdmin] = useState<string>('all');
  const [dailyFilterModule, setDailyFilterModule] = useState<string>('all');
  const [dailyFilterDate, setDailyFilterDate] = useState<string>('');
  const [dailyFilterOwnership, setDailyFilterOwnership] = useState<string>('all');

  // All transfers state
  const [allTransfers, setAllTransfers] = useState<any[]>([]);
  const [allTransfersLoading, setAllTransfersLoading] = useState(false);
  const [transfersMasterFilter, setTransfersMasterFilter] = useState<string>('all');
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; admin: AdminItem | null }>({ open: false, admin: null });
  const [transferDialog, setTransferDialog] = useState<{ open: boolean; admin: AdminItem | null }>({ open: false, admin: null });
  const [newPassword, setNewPassword] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // Detail dialog
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; admin: AdminItem | null }>({ open: false, admin: null });
  const [detailData, setDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Gerenciar state
  const [cnhIphone, setCnhIphone] = useState('');
  const [cnhApk, setCnhApk] = useState('');
  const [govbrIphone, setGovbrIphone] = useState('');
  const [govbrApk, setGovbrApk] = useState('');
  const [abafeIphone, setAbafeIphone] = useState('');
  const [abafeApk, setAbafeApk] = useState('');
  const [savingLinks, setSavingLinks] = useState(false);

  // Create master/reseller
  const [createType, setCreateType] = useState<'sub' | 'master' | 'revendedor'>(role === 'sub' ? 'revendedor' : 'master');
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
  const [initialCredits, setInitialCredits] = useState('0');
  const [giveCredits, setGiveCredits] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Pricing
  const [resellerPrice, setResellerPrice] = useState('90');
  const [resellerCredits, setResellerCredits] = useState('5');
  const [creditPackages, setCreditPackages] = useState<Array<{ credits: number; unitPrice: number; total: number }>>([]);
  const [savingPricing, setSavingPricing] = useState(false);
  const [recargaDobro, setRecargaDobro] = useState(false);
  const [togglingDobro, setTogglingDobro] = useState(false);

  // Alert
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertTargetId, setAlertTargetId] = useState<string>('');
  const [sendingAlert, setSendingAlert] = useState(false);

  // Maintenance
  const MODULES = [
    { id: 'cnh-digital-2026', label: 'CNH Digital (2026)' },
    { id: 'rg-digital', label: 'CIN (RG Digital)' },
    { id: 'cnh-arrais-nautica', label: 'Arrais Náutica' },
    { id: 'carteira-abafe', label: 'ABAFE' },
    { id: 'crlv-digital', label: 'CRLV Digital' },
    { id: 'atestado-hapvida', label: 'Hapvida' },
    { id: 'comprovante-picpay', label: 'PicPay' },
    { id: 'comprovante-bradesco', label: 'Bradesco' },
  ];
  const [maintenanceMap, setMaintenanceMap] = useState<Record<string, boolean>>({});
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);
  const [savingModule, setSavingModule] = useState<string | null>(null);
  const [togglingAll, setTogglingAll] = useState(false);

  // Notícias
  interface Noticia { id: number; titulo: string; informacao: string; data_post: string; }
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [noticiaForm, setNoticiaForm] = useState({ titulo: '', informacao: '' });
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [savingNoticia, setSavingNoticia] = useState(false);

  // Sub plans
  interface SubPlan { id?: number; admin_id?: number; name: string; credits: number; base_credits: number; bonus: number; total: number; badge: string; badge_color: string; sort_order: number; is_active: boolean; qr_code_image: string; pix_copy_paste: string; whatsapp_number: string; }
  const emptySubPlan: SubPlan = { name: '', credits: 0, base_credits: 0, bonus: 0, total: 0, badge: '', badge_color: 'bg-blue-500', sort_order: 0, is_active: true, qr_code_image: '', pix_copy_paste: '', whatsapp_number: '' };
  const [subPlans, setSubPlans] = useState<SubPlan[]>([]);
  const [subPlanForm, setSubPlanForm] = useState<SubPlan>(emptySubPlan);
  const [showSubPreview, setShowSubPreview] = useState(false);
  const [editingSubPlan, setEditingSubPlan] = useState<SubPlan | null>(null);
  const [savingSubPlan, setSavingSubPlan] = useState(false);
  const [loadingSubPlans, setLoadingSubPlans] = useState(false);

  // QR Code crop state
  const [qrCropImage, setQrCropImage] = useState<string | null>(null);
  const [qrCrop, setQrCrop] = useState({ x: 0, y: 0 });
  const [qrZoom, setQrZoom] = useState(1);
  const [qrCroppedArea, setQrCroppedArea] = useState<any>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);

  const onQrCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setQrCroppedArea(croppedAreaPixels);
  }, []);

  const getCroppedImg = useCallback(async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = imageSrc; });
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return canvas.toDataURL('image/png').split(',')[1];
  }, []);

  const handleQrCropConfirm = useCallback(async () => {
    if (!qrCropImage || !qrCroppedArea) return;
    try {
      const base64 = await getCroppedImg(qrCropImage, qrCroppedArea);
      const stored = localStorage.getItem('admin');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (stored) { const parsed = JSON.parse(stored); headers['x-admin-id'] = String(parsed.id); headers['x-session-token'] = parsed.session_token; }
      const envUrl = import.meta.env.VITE_API_URL as string | undefined;
      let apiBase = envUrl ? envUrl.replace(/\/+$/, '') : (window.location.origin + '/api');
      if (!apiBase.endsWith('/api')) apiBase += '/api';
      const resp = await fetch(`${apiBase}/sub-plans/upload-qrcode`, { method: 'POST', headers, body: JSON.stringify({ image_base64: base64 }) });
      const data = await resp.json();
      if (data?.url) { setSubPlanForm(f => ({ ...f, qr_code_image: data.url })); toast.success('QR Code enviado!'); }
      else throw new Error(data?.error || 'Erro ao enviar');
    } catch (err: any) { toast.error('Erro ao enviar QR Code', { description: err.message }); }
    setQrCropImage(null);
    setQrZoom(1);
    setQrCrop({ x: 0, y: 0 });
  }, [qrCropImage, qrCroppedArea, getCroppedImg]);

  // ===== HELPERS =====
  const isSub = role === 'sub';

  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const timeAgo = (d: string) => {
    if (!d) return 'Nunca';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    return formatDate(d);
  };

  const getDaysInactive = (lastActive: string | null, createdAt?: string) => {
    const ref = lastActive || createdAt;
    if (!ref) return 999;
    return Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case 'dono': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[9px] px-1.5 py-0">Dono</Badge>;
      case 'sub': return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[9px] px-1.5 py-0">Sub</Badge>;
      case 'master': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[9px] px-1.5 py-0">Master</Badge>;
      default: return <Badge className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0">Revenda</Badge>;
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'CNH': return <Car className="h-3.5 w-3.5 text-green-500" />;
      case 'RG': return <IdCard className="h-3.5 w-3.5 text-purple-500" />;
      case 'Carteira': return <GraduationCap className="h-3.5 w-3.5 text-amber-500" />;
      case 'CRLV': return <Truck className="h-3.5 w-3.5 text-blue-500" />;
      case 'Náutica': return <Ship className="h-3.5 w-3.5 text-cyan-500" />;
      default: return <FileText className="h-3.5 w-3.5" />;
    }
  };

  const getStatusColor = (days: number) => {
    if (days >= 30) return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' };
    if (days >= 14) return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500' };
    if (days >= 7) return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' };
    if (days >= 2) return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-500' };
    return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', dot: 'bg-green-500' };
  };

  // ===== DATA FETCHING =====
  const fetchSubPlans = async () => {
    if (!admin) return;
    setLoadingSubPlans(true);
    try {
      const resp = await fetch(`${getApiBase()}/sub-plans/list`, {
        headers: { 'x-admin-id': String(admin.id), 'x-session-token': admin.session_token || '' }
      });
      const data = await resp.json();
      console.log('fetchSubPlans response:', data);
      if (!resp.ok) {
        console.error('Sub plans error:', data);
        toast.error('Erro ao carregar planos');
      } else if (data?.plans) {
        setSubPlans(data.plans);
      }
    } catch (e) { console.error('Erro ao buscar planos:', e); }
    finally { setLoadingSubPlans(false); }
  };

  const handleSaveSubPlan = async () => {
    if (!admin || !subPlanForm.name || !subPlanForm.credits || !subPlanForm.total) {
      toast.error('Preencha nome, créditos e valor');
      return;
    }
    setSavingSubPlan(true);
    try {
      const isUpdate = !!editingSubPlan;
      const plan = isUpdate ? { ...subPlanForm, id: editingSubPlan.id } : subPlanForm;
      const endpoint = isUpdate ? 'update' : 'create';
      const method = isUpdate ? 'PUT' : 'POST';
      const resp = await fetch(`${getApiBase()}/sub-plans/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-id': String(admin.id), 'x-session-token': admin.session_token || '' },
        body: JSON.stringify({ plan })
      });
      if (!resp.ok) { const d = await resp.json(); throw new Error(d.error); }
      toast.success(editingSubPlan ? 'Plano atualizado!' : 'Plano criado!');
      setSubPlanForm(emptySubPlan);
      setEditingSubPlan(null);
      fetchSubPlans();
    } catch (e: any) { toast.error(e.message || 'Erro ao salvar plano'); }
    finally { setSavingSubPlan(false); }
  };

  const handleDeleteSubPlan = async (planId: number) => {
    if (!admin) return;
    try {
      await fetch(`${getApiBase()}/sub-plans/delete/${planId}`, {
        method: 'DELETE',
        headers: { 'x-admin-id': String(admin.id), 'x-session-token': admin.session_token || '' }
      });
      toast.success('Plano removido!');
      fetchSubPlans();
    } catch (e: any) { toast.error('Erro ao remover plano'); }
  };

  const getApiBase = () => {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined;
    let apiBase = envUrl ? envUrl.replace(/\/+$/, '') : 'http://localhost:4000/api';
    if (!apiBase.endsWith('/api')) apiBase += '/api';
    return apiBase;
  };

  const fetchMaintenance = async () => {
    if (!admin) return;
    try {
      const resp = await fetch(`${getApiBase()}/maintenance`, {
        headers: { 'x-admin-id': String(admin.id), 'x-session-token': admin.session_token || '' },
      });
      if (resp.ok) setMaintenanceMap(await resp.json());
    } catch (err) { console.error('Erro manutenção:', err); }
    finally { setLoadingMaintenance(false); }
  };

  const toggleMaintenance = async (moduleId: string, currentValue: boolean) => {
    if (!admin) return;
    setSavingModule(moduleId);
    try {
      const resp = await fetch(`${getApiBase()}/maintenance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': String(admin.id), 'x-session-token': admin.session_token || '' },
        body: JSON.stringify({ module_id: moduleId, is_maintenance: !currentValue }),
      });
      if (resp.ok) {
        setMaintenanceMap(prev => ({ ...prev, [moduleId]: !currentValue }));
        toast.success(!currentValue ? 'Módulo em manutenção' : 'Módulo ativado');
      } else toast.error('Erro ao atualizar');
    } catch { toast.error('Erro de conexão'); }
    finally { setSavingModule(null); }
  };

  const toggleAllMaintenance = async (enable: boolean) => {
    if (!admin) return;
    setTogglingAll(true);
    try {
      for (const mod of MODULES) {
        await fetch(`${getApiBase()}/maintenance`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-id': String(admin.id), 'x-session-token': admin.session_token || '' },
          body: JSON.stringify({ module_id: mod.id, is_maintenance: enable }),
        });
      }
      const newMap: Record<string, boolean> = {};
      MODULES.forEach(m => newMap[m.id] = enable);
      setMaintenanceMap(newMap);
      toast.success(enable ? 'Todos em manutenção!' : 'Todos ativados!');
    } catch { toast.error('Erro de conexão'); }
    finally { setTogglingAll(false); }
  };

  useEffect(() => {
    if (admin && (role === 'dono' || role === 'sub')) {
      fetchAllData();
      fetchMaintenance();
    }
  }, [admin, role]);

  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      const [overviewData, adminsData, topData, lastSvc, dlData, noticiasData, settingsData] = await Promise.all([
        (api as any).owner.getOverview(),
        (api as any).owner.getAllAdmins(),
        (api as any).owner.getTopResellers(),
        (api as any).owner.getLastService(),
        role === 'dono' ? mysqlApi.downloads.fetch().catch(() => null) : Promise.resolve(null),
        (api as any).noticias.list().catch(() => []),
        (api as any).settings.get().catch(() => null),
      ]);
      setOverview(overviewData);
      setAllAdmins(adminsData);
      setTopEntries(topData);
      setLastService(lastSvc);

      if (dlData) {
        setCnhIphone(dlData.cnh_iphone || '');
        setCnhApk(dlData.cnh_apk || '');
        setGovbrIphone(dlData.govbr_iphone || '');
        setGovbrApk(dlData.govbr_apk || '');
        setAbafeIphone(dlData.abafe_iphone || '');
        setAbafeApk(dlData.abafe_apk || '');
      }

      setNoticias(noticiasData || []);

      if (settingsData) {
        setResellerPrice(String(settingsData.reseller_price || 90));
        setResellerCredits(String(settingsData.reseller_credits || 5));
        setCreditPackages(settingsData.credit_packages || []);
        setRecargaDobro(!!settingsData.recarga_em_dobro);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do painel');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAllTransfers = async (masterId?: string) => {
    setAllTransfersLoading(true);
    try {
      const mid = masterId && masterId !== 'all' ? parseInt(masterId) : undefined;
      const data = await (api as any).credits.getAllTransfers(mid);
      setAllTransfers(data || []);
    } catch (e) {
      console.error('Erro ao buscar transferências:', e);
    } finally {
      setAllTransfersLoading(false);
    }
  };

  const fetchDailyHistory = async () => {
    setDailyLoading(true);
    try {
      const filters: any = {};
      if (dailyFilterAdmin !== 'all') filters.adminId = parseInt(dailyFilterAdmin);
      if (dailyFilterModule !== 'all') filters.module = dailyFilterModule;
      if (dailyFilterDate) filters.date = dailyFilterDate;
      const data = await (api as any).owner.getDailyHistory(filters);
      setDailyHistory(data.grouped || {});
      setDailyTotal(data.total || 0);
    } catch (error) {
      console.error('Erro ao buscar histórico diário:', error);
    } finally {
      setDailyLoading(false);
    }
  };

  useEffect(() => {
    if (admin && (role === 'dono' || role === 'sub') && activeTab === 'audit') {
      fetchDailyHistory();
    }
  }, [activeTab, dailyFilterAdmin, dailyFilterModule, dailyFilterDate]);

  const handleSaveLinks = async () => {
    if (!admin) return;
    setSavingLinks(true);
    try {
      if (isUsingMySQL()) {
        await mysqlApi.downloads.update({ cnh_iphone: cnhIphone, cnh_apk: cnhApk, govbr_iphone: govbrIphone, govbr_apk: govbrApk, abafe_apk: abafeApk, abafe_iphone: abafeIphone });
      } else {
        const { error } = await supabase.functions.invoke('update-downloads', {
          body: { admin_id: admin.id, session_token: admin.session_token, cnh_iphone: cnhIphone, cnh_apk: cnhApk, govbr_iphone: govbrIphone, govbr_apk: govbrApk, abafe_apk: abafeApk, abafe_iphone: abafeIphone },
        });
        if (error) throw error;
      }
      toast.success('Links atualizados!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar links');
    } finally {
      setSavingLinks(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (createForm.password.length < 4) {
      toast.error('Senha deve ter no mínimo 4 caracteres');
      return;
    }
    setIsCreating(true);
    try {
      const creditsToGive = giveCredits && parseInt(initialCredits) > 0 ? parseInt(initialCredits) : 0;

      if (createType === 'sub') {
        await (api as any).admins.createSub({
          nome: createForm.name, email: createForm.email.toLowerCase().trim(), key: createForm.password, criadoPor: admin!.id,
          ...(creditsToGive > 0 ? { creditos: creditsToGive } : {}),
        });
      } else if (createType === 'master') {
        await api.admins.createMaster({
          nome: createForm.name, email: createForm.email.toLowerCase().trim(), key: createForm.password, criadoPor: admin!.id,
          ...(creditsToGive > 0 ? { creditos: creditsToGive } : {}),
        });
      } else {
        await api.admins.createReseller({
          nome: createForm.name, email: createForm.email.toLowerCase().trim(), key: createForm.password, criadoPor: admin!.id,
          ...(creditsToGive > 0 ? { creditos: creditsToGive } : {}),
        });
      }

      const typeLabel = createType === 'sub' ? 'Sub Dono' : createType === 'master' ? 'Master' : 'Revendedor';
      playSuccessSound();
      toast.success(`${typeLabel} criado com sucesso!`, {
        description: `${createForm.name} (${createForm.email})${creditsToGive > 0 ? ` • ${creditsToGive} créditos iniciais` : ''}`,
      });
      setCreateForm({ name: '', email: '', password: '' });
      setInitialCredits('0');
      setGiveCredits(false);
      fetchAllData();
      refreshCredits();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setIsCreating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordDialog.admin || !newPassword) return;
    try {
      await (api as any).owner.changePassword(passwordDialog.admin.id, newPassword);
      toast.success(`Senha de ${passwordDialog.admin.nome} alterada!`);
      setPasswordDialog({ open: false, admin: null });
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha');
    }
  };

  const handleTransferCredits = async () => {
    if (!transferDialog.admin || !transferAmount) return;
    const amount = parseInt(transferAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('Valor inválido'); return; }
    try {
      await (api as any).owner.transferCredits(transferDialog.admin.id, amount);
      toast.success(`${amount} créditos transferidos para ${transferDialog.admin.nome}!`);
      setTransferDialog({ open: false, admin: null });
      setTransferAmount('');
      refreshCredits();
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao transferir');
    }
  };

  const openDetailDialog = async (adm: AdminItem) => {
    setDetailDialog({ open: true, admin: adm });
    setDetailData(null);
    setLoadingDetail(true);
    try {
      const data = await (api as any).owner.getAdminDocuments(adm.id);
      setDetailData(data);
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoadingDetail(false);
    }
  };

  // ===== GUARDS =====
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, hsl(220 25% 6%), hsl(220 20% 4%))' }}><div className="animate-spin rounded-full h-8 w-8" style={{ borderBottom: '2px solid hsl(201 55% 59%)' }} /></div>;
  }
  if (!admin) return <Navigate to="/login" replace />;
  if (role !== 'dono' && role !== 'sub') return <Navigate to="/dashboard" replace />;

  // ===== COMPUTED DATA =====
  const masters = allAdmins.filter(a => a.rank === 'master');
  const resellers = allAdmins.filter(a => a.rank === 'revendedor');

  // All non-dono admins sorted by inactivity
  const allNonDono = allAdmins.filter(a => a.rank !== 'dono');
  const inactiveAdmins = allNonDono
    .filter(a => getDaysInactive(a.last_active, a.created_at) >= 2)
    .sort((a, b) => getDaysInactive(b.last_active, b.created_at) - getDaysInactive(a.last_active, a.created_at));
  const inactiveMasters = inactiveAdmins.filter(a => a.rank === 'master');
  const inactiveResellers = inactiveAdmins.filter(a => a.rank === 'revendedor');

  // ===== RENDER INACTIVE CARD (key feature) =====
  const renderInactiveRow = (a: AdminItem) => {
    const days = getDaysInactive(a.last_active, a.created_at);
    const colors = getStatusColor(days);
    return (
      <div key={a.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${colors.bg} ${colors.border} transition-all`}>
        <div className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">{a.nome}</span>
            {getRankBadge(a.rank)}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {a.last_service ? (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                {getServiceIcon(a.last_service.tipo)}
                {a.last_service.tipo} • {a.last_service.nome?.split(' ')[0]}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground italic">Nenhum serviço</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-xs font-bold ${colors.text}`}>{days}d off</span>
          <p className="text-[10px] text-muted-foreground">
            {a.last_active ? timeAgo(a.last_active) : 'Nunca'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-[1100px] mx-auto">
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
            <p className="text-[11px] text-muted-foreground">Painel de Controle</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              <CreditCard className="h-3 w-3" />
              {isSub ? 'Ilimitado' : credits.toLocaleString('pt-BR')}
            </Badge>
            {isSub && (
              <Badge variant="outline" className="text-xs gap-1">
                <Send className="h-3 w-3" />
                {creditsTransf.toLocaleString('pt-BR')}
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchAllData} disabled={loadingData}>
              <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v);
          if (v === 'transfers' && allTransfers.length === 0) fetchAllTransfers();
        }}>
          <TabsList className="flex w-full overflow-x-auto no-scrollbar gap-0.5 h-9">
            <TabsTrigger value="overview" className="text-[10px] px-2.5 shrink-0 h-7">Geral</TabsTrigger>
            <TabsTrigger value="activity" className="text-[10px] px-2.5 shrink-0 h-7">Atividade</TabsTrigger>
            <TabsTrigger value="masters" className="text-[10px] px-2.5 shrink-0 h-7">Masters</TabsTrigger>
            <TabsTrigger value="resellers" className="text-[10px] px-2.5 shrink-0 h-7">Revendas</TabsTrigger>
            {!isSub && <TabsTrigger value="transfers" className="text-[10px] px-2.5 shrink-0 h-7">Transf.</TabsTrigger>}
            <TabsTrigger value="audit" className="text-[10px] px-2.5 shrink-0 h-7">Histórico</TabsTrigger>
            {!isSub && <TabsTrigger value="ranking" className="text-[10px] px-2.5 shrink-0 h-7">Ranking</TabsTrigger>}
            <TabsTrigger value="noticias" className="text-[10px] px-2.5 shrink-0 h-7">Notícias</TabsTrigger>
            <TabsTrigger value="anuncios" className="text-[10px] px-2.5 shrink-0 h-7">Anúncios</TabsTrigger>
            {isSub && <TabsTrigger value="plans" className="text-[10px] px-2.5 shrink-0 h-7" onClick={() => { if (subPlans.length === 0) fetchSubPlans(); }}>Planos</TabsTrigger>}
            <TabsTrigger value="manage" className="text-[10px] px-2.5 shrink-0 h-7">Gerenciar</TabsTrigger>
          </TabsList>

          {loadingData ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {/* ===== OVERVIEW ===== */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                {overview && (
                  <>
                    {/* Stats Grid */}
                    <div className={`grid gap-3 ${isSub ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
                      {[
                        { icon: Shield, label: 'Masters', value: overview.totalMasters, show: true },
                        { icon: Users, label: 'Revendas', value: overview.totalResellers, show: true },
                        { icon: CreditCard, label: 'Créditos', value: overview.totalCredits?.toLocaleString('pt-BR'), show: !isSub },
                        { icon: TrendingUp, label: 'Transações', value: overview.totalTransactions, show: !isSub },
                        { icon: DollarSign, label: 'Faturamento', value: `R$ ${overview.totalRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, show: !isSub },
                      ].filter(i => i.show).map(item => (
                        <div key={item.label} className="p-3 rounded-lg border border-border/50 bg-card/50">
                          <div className="flex items-center gap-2 mb-1">
                            <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</span>
                          </div>
                          <p className="text-lg font-bold">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Documents */}
                    <div className="p-3 rounded-lg border border-border/50 bg-card/50">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Documentos na Base</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[
                          { label: 'CNH', count: overview.documents.cnh, icon: Car },
                          { label: 'RG', count: overview.documents.rg, icon: IdCard },
                          { label: 'Carteira', count: overview.documents.carteira, icon: GraduationCap },
                          { label: 'CRLV', count: overview.documents.crlv, icon: Truck },
                          { label: 'Náutica', count: overview.documents.cha, icon: Ship },
                          { label: 'Total', count: overview.documents.total, icon: FileText },
                        ].map(item => (
                          <div key={item.label} className="text-center p-2 rounded-md bg-muted/30">
                            <item.icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                            <p className="text-sm font-bold">{item.count.toLocaleString('pt-BR')}</p>
                            <p className="text-[9px] text-muted-foreground">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Last Service */}
                    {lastService && (
                      <div className="p-3 rounded-lg border border-border/50 bg-card/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-3.5 w-3.5 text-yellow-500" />
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Último Serviço</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(lastService.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {getServiceIcon(lastService.tipo)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{lastService.nome}</p>
                            <p className="text-[10px] text-muted-foreground">por {lastService.admin_nome} • CPF: {lastService.cpf}</p>
                          </div>
                          {!isSub && (
                            <div className="flex items-center gap-1 text-[10px] shrink-0">
                              <span className="text-green-500 font-semibold">{lastService.saldo_antes}</span>
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-red-500 font-semibold">{lastService.saldo_depois}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* ===== ACTIVITY (Inactive highlight) ===== */}
              <TabsContent value="activity" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-semibold">Inativos ({inactiveAdmins.length})</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1"
                    onClick={() => setAlertDialogOpen(true)}
                  >
                    <Send className="h-3 w-3" /> Enviar Alerta
                  </Button>
                </div>

                {/* Inactive Tabs: Masters / Revendas */}
                <Tabs defaultValue="revendas" className="w-full">
                  <TabsList className="w-full h-8 mb-3">
                    <TabsTrigger value="masters" className="flex-1 text-[10px] h-6">
                      Masters ({inactiveMasters.length})
                    </TabsTrigger>
                    <TabsTrigger value="revendas" className="flex-1 text-[10px] h-6">
                      Revendas ({inactiveResellers.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="masters" className="mt-0">
                    <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                      {inactiveMasters.length === 0 ? (
                        <p className="text-center text-muted-foreground text-xs py-8">Todos os masters estão ativos ✓</p>
                      ) : inactiveMasters.map(renderInactiveRow)}
                    </div>
                  </TabsContent>

                  <TabsContent value="revendas" className="mt-0">
                    <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                      {inactiveResellers.length === 0 ? (
                        <p className="text-center text-muted-foreground text-xs py-8">Todas as revendas estão ativas ✓</p>
                      ) : inactiveResellers.map(renderInactiveRow)}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Active Summary */}
                <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <CircleDot className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Online Recentemente</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allNonDono
                      .filter(a => getDaysInactive(a.last_active, a.created_at) < 2)
                      .sort((a, b) => new Date(b.last_active || '').getTime() - new Date(a.last_active || '').getTime())
                      .slice(0, 15)
                      .map(a => (
                        <div key={a.id} className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="text-[10px] font-medium">{a.nome.split(' ')[0]}</span>
                          {getRankBadge(a.rank)}
                          <span className="text-[9px] text-muted-foreground">{timeAgo(a.last_active || '')}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>

              {/* ===== MASTERS ===== */}
              <TabsContent value="masters" className="space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{masters.length} Masters</Badge>
                </div>
                {renderAdminTable(masters)}
              </TabsContent>

              {/* ===== RESELLERS ===== */}
              <TabsContent value="resellers" className="space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Buscar..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} className="pl-8 h-8 text-xs" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">{resellers.length} Revendas</Badge>
                </div>
                {renderAdminTable(resellers.filter(a => !adminSearch || a.nome.toLowerCase().includes(adminSearch.toLowerCase()) || a.email.toLowerCase().includes(adminSearch.toLowerCase())))}
              </TabsContent>

              {/* ===== TRANSFERS ===== */}
              <TabsContent value="transfers" className="space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <Select value={transfersMasterFilter} onValueChange={(v) => { setTransfersMasterFilter(v); fetchAllTransfers(v); }}>
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <SelectValue placeholder="Filtrar por Master" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {masters.map(m => (<SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fetchAllTransfers(transfersMasterFilter)}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {allTransfersLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : allTransfers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-xs">Nenhuma transferência</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px]">De</TableHead>
                          <TableHead className="text-[10px]">Para</TableHead>
                          <TableHead className="text-[10px] text-right">Créditos</TableHead>
                          <TableHead className="text-[10px] text-right">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTransfers.map((t: any) => (
                          <TableRow key={t.id}>
                            <TableCell className="py-2">
                              <p className="text-xs font-medium">{t.from_admin_name}</p>
                            </TableCell>
                            <TableCell className="py-2">
                              <p className="text-xs font-medium">{t.to_admin_name}</p>
                            </TableCell>
                            <TableCell className="text-right py-2 font-mono text-xs text-green-500 font-semibold">
                              +{t.amount?.toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-right py-2 text-[10px] text-muted-foreground">
                              {new Date(t.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* ===== HISTÓRICO ===== */}
              <TabsContent value="audit" className="space-y-3 mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={dailyFilterAdmin} onValueChange={setDailyFilterAdmin}>
                    <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Admin..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {allAdmins.map(a => (<SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={dailyFilterModule} onValueChange={setDailyFilterModule}>
                    <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Módulo..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="CNH">CNH</SelectItem>
                      <SelectItem value="RG">RG</SelectItem>
                      <SelectItem value="Carteira">Estudante</SelectItem>
                      <SelectItem value="CRLV">CRLV</SelectItem>
                      <SelectItem value="Nautica">Náutica</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dailyFilterOwnership} onValueChange={setDailyFilterOwnership}>
                    <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="mine">Meus</SelectItem>
                      <SelectItem value="others">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="date" value={dailyFilterDate} onChange={(e) => setDailyFilterDate(e.target.value)} className="w-[140px] h-8 text-xs" />
                  {dailyFilterDate && <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setDailyFilterDate('')}>Limpar</Button>}
                  <Badge variant="secondary" className="text-[10px]">{dailyTotal} serviços</Badge>
                </div>

                {dailyLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : Object.keys(dailyHistory).length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Nenhum serviço encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(dailyHistory)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([day, services]) => {
                        let filtered = services;
                        if (dailyFilterOwnership === 'mine') filtered = services.filter((s: any) => s.is_mine);
                        else if (dailyFilterOwnership === 'others') filtered = services.filter((s: any) => !s.is_mine);
                        if (filtered.length === 0) return null;
                        return (
                          <div key={day} className="rounded-lg border border-border/50 overflow-hidden">
                            <div className="px-3 py-2 bg-muted/30 flex items-center justify-between">
                              <span className="text-xs font-semibold">{new Date(day + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                              <Badge variant="secondary" className="text-[9px]">{filtered.length}</Badge>
                            </div>
                            <div className="divide-y divide-border/30">
                              {filtered.map((svc: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2">
                                  {getServiceIcon(svc.tipo || svc.module)}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{svc.nome}</p>
                                    <p className="text-[10px] text-muted-foreground">{svc.admin_nome} • {svc.cpf}</p>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground shrink-0">
                                    {new Date(svc.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </TabsContent>

              {/* ===== RANKING ===== */}
              <TabsContent value="ranking" className="space-y-3 mt-4">
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <div className="px-3 py-2 bg-muted/30">
                    <span className="text-xs font-semibold flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-yellow-500" />Ranking por Serviços</span>
                  </div>
                  <div className="divide-y divide-border/30">
                    {topEntries.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-xs">Nenhum dado</p>
                    ) : topEntries.map((entry, index) => (
                      <div key={entry.id} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="w-6 shrink-0 text-center">
                          {index === 0 ? <Trophy className="h-4 w-4 text-yellow-500 mx-auto" /> :
                           index === 1 ? <Medal className="h-4 w-4 text-gray-400 mx-auto" /> :
                           index === 2 ? <Award className="h-4 w-4 text-amber-600 mx-auto" /> :
                           <span className="text-[10px] font-bold text-muted-foreground">{index + 1}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate">{entry.nome}</span>
                            {getRankBadge(entry.rank)}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{entry.last_active ? timeAgo(entry.last_active) : 'Nunca'}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!isSub && <span className="text-[10px] text-muted-foreground">{entry.creditos.toLocaleString('pt-BR')} cr</span>}
                          <Badge variant="secondary" className="text-[9px]">{entry.total_services} serv.</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ===== NOTÍCIAS ===== */}
              <TabsContent value="noticias" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {editingNoticia ? 'Editar Notícia' : 'Nova Notícia'}
                  </p>
                  <Input
                    placeholder="Título"
                    value={noticiaForm.titulo}
                    onChange={(e) => setNoticiaForm(prev => ({ ...prev, titulo: e.target.value }))}
                    className="h-8 text-xs"
                  />
                  <Textarea
                    placeholder="Conteúdo..."
                    value={noticiaForm.informacao}
                    onChange={(e) => setNoticiaForm(prev => ({ ...prev, informacao: e.target.value }))}
                    rows={3}
                    className="text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!noticiaForm.titulo || !noticiaForm.informacao) { toast.error('Preencha todos os campos'); return; }
                        setSavingNoticia(true);
                        try {
                          if (editingNoticia) {
                            await (api as any).noticias.update(editingNoticia.id, noticiaForm.titulo, noticiaForm.informacao);
                            toast.success('Notícia atualizada!');
                          } else {
                            await (api as any).noticias.create(noticiaForm.titulo, noticiaForm.informacao);
                            toast.success('Notícia publicada!');
                          }
                          setNoticiaForm({ titulo: '', informacao: '' });
                          setEditingNoticia(null);
                          const updated = await (api as any).noticias.list();
                          setNoticias(updated || []);
                        } catch (err: any) { toast.error(err.message || 'Erro'); }
                        finally { setSavingNoticia(false); }
                      }}
                      disabled={savingNoticia}
                      className="flex-1 h-8 text-xs"
                    >
                      {savingNoticia ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : editingNoticia ? <Save className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                      {editingNoticia ? 'Salvar' : 'Publicar'}
                    </Button>
                    {editingNoticia && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setEditingNoticia(null); setNoticiaForm({ titulo: '', informacao: '' }); }}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {noticias.length === 0 ? (
                    <div className="text-center py-8">
                      <Megaphone className="h-6 w-6 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">Nenhuma notícia</p>
                    </div>
                  ) : noticias.map((noticia) => (
                    <div key={noticia.id} className="p-3 rounded-lg border border-border/50 bg-card/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold">{noticia.titulo}</p>
                          <p className="text-[11px] text-muted-foreground mt-1 whitespace-pre-wrap">{noticia.informacao}</p>
                          <p className="text-[9px] text-muted-foreground mt-1.5">
                            {noticia.data_post ? new Date(noticia.data_post).toLocaleString('pt-BR') : '-'}
                          </p>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingNoticia(noticia); setNoticiaForm({ titulo: noticia.titulo, informacao: noticia.informacao }); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={async () => {
                            try {
                              await (api as any).noticias.delete(noticia.id);
                              toast.success('Removida');
                              setNoticias(prev => prev.filter(n => n.id !== noticia.id));
                            } catch { toast.error('Erro'); }
                          }}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* ===== SUB PLANS ===== */}
              {isSub && (
              <TabsContent value="plans" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {editingSubPlan ? 'Editar Plano' : 'Novo Plano'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Nome</Label>
                      <Input value={subPlanForm.name} onChange={(e) => setSubPlanForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Pacote Básico" className="h-8 text-xs" />
                      <p className="text-[9px] text-muted-foreground">Nome exibido para o revendedor</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Créditos</Label>
                      <Input type="number" value={subPlanForm.credits || ''} onChange={(e) => setSubPlanForm(f => ({ ...f, credits: Number(e.target.value) }))} placeholder="Ex: 3" className="h-8 text-xs" />
                      <p className="text-[9px] text-muted-foreground">Total de créditos que o revendedor recebe</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Bônus</Label>
                      <Input type="number" value={subPlanForm.bonus || ''} onChange={(e) => setSubPlanForm(f => ({ ...f, bonus: Number(e.target.value) }))} placeholder="Ex: 0" className="h-8 text-xs" />
                      <p className="text-[9px] text-muted-foreground">Créditos extras de bonificação</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Valor (R$)</Label>
                      <Input type="number" step="0.01" value={subPlanForm.total || ''} onChange={(e) => setSubPlanForm(f => ({ ...f, total: Number(e.target.value) }))} placeholder="Ex: 60.00" className="h-8 text-xs" />
                      <p className="text-[9px] text-muted-foreground">Preço cobrado do revendedor</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Base</Label>
                      <Input type="number" value={subPlanForm.base_credits || ''} onChange={(e) => setSubPlanForm(f => ({ ...f, base_credits: Number(e.target.value) }))} placeholder="Ex: 3" className="h-8 text-xs" />
                      <p className="text-[9px] text-muted-foreground">Créditos base (sem bônus)</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Badge</Label>
                      <Input value={subPlanForm.badge} onChange={(e) => setSubPlanForm(f => ({ ...f, badge: e.target.value }))} placeholder="Ex: POPULAR" className="h-8 text-xs" />
                      <p className="text-[9px] text-muted-foreground">Etiqueta destaque (opcional)</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Cor Badge</Label>
                      <Select value={subPlanForm.badge_color} onValueChange={(v) => setSubPlanForm(f => ({ ...f, badge_color: v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bg-blue-500">Azul</SelectItem>
                          <SelectItem value="bg-green-500">Verde</SelectItem>
                          <SelectItem value="bg-purple-500">Roxo</SelectItem>
                          <SelectItem value="bg-orange-500">Laranja</SelectItem>
                          <SelectItem value="bg-red-500">Vermelho</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[9px] text-muted-foreground">Cor da etiqueta destaque</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Ordem</Label>
                      <Input type="number" value={subPlanForm.sort_order || ''} onChange={(e) => setSubPlanForm(f => ({ ...f, sort_order: Number(e.target.value) }))} placeholder="Ex: 1" className="h-8 text-xs" />
                      <p className="text-[9px] text-muted-foreground">Posição na lista (menor = primeiro)</p>
                    </div>
                  </div>

                  <div className="border-t border-border/30 pt-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">PIX & WhatsApp</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">QR Code (Upload)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            className="h-8 text-xs"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const reader = new FileReader();
                                const base64 = await new Promise<string>((resolve, reject) => {
                                  reader.onload = () => resolve((reader.result as string).split(',')[1]);
                                  reader.onerror = reject;
                                  reader.readAsDataURL(file);
                                });
                                const stored = localStorage.getItem('admin');
                                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                                if (stored) {
                                  const parsed = JSON.parse(stored);
                                  headers['x-admin-id'] = String(parsed.id);
                                  headers['x-session-token'] = parsed.session_token;
                                }
                                const envUrl = import.meta.env.VITE_API_URL as string | undefined;
                                let apiBase = envUrl ? envUrl.replace(/\/+$/, '') : (window.location.origin + '/api');
                                if (!apiBase.endsWith('/api')) apiBase += '/api';
                                const resp = await fetch(`${apiBase}/sub-plans/upload-qrcode`, {
                                  method: 'POST',
                                  headers,
                                  body: JSON.stringify({ image_base64: base64 }),
                                });
                                const data = await resp.json();
                                if (data?.url) {
                                  setSubPlanForm(f => ({ ...f, qr_code_image: data.url }));
                                  toast.success('QR Code enviado!');
                                } else {
                                  throw new Error(data?.error || 'Erro ao enviar');
                                }
                              } catch (err: any) {
                                toast.error('Erro ao enviar QR Code', { description: err.message });
                              }
                            }}
                          />
                        </div>
                        <p className="text-[9px] text-muted-foreground">Envie a imagem do QR Code PIX</p>
                        {subPlanForm.qr_code_image && <img src={subPlanForm.qr_code_image} alt="QR" className="w-16 h-16 rounded border object-contain bg-white mt-1" />}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">PIX Copia e Cola</Label>
                        <Textarea value={subPlanForm.pix_copy_paste} onChange={(e) => setSubPlanForm(f => ({ ...f, pix_copy_paste: e.target.value }))} placeholder="Cole aqui o código PIX copia e cola" className="text-xs min-h-[60px]" />
                        <p className="text-[9px] text-muted-foreground">Código PIX que o revendedor vai copiar</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">WhatsApp (DDD + número)</Label>
                        <Input value={subPlanForm.whatsapp_number} onChange={(e) => setSubPlanForm(f => ({ ...f, whatsapp_number: e.target.value }))} placeholder="Ex: 83999999999" className="h-8 text-xs" />
                        <p className="text-[9px] text-muted-foreground">Número para o revendedor confirmar pagamento</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveSubPlan} disabled={savingSubPlan} className="flex-1 h-8 text-xs">
                      {savingSubPlan ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                      {editingSubPlan ? 'Atualizar' : 'Criar'}
                    </Button>
                    {editingSubPlan && <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setEditingSubPlan(null); setSubPlanForm(emptySubPlan); }}>Cancelar</Button>}
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowSubPreview(!showSubPreview)}>
                      <Eye className="h-3.5 w-3.5 mr-1" />Preview
                    </Button>
                  </div>
                </div>

                {/* Preview */}
                {showSubPreview && subPlans.length > 0 && (
                  <div className="p-3 rounded-lg border border-primary/30 bg-card/50 space-y-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Preview do Revendedor</p>
                    <div className="grid grid-cols-2 gap-2">
                      {subPlans.filter(p => p.is_active).map((plan) => (
                        <div key={plan.id} className="py-2 px-2 rounded-lg border border-border text-center relative bg-card">
                          {plan.badge && <Badge className={`${plan.badge_color} text-white text-[7px] px-1 py-0 absolute -top-1.5 left-1/2 -translate-x-1/2`}>{plan.badge}</Badge>}
                          <p className="text-xs font-bold text-primary">{plan.credits} cr</p>
                          <p className="text-[10px] font-medium">R$ {Number(plan.total).toFixed(2).replace('.', ',')}</p>
                          {plan.bonus > 0 && <p className="text-[9px] text-green-500">+{plan.bonus} bônus</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* List */}
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <div className="px-3 py-2 bg-muted/30">
                    <span className="text-xs font-semibold">Planos ({subPlans.length})</span>
                  </div>
                  {loadingSubPlans ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : subPlans.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-8">Nenhum plano</p>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {subPlans.map((plan) => (
                        <div key={plan.id} className="flex items-center gap-3 px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium">{plan.name}</span>
                              {plan.badge && <Badge className={`${plan.badge_color} text-white text-[7px] px-1 py-0`}>{plan.badge}</Badge>}
                              {!plan.is_active && <Badge variant="outline" className="text-[8px] text-muted-foreground">OFF</Badge>}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{plan.credits} cr • R$ {Number(plan.total).toFixed(2)}{plan.bonus > 0 ? ` • +${plan.bonus} bônus` : ''}</p>
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingSubPlan(plan); setSubPlanForm(plan); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => plan.id && handleDeleteSubPlan(plan.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              )}

              {/* ===== ANÚNCIOS ===== */}
              <TabsContent value="anuncios" className="mt-4">
                <AnnouncementsManager adminId={admin?.id || 0} />
              </TabsContent>

              {/* ===== GERENCIAR ===== */}
              <TabsContent value="manage" className="space-y-4 mt-4">
                {/* Create Account */}
                <div className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Criar Conta</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Tipo</Label>
                      <Select value={createType} onValueChange={(v: any) => setCreateType(v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {!isSub && <SelectItem value="sub">Sub Dono</SelectItem>}
                          {!isSub && <SelectItem value="master">Master</SelectItem>}
                          <SelectItem value="revendedor">Revendedor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Nome</Label>
                      <Input value={createForm.name} onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Email</Label>
                      <Input value={createForm.email} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Senha</Label>
                      <Input value={createForm.password} onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={giveCredits} onCheckedChange={setGiveCredits} />
                    <span className="text-xs text-muted-foreground">Créditos iniciais</span>
                    {giveCredits && <Input type="number" value={initialCredits} onChange={(e) => setInitialCredits(e.target.value)} className="w-20 h-7 text-xs" min={0} />}
                  </div>
                  <Button size="sm" onClick={handleCreateAccount} disabled={isCreating} className="w-full h-8 text-xs">
                    {isCreating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <UserPlus className="h-3.5 w-3.5 mr-1" />}
                    Criar {createType === 'sub' ? 'Sub' : createType === 'master' ? 'Master' : 'Revendedor'}
                  </Button>
                </div>

                {/* Manutenção de Módulos */}
                {!isSub && (
                <div className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Manutenção de Módulos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px]"
                        disabled={togglingAll}
                        onClick={() => toggleAllMaintenance(true)}
                      >
                        {togglingAll ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Power className="h-3 w-3 mr-1" />}
                        Desativar Todos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px]"
                        disabled={togglingAll}
                        onClick={() => toggleAllMaintenance(false)}
                      >
                        {togglingAll ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Power className="h-3 w-3 mr-1" />}
                        Ativar Todos
                      </Button>
                    </div>
                  </div>
                  {loadingMaintenance ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {MODULES.map(mod => {
                        const isOn = !!maintenanceMap[mod.id];
                        return (
                          <div key={mod.id} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${isOn ? 'border-red-500/30 bg-red-500/5' : 'border-border/50 bg-card/50'}`}>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${isOn ? 'bg-red-500' : 'bg-green-500'}`} />
                              <span className="text-xs font-medium">{mod.label}</span>
                              {isOn && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[8px] px-1 py-0">OFF</Badge>}
                            </div>
                            <Switch
                              checked={!isOn}
                              disabled={savingModule === mod.id || togglingAll}
                              onCheckedChange={() => toggleMaintenance(mod.id, isOn)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                )}

                {/* Recarga em Dobro */}
                {!isSub && (
                <div className={`p-3 rounded-lg border transition-all ${recargaDobro ? 'border-green-500/30 bg-green-500/5' : 'border-border/50 bg-card/50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className={`h-3.5 w-3.5 ${recargaDobro ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="text-xs font-medium flex items-center gap-1.5">
                          Recarga em Dobro
                          {recargaDobro && <Badge className="bg-green-500 text-white text-[8px] px-1 py-0 border-0">ON</Badge>}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Dobro de créditos na recarga PIX</p>
                      </div>
                    </div>
                    <Switch
                      checked={recargaDobro}
                      disabled={togglingDobro}
                      onCheckedChange={async (checked) => {
                        setTogglingDobro(true);
                        try {
                          await (api as any).settings.toggleRecargaDobro(checked);
                          setRecargaDobro(checked);
                          toast.success(checked ? 'Ativada!' : 'Desativada');
                        } catch { toast.error('Erro'); }
                        finally { setTogglingDobro(false); }
                      }}
                    />
                  </div>
                </div>
                )}

                {/* Pricing */}
                {!isSub && (
                <div className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Valores</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Cadastro (R$)</Label>
                      <Input type="number" step="0.01" value={resellerPrice} onChange={(e) => setResellerPrice(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Créditos iniciais</Label>
                      <Input type="number" value={resellerCredits} onChange={(e) => setResellerCredits(e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>

                  <div className="border-t border-border/30 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Pacotes</span>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setCreditPackages(prev => [...prev, { credits: 0, unitPrice: 0, total: 0 }])}>
                        <Plus className="h-3 w-3 mr-1" />Adicionar
                      </Button>
                    </div>
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                      {creditPackages.map((pkg, index) => (
                        <div key={index} className="grid grid-cols-4 gap-1.5 items-end">
                          <Input type="number" value={pkg.credits} onChange={(e) => setCreditPackages(prev => prev.map((p, i) => i === index ? { ...p, credits: parseInt(e.target.value) || 0 } : p))} placeholder="Cr" className="h-7 text-[10px]" />
                          <Input type="number" step="0.01" value={pkg.unitPrice} onChange={(e) => { const val = parseFloat(e.target.value) || 0; setCreditPackages(prev => prev.map((p, i) => i === index ? { ...p, unitPrice: val, total: Math.round(val * (p.credits || 0) * 100) / 100 } : p)); }} placeholder="R$/un" className="h-7 text-[10px]" />
                          <Input type="number" step="0.01" value={pkg.total} onChange={(e) => setCreditPackages(prev => prev.map((p, i) => i === index ? { ...p, total: parseFloat(e.target.value) || 0 } : p))} placeholder="Total" className="h-7 text-[10px]" />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCreditPackages(prev => prev.filter((_, i) => i !== index))}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      {creditPackages.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-3">Nenhum pacote</p>}
                    </div>
                  </div>

                  <Button size="sm" className="w-full h-8 text-xs" onClick={async () => {
                    setSavingPricing(true);
                    try {
                      const valid = creditPackages.filter(p => p.credits > 0 && p.unitPrice > 0 && p.total > 0);
                      if (valid.length === 0) { toast.error('Adicione pacote válido'); return; }
                      await (api as any).settings.update({
                        reseller_price: parseFloat(resellerPrice) || 90,
                        reseller_credits: parseInt(resellerCredits) || 5,
                        credit_packages: valid.sort((a: any, b: any) => a.credits - b.credits),
                      });
                      toast.success('Valores salvos!');
                    } catch (err: any) { toast.error(err.message || 'Erro'); }
                    finally { setSavingPricing(false); }
                  }} disabled={savingPricing}>
                    {savingPricing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                    Salvar Valores
                  </Button>
                </div>
                )}

                {/* Downloads */}
                {!isSub && (
                <div className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Downloads</span>
                  </div>
                  {[
                    { title: 'CNH Digital 2026', fields: [{ label: 'iPhone', value: cnhIphone, set: setCnhIphone }, { label: 'APK', value: cnhApk, set: setCnhApk }] },
                    { title: 'Gov.br', fields: [{ label: 'iPhone', value: govbrIphone, set: setGovbrIphone }, { label: 'APK', value: govbrApk, set: setGovbrApk }] },
                    { title: 'ABAFE', fields: [{ label: 'iPhone', value: abafeIphone, set: setAbafeIphone }, { label: 'APK', value: abafeApk, set: setAbafeApk }] },
                  ].map((section, si) => (
                    <div key={si}>
                      {si > 0 && <div className="border-t border-border/30 pt-2" />}
                      <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{section.title}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {section.fields.map((f) => (
                          <div key={f.label} className="flex gap-1">
                            <Input value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={`${f.label}...`} className="h-7 text-[10px] flex-1" />
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => f.set('')}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button size="sm" onClick={handleSaveLinks} disabled={savingLinks} className="w-full h-8 text-xs">
                    {savingLinks ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                    Salvar Links
                  </Button>
                </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* ===== DIALOGS ===== */}
      {/* Alert Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4 text-amber-500" />Enviar Alerta</DialogTitle>
            <DialogDescription className="text-[10px]">Selecione um admin ou envie para todos inativos.</DialogDescription>
          </DialogHeader>
          <Select value={alertTargetId} onValueChange={setAlertTargetId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {allNonDono.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.nome} ({a.rank})</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-8 text-xs" disabled={!alertTargetId || sendingAlert} onClick={async () => {
              setSendingAlert(true);
              try {
                const target = allAdmins.find(a => a.id === Number(alertTargetId));
                const msg = target?.rank === 'master'
                  ? '⚠️ ALERTA DA ADMINISTRAÇÃO: Você é Master, um cargo importante na base. Dê atenção ou será rebaixado para Revendedor. Não faz sentido ter seu cargo e não utilizar dos benefícios.'
                  : '⚠️ ALERTA DA ADMINISTRAÇÃO: Você está inativo na base. Use com frequência, pois poderá perder acesso.';
                await api.alerts.send(Number(alertTargetId), msg);
                toast.success('Alerta enviado!');
                setAlertDialogOpen(false);
                setAlertTargetId('');
              } catch (e: any) { toast.error(e.message || 'Erro'); }
              finally { setSendingAlert(false); }
            }}>
              <Send className="h-3 w-3 mr-1" />Enviar
            </Button>
            {inactiveAdmins.length > 0 && (
              <Button size="sm" variant="destructive" className="h-8 text-xs" disabled={sendingAlert} onClick={async () => {
                setSendingAlert(true);
                try {
                  for (const a of inactiveAdmins) {
                    const msg = a.rank === 'master'
                      ? '⚠️ ALERTA DA ADMINISTRAÇÃO: Você é Master, um cargo importante na base. Dê atenção ou será rebaixado para Revendedor.'
                      : '⚠️ ALERTA DA ADMINISTRAÇÃO: Você está inativo na base. Use com frequência, pois poderá perder acesso.';
                    await api.alerts.send(a.id, msg);
                  }
                  toast.success(`Alerta enviado para ${inactiveAdmins.length} inativos!`);
                  setAlertDialogOpen(false);
                } catch (e: any) { toast.error(e.message || 'Erro'); }
                finally { setSendingAlert(false); }
              }}>
                <AlertTriangle className="h-3 w-3 mr-1" />Todos ({inactiveAdmins.length})
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={passwordDialog.open} onOpenChange={(o) => setPasswordDialog({ open: o, admin: o ? passwordDialog.admin : null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2"><KeyRound className="h-4 w-4" />Alterar Senha</DialogTitle>
            <DialogDescription className="text-[10px]">{passwordDialog.admin?.nome} ({passwordDialog.admin?.email})</DialogDescription>
          </DialogHeader>
          <Input type="text" placeholder="Nova senha (mín. 4)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-8 text-xs" />
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPasswordDialog({ open: false, admin: null })}>Cancelar</Button>
            <Button size="sm" className="h-8 text-xs" onClick={handleChangePassword} disabled={newPassword.length < 4}>Alterar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialog.open} onOpenChange={(o) => setTransferDialog({ open: o, admin: o ? transferDialog.admin : null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4" />Transferir</DialogTitle>
            <DialogDescription className="text-[10px]">Para {transferDialog.admin?.nome} (saldo: {transferDialog.admin?.creditos.toLocaleString('pt-BR')})</DialogDescription>
          </DialogHeader>
          <p className="text-[10px] text-muted-foreground">Seu saldo: <strong>{credits.toLocaleString('pt-BR')}</strong></p>
          <Input type="number" placeholder="Quantidade" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="h-8 text-xs" min={1} />
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setTransferDialog({ open: false, admin: null })}>Cancelar</Button>
            <Button size="sm" className="h-8 text-xs" onClick={handleTransferCredits} disabled={!transferAmount || parseInt(transferAmount) <= 0 || parseInt(transferAmount) > credits}>Transferir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(o) => setDetailDialog({ open: o, admin: o ? detailDialog.admin : null })}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" />Documentos de {detailDialog.admin?.nome}</DialogTitle>
            <DialogDescription className="text-[10px]">{detailDialog.admin?.email} • {detailDialog.admin?.creditos.toLocaleString('pt-BR')} créditos</DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : detailData ? (
            <Tabs defaultValue="cnh" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                {[
                  { value: 'cnh', icon: Car, label: 'CNH', key: 'cnhs' },
                  { value: 'rg', icon: IdCard, label: 'RG', key: 'rgs' },
                  { value: 'carteira', icon: GraduationCap, label: 'Est', key: 'carteiras' },
                  { value: 'crlv', icon: Truck, label: 'CRLV', key: 'crlvs' },
                  { value: 'cha', icon: Ship, label: 'Náut', key: 'chas' },
                ].map(t => (
                  <TabsTrigger key={t.value} value={t.value} className="text-[10px] gap-1">
                    <t.icon className="h-3 w-3" />{t.label} ({detailData.documents[t.key]?.length || 0})
                  </TabsTrigger>
                ))}
              </TabsList>

              {['cnh', 'rg', 'carteira', 'crlv', 'cha'].map((type) => {
                const key = type === 'cnh' ? 'cnhs' : type === 'rg' ? 'rgs' : type === 'carteira' ? 'carteiras' : type === 'crlv' ? 'crlvs' : 'chas';
                const docs = detailData.documents[key] || [];
                return (
                  <TabsContent key={type} value={type} className="mt-3">
                    {docs.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8 text-xs">Nenhum documento</p>
                    ) : (
                      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-[10px]">Nome</TableHead>
                              <TableHead className="text-[10px]">CPF</TableHead>
                              <TableHead className="text-[10px]">Senha</TableHead>
                              {type === 'crlv' && <TableHead className="text-[10px]">Placa</TableHead>}
                              {type !== 'carteira' && <TableHead className="text-[10px]">Validade</TableHead>}
                              <TableHead className="text-[10px]">Criado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {docs.map((doc: any) => (
                              <TableRow key={doc.id}>
                                <TableCell className="text-xs font-medium max-w-[150px] truncate">{doc.nome}</TableCell>
                                <TableCell className="font-mono text-[10px]">{doc.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</TableCell>
                                <TableCell className="font-mono text-[10px] font-semibold text-primary">{doc.senha}</TableCell>
                                {type === 'crlv' && <TableCell className="font-mono text-[10px]">{doc.placa}</TableCell>}
                                {type !== 'carteira' && <TableCell className="text-[10px]">{doc.validade ? new Date(doc.validade).toLocaleDateString('pt-BR') : '-'}</TableCell>}
                                <TableCell className="text-[10px] text-muted-foreground">{formatDate(doc.created_at)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-xs">Erro ao carregar</p>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );

  // ===== ADMIN TABLE =====
  function renderAdminTable(admins: AdminItem[]) {
    return (
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px]">Admin</TableHead>
              {!isSub && <TableHead className="text-[10px]">Saldo</TableHead>}
              <TableHead className="text-[10px]">Serviços</TableHead>
              <TableHead className="text-[10px]">Último Módulo</TableHead>
              <TableHead className="text-[10px]">Status</TableHead>
              <TableHead className="text-[10px]">Criado por</TableHead>
              <TableHead className="text-[10px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((adm) => {
              const days = getDaysInactive(adm.last_active, adm.created_at);
              const colors = getStatusColor(days);
              return (
                <TableRow key={adm.id}>
                  <TableCell className="py-2">
                    <p className="text-xs font-medium">{adm.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{adm.email}</p>
                    {adm.key_plain && <p className="text-[9px] text-muted-foreground/50 font-mono">🔑 {adm.key_plain}</p>}
                  </TableCell>
                  {!isSub && <TableCell className="py-2 text-xs font-semibold">{adm.creditos.toLocaleString('pt-BR')}</TableCell>}
                  <TableCell className="py-2">
                    <span className="text-xs font-bold">{adm.total_services}</span>
                    <div className="flex gap-0.5 mt-0.5 flex-wrap">
                      {adm.total_cnh > 0 && <span className="text-[8px] px-1 py-0 rounded bg-green-500/10 text-green-500">{adm.total_cnh} CNH</span>}
                      {adm.total_rg > 0 && <span className="text-[8px] px-1 py-0 rounded bg-purple-500/10 text-purple-500">{adm.total_rg} RG</span>}
                      {adm.total_crlv > 0 && <span className="text-[8px] px-1 py-0 rounded bg-blue-500/10 text-blue-500">{adm.total_crlv} CRLV</span>}
                      {adm.total_carteira > 0 && <span className="text-[8px] px-1 py-0 rounded bg-amber-500/10 text-amber-500">{adm.total_carteira} Est</span>}
                      {adm.total_cha > 0 && <span className="text-[8px] px-1 py-0 rounded bg-cyan-500/10 text-cyan-500">{adm.total_cha} Náut</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    {adm.last_service ? (
                      <div className="flex items-center gap-1">
                        {getServiceIcon(adm.last_service.tipo)}
                        <div>
                          <p className="text-[10px] font-medium">{adm.last_service.tipo}</p>
                          <p className="text-[9px] text-muted-foreground">{timeAgo(adm.last_service.created_at)}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      <span className={`text-[10px] font-medium ${colors.text}`}>
                        {days === 0 ? 'Online' : days < 2 ? 'Recente' : `${days}d off`}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground">{adm.last_active ? timeAgo(adm.last_active) : 'Nunca'}</p>
                  </TableCell>
                  <TableCell className="py-2 text-[10px] text-muted-foreground">{adm.criado_por_nome || '-'}</TableCell>
                  <TableCell className="py-2 text-right">
                    <div className="flex items-center gap-0.5 justify-end">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openDetailDialog(adm)} title="Documentos"><Eye className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setPasswordDialog({ open: true, admin: adm }); setNewPassword(''); }} title="Senha"><KeyRound className="h-3 w-3" /></Button>
                      {!isSub && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setTransferDialog({ open: true, admin: adm }); setTransferAmount(''); }} title="Transferir"><Send className="h-3 w-3" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {admins.length === 0 && (
              <TableRow>
                <TableCell colSpan={isSub ? 6 : 7} className="text-center py-8 text-muted-foreground text-xs">
                  Nenhum admin encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  }
}
