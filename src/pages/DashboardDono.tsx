import { useState, useEffect } from 'react';
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
import {
  Crown, Users, CreditCard, FileText, Shield, Eye, KeyRound, Send,
  Car, IdCard, GraduationCap, Truck, Ship, Trophy, Medal, Award,
  ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Activity,
  Search, RefreshCw, Clock, AlertTriangle, Zap, ChevronRight,
  Settings, UserPlus, Download, Save, Loader2, Trash2, Megaphone, Plus, Pencil
} from 'lucide-react';

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

interface AuditEntry {
  type: 'service' | 'transfer' | 'recharge';
  service?: string;
  cpf?: string;
  nome_documento?: string;
  admin_id?: number;
  admin_nome?: string;
  admin_saldo_atual?: number;
  amount?: number;
  total_price?: number;
  from_admin_id?: number;
  from_nome?: string;
  from_saldo_atual?: number;
  to_admin_id?: number;
  to_nome?: string;
  to_saldo_atual?: number;
  created_at: string;
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
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [topEntries, setTopEntries] = useState<TopEntry[]>([]);
  const [lastService, setLastService] = useState<LastService | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [auditFilter, setAuditFilter] = useState<string>('');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminRankFilter, setAdminRankFilter] = useState<string>('all');

  // Daily history state
  const [dailyHistory, setDailyHistory] = useState<Record<string, any[]>>({});
  const [dailyTotal, setDailyTotal] = useState(0);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyFilterAdmin, setDailyFilterAdmin] = useState<string>('all');
  const [dailyFilterModule, setDailyFilterModule] = useState<string>('all');
  const [dailyFilterDate, setDailyFilterDate] = useState<string>('');
  const [dailyFilterOwnership, setDailyFilterOwnership] = useState<string>('all'); // all, mine, others

  // All transfers state (dono)
  const [allTransfers, setAllTransfers] = useState<any[]>([]);
  const [allTransfersLoading, setAllTransfersLoading] = useState(false);
  const [transfersMasterFilter, setTransfersMasterFilter] = useState<string>('all');
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; admin: AdminItem | null }>({ open: false, admin: null });
  const [transferDialog, setTransferDialog] = useState<{ open: boolean; admin: AdminItem | null }>({ open: false, admin: null });
  const [newPassword, setNewPassword] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // Detail dialog state
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; admin: AdminItem | null }>({ open: false, admin: null });
  const [detailData, setDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Gerenciar tab state
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

  // Pricing settings state
  const [resellerPrice, setResellerPrice] = useState('90');
  const [resellerCredits, setResellerCredits] = useState('5');
  const [creditPackages, setCreditPackages] = useState<Array<{ credits: number; unitPrice: number; total: number }>>([]);
  const [savingPricing, setSavingPricing] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [recargaDobro, setRecargaDobro] = useState(false);
  const [togglingDobro, setTogglingDobro] = useState(false);

  // Alert state
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertTargetId, setAlertTargetId] = useState<string>('');
  const [sendingAlert, setSendingAlert] = useState(false);

  // Notícias state
  interface Noticia { id: number; titulo: string; informacao: string; data_post: string; }
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [noticiaForm, setNoticiaForm] = useState({ titulo: '', informacao: '' });
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [savingNoticia, setSavingNoticia] = useState(false);

  // Sub recharge plans state
  interface SubPlan { id?: number; admin_id?: number; name: string; credits: number; base_credits: number; bonus: number; total: number; badge: string; badge_color: string; sort_order: number; is_active: boolean; }
  const [subPlans, setSubPlans] = useState<SubPlan[]>([]);
  const [subPlanForm, setSubPlanForm] = useState<SubPlan>({ name: '', credits: 0, base_credits: 0, bonus: 0, total: 0, badge: '', badge_color: 'bg-blue-500', sort_order: 0, is_active: true });
  const [editingSubPlan, setEditingSubPlan] = useState<SubPlan | null>(null);
  const [savingSubPlan, setSavingSubPlan] = useState(false);
  const [loadingSubPlans, setLoadingSubPlans] = useState(false);

  const fetchSubPlans = async () => {
    if (!admin) return;
    setLoadingSubPlans(true);
    try {
      const { data } = await supabase.functions.invoke('manage-sub-plans', {
        body: { action: 'list', admin_id: admin.id, session_token: admin.session_token }
      });
      if (data?.plans) setSubPlans(data.plans);
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
      const action = editingSubPlan ? 'update' : 'create';
      const plan = editingSubPlan ? { ...subPlanForm, id: editingSubPlan.id } : subPlanForm;
      const { data, error } = await supabase.functions.invoke('manage-sub-plans', {
        body: { action, admin_id: admin.id, session_token: admin.session_token, plan }
      });
      if (error) throw error;
      toast.success(editingSubPlan ? 'Plano atualizado!' : 'Plano criado!');
      setSubPlanForm({ name: '', credits: 0, base_credits: 0, bonus: 0, total: 0, badge: '', badge_color: 'bg-blue-500', sort_order: 0, is_active: true });
      setEditingSubPlan(null);
      fetchSubPlans();
    } catch (e: any) { toast.error(e.message || 'Erro ao salvar plano'); }
    finally { setSavingSubPlan(false); }
  };

  const handleDeleteSubPlan = async (planId: number) => {
    if (!admin) return;
    try {
      await supabase.functions.invoke('manage-sub-plans', {
        body: { action: 'delete', admin_id: admin.id, session_token: admin.session_token, plan_id: planId }
      });
      toast.success('Plano removido!');
      fetchSubPlans();
    } catch (e: any) { toast.error('Erro ao remover plano'); }
  };

  useEffect(() => {
    if (admin && (role === 'dono' || role === 'sub')) fetchAllData();
  }, [admin, role]);

  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      const [overviewData, adminsData, auditData, topData, lastSvc, dlData, noticiasData, settingsData] = await Promise.all([
        (api as any).owner.getOverview(),
        (api as any).owner.getAllAdmins(),
        (api as any).owner.getAuditLog(),
        (api as any).owner.getTopResellers(),
        (api as any).owner.getLastService(),
        role === 'dono' ? mysqlApi.downloads.fetch().catch(() => null) : Promise.resolve(null),
        (api as any).noticias.list().catch(() => []),
        (api as any).settings.get().catch(() => null),
      ]);
      setOverview(overviewData);
      setAllAdmins(adminsData);
      setAuditLog(auditData);
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

  const handleSaveLinks = async () => {
    if (!admin) return;
    setSavingLinks(true);
    try {
      if (isUsingMySQL()) {
        await mysqlApi.downloads.update({
          cnh_iphone: cnhIphone,
          cnh_apk: cnhApk,
          govbr_iphone: govbrIphone,
          govbr_apk: govbrApk,
          abafe_apk: abafeApk,
          abafe_iphone: abafeIphone,
        });
      } else {
        const { error } = await supabase.functions.invoke('update-downloads', {
          body: {
            admin_id: admin.id,
            session_token: admin.session_token,
            cnh_iphone: cnhIphone,
            cnh_apk: cnhApk,
            govbr_iphone: govbrIphone,
            govbr_apk: govbrApk,
            abafe_apk: abafeApk,
            abafe_iphone: abafeIphone,
          },
        });
        if (error) throw error;
      }
      toast.success('Links atualizados com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar links');
    } finally {
      setSavingLinks(false);
    }
  };

  const handleClearLink = (field: string) => {
    switch (field) {
      case 'cnh_iphone': setCnhIphone(''); break;
      case 'cnh_apk': setCnhApk(''); break;
      case 'govbr_iphone': setGovbrIphone(''); break;
      case 'govbr_apk': setGovbrApk(''); break;
      case 'abafe_iphone': setAbafeIphone(''); break;
      case 'abafe_apk': setAbafeApk(''); break;
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
      let newAdminId: number | null = null;

      const creditsToGive = giveCredits && parseInt(initialCredits) > 0 ? parseInt(initialCredits) : 0;

      if (createType === 'sub') {
        const result = await (api as any).admins.createSub({
          nome: createForm.name,
          email: createForm.email.toLowerCase().trim(),
          key: createForm.password,
          criadoPor: admin!.id,
          ...(creditsToGive > 0 ? { creditos: creditsToGive } : {}),
        });
        newAdminId = typeof result === 'number' ? result : (result as any)?.id || null;
      } else if (createType === 'master') {
        const result = await api.admins.createMaster({
          nome: createForm.name,
          email: createForm.email.toLowerCase().trim(),
          key: createForm.password,
          criadoPor: admin!.id,
          ...(creditsToGive > 0 ? { creditos: creditsToGive } : {}),
        });
        newAdminId = typeof result === 'number' ? result : (result as any)?.id || null;
      } else {
        const result = await api.admins.createReseller({
          nome: createForm.name,
          email: createForm.email.toLowerCase().trim(),
          key: createForm.password,
          criadoPor: admin!.id,
          ...(creditsToGive > 0 ? { creditos: creditsToGive } : {}),
        });
        newAdminId = typeof result === 'number' ? result : (result as any)?.id || null;
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

  const handleFilterAudit = async (adminId?: number) => {
    try {
      const data = await (api as any).owner.getAuditLog(adminId);
      setAuditLog(data);
    } catch (error) { console.error('Erro:', error); }
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
      toast.error('Erro ao carregar histórico diário');
    } finally {
      setDailyLoading(false);
    }
  };

  useEffect(() => {
    if (admin && (role === 'dono' || role === 'sub') && activeTab === 'audit') {
      fetchDailyHistory();
    }
  }, [activeTab, dailyFilterAdmin, dailyFilterModule, dailyFilterDate]);

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }
  if (!admin) return <Navigate to="/login" replace />;
  if (role !== 'dono' && role !== 'sub') return <Navigate to="/dashboard" replace />;
  
  const isSub = role === 'sub';

  const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const timeAgo = (d: string) => {
    if (!d) return 'Nunca';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d atrás`;
    return formatDate(d);
  };

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case 'dono': return <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-yellow-950 border-0 text-[10px]"><Crown className="h-3 w-3 mr-1" />Dono</Badge>;
      case 'sub': return <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-orange-950 border-0 text-[10px]"><Shield className="h-3 w-3 mr-1" />Sub Dono</Badge>;
      case 'master': return <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 text-[10px]"><Shield className="h-3 w-3 mr-1" />Master</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]">Revendedor</Badge>;
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'CNH': return <Car className="h-4 w-4 text-green-500" />;
      case 'RG': return <IdCard className="h-4 w-4 text-purple-500" />;
      case 'Carteira': return <GraduationCap className="h-4 w-4 text-amber-500" />;
      case 'CRLV': return <Truck className="h-4 w-4 text-blue-500" />;
      case 'Náutica': return <Ship className="h-4 w-4 text-cyan-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const masters = allAdmins.filter(a => a.rank === 'master');
  const resellers = allAdmins.filter(a => a.rank === 'revendedor');
  const donos = allAdmins.filter(a => a.rank === 'dono');
  const subs = allAdmins.filter(a => a.rank === 'sub');

  const filteredAdmins = allAdmins.filter(a => {
    const matchSearch = !adminSearch || a.nome.toLowerCase().includes(adminSearch.toLowerCase()) || a.email.toLowerCase().includes(adminSearch.toLowerCase());
    const matchRank = adminRankFilter === 'all' || a.rank === adminRankFilter;
    return matchSearch && matchRank;
  });

  // Ordenar por atividade: mais ativos primeiro
  const sortedByActivity = [...allAdmins].filter(a => a.rank !== 'dono').sort((a, b) => b.total_services - a.total_services);
  const mostActive = sortedByActivity.slice(0, 10);
  const mostActiveMasters = sortedByActivity.filter(a => a.rank === 'master').slice(0, 5);
  const mostActiveResellers = sortedByActivity.filter(a => a.rank === 'revendedor').slice(0, 5);
  const mostActiveSubs = sortedByActivity.filter(a => a.rank === 'sub').slice(0, 5);
  // Inativos: 2+ dias sem atividade
  const getDaysInactive = (lastActive: string | null, createdAt?: string) => {
    const ref = lastActive || createdAt;
    if (!ref) return 999;
    return Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24));
  };
  const inactiveAdmins = allAdmins
    .filter(a => a.rank !== 'dono' && getDaysInactive(a.last_active, a.created_at) >= 2)
    .sort((a, b) => getDaysInactive(b.last_active, b.created_at) - getDaysInactive(a.last_active, a.created_at));
  const inactiveMasters = inactiveAdmins.filter(a => a.rank === 'master');
  const inactiveResellers = inactiveAdmins.filter(a => a.rank === 'revendedor');
  const inactiveSubs = inactiveAdmins.filter(a => a.rank === 'sub');

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">Inovando e Recriando o Futuro Digital</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              <CreditCard className="h-3 w-3 mr-1" />
              Ilimitado
            </Badge>
            {(isSub) && (
              <Badge variant="outline" className="text-sm">
                <Send className="h-3 w-3 mr-1" />
                {creditsTransf.toLocaleString('pt-BR')} transf
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={fetchAllData} disabled={loadingData}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v);
          if (v === 'transfers' && allTransfers.length === 0) {
            fetchAllTransfers();
          }
        }}>
          <TabsList className="flex w-full overflow-x-auto no-scrollbar gap-0.5 lg:inline-flex lg:w-auto">
            <TabsTrigger value="overview" className="text-[10px] sm:text-xs px-2 sm:px-3 shrink-0">Geral</TabsTrigger>
            <TabsTrigger value="masters" className="text-[10px] sm:text-xs px-2 sm:px-3 shrink-0">Masters</TabsTrigger>
            <TabsTrigger value="resellers" className="text-[10px] sm:text-xs px-2 sm:px-3 shrink-0">Revendas</TabsTrigger>
            {!isSub && <TabsTrigger value="transfers" className="text-[10px] sm:text-xs px-2 sm:px-3 shrink-0">Transf.</TabsTrigger>}
            <TabsTrigger value="audit" className="text-[10px] sm:text-xs px-2 sm:px-3 shrink-0">Histórico</TabsTrigger>
            {!isSub && <TabsTrigger value="ranking" className="text-[10px] sm:text-xs px-2 sm:px-3 shrink-0">Ranking</TabsTrigger>}
            <TabsTrigger value="noticias" className="text-[10px] sm:text-xs px-2 sm:px-3 shrink-0">Notícias</TabsTrigger>
            {isSub && <TabsTrigger value="plans" className="text-[10px] sm:text-xs px-2 sm:px-3 shrink-0" onClick={() => { if (subPlans.length === 0) fetchSubPlans(); }}>Planos</TabsTrigger>}
            <TabsTrigger value="manage" className="text-[10px] sm:text-xs px-2 sm:px-3 shrink-0">Gerenciar</TabsTrigger>
          </TabsList>

          {loadingData ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <>
              {/* ===== OVERVIEW ===== */}
              <TabsContent value="overview" className="space-y-6">
                {overview && (
                  <>
                    <div className={`grid grid-cols-2 ${isSub ? 'sm:grid-cols-2 lg:grid-cols-2' : 'sm:grid-cols-3 lg:grid-cols-5'} gap-3`}>
                      {[
                        { icon: Shield, label: 'Masters', value: overview.totalMasters, color: 'text-blue-500', bg: 'from-blue-500/10 to-blue-600/5 border-blue-500/20', showForSub: true },
                        { icon: Users, label: 'Revendedores', value: overview.totalResellers, color: 'text-purple-500', bg: 'from-purple-500/10 to-purple-600/5 border-purple-500/20', showForSub: true },
                        { icon: CreditCard, label: 'Créditos', value: overview.totalCredits?.toLocaleString('pt-BR'), color: 'text-green-500', bg: 'from-green-500/10 to-green-600/5 border-green-500/20', showForSub: false },
                        { icon: TrendingUp, label: 'Transações', value: overview.totalTransactions, color: 'text-amber-500', bg: 'from-amber-500/10 to-amber-600/5 border-amber-500/20', showForSub: false },
                        { icon: DollarSign, label: 'Faturamento', value: `R$ ${overview.totalRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, color: 'text-emerald-500', bg: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20', showForSub: false },
                      ].filter(item => !isSub || item.showForSub).map(item => (
                        <Card key={item.label} className={`bg-gradient-to-br ${item.bg}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <item.icon className={`h-5 w-5 ${item.color}`} />
                              <div>
                                <p className="text-xl font-bold">{item.value}</p>
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Document counts */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5 text-primary" />Documentos na Base</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {[
                            { label: 'CNH', count: overview.documents.cnh, icon: Car, color: 'text-green-500' },
                            { label: 'RG', count: overview.documents.rg, icon: IdCard, color: 'text-purple-500' },
                            { label: 'Carteira', count: overview.documents.carteira, icon: GraduationCap, color: 'text-amber-500' },
                            { label: 'CRLV', count: overview.documents.crlv, icon: Truck, color: 'text-blue-500' },
                            { label: 'Náutica', count: overview.documents.cha, icon: Ship, color: 'text-cyan-500' },
                            { label: 'Total', count: overview.documents.total, icon: FileText, color: 'text-primary font-bold' },
                          ].map(item => (
                            <div key={item.label} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                              <item.icon className={`h-4 w-4 ${item.color}`} />
                              <div>
                                <p className="text-lg font-bold">{item.count.toLocaleString('pt-BR')}</p>
                                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Last Service Created + Activity Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Last service */}
                      <Card className="border-2 border-primary/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Último Serviço Criado
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {lastService ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                {getServiceIcon(lastService.tipo)}
                                <Badge variant="secondary">{lastService.tipo}</Badge>
                                <span className="text-xs text-muted-foreground ml-auto">{timeAgo(lastService.created_at)}</span>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                                <p className="font-medium text-sm">{lastService.nome}</p>
                                <p className="text-xs text-muted-foreground">CPF: {lastService.cpf}</p>
                                <p className="text-xs text-muted-foreground">Criado por: <span className="font-semibold text-foreground">{lastService.admin_nome}</span></p>
                              </div>
                              {!isSub && (
                              <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                  <p className="text-xs text-muted-foreground">Saldo Antes</p>
                                  <p className="text-lg font-bold text-green-600">{lastService.saldo_antes}</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                  <p className="text-xs text-muted-foreground">Saldo Depois</p>
                                  <p className="text-lg font-bold text-red-600">{lastService.saldo_depois}</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-muted/50 border">
                                  <p className="text-xs text-muted-foreground">Saldo Atual</p>
                                  <p className="text-lg font-bold">{lastService.saldo_atual}</p>
                                </div>
                              </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-center text-muted-foreground py-4 text-sm">Nenhum serviço criado</p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Most active / least active - side by side */}
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <TrendingUp className="h-5 w-5 text-green-500" />
                              Mais Ativos
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Tabs defaultValue="masters" className="w-full">
                              <TabsList className="w-full mb-3">
                                <TabsTrigger value="masters" className="flex-1 text-xs">Masters</TabsTrigger>
                                <TabsTrigger value="revendedores" className="flex-1 text-xs">Revendas</TabsTrigger>
                              </TabsList>
                              {[
                                { value: 'masters', list: mostActiveMasters },
                                { value: 'revendedores', list: mostActiveResellers },
                              ].map(tab => (
                                <TabsContent key={tab.value} value={tab.value} className="mt-0">
                                  <div className="space-y-2">
                                    {tab.list.length === 0 ? (
                                      <p className="text-center text-muted-foreground py-4 text-xs">Nenhum admin encontrado</p>
                                    ) : tab.list.map((a, i) => (
                                      <div key={a.id} className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-muted/30">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-[11px] font-bold text-green-600 shrink-0">{i + 1}</span>
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-sm font-medium truncate max-w-[120px]">{a.nome}</span>
                                              {getRankBadge(a.rank)}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground truncate">{a.email}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                          {!isSub && (
                                            <span className="text-[11px] text-muted-foreground">
                                              <CreditCard className="h-3 w-3 inline mr-0.5" />{a.creditos.toLocaleString('pt-BR')}
                                            </span>
                                          )}
                                          <span className="text-xs font-semibold">{a.total_services} serviços</span>
                                          <span className="text-[11px] text-muted-foreground hidden sm:inline">{a.last_active ? timeAgo(a.last_active) : '-'}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </TabsContent>
                              ))}
                            </Tabs>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2 text-base">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                Inativos
                              </CardTitle>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                                onClick={() => setAlertDialogOpen(true)}
                              >
                                <Send className="h-3 w-3" /> Enviar Alerta
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Tabs defaultValue="masters" className="w-full">
                              <TabsList className="w-full mb-3">
                                <TabsTrigger value="masters" className="flex-1 text-xs">Masters ({inactiveMasters.length})</TabsTrigger>
                                <TabsTrigger value="revendedores" className="flex-1 text-xs">Revendas ({inactiveResellers.length})</TabsTrigger>
                              </TabsList>
                              {[
                                { value: 'masters', list: inactiveMasters },
                                { value: 'revendedores', list: inactiveResellers },
                              ].map(tab => (
                                <TabsContent key={tab.value} value={tab.value} className="mt-0">
                                  <div className="space-y-2">
                                    {tab.list.length === 0 ? (
                                      <p className="text-center text-muted-foreground py-4 text-xs">Nenhum inativo</p>
                                    ) : tab.list.map((a) => {
                                      const days = getDaysInactive(a.last_active, a.created_at);
                                      return (
                                        <div key={a.id} className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-muted/30">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-medium truncate max-w-[120px]">{a.nome}</span>
                                                {getRankBadge(a.rank)}
                                              </div>
                                              <p className="text-[11px] text-muted-foreground truncate">{a.email}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-3 shrink-0">
                                            <Badge variant="destructive" className="text-[9px] px-1.5 py-0">{days}d off</Badge>
                                            <span className="text-xs">{a.total_services} serviços</span>
                                            <span className="text-[11px] text-muted-foreground">{a.last_active ? timeAgo(a.last_active) : 'Nunca'}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </TabsContent>
                              ))}
                            </Tabs>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Alert Dialog */}
                      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base">
                              <Send className="h-4 w-4 text-amber-500" /> Enviar Alerta de Inatividade
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                              Selecione o usuário ou envie para todos os inativos.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-2">
                            <Select value={alertTargetId} onValueChange={setAlertTargetId}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione um admin..." />
                              </SelectTrigger>
                              <SelectContent>
                                {allAdmins.filter(a => a.rank !== 'dono').map((a) => (
                                  <SelectItem key={a.id} value={String(a.id)}>
                                    {a.nome} ({a.rank})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                              <Button
                                onClick={async () => {
                                  if (!alertTargetId) return;
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
                                  } catch (e: any) {
                                    toast.error(e.message || 'Erro ao enviar alerta');
                                  } finally {
                                    setSendingAlert(false);
                                  }
                                }}
                                disabled={!alertTargetId || sendingAlert}
                                className="flex-1 h-9 text-sm gap-1.5"
                              >
                                <Send className="h-3.5 w-3.5" /> Enviar
                              </Button>
                              {inactiveAdmins.length > 0 && (
                                <Button
                                  onClick={async () => {
                                    setSendingAlert(true);
                                    try {
                                      for (const a of inactiveAdmins) {
                                        const msg = a.rank === 'master'
                                          ? '⚠️ ALERTA DA ADMINISTRAÇÃO: Você é Master, um cargo importante na base. Dê atenção ou será rebaixado para Revendedor. Não faz sentido ter seu cargo e não utilizar dos benefícios.'
                                          : '⚠️ ALERTA DA ADMINISTRAÇÃO: Você está inativo na base. Use com frequência, pois poderá perder acesso.';
                                        await api.alerts.send(a.id, msg);
                                      }
                                      toast.success(`Alerta enviado para ${inactiveAdmins.length} inativos!`);
                                      setAlertDialogOpen(false);
                                    } catch (e: any) {
                                      toast.error(e.message || 'Erro ao enviar alertas');
                                    } finally {
                                      setSendingAlert(false);
                                    }
                                  }}
                                  disabled={sendingAlert}
                                  variant="destructive"
                                  className="h-9 text-sm gap-1.5"
                                >
                                  <AlertTriangle className="h-3.5 w-3.5" /> Todos ({inactiveAdmins.length})
                                </Button>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* ===== MASTERS TAB ===== */}
              <TabsContent value="masters" className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm"><Shield className="h-3 w-3 mr-1" />{masters.length} Masters</Badge>
                </div>
                {renderAdminTable(masters)}
              </TabsContent>

              {/* ===== RESELLERS TAB ===== */}
              <TabsContent value="resellers" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar revendedor..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Badge variant="outline" className="text-sm"><Users className="h-3 w-3 mr-1" />{resellers.length} Revendedores</Badge>
                </div>
                {renderAdminTable(resellers.filter(a => !adminSearch || a.nome.toLowerCase().includes(adminSearch.toLowerCase()) || a.email.toLowerCase().includes(adminSearch.toLowerCase())))}
              </TabsContent>

              {/* ===== HISTÓRICO DIÁRIO ===== */}
              {/* ===== TRANSFERÊNCIAS ===== */}
              <TabsContent value="transfers" className="space-y-4">
                <div className="flex items-center gap-3">
                  <Select value={transfersMasterFilter} onValueChange={(v) => { setTransfersMasterFilter(v); fetchAllTransfers(v); }}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por Master" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Masters</SelectItem>
                      {allAdmins.filter(a => a.rank === 'master').map(m => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => fetchAllTransfers(transfersMasterFilter)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {allTransfersLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : allTransfers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma transferência encontrada</p>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>De (Master)</TableHead>
                              <TableHead>Para (Revendedor)</TableHead>
                              <TableHead className="text-right">Créditos</TableHead>
                              <TableHead className="text-right">Data</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allTransfers.map((t: any) => (
                              <TableRow key={t.id}>
                                <TableCell>
                                  <p className="font-medium">{t.from_admin_name}</p>
                                  <p className="text-xs text-muted-foreground">{t.from_admin_email}</p>
                                </TableCell>
                                <TableCell>
                                  <p className="font-medium">{t.to_admin_name}</p>
                                  <p className="text-xs text-muted-foreground">{t.to_admin_email}</p>
                                </TableCell>
                                <TableCell className="text-right font-mono font-semibold text-success">
                                  +{t.amount?.toLocaleString('pt-BR')}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm">
                                  {new Date(t.created_at).toLocaleDateString('pt-BR')} {new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ===== HISTÓRICO DIÁRIO ===== */}
              <TabsContent value="audit" className="space-y-4">
                {/* Filtros */}
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={dailyFilterAdmin} onValueChange={setDailyFilterAdmin}>
                    <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filtrar por admin..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os admins</SelectItem>
                      {allAdmins.map(a => (<SelectItem key={a.id} value={String(a.id)}>{a.nome} ({a.rank})</SelectItem>))}
                    </SelectContent>
                  </Select>

                  <Select value={dailyFilterModule} onValueChange={setDailyFilterModule}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Módulo..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os módulos</SelectItem>
                      <SelectItem value="CNH">CNH Digital</SelectItem>
                      <SelectItem value="RG">RG Digital</SelectItem>
                      <SelectItem value="Carteira">Carteira Estudante</SelectItem>
                      <SelectItem value="CRLV">CRLV</SelectItem>
                      <SelectItem value="Nautica">Arrais Náutica</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dailyFilterOwnership} onValueChange={setDailyFilterOwnership}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="mine">Meus serviços</SelectItem>
                      <SelectItem value="others">De outros</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={dailyFilterDate}
                    onChange={(e) => setDailyFilterDate(e.target.value)}
                    className="w-[170px]"
                    placeholder="Filtrar por data"
                  />
                  {dailyFilterDate && (
                    <Button variant="ghost" size="sm" onClick={() => setDailyFilterDate('')}>Limpar data</Button>
                  )}

                  <Badge variant="secondary">{dailyTotal} serviços</Badge>
                </div>

                {dailyLoading ? (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
                ) : Object.keys(dailyHistory).length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Clock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Nenhum serviço encontrado</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(dailyHistory)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([day, services]) => {
                        // Apply ownership filter client-side
                        const filtered = services.filter(s => {
                          if (dailyFilterOwnership === 'mine') return s.is_mine;
                          if (dailyFilterOwnership === 'others') return !s.is_mine;
                          return true;
                        });
                        if (filtered.length === 0) return null;

                        const dayDate = new Date(day + 'T12:00:00');
                        const isToday = new Date().toISOString().slice(0, 10) === day;
                        const isYesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10) === day;
                        const dayLabel = isToday ? 'Hoje' : isYesterday ? 'Ontem' : dayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

                        // Count per module
                        const moduleCounts: Record<string, number> = {};
                        filtered.forEach(s => { moduleCounts[s.modulo] = (moduleCounts[s.modulo] || 0) + 1; });

                        return (
                          <Card key={day}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 capitalize">
                                  <Clock className="h-4 w-4 text-primary" />
                                  {dayLabel}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                  {Object.entries(moduleCounts).map(([mod, count]) => (
                                    <div key={mod} className="flex items-center gap-1">
                                      {getServiceIcon(mod)}
                                      <span className="text-xs font-semibold">{count}</span>
                                    </div>
                                  ))}
                                  <Badge variant="outline" className="text-xs">{filtered.length} total</Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[80px]">Módulo</TableHead>
                                      <TableHead>Documento</TableHead>
                                      <TableHead>Gerado por</TableHead>
                                      <TableHead className="w-[80px]">Hora</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filtered.map((svc, idx) => (
                                      <TableRow key={`${svc.modulo}-${svc.id}-${idx}`} className={svc.is_mine ? 'bg-primary/5' : ''}>
                                        <TableCell>
                                          <div className="flex items-center gap-1.5">
                                            {getServiceIcon(svc.modulo)}
                                            <span className="text-[10px] font-medium">{svc.modulo}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <p className="text-sm font-medium">{svc.nome}</p>
                                          <p className="text-[10px] text-muted-foreground">CPF: {svc.cpf}</p>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-medium">{svc.admin_nome}</span>
                                            {svc.is_mine && <Badge variant="secondary" className="text-[9px] px-1">Eu</Badge>}
                                            <Badge variant="outline" className="text-[9px] px-1 capitalize">{svc.admin_rank}</Badge>
                                          </div>
                                          <p className="text-[10px] text-muted-foreground">ID: {svc.admin_id}</p>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                          {new Date(svc.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </TabsContent>

              {/* ===== RANKING ===== */}
              <TabsContent value="ranking" className="space-y-4">
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" />Ranking Geral — Quem Mais Usa a Base</CardTitle>
                    <CardDescription>Todos os admins ordenados por total de serviços criados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topEntries.length > 0 ? (
                      <div className="space-y-2">
                        {topEntries.map((entry, index) => (
                          <div key={entry.id} className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-transparent border border-yellow-500/30 shadow-sm'
                              : index === 1 ? 'bg-gradient-to-r from-gray-400/15 to-transparent border border-gray-400/20'
                              : index === 2 ? 'bg-gradient-to-r from-amber-600/15 to-transparent border border-amber-600/20'
                              : 'bg-muted/30'
                          }`}>
                            <div className="flex items-center gap-3">
                              {index === 0 ? (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md"><Trophy className="h-4 w-4 text-yellow-950" /></div>
                              ) : index === 1 ? (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center"><Medal className="h-4 w-4 text-gray-700" /></div>
                              ) : index === 2 ? (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"><Award className="h-4 w-4 text-amber-950" /></div>
                              ) : (
                                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{index + 1}</span>
                              )}
                              <div>
                                <span className={`font-medium text-sm ${index === 0 ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>{entry.nome}</span>
                                <div className="flex items-center gap-2">
                                  {getRankBadge(entry.rank)}
                                  <span className="text-[10px] text-muted-foreground">{entry.last_active ? timeAgo(entry.last_active) : 'Nunca acessou'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary"><CreditCard className="h-3 w-3 mr-1" />{entry.creditos.toLocaleString('pt-BR')}</Badge>
                              <Badge variant={index < 3 ? "default" : "outline"} className={index === 0 ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-yellow-950 border-0' : ''}>
                                <Activity className="h-3 w-3 mr-1" />{entry.total_services} serviços
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4 text-sm">Nenhum dado</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ===== NOTÍCIAS ===== */}
              <TabsContent value="noticias" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Megaphone className="h-5 w-5 text-primary" />
                      {editingNoticia ? 'Editar Notícia' : 'Nova Notícia'}
                    </CardTitle>
                    <CardDescription>Publique comunicados e atualizações para os revendedores</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Título</Label>
                      <Input
                        placeholder="Título da notícia"
                        value={noticiaForm.titulo}
                        onChange={(e) => setNoticiaForm(prev => ({ ...prev, titulo: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Conteúdo</Label>
                      <Textarea
                        placeholder="Escreva o conteúdo da notícia..."
                        value={noticiaForm.informacao}
                        onChange={(e) => setNoticiaForm(prev => ({ ...prev, informacao: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
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
                        className="flex-1"
                      >
                        {savingNoticia ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : editingNoticia ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        {editingNoticia ? 'Salvar Alterações' : 'Publicar Notícia'}
                      </Button>
                      {editingNoticia && (
                        <Button variant="outline" onClick={() => { setEditingNoticia(null); setNoticiaForm({ titulo: '', informacao: '' }); }}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de notícias */}
                <div className="space-y-3">
                  {noticias.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma notícia publicada ainda.</p>
                      </CardContent>
                    </Card>
                  ) : noticias.map((noticia) => (
                    <Card key={noticia.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm">{noticia.titulo}</h3>
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{noticia.informacao}</p>
                            <p className="text-[10px] text-muted-foreground mt-2">
                              {noticia.data_post ? new Date(noticia.data_post).toLocaleString('pt-BR') : '-'}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingNoticia(noticia); setNoticiaForm({ titulo: noticia.titulo, informacao: noticia.informacao }); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={async () => {
                              try {
                                await (api as any).noticias.delete(noticia.id);
                                toast.success('Notícia removida');
                                setNoticias(prev => prev.filter(n => n.id !== noticia.id));
                              } catch { toast.error('Erro ao remover'); }
                            }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* ===== PLANOS DE RECARGA (SUB) ===== */}
              {isSub && (
              <TabsContent value="plans" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="h-5 w-5 text-primary" />
                      {editingSubPlan ? 'Editar Plano' : 'Criar Novo Plano'}
                    </CardTitle>
                    <CardDescription>Gerencie os planos de recarga que seus revendedores verão</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nome do Plano</Label>
                        <Input value={subPlanForm.name} onChange={(e) => setSubPlanForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Pacote Básico" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Total Créditos</Label>
                        <Input type="number" value={subPlanForm.credits || ''} onChange={(e) => setSubPlanForm(f => ({ ...f, credits: Number(e.target.value) }))} placeholder="10" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Créditos Base</Label>
                        <Input type="number" value={subPlanForm.base_credits || ''} onChange={(e) => setSubPlanForm(f => ({ ...f, base_credits: Number(e.target.value) }))} placeholder="8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Bônus</Label>
                        <Input type="number" value={subPlanForm.bonus || ''} onChange={(e) => setSubPlanForm(f => ({ ...f, bonus: Number(e.target.value) }))} placeholder="2" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valor Total (R$)</Label>
                        <Input type="number" step="0.01" value={subPlanForm.total || ''} onChange={(e) => setSubPlanForm(f => ({ ...f, total: Number(e.target.value) }))} placeholder="100.00" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Badge</Label>
                        <Input value={subPlanForm.badge} onChange={(e) => setSubPlanForm(f => ({ ...f, badge: e.target.value }))} placeholder="POPULAR" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cor Badge</Label>
                        <Select value={subPlanForm.badge_color} onValueChange={(v) => setSubPlanForm(f => ({ ...f, badge_color: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bg-blue-500">Azul</SelectItem>
                            <SelectItem value="bg-green-500">Verde</SelectItem>
                            <SelectItem value="bg-purple-500">Roxo</SelectItem>
                            <SelectItem value="bg-orange-500">Laranja</SelectItem>
                            <SelectItem value="bg-red-500">Vermelho</SelectItem>
                            <SelectItem value="bg-emerald-500">Esmeralda</SelectItem>
                            <SelectItem value="bg-gradient-to-r from-orange-500 to-red-500">Gradiente Quente</SelectItem>
                            <SelectItem value="bg-gradient-to-r from-purple-500 to-pink-500">Gradiente Roxo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Ordem</Label>
                        <Input type="number" value={subPlanForm.sort_order || ''} onChange={(e) => setSubPlanForm(f => ({ ...f, sort_order: Number(e.target.value) }))} placeholder="0" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveSubPlan} disabled={savingSubPlan} className="flex-1">
                        {savingSubPlan ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {editingSubPlan ? 'Atualizar' : 'Criar Plano'}
                      </Button>
                      {editingSubPlan && (
                        <Button variant="outline" onClick={() => {
                          setEditingSubPlan(null);
                          setSubPlanForm({ name: '', credits: 0, base_credits: 0, bonus: 0, total: 0, badge: '', badge_color: 'bg-blue-500', sort_order: 0, is_active: true });
                        }}>Cancelar</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Plans List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Planos Cadastrados ({subPlans.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingSubPlans ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : subPlans.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">Nenhum plano cadastrado. Crie seu primeiro plano acima.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Nome</TableHead>
                              <TableHead className="text-xs">Créditos</TableHead>
                              <TableHead className="text-xs">Base + Bônus</TableHead>
                              <TableHead className="text-xs">Valor</TableHead>
                              <TableHead className="text-xs">Badge</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                              <TableHead className="text-xs">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subPlans.map((plan) => (
                              <TableRow key={plan.id}>
                                <TableCell className="text-sm font-medium">{plan.name}</TableCell>
                                <TableCell className="text-sm">{plan.credits}</TableCell>
                                <TableCell className="text-sm">{plan.base_credits} + {plan.bonus}</TableCell>
                                <TableCell className="text-sm">R$ {Number(plan.total).toFixed(2)}</TableCell>
                                <TableCell>
                                  {plan.badge && <Badge className={`${plan.badge_color} text-white text-[10px]`}>{plan.badge}</Badge>}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={plan.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                    {plan.is_active ? 'Ativo' : 'Inativo'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                      setEditingSubPlan(plan);
                                      setSubPlanForm({
                                        name: plan.name, credits: plan.credits, base_credits: plan.base_credits,
                                        bonus: plan.bonus, total: Number(plan.total), badge: plan.badge,
                                        badge_color: plan.badge_color, sort_order: plan.sort_order, is_active: plan.is_active,
                                      });
                                    }}>
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => plan.id && handleDeleteSubPlan(plan.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              )}

              {/* ===== GERENCIAR ===== */}
              <TabsContent value="manage" className="space-y-6">
                {/* Create Master/Reseller */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <UserPlus className="h-5 w-5 text-primary" />
                      Criar Conta
                    </CardTitle>
                    <CardDescription>Crie uma conta {!isSub ? 'Sub Dono, Master ou ' : ''}Revendedor diretamente</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      {!isSub && (
                        <Button
                          variant={createType === 'sub' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCreateType('sub')}
                        >
                          <Crown className="h-4 w-4 mr-1" /> Sub Dono
                        </Button>
                      )}
                      {!isSub && (
                        <Button
                          variant={createType === 'master' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCreateType('master')}
                        >
                          <Shield className="h-4 w-4 mr-1" /> Master
                        </Button>
                      )}
                      <Button
                        variant={createType === 'revendedor' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCreateType('revendedor')}
                      >
                        <Users className="h-4 w-4 mr-1" /> Revendedor
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nome</Label>
                        <Input
                          placeholder="Nome"
                          value={createForm.name}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={createForm.email}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Senha</Label>
                        <Input
                          type="password"
                          placeholder="••••••"
                          value={createForm.password}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2">
                        <Switch checked={giveCredits} onCheckedChange={setGiveCredits} />
                        <Label className="text-sm">Definir créditos iniciais</Label>
                      </div>
                      {giveCredits && (
                        <Input
                          type="number"
                          placeholder="Qtd"
                          value={initialCredits}
                          onChange={(e) => setInitialCredits(e.target.value)}
                          className="w-24"
                          min={0}
                        />
                      )}
                    </div>

                    <Button onClick={handleCreateAccount} disabled={isCreating} className="w-full">
                      {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                      Criar {createType === 'sub' ? 'Sub Dono' : createType === 'master' ? 'Master' : 'Revendedor'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Recarga em Dobro Toggle - only for dono */}
                {!isSub && (
                <Card className={`border-2 transition-all ${recargaDobro ? 'border-green-500/50 bg-green-500/5' : 'border-border'}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${recargaDobro ? 'bg-green-500/15' : 'bg-muted'}`}>
                        <Zap className={`h-5 w-5 ${recargaDobro ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                          Recarga em Dobro
                          {recargaDobro && <Badge className="bg-green-500 text-white text-[9px] border-0">ATIVO</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Revendedores recebem o dobro de créditos ao recarregar via PIX
                        </p>
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
                          toast.success(checked ? 'Recarga em dobro ativada!' : 'Recarga em dobro desativada');
                        } catch (err: any) {
                          toast.error('Erro ao alterar configuração');
                        } finally {
                          setTogglingDobro(false);
                        }
                      }}
                    />
                  </CardContent>
                </Card>
                )}

                {/* Pricing Configuration - only for dono */}
                {!isSub && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Configurar Valores
                    </CardTitle>
                    <CardDescription>Configure os preços dos pacotes de créditos e do cadastro de revendedor</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Reseller Price */}
                    <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cadastro de Revendedor (PIX)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Valor (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={resellerPrice}
                            onChange={(e) => setResellerPrice(e.target.value)}
                            placeholder="90.00"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Créditos iniciais</Label>
                          <Input
                            type="number"
                            value={resellerCredits}
                            onChange={(e) => setResellerCredits(e.target.value)}
                            placeholder="5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Credit Packages */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pacotes de Créditos (Recarga)</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCreditPackages(prev => [...prev, { credits: 0, unitPrice: 0, total: 0 }])}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Adicionar
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {creditPackages.map((pkg, index) => (
                          <div key={index} className="grid grid-cols-4 gap-2 items-end p-2 rounded border bg-card">
                            <div className="space-y-1">
                              <Label className="text-[10px]">Créditos</Label>
                              <Input
                                type="number"
                                value={pkg.credits}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setCreditPackages(prev => prev.map((p, i) => i === index ? { ...p, credits: val } : p));
                                }}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px]">Preço/un (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={pkg.unitPrice}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const credits = pkg.credits || 0;
                                  setCreditPackages(prev => prev.map((p, i) => i === index ? { ...p, unitPrice: val, total: Math.round(val * credits * 100) / 100 } : p));
                                }}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px]">Total (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={pkg.total}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setCreditPackages(prev => prev.map((p, i) => i === index ? { ...p, total: val } : p));
                                }}
                                className="h-8 text-xs"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setCreditPackages(prev => prev.filter((_, i) => i !== index))}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        {creditPackages.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum pacote configurado. Clique em "Adicionar" para criar.</p>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={async () => {
                        setSavingPricing(true);
                        try {
                          const validPackages = creditPackages.filter(p => p.credits > 0 && p.unitPrice > 0 && p.total > 0);
                          if (validPackages.length === 0) {
                            toast.error('Adicione pelo menos um pacote válido');
                            return;
                          }
                          await (api as any).settings.update({
                            reseller_price: parseFloat(resellerPrice) || 90,
                            reseller_credits: parseInt(resellerCredits) || 5,
                            credit_packages: validPackages.sort((a: any, b: any) => a.credits - b.credits),
                          });
                          toast.success('Valores atualizados com sucesso!');
                        } catch (err: any) {
                          toast.error(err.message || 'Erro ao salvar valores');
                        } finally {
                          setSavingPricing(false);
                        }
                      }}
                      disabled={savingPricing}
                      className="w-full"
                    >
                      {savingPricing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Salvar Valores
                    </Button>
                  </CardContent>
                </Card>
                )}

                {/* Download Links Management - only for dono */}
                {!isSub && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Download className="h-5 w-5 text-primary" />
                      Gerenciar Downloads
                    </CardTitle>
                    <CardDescription>Atualize ou exclua os links de download dos aplicativos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">CNH Digital 2026</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs">iPhone</Label><div className="flex gap-1"><Input value={cnhIphone} onChange={(e) => setCnhIphone(e.target.value)} placeholder="https://..." className="flex-1" /><Button variant="ghost" size="icon" onClick={() => handleClearLink('cnh_iphone')} title="Limpar"><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>
                      <div className="space-y-1"><Label className="text-xs">Android (APK)</Label><div className="flex gap-1"><Input value={cnhApk} onChange={(e) => setCnhApk(e.target.value)} placeholder="https://..." className="flex-1" /><Button variant="ghost" size="icon" onClick={() => handleClearLink('cnh_apk')} title="Limpar"><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>
                    </div>
                    <div className="border-t pt-4" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gov.br</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs">iPhone</Label><div className="flex gap-1"><Input value={govbrIphone} onChange={(e) => setGovbrIphone(e.target.value)} placeholder="https://..." className="flex-1" /><Button variant="ghost" size="icon" onClick={() => handleClearLink('govbr_iphone')} title="Limpar"><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>
                      <div className="space-y-1"><Label className="text-xs">Android (APK)</Label><div className="flex gap-1"><Input value={govbrApk} onChange={(e) => setGovbrApk(e.target.value)} placeholder="https://..." className="flex-1" /><Button variant="ghost" size="icon" onClick={() => handleClearLink('govbr_apk')} title="Limpar"><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>
                    </div>
                    <div className="border-t pt-4" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ABAFE - Carteira Estudante</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs">iPhone</Label><div className="flex gap-1"><Input value={abafeIphone} onChange={(e) => setAbafeIphone(e.target.value)} placeholder="https://..." className="flex-1" /><Button variant="ghost" size="icon" onClick={() => handleClearLink('abafe_iphone')} title="Limpar"><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>
                      <div className="space-y-1"><Label className="text-xs">Android (APK)</Label><div className="flex gap-1"><Input value={abafeApk} onChange={(e) => setAbafeApk(e.target.value)} placeholder="https://..." className="flex-1" /><Button variant="ghost" size="icon" onClick={() => handleClearLink('abafe_apk')} title="Limpar"><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>
                    </div>
                    <Button onClick={handleSaveLinks} disabled={savingLinks} className="w-full">
                      {savingLinks ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Salvar Links
                    </Button>
                  </CardContent>
                </Card>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialog.open} onOpenChange={(o) => setPasswordDialog({ open: o, admin: o ? passwordDialog.admin : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Alterar Senha</DialogTitle>
            <DialogDescription>Alterar senha de <strong>{passwordDialog.admin?.nome}</strong> ({passwordDialog.admin?.email})</DialogDescription>
          </DialogHeader>
          <Input type="text" placeholder="Nova senha (mín. 4 caracteres)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog({ open: false, admin: null })}>Cancelar</Button>
            <Button onClick={handleChangePassword} disabled={newPassword.length < 4}>Alterar Senha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Credits Dialog */}
      <Dialog open={transferDialog.open} onOpenChange={(o) => setTransferDialog({ open: o, admin: o ? transferDialog.admin : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" />Transferir Créditos</DialogTitle>
            <DialogDescription>Para <strong>{transferDialog.admin?.nome}</strong> (saldo: {transferDialog.admin?.creditos.toLocaleString('pt-BR')})</DialogDescription>
          </DialogHeader>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Seu saldo: <strong>{credits.toLocaleString('pt-BR')}</strong></p>
            <Input type="number" placeholder="Quantidade" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} min={1} max={credits} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialog({ open: false, admin: null })}>Cancelar</Button>
            <Button onClick={handleTransferCredits} disabled={!transferAmount || parseInt(transferAmount) <= 0 || parseInt(transferAmount) > credits}>Transferir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Documents Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(o) => setDetailDialog({ open: o, admin: o ? detailDialog.admin : null })}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Documentos de {detailDialog.admin?.nome}
            </DialogTitle>
            <DialogDescription>
              {detailDialog.admin?.email} — Saldo: {detailDialog.admin?.creditos.toLocaleString('pt-BR')} créditos
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : detailData ? (
            <Tabs defaultValue="cnh" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="cnh" className="gap-1 text-xs">
                  <Car className="h-3 w-3" />CNH ({detailData.documents.cnhs?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="rg" className="gap-1 text-xs">
                  <IdCard className="h-3 w-3" />RG ({detailData.documents.rgs?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="carteira" className="gap-1 text-xs">
                  <GraduationCap className="h-3 w-3" />Estudante ({detailData.documents.carteiras?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="crlv" className="gap-1 text-xs">
                  <Truck className="h-3 w-3" />CRLV ({detailData.documents.crlvs?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="cha" className="gap-1 text-xs">
                  <Ship className="h-3 w-3" />Náutica ({detailData.documents.chas?.length || 0})
                </TabsTrigger>
              </TabsList>

              {['cnh', 'rg', 'carteira', 'crlv', 'cha'].map((type) => {
                const key = type === 'cnh' ? 'cnhs' : type === 'rg' ? 'rgs' : type === 'carteira' ? 'carteiras' : type === 'crlv' ? 'crlvs' : 'chas';
                const docs = detailData.documents[key] || [];
                return (
                  <TabsContent key={type} value={type} className="mt-4">
                    {docs.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Nenhum documento</p>
                    ) : (
                      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>CPF</TableHead>
                              <TableHead>Senha</TableHead>
                              {type === 'crlv' && <TableHead>Placa</TableHead>}
                              {type !== 'carteira' && <TableHead>Validade</TableHead>}
                              <TableHead>Criado em</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {docs.map((doc: any) => (
                              <TableRow key={doc.id}>
                                <TableCell className="font-medium max-w-[200px] truncate">{doc.nome}</TableCell>
                                <TableCell className="font-mono text-xs">{doc.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</TableCell>
                                <TableCell className="font-mono font-semibold text-primary">{doc.senha}</TableCell>
                                {type === 'crlv' && <TableCell className="font-mono text-xs">{doc.placa}</TableCell>}
                                {type !== 'carteira' && <TableCell className="text-xs">{doc.validade ? new Date(doc.validade).toLocaleDateString('pt-BR') : '-'}</TableCell>}
                                <TableCell className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</TableCell>
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
            <p className="text-center text-muted-foreground py-8">Erro ao carregar dados</p>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );

  // Render admin table (shared between masters and resellers tabs)
  function renderAdminTable(admins: AdminItem[]) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  {!isSub && <TableHead>Créditos</TableHead>}
                  <TableHead>Serviços</TableHead>
                  <TableHead>Último Serviço</TableHead>
                  {!isSub && <TableHead>Saldo Antes/Depois</TableHead>}
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Criado por</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((adm) => (
                  <TableRow key={adm.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{adm.nome}</p>
                        <p className="text-xs text-muted-foreground">{adm.email}</p>
                        {adm.key_plain && (
                          <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">🔑 {adm.key_plain}</p>
                        )}
                      </div>
                    </TableCell>
                    {!isSub && <TableCell><span className="font-semibold">{adm.creditos.toLocaleString('pt-BR')}</span></TableCell>}
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <span className="font-bold text-sm">{adm.total_services}</span>
                        <span className="text-muted-foreground text-[10px]">total</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {adm.total_cnh > 0 && <Badge variant="secondary" className="text-[9px] px-1"><Car className="h-2.5 w-2.5 mr-0.5" />{adm.total_cnh}</Badge>}
                        {adm.total_rg > 0 && <Badge variant="secondary" className="text-[9px] px-1"><IdCard className="h-2.5 w-2.5 mr-0.5" />{adm.total_rg}</Badge>}
                        {adm.total_carteira > 0 && <Badge variant="secondary" className="text-[9px] px-1"><GraduationCap className="h-2.5 w-2.5 mr-0.5" />{adm.total_carteira}</Badge>}
                        {adm.total_crlv > 0 && <Badge variant="secondary" className="text-[9px] px-1"><Truck className="h-2.5 w-2.5 mr-0.5" />{adm.total_crlv}</Badge>}
                        {adm.total_cha > 0 && <Badge variant="secondary" className="text-[9px] px-1"><Ship className="h-2.5 w-2.5 mr-0.5" />{adm.total_cha}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {adm.last_service ? (
                        <div>
                          <div className="flex items-center gap-1">
                            {getServiceIcon(adm.last_service.tipo)}
                            <span className="text-xs font-medium">{adm.last_service.tipo}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{adm.last_service.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{timeAgo(adm.last_service.created_at)}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Nenhum</span>
                      )}
                    </TableCell>
                    {!isSub && (
                    <TableCell>
                      {adm.last_service ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-green-600 font-semibold">{adm.last_service.saldo_antes}</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-red-600 font-semibold">{adm.last_service.saldo_depois}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    )}
                    <TableCell>
                      <div>
                        <p className="text-xs">{adm.last_active ? timeAgo(adm.last_active) : 'Nunca'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{adm.criado_por_nome || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openDetailDialog(adm)} title="Ver documentos"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setPasswordDialog({ open: true, admin: adm }); setNewPassword(''); }} title="Alterar senha"><KeyRound className="h-4 w-4" /></Button>
                        {!isSub && <Button variant="ghost" size="sm" onClick={() => { setTransferDialog({ open: true, admin: adm }); setTransferAmount(''); }} title="Transferir créditos"><Send className="h-4 w-4" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {admins.length === 0 && (<TableRow><TableCell colSpan={isSub ? 6 : 8} className="text-center py-8 text-muted-foreground">Nenhum admin encontrado</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }
}
