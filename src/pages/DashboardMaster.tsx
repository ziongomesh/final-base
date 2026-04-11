import { useState, useEffect, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { playSuccessSound } from '@/lib/success-sound';
import api from '@/lib/api';
import AlertNotification from '@/components/dashboard/AlertNotification';
import AnnouncementsFeed from '@/components/dashboard/AnnouncementsFeed';
import LastRecords from '@/components/dashboard/LastRecords';
import {
  Users, UserCheck, UserX, UserPlus, Bell, Clock, Send, Trash2,
  CreditCard, RefreshCw, Loader2, Save, Plus, Pencil, Eye, Target,
  Zap, TrendingUp, Car, IdCard, GraduationCap, Truck, Ship, FileText,
  ChevronRight,
} from 'lucide-react';

// ===== TYPES =====
interface Reseller {
  id: number;
  nome: string;
  email: string;
  creditos: number;
  created_at?: string;
  last_active?: string | null;
}

interface SubPlan {
  id?: number;
  admin_id?: number;
  name: string;
  credits: number;
  base_credits: number;
  bonus: number;
  total: number;
  badge: string;
  badge_color: string;
  sort_order: number;
  is_active: boolean;
  qr_code_image: string;
  pix_copy_paste: string;
  whatsapp_number: string;
}

interface ResellerGoal {
  weekly: number;
  monthly: number;
}

// ===== HELPERS =====
function getDaysInactive(lastActive: string | null | undefined, createdAt?: string): number {
  const ref = lastActive || createdAt;
  if (!ref) return 999;
  return Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24));
}

function timeAgo(d: string) {
  if (!d) return 'Nunca';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const emptySubPlan: SubPlan = { name: '', credits: 0, base_credits: 0, bonus: 0, total: 0, badge: '', badge_color: 'bg-blue-500', sort_order: 0, is_active: true, qr_code_image: '', pix_copy_paste: '', whatsapp_number: '' };

function getGoalsKey(masterId: number) {
  return `master_reseller_goals_${masterId}`;
}

function loadGoals(masterId: number): Record<number, ResellerGoal> {
  try {
    const raw = localStorage.getItem(getGoalsKey(masterId));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveGoals(masterId: number, goals: Record<number, ResellerGoal>) {
  localStorage.setItem(getGoalsKey(masterId), JSON.stringify(goals));
}

export default function DashboardMaster() {
  const { admin, credits, loading, refreshCredits } = useAuth();
  const navigate = useNavigate();

  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('equipe');

  // Goals
  const [goals, setGoals] = useState<Record<number, ResellerGoal>>({});
  const [editGoalId, setEditGoalId] = useState<number | null>(null);
  const [goalForm, setGoalForm] = useState<ResellerGoal>({ weekly: 0, monthly: 0 });

  // Alert
  const [alertOpen, setAlertOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [sending, setSending] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Create
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
  const [isCreating, setIsCreating] = useState(false);

  // Sub plans
  const [subPlans, setSubPlans] = useState<SubPlan[]>([]);
  const [subPlanForm, setSubPlanForm] = useState<SubPlan>(emptySubPlan);
  const [editingSubPlan, setEditingSubPlan] = useState<SubPlan | null>(null);
  const [savingSubPlan, setSavingSubPlan] = useState(false);
  const [loadingSubPlans, setLoadingSubPlans] = useState(false);
  const [showSubPreview, setShowSubPreview] = useState(false);

  // QR crop
  const [qrCropImage, setQrCropImage] = useState<string | null>(null);
  const [qrCrop, setQrCrop] = useState({ x: 0, y: 0 });
  const [qrZoom, setQrZoom] = useState(1);
  const [qrCroppedArea, setQrCroppedArea] = useState<any>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);

  // Daily history
  const [dailyHistory, setDailyHistory] = useState<Record<string, any[]>>({});
  const [dailyTotal, setDailyTotal] = useState(0);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyFilterAdmin, setDailyFilterAdmin] = useState<string>('all');
  const [dailyFilterModule, setDailyFilterModule] = useState<string>('all');

  const getApiBase = () => {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined;
    let apiBase = envUrl ? envUrl.replace(/\/+$/, '') : 'http://localhost:4000/api';
    if (!apiBase.endsWith('/api')) apiBase += '/api';
    return apiBase;
  };

  // ===== FETCH =====
  const fetchResellers = async () => {
    if (!admin) return;
    setLoadingData(true);
    try {
      const data = await api.admins.getResellers(admin.id);
      setResellers(data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingData(false); }
  };

  const fetchSubPlans = async () => {
    if (!admin) return;
    setLoadingSubPlans(true);
    try {
      const resp = await fetch(`${getApiBase()}/sub-plans/list`, {
        headers: { 'x-admin-id': String(admin.id), 'x-session-token': admin.session_token || '' }
      });
      const data = await resp.json();
      if (data?.plans) setSubPlans(data.plans);
    } catch (e) { console.error(e); }
    finally { setLoadingSubPlans(false); }
  };

  const fetchDailyHistory = async () => {
    if (!admin) return;
    setDailyLoading(true);
    try {
      const filters: any = {};
      if (dailyFilterAdmin !== 'all') filters.adminId = parseInt(dailyFilterAdmin);
      if (dailyFilterModule !== 'all') filters.module = dailyFilterModule;
      const data = await api.admins.getMasterDailyHistory(admin.id, filters);
      setDailyHistory(data.grouped || {});
      setDailyTotal(data.total || 0);
    } catch (e) { console.error(e); }
    finally { setDailyLoading(false); }
  };

  useEffect(() => {
    if (admin) {
      fetchResellers();
      setGoals(loadGoals(admin.id));
    }
  }, [admin]);

  useEffect(() => {
    if (admin && activeTab === 'historico') fetchDailyHistory();
  }, [activeTab, dailyFilterAdmin, dailyFilterModule]);

  // ===== HANDLERS =====
  const handleCreateReseller = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error('Preencha todos os campos'); return;
    }
    if (createForm.password.length < 4) { toast.error('Senha mínima: 4 caracteres'); return; }
    setIsCreating(true);
    try {
      await api.admins.createReseller({
        nome: createForm.name, email: createForm.email.toLowerCase().trim(), key: createForm.password, criadoPor: admin!.id,
      });
      playSuccessSound();
      toast.success('Revendedor criado!', { description: `${createForm.name} (${createForm.email})` });
      setCreateForm({ name: '', email: '', password: '' });
      fetchResellers();
    } catch (e: any) { toast.error(e.message || 'Erro ao criar'); }
    finally { setIsCreating(false); }
  };

  const handleDeleteReseller = async (id: number) => {
    setDeleting(true);
    try {
      await api.admins.delete(id);
      toast.success('Revendedor excluído');
      setResellers(prev => prev.filter(r => r.id !== id));
      setDeleteConfirm(null);
    } catch (e: any) { toast.error(e.message || 'Erro'); }
    finally { setDeleting(false); }
  };

  const handleSendAlert = async () => {
    if (!selectedUserId) return;
    setSending(true);
    try {
      await api.alerts.send(Number(selectedUserId), '⚠️ Você está inativo. Use com frequência, pois poderá perder acesso.');
      toast.success('Alerta enviado!');
      setAlertOpen(false);
      setSelectedUserId('');
    } catch (e: any) { toast.error(e.message || 'Erro'); }
    finally { setSending(false); }
  };

  const handleSaveGoal = (resellerId: number) => {
    if (!admin) return;
    const updated = { ...goals, [resellerId]: goalForm };
    setGoals(updated);
    saveGoals(admin.id, updated);
    setEditGoalId(null);
    toast.success('Meta salva!');
  };

  // Sub plans
  const handleSaveSubPlan = async () => {
    if (!admin || !subPlanForm.name || !subPlanForm.credits || !subPlanForm.total) {
      toast.error('Preencha nome, créditos e valor'); return;
    }
    setSavingSubPlan(true);
    try {
      const isUpdate = !!editingSubPlan;
      const plan = isUpdate ? { ...subPlanForm, id: editingSubPlan.id } : subPlanForm;
      const endpoint = isUpdate ? 'update' : 'create';
      const method = isUpdate ? 'PUT' : 'POST';
      const resp = await fetch(`${getApiBase()}/sub-plans/${endpoint}`, {
        method, headers: { 'Content-Type': 'application/json', 'x-admin-id': String(admin.id), 'x-session-token': admin.session_token || '' },
        body: JSON.stringify({ plan })
      });
      if (!resp.ok) { const d = await resp.json(); throw new Error(d.error); }
      toast.success(editingSubPlan ? 'Plano atualizado!' : 'Plano criado!');
      setSubPlanForm(emptySubPlan);
      setEditingSubPlan(null);
      fetchSubPlans();
    } catch (e: any) { toast.error(e.message || 'Erro'); }
    finally { setSavingSubPlan(false); }
  };

  const handleDeleteSubPlan = async (planId: number) => {
    if (!admin) return;
    try {
      await fetch(`${getApiBase()}/sub-plans/delete/${planId}`, {
        method: 'DELETE', headers: { 'x-admin-id': String(admin.id), 'x-session-token': admin.session_token || '' }
      });
      toast.success('Plano removido!');
      fetchSubPlans();
    } catch { toast.error('Erro ao remover'); }
  };

  // QR crop
  const onQrCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setQrCroppedArea(croppedAreaPixels);
  }, []);

  const getCroppedImg = useCallback(async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = imageSrc; });
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return canvas.toDataURL('image/png').split(',')[1];
  }, []);

  const handleQrCropConfirm = useCallback(async () => {
    if (!qrCropImage || !qrCroppedArea) return;
    try {
      const base64 = await getCroppedImg(qrCropImage, qrCroppedArea);
      const resp = await fetch(`${getApiBase()}/sub-plans/upload-qrcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-id': String(admin!.id), 'x-session-token': admin!.session_token || '' },
        body: JSON.stringify({ image_base64: base64 })
      });
      const data = await resp.json();
      if (data?.url) { setSubPlanForm(f => ({ ...f, qr_code_image: data.url })); toast.success('QR Code enviado!'); }
      else throw new Error(data?.error || 'Erro');
    } catch (err: any) { toast.error('Erro ao enviar QR Code'); }
    setQrCropImage(null); setQrZoom(1); setQrCrop({ x: 0, y: 0 });
  }, [qrCropImage, qrCroppedArea, getCroppedImg, admin]);

  const getServiceIcon = (s: string) => {
    switch (s) {
      case 'CNH': return <Car className="h-3.5 w-3.5 text-green-500" />;
      case 'RG': return <IdCard className="h-3.5 w-3.5 text-purple-500" />;
      case 'Carteira': return <GraduationCap className="h-3.5 w-3.5 text-amber-500" />;
      case 'CRLV': return <Truck className="h-3.5 w-3.5 text-blue-500" />;
      case 'Nautica': return <Ship className="h-3.5 w-3.5 text-cyan-500" />;
      default: return <FileText className="h-3.5 w-3.5" />;
    }
  };

  // ===== GUARDS =====
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, hsl(220 25% 6%), hsl(220 20% 4%))' }}><div className="animate-spin rounded-full h-8 w-8" style={{ borderBottom: '2px solid hsl(201 55% 59%)' }} /></div>;
  }
  if (!admin) return <Navigate to="/login" replace />;

  const activeResellers = resellers.filter(r => getDaysInactive(r.last_active, r.created_at) < 7);
  const inactiveResellers = resellers.filter(r => getDaysInactive(r.last_active, r.created_at) >= 7);

  return (
    <DashboardLayout>
      <AlertNotification adminId={admin.id} />

      <div className="space-y-4 animate-fade-in max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
            <p className="text-[11px] text-muted-foreground">Painel Master</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              <CreditCard className="h-3 w-3" /> {credits.toLocaleString('pt-BR')}
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { fetchResellers(); refreshCredits(); }} disabled={loadingData}>
              <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v);
          if (v === 'planos' && subPlans.length === 0) fetchSubPlans();
        }}>
          <TabsList className="flex w-full overflow-x-auto no-scrollbar gap-0.5 h-9">
            <TabsTrigger value="equipe" className="text-[10px] px-2.5 shrink-0 h-7">Equipe</TabsTrigger>
            <TabsTrigger value="metas" className="text-[10px] px-2.5 shrink-0 h-7">Metas</TabsTrigger>
            <TabsTrigger value="historico" className="text-[10px] px-2.5 shrink-0 h-7">Histórico</TabsTrigger>
            <TabsTrigger value="planos" className="text-[10px] px-2.5 shrink-0 h-7">Planos</TabsTrigger>
            <TabsTrigger value="criar" className="text-[10px] px-2.5 shrink-0 h-7">Criar</TabsTrigger>
            <TabsTrigger value="recarregar" className="text-[10px] px-2.5 shrink-0 h-7">Recarregar</TabsTrigger>
          </TabsList>

          {loadingData ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {/* ===== EQUIPE ===== */}
              <TabsContent value="equipe" className="space-y-4 mt-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-border/50 bg-card/50 text-center">
                    <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{resellers.length}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">Total</p>
                  </div>
                  <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5 text-center">
                    <UserCheck className="h-4 w-4 mx-auto text-green-500 mb-1" />
                    <p className="text-lg font-bold text-green-400">{activeResellers.length}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">Ativos</p>
                  </div>
                  <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-center">
                    <UserX className="h-4 w-4 mx-auto text-red-500 mb-1" />
                    <p className="text-lg font-bold text-red-400">{inactiveResellers.length}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">Inativos</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 border-primary/30 text-primary hover:bg-primary/10" onClick={() => setActiveTab('criar')}>
                    <UserPlus className="h-3 w-3" /> Novo
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10" onClick={() => setAlertOpen(true)}>
                    <Bell className="h-3 w-3" /> Alerta
                  </Button>
                </div>

                {/* Active */}
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <UserCheck className="h-3 w-3 text-green-500" /> Ativos ({activeResellers.length})
                  </p>
                  {activeResellers.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum revendedor ativo</p>
                  ) : (
                    <div className="space-y-1.5">
                      {activeResellers.map(r => (
                        <ResellerRow key={r.id} reseller={r} goal={goals[r.id]} onDelete={() => setDeleteConfirm(r.id)} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Inactive */}
                {inactiveResellers.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <UserX className="h-3 w-3 text-red-500" /> Inativos ({inactiveResellers.length})
                    </p>
                    <div className="space-y-1.5">
                      {inactiveResellers
                        .sort((a, b) => getDaysInactive(b.last_active, b.created_at) - getDaysInactive(a.last_active, a.created_at))
                        .map(r => (
                          <ResellerRow key={r.id} reseller={r} inactive goal={goals[r.id]} onDelete={() => setDeleteConfirm(r.id)} />
                        ))}
                    </div>
                  </div>
                )}

                {/* Announcements */}
                <AnnouncementsFeed />
              </TabsContent>

              {/* ===== METAS ===== */}
              <TabsContent value="metas" className="space-y-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Metas por Revendedor</span>
                </div>
                {resellers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Nenhum revendedor cadastrado</p>
                ) : (
                  <div className="space-y-2">
                    {resellers.map(r => {
                      const goal = goals[r.id] || { weekly: 0, monthly: 0 };
                      const days = getDaysInactive(r.last_active, r.created_at);
                      const isActive = days < 7;
                      return (
                        <div key={r.id} className={`p-3 rounded-lg border transition-all ${isActive ? 'border-border/50 bg-card/50' : 'border-red-500/20 bg-red-500/5'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-sm font-medium truncate">{r.nome}</span>
                              {!isActive && <span className="text-[10px] text-red-400 font-bold">{days}d off</span>}
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditGoalId(r.id); setGoalForm(goal); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[9px] text-muted-foreground uppercase mb-1">Meta Semanal</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: '0%' }} />
                                </div>
                                <span className="text-[10px] font-bold text-primary">{goal.weekly || '-'}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-[9px] text-muted-foreground uppercase mb-1">Meta Mensal</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: '0%' }} />
                                </div>
                                <span className="text-[10px] font-bold text-green-400">{goal.monthly || '-'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* ===== HISTÓRICO ===== */}
              <TabsContent value="historico" className="space-y-3 mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={dailyFilterAdmin} onValueChange={setDailyFilterAdmin}>
                    <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Revendedor..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {resellers.map(r => (<SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={dailyFilterModule} onValueChange={setDailyFilterModule}>
                    <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Módulo..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="CNH">CNH</SelectItem>
                      <SelectItem value="RG">RG</SelectItem>
                      <SelectItem value="Carteira">Estudante</SelectItem>
                      <SelectItem value="CRLV">CRLV</SelectItem>
                      <SelectItem value="Nautica">Náutica</SelectItem>
                    </SelectContent>
                  </Select>
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
                      .map(([day, services]) => (
                        <div key={day} className="rounded-lg border border-border/50 overflow-hidden">
                          <div className="px-3 py-2 bg-muted/30 flex items-center justify-between">
                            <span className="text-xs font-semibold">{new Date(day + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                            <Badge variant="secondary" className="text-[9px]">{services.length}</Badge>
                          </div>
                          <div className="divide-y divide-border/30">
                            {services.map((svc: any, i: number) => (
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
                      ))}
                  </div>
                )}

                <LastRecords adminId={admin.id} sessionToken={admin.session_token} />
              </TabsContent>

              {/* ===== PLANOS ===== */}
              <TabsContent value="planos" className="space-y-4 mt-4">
                {/* Form */}
                <div className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {editingSubPlan ? 'Editar Plano' : 'Novo Plano'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Nome</Label>
                      <Input value={subPlanForm.name} onChange={e => setSubPlanForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-xs" placeholder="Ex: Plano Bronze" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Créditos</Label>
                      <Input type="number" value={subPlanForm.credits || ''} onChange={e => { const v = parseInt(e.target.value) || 0; setSubPlanForm(f => ({ ...f, credits: v, base_credits: v })); }} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Bônus</Label>
                      <Input type="number" value={subPlanForm.bonus || ''} onChange={e => setSubPlanForm(f => ({ ...f, bonus: parseInt(e.target.value) || 0 }))} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Valor (R$)</Label>
                      <Input type="number" step="0.01" value={subPlanForm.total || ''} onChange={e => setSubPlanForm(f => ({ ...f, total: parseFloat(e.target.value) || 0 }))} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">PIX Copia e Cola</Label>
                      <Input value={subPlanForm.pix_copy_paste} onChange={e => setSubPlanForm(f => ({ ...f, pix_copy_paste: e.target.value }))} className="h-8 text-xs" placeholder="Chave PIX..." />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">WhatsApp</Label>
                      <Input value={subPlanForm.whatsapp_number} onChange={e => setSubPlanForm(f => ({ ...f, whatsapp_number: e.target.value }))} className="h-8 text-xs" placeholder="5511999..." />
                    </div>
                  </div>

                  {/* QR Code upload */}
                  <div className="space-y-1">
                    <Label className="text-[10px]">QR Code (upload)</Label>
                    <input ref={qrFileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setQrCropImage(reader.result as string);
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }} />
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => qrFileRef.current?.click()}>
                        <Plus className="h-3 w-3 mr-1" /> Upload QR
                      </Button>
                      {subPlanForm.qr_code_image && (
                        <img src={subPlanForm.qr_code_image} alt="QR" className="h-10 w-10 rounded border border-border object-contain" />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveSubPlan} disabled={savingSubPlan} className="flex-1 h-8 text-xs">
                      {savingSubPlan ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                      {editingSubPlan ? 'Atualizar' : 'Criar'}
                    </Button>
                    {editingSubPlan && <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setEditingSubPlan(null); setSubPlanForm(emptySubPlan); }}>Cancelar</Button>}
                  </div>
                </div>

                {/* Plans list */}
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <div className="px-3 py-2 bg-muted/30">
                    <span className="text-xs font-semibold">Meus Planos ({subPlans.length})</span>
                  </div>
                  {loadingSubPlans ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : subPlans.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-8">Nenhum plano</p>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {subPlans.map(plan => (
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

              {/* ===== CRIAR ===== */}
              <TabsContent value="criar" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Criar Revendedor</span>
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Nome</Label>
                      <Input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-xs" placeholder="Nome completo" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Email</Label>
                      <Input value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} className="h-8 text-xs" placeholder="email@exemplo.com" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Senha</Label>
                      <Input value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} className="h-8 text-xs" placeholder="Mínimo 4 caracteres" />
                    </div>
                  </div>
                  <Button size="sm" onClick={handleCreateReseller} disabled={isCreating} className="w-full h-8 text-xs">
                    {isCreating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <UserPlus className="h-3.5 w-3.5 mr-1" />}
                    Criar Revendedor
                  </Button>
                </div>
              </TabsContent>

              {/* ===== RECARREGAR ===== */}
              <TabsContent value="recarregar" className="space-y-4 mt-4">
                <div className="text-center py-8">
                  <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">Recarregar Créditos</p>
                  <p className="text-xs text-muted-foreground mb-4">Acesse a página de recarga para comprar créditos</p>
                  <Button size="sm" className="h-8 text-xs" onClick={() => navigate('/recarregar')}>
                    <Zap className="h-3.5 w-3.5 mr-1.5" /> Ir para Recarga
                  </Button>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* ===== MODALS ===== */}

      {/* Alert Dialog */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" /> Enviar Alerta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Selecione um revendedor..." /></SelectTrigger>
              <SelectContent>
                {resellers.map(r => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    <span className="flex items-center gap-2">
                      {r.nome}
                      {getDaysInactive(r.last_active, r.created_at) >= 7 && (
                        <Badge variant="destructive" className="text-[8px] px-1 py-0">{getDaysInactive(r.last_active, r.created_at)}d</Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={handleSendAlert} disabled={!selectedUserId || sending} className="flex-1 h-9 text-sm gap-1.5">
                <Send className="h-3.5 w-3.5" /> Enviar
              </Button>
              {inactiveResellers.length > 0 && (
                <Button onClick={async () => {
                  setSending(true);
                  try {
                    for (const r of inactiveResellers) {
                      await api.alerts.send(r.id, '⚠️ Você está inativo. Use com frequência, pois poderá perder acesso.');
                    }
                    toast.success(`Alerta enviado para ${inactiveResellers.length} inativos!`);
                    setAlertOpen(false);
                  } catch (e: any) { toast.error(e.message || 'Erro'); }
                  finally { setSending(false); }
                }} disabled={sending} variant="destructive" className="h-9 text-sm gap-1.5">
                  <Bell className="h-3.5 w-3.5" /> Todos ({inactiveResellers.length})
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Excluir revendedor?</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Esta ação é irreversível. <strong>{resellers.find(r => r.id === deleteConfirm)?.nome}</strong> será removido.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" size="sm" className="flex-1" onClick={() => deleteConfirm && handleDeleteReseller(deleteConfirm)} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal Edit Dialog */}
      <Dialog open={editGoalId !== null} onOpenChange={open => !open && setEditGoalId(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Definir Meta
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mb-2">
            {resellers.find(r => r.id === editGoalId)?.nome}
          </p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px]">Meta Semanal (serviços)</Label>
              <Input type="number" value={goalForm.weekly || ''} onChange={e => setGoalForm(f => ({ ...f, weekly: parseInt(e.target.value) || 0 }))} className="h-8 text-xs" placeholder="Ex: 10" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Meta Mensal (serviços)</Label>
              <Input type="number" value={goalForm.monthly || ''} onChange={e => setGoalForm(f => ({ ...f, monthly: parseInt(e.target.value) || 0 }))} className="h-8 text-xs" placeholder="Ex: 50" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditGoalId(null)}>Cancelar</Button>
            <Button size="sm" className="flex-1" onClick={() => editGoalId && handleSaveGoal(editGoalId)}>
              <Save className="h-3.5 w-3.5 mr-1" /> Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Crop Dialog */}
      <Dialog open={!!qrCropImage} onOpenChange={open => { if (!open) { setQrCropImage(null); setQrZoom(1); setQrCrop({ x: 0, y: 0 }); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Ajustar QR Code</DialogTitle></DialogHeader>
          <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
            {qrCropImage && (
              <Cropper image={qrCropImage} crop={qrCrop} zoom={qrZoom} aspect={1} onCropChange={setQrCrop} onZoomChange={setQrZoom} onCropComplete={onQrCropComplete} />
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground shrink-0">Zoom</span>
            <Slider min={1} max={3} step={0.1} value={[qrZoom]} onValueChange={v => setQrZoom(v[0])} className="flex-1" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setQrCropImage(null)}>Cancelar</Button>
            <Button size="sm" className="flex-1" onClick={handleQrCropConfirm}>Confirmar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ===== RESELLER ROW COMPONENT =====
function ResellerRow({ reseller, inactive, goal, onDelete }: { reseller: Reseller; inactive?: boolean; goal?: ResellerGoal; onDelete: () => void }) {
  const days = getDaysInactive(reseller.last_active, reseller.created_at);
  const severityColor = days >= 30 ? 'text-red-500' : days >= 14 ? 'text-amber-500' : days >= 7 ? 'text-yellow-500' : 'text-emerald-400';

  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
      inactive
        ? days >= 30 ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'
        : 'bg-card border-border/50'
    }`}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{reseller.nome}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] text-muted-foreground truncate">{reseller.email}</p>
          {reseller.last_active && (
            <span className="text-[9px] text-muted-foreground">• {timeAgo(reseller.last_active)}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {goal && (goal.weekly > 0 || goal.monthly > 0) && (
          <Target className="h-3 w-3 text-primary/50" />
        )}
        {inactive && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className={`text-[10px] font-bold ${severityColor}`}>{days}d</span>
          </div>
        )}
        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{reseller.creditos} cr</Badge>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
