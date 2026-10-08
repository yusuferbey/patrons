import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  UserRole,
  ActiveTab,
  User,
  DEFAULT_ROLE_PERMISSIONS,
  CustomRole,
  ALL_SYSTEM_PERMISSIONS,
} from '../types';
import {
  ShieldCheck,
  Shield,
  LayoutDashboard,
  Grid3X3,
  CalendarDays,
  UtensilsCrossed,
  Flame,
  Coffee,
  Layers,
  Package,
  Users,
  CreditCard,
  Wallet,
  BarChart3,
  ShieldAlert,
  Settings,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Info,
  Smartphone,
  Eye,
  Lock,
  Unlock,
  Sliders,
  UserCheck,
  Search,
  Filter,
  Copy,
  ChevronRight,
  AlertCircle,
  Plus,
  Trash2,
  Key,
  Tag,
} from 'lucide-react';

export interface TabDefinition {
  id: ActiveTab;
  title: string;
  description: string;
  category: 'OPERASYON' | 'MUTFAK' | 'FINANS' | 'YONETIM';
  icon: React.ElementType;
  badgeColor: string;
}

export const ALL_PAGE_TABS: TabDefinition[] = [
  {
    id: 'dashboard',
    title: 'Ana Panel / Dashboard',
    description: 'Günlük ciro, canlı masa doluluk oranı, kritik sipariş özetleri ve anlık istatistikler.',
    category: 'YONETIM',
    icon: LayoutDashboard,
    badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  },
  {
    id: 'tables',
    title: 'Masalar (Kat Planı & Adisyon)',
    description: 'Salon/Teras/Bahçe masaları, masa açma, adisyon detayları, masa taşıma ve birleştirme.',
    category: 'OPERASYON',
    icon: Grid3X3,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 'reservations',
    title: 'Rezervasyon Yönetimi',
    description: 'Müşteri rezervasyon takvimi, telefon kayıtları, kişi sayısı ve masaya alma işlemleri.',
    category: 'OPERASYON',
    icon: CalendarDays,
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    id: 'orders',
    title: 'Aktif Siparişler Listesi',
    description: 'Canlı siparişlerin servis durumu, hazırlık süreleri ve hızlı müdahale ekranı.',
    category: 'OPERASYON',
    icon: UtensilsCrossed,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 'kitchen',
    title: 'KDS Mutfak & Bar Ekranı',
    description: 'İstasyon bazlı sipariş fişleri, pişirme süreleri, kabul etme ve hazır butonları.',
    category: 'MUTFAK',
    icon: Flame,
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
  {
    id: 'products',
    title: 'Ürün & Menü Yönetimi',
    description: 'Menü ürünleri, fiyatlandırma, porsiyonlar, reçeteler, istasyon ve KDV atamaları.',
    category: 'YONETIM',
    icon: Coffee,
    badgeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  },
  {
    id: 'categories',
    title: 'Kategoriler & Menü Grupları',
    description: 'Menü kategorileri, sıralama, ikon ve renk şeması yapılandırması.',
    category: 'YONETIM',
    icon: Layers,
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    id: 'stock',
    title: 'Stok & Envanter Takibi',
    description: 'Ürün ve hammadde stok adetleri, kritik stok uyarıları ve stok giriş-çıkışları.',
    category: 'MUTFAK',
    icon: Package,
    badgeColor: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  },
  {
    id: 'staff',
    title: 'Personel & Garson Yönetimi',
    description: 'Personel listesi, PIN kodları, roller ve garson performans göstergeleri.',
    category: 'YONETIM',
    icon: Users,
    badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  },
  {
    id: 'payments',
    title: 'Ödemeler & Hesap Kapatma',
    description: 'Kapanan hesaplar, nakit/kart/parçalı ödemeler ve detaylı fiş dökümü.',
    category: 'FINANS',
    icon: CreditCard,
    badgeColor: 'text-green-400 bg-green-500/10 border-green-500/20',
  },
  {
    id: 'cash-register',
    title: 'Günlük Kasa & Z Raporu',
    description: 'Nakit giriş/çıkış, gün başı kasası, gün sonu devri ve Z raporu mutabakatı.',
    category: 'FINANS',
    icon: Wallet,
    badgeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  },
  {
    id: 'reports',
    title: 'Raporlar & Finansal Analiz',
    description: 'Saatlik ciro grafikleri, en çok satanlar, personel satışları ve iptal analizleri.',
    category: 'FINANS',
    icon: BarChart3,
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'audit-logs',
    title: 'Güvenlik & Denetim Kayıtları',
    description: 'Tüm sipariş iptalleri, fiyat değişiklikleri ve kullanıcı hareket logları.',
    category: 'YONETIM',
    icon: ShieldAlert,
    badgeColor: 'text-red-400 bg-red-500/10 border-red-500/20',
  },
  {
    id: 'settings',
    title: 'Sistem & Rol İzin Ayarları',
    description: 'Restoran profili, KDV oranları, ses tercihleri ve rol yetki matrisi.',
    category: 'YONETIM',
    icon: Settings,
    badgeColor: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  },
];

const ROLES_META: {
  role: UserRole;
  label: string;
  subLabel: string;
  iconText: string;
  badge: string;
}[] = [
  {
    role: 'WAITER',
    label: 'Garson / Servis Elemanı',
    subLabel: 'Masa siparişi, adisyon ve servis takibi',
    iconText: '📱',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    role: 'CASHIER',
    label: 'Kasa Görevlisi / Kasiyer',
    subLabel: 'Hesap kapatma, ödemeler ve kasa raporları',
    iconText: '💳',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    role: 'KITCHEN',
    label: 'Mutfak Şefi / Aşçı',
    subLabel: 'KDS ekranı, sipariş hazırlığı ve mutfak stoku',
    iconText: '👨‍🍳',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  {
    role: 'ADMIN',
    label: 'Patron / Genel Yönetici',
    subLabel: 'Tüm sayfa ve sistem yetkilerine sahip yönetici',
    iconText: '👑',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
];

interface RolePermissionsManagerProps {
  initialTargetUserId?: string;
  initialMode?: 'role' | 'user';
}

export const RolePermissionsManager: React.FC<RolePermissionsManagerProps> = ({
  initialTargetUserId,
  initialMode = 'user',
}) => {
  const {
    users,
    settings,
    updateRolePermissions,
    toggleRoleTabPermission,
    resetRolePermissions,
    getUserEffectiveTabs,
    updateUserCustomPermissions,
    toggleUserTabPermission,
    resetUserToRolePermissions,
    addToast,
    customRoles,
    saveCustomRole,
    deleteCustomRole,
  } = usePOS();

  const [mode, setMode] = useState<'role' | 'user' | 'custom_roles'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>('WAITER');
  const [selectedUserId, setSelectedUserId] = useState<string>(
    initialTargetUserId || users.find((u) => u.role === 'WAITER')?.id || users[0]?.id || ''
  );
  const [selectedCustomRoleId, setSelectedCustomRoleId] = useState<string>('');
  const [isCreatingRole, setIsCreatingRole] = useState<boolean>(false);
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [newRoleDesc, setNewRoleDesc] = useState<string>('');
  const [newRoleColor, setNewRoleColor] = useState<string>('#f59e0b');
  const [permissionCategoryFilter, setPermissionCategoryFilter] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'OPERASYON' | 'MUTFAK' | 'FINANS' | 'YONETIM'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | UserRole>('ALL');

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];
  const activeCustomRole = customRoles.find((r) => r.id === selectedCustomRoleId) || customRoles[0];

  // Role permissions
  const rolePerms = settings?.rolePermissions || DEFAULT_ROLE_PERMISSIONS;
  const currentRoleAllowedTabs = (rolePerms[selectedRole] ?? DEFAULT_ROLE_PERMISSIONS[selectedRole] ?? []) as ActiveTab[];

  // User effective permissions
  const userEffectiveTabs = selectedUser ? getUserEffectiveTabs(selectedUser) : [];
  const isCustomUser = !!selectedUser?.customPermissionsEnabled;

  // Filtered page tabs
  const filteredTabs = ALL_PAGE_TABS.filter((tab) => {
    if (filterCategory !== 'ALL' && tab.category !== filterCategory) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return tab.title.toLowerCase().includes(q) || tab.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered user list
  const filteredUsers = users.filter((u) => {
    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
    }
    return true;
  });

  // -------------------------------------------------------------
  // Role Handlers
  // -------------------------------------------------------------
  const handleRoleToggle = async (tabId: ActiveTab) => {
    try {
      await toggleRoleTabPermission(selectedRole, tabId);
      const isNowActive = !currentRoleAllowedTabs.includes(tabId);
      const tabDef = ALL_PAGE_TABS.find((t) => t.id === tabId);
      addToast(
        isNowActive ? 'success' : 'info',
        isNowActive ? 'Rol İzni Verildi' : 'Rol İzni Kaldırıldı',
        `${ROLES_META.find((r) => r.role === selectedRole)?.label} için "${tabDef?.title}" ${isNowActive ? 'erişilebilir yapıldı' : 'gizlendi'}.`
      );
    } catch (err) {
      addToast('error', 'Hata', 'Yetki güncellenemedi.');
    }
  };

  const handleRoleGrantAll = async () => {
    const allTabIds = ALL_PAGE_TABS.map((t) => t.id);
    await updateRolePermissions(selectedRole, allTabIds);
    addToast('success', 'Tüm Sayfalar Açıldı', `${ROLES_META.find((r) => r.role === selectedRole)?.label} tüm sayfalara erişebilir.`);
  };

  const handleRoleRevokeAll = async () => {
    const minimal = selectedRole === 'WAITER' ? ['tables'] : selectedRole === 'KITCHEN' ? ['kitchen'] : ['tables'];
    await updateRolePermissions(selectedRole, minimal as ActiveTab[]);
    addToast('info', 'Erişim Kısıtlandı', `${ROLES_META.find((r) => r.role === selectedRole)?.label} için temel sayfa dışındakiler kapatıldı.`);
  };

  const handleRoleResetDefaults = async () => {
    await resetRolePermissions(selectedRole);
    addToast('success', 'Varsayılana Sıfırlandı', `${ROLES_META.find((r) => r.role === selectedRole)?.label} varsayılan fabrika izinlerine döndürüldü.`);
  };

  // -------------------------------------------------------------
  // User-Specific Handlers
  // -------------------------------------------------------------
  const handleToggleUserCustomMode = async () => {
    if (!selectedUser) return;
    const newEnabledState = !isCustomUser;
    const defaultTabs = rolePerms[selectedUser.role] ?? DEFAULT_ROLE_PERMISSIONS[selectedUser.role] ?? [];
    await updateUserCustomPermissions(selectedUser.id, newEnabledState, selectedUser.allowedTabs || defaultTabs);
    addToast(
      'success',
      newEnabledState ? 'Özel Yetkilendirme Aktif' : 'Role Bağlandı',
      newEnabledState
        ? `${selectedUser.name} için kişiye özel yetkilendirme açıldı.`
        : `${selectedUser.name} artık standart ${selectedUser.role} rol izinlerini takip ediyor.`
    );
  };

  const handleUserToggleTab = async (tabId: ActiveTab) => {
    if (!selectedUser) return;
    await toggleUserTabPermission(selectedUser.id, tabId);
    const isNowActive = !userEffectiveTabs.includes(tabId);
    const tabDef = ALL_PAGE_TABS.find((t) => t.id === tabId);
    addToast(
      isNowActive ? 'success' : 'info',
      isNowActive ? 'Kişisel İzin Verildi' : 'Kişisel İzin Kaldırıldı',
      `${selectedUser.name} için "${tabDef?.title}" ${isNowActive ? 'açıldı' : 'kapatıldı'}.`
    );
  };

  const handleUserEnableCashAndPayment = async () => {
    if (!selectedUser) return;
    const baseTabs = selectedUser.allowedTabs || rolePerms[selectedUser.role] || ['tables', 'reservations', 'orders'];
    const newTabs = Array.from(new Set([...baseTabs, 'payments' as ActiveTab, 'cash-register' as ActiveTab]));
    await updateUserCustomPermissions(selectedUser.id, true, newTabs);
    addToast(
      'success',
      'Kasa & Ödeme İzni Verildi',
      `${selectedUser.name} artık Kasa ve Ödemeler ekranlarına erişebilir!`
    );
  };

  const handleUserGrantAll = async () => {
    if (!selectedUser) return;
    const allTabIds = ALL_PAGE_TABS.map((t) => t.id);
    await updateUserCustomPermissions(selectedUser.id, true, allTabIds);
    addToast('success', 'Tüm Sayfalar Açıldı', `${selectedUser.name} için tüm sayfalara erişim izni verildi.`);
  };

  const handleUserCopyFromRole = async () => {
    if (!selectedUser) return;
    const defaultTabs = rolePerms[selectedUser.role] ?? DEFAULT_ROLE_PERMISSIONS[selectedUser.role] ?? [];
    await updateUserCustomPermissions(selectedUser.id, true, [...defaultTabs]);
    addToast('info', 'Rol İzinleri Kopyalandı', `${selectedUser.role} rolünün mevcut izinleri ${selectedUser.name}'e uyarlandı.`);
  };

  const handleUserResetToRole = async () => {
    if (!selectedUser) return;
    await resetUserToRolePermissions(selectedUser.id);
    addToast('success', 'Role Sıfırlandı', `${selectedUser.name} özel yetkileri sıfırlanıp ${selectedUser.role} rolüne bağlandı.`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
      {/* Top Level Segment Switch: User vs Role */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
              <span>Yetki ve Erişim Yönetimi</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Canlı Kontrol
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Roller için genel sayfa erişimlerini veya doğrudan personele özel istisna izinlerini tanımlayın.
            </p>
          </div>
        </div>

        {/* View Mode Switch */}
        <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setMode('user')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              mode === 'user'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Kullanıcı / Personel Özel Yetkileri</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('role')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              mode === 'role'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Genel Rol Şablonları</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('custom_roles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              mode === 'custom_roles'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Özel Roller & Yetki Matrisi</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: USER / PERSONEL SPECIFIC PERMISSIONS (Ahmet vs Can)               */}
      {/* ========================================================================= */}
      {mode === 'user' && (
        <div className="space-y-6">
          {/* Quick Scenario Banner */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                <Sliders className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <span>Kişiye Özel Filtreleme & Yetkilendirme Örneği</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Aktif</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Örn: <strong className="text-slate-200">Garson Can</strong> için Kasa & Ödeme açıkken,{' '}
                  <strong className="text-slate-200">Garson Ahmet</strong> için Kasa kapatılabilir. Her personelin yetkisi bağımsız yönetilir.
                </p>
              </div>
            </div>

            {/* Role Filter Chips for Staff */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', 'WAITER', 'CASHIER', 'KITCHEN', 'ADMIN'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    userRoleFilter === r
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {r === 'ALL' && 'Tüm Personel'}
                  {r === 'WAITER' && '📱 Garsonlar'}
                  {r === 'CASHIER' && '💳 Kasiyerler'}
                  {r === 'KITCHEN' && '👨‍🍳 Mutfak'}
                  {r === 'ADMIN' && '👑 Patron'}
                </button>
              ))}
            </div>
          </div>

          {/* User Selection Carousel / Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Personel Seçin ({filteredUsers.length} Personel)
              </span>
              <span className="text-xs text-amber-400">
                Seçili: <strong className="text-slate-100">{selectedUser?.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredUsers.map((u) => {
                const isSelected = selectedUserId === u.id;
                const hasCustom = !!u.customPermissionsEnabled;
                const uTabs = getUserEffectiveTabs(u);
                const hasCashAccess = uTabs.includes('payments') || uTabs.includes('cash-register');

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUserId(u.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                            u.active ? 'bg-emerald-500' : 'bg-slate-600'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-amber-400' : 'text-slate-100'}`}>
                            {u.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            {u.role === 'WAITER' ? 'Garson' : u.role === 'CASHIER' ? 'Kasiyer' : u.role === 'KITCHEN' ? 'Mutfak' : 'Patron'}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-[10px] text-slate-400 font-mono">PIN: ••••</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {hasCustom ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                          Özel ({uTabs.length})
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                          Rol Standart
                        </span>
                      )}

                      {hasCashAccess && (
                        <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                          <CreditCard className="w-2.5 h-2.5" /> Kasa Açık
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected User Management Panel */}
          {selectedUser && (
            <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-5 shadow-2xl">
              {/* User Bar & Main Mode Switch */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3.5">
                  <img
                    src={selectedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={selectedUser.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500/30"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-100">{selectedUser.name}</h3>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
                        {selectedUser.role === 'WAITER' && '📱 Garson'}
                        {selectedUser.role === 'CASHIER' && '💳 Kasa Görevlisi'}
                        {selectedUser.role === 'KITCHEN' && '👨‍🍳 Mutfak'}
                        {selectedUser.role === 'ADMIN' && '👑 Patron'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kullanıcı Adı: <span className="font-mono text-slate-300">@{selectedUser.username}</span> | PIN: <span className="font-mono text-slate-300">••••</span>
                    </p>
                  </div>
                </div>

                {/* Switch for Custom Permission vs Role */}
                <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-2xl border border-slate-800">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-200">
                      {isCustomUser ? 'Kişiye Özel Yetkilendirme Açık' : 'Standart Role Bağlı'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isCustomUser ? 'Bu kullanıcı için özel kurallar devrede' : `${selectedUser.role} genel şablonunu kullanıyor`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleUserCustomMode}
                    className={`w-14 h-7 rounded-full p-1 transition-colors relative duration-200 ease-in-out focus:outline-none ${
                      isCustomUser ? 'bg-amber-500 shadow-md shadow-amber-500/30' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-slate-950 shadow-sm transition-transform duration-200 ease-in-out flex items-center justify-center ${
                        isCustomUser ? 'translate-x-7 bg-white' : 'translate-x-0'
                      }`}
                    >
                      {isCustomUser ? (
                        <Check className="w-3 h-3 text-amber-600 stroke-[3]" />
                      ) : (
                        <X className="w-3 h-3 text-slate-500 stroke-[3]" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Actions for Selected User */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-400">Hızlı İşlemler:</span>

                  {selectedUser.role === 'WAITER' && (
                    <button
                      type="button"
                      onClick={handleUserEnableCashAndPayment}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Kasayı & Ödemeyi Aç (Can Örneği)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleUserCopyFromRole}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Rol İzinlerini Kopyala</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUserGrantAll}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Tüm Sayfaları Aç</span>
                  </button>
                </div>

                {isCustomUser && (
                  <button
                    type="button"
                    onClick={handleUserResetToRole}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Role Geri Döndür</span>
                  </button>
                )}
              </div>

              {/* Page Permissions Matrix for Selected User */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {selectedUser.name} İçin Sayfa İzinleri
                    </span>
                    <span className="text-xs text-amber-400 font-mono font-bold">
                      ({userEffectiveTabs.length} / {ALL_PAGE_TABS.length} Sayfa Açık)
                    </span>
                  </div>

                  {/* Filter category */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {(['ALL', 'OPERASYON', 'MUTFAK', 'FINANS', 'YONETIM'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFilterCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                          filterCategory === cat
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {cat === 'ALL' && 'Tümü'}
                        {cat === 'OPERASYON' && 'Masa & Sipariş'}
                        {cat === 'MUTFAK' && 'Mutfak'}
                        {cat === 'FINANS' && 'Kasa & Finans'}
                        {cat === 'YONETIM' && 'Yönetim'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isAllowed = userEffectiveTabs.includes(tab.id);

                    return (
                      <div
                        key={tab.id}
                        onClick={() => handleUserToggleTab(tab.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 group ${
                          isAllowed
                            ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-400 shadow-md shadow-amber-500/5'
                            : 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-90 hover:border-slate-750'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
                              isAllowed
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 group-hover:bg-amber-500/20'
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className={`text-xs font-bold ${isAllowed ? 'text-slate-100' : 'text-slate-400'}`}>
                                {tab.title}
                              </h5>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${tab.badgeColor}`}>
                                {tab.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                              {tab.description}
                            </p>
                          </div>
                        </div>

                        {/* Switch */}
                        <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                          <button
                            type="button"
                            aria-checked={isAllowed}
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors relative duration-200 ease-in-out focus:outline-none ${
                              isAllowed ? 'bg-amber-500 shadow-md shadow-amber-500/30' : 'bg-slate-800'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-slate-950 shadow-sm transition-transform duration-200 ease-in-out flex items-center justify-center ${
                                isAllowed ? 'translate-x-5 bg-white' : 'translate-x-0'
                              }`}
                            >
                              {isAllowed ? (
                                <Check className="w-2.5 h-2.5 text-amber-600 stroke-[3]" />
                              ) : (
                                <X className="w-2.5 h-2.5 text-slate-500 stroke-[3]" />
                              )}
                            </div>
                          </button>

                          <span
                            className={`text-[9px] font-bold font-mono uppercase tracking-wider ${
                              isAllowed ? 'text-amber-400' : 'text-slate-500'
                            }`}
                          >
                            {isAllowed ? 'AÇIK' : 'KAPALI'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: GENERAL ROLE TEMPLATES (Role Matrix)                              */}
      {/* ========================================================================= */}
      {mode === 'role' && (
        <div className="space-y-6">
          {/* Header & Bulk Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-100">Genel Rol Şablonları</h4>
              <p className="text-xs text-slate-400">
                Kişiye özel istisnası olmayan tüm personel bu genel rol şablonundaki izinleri takip eder.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleRoleGrantAll}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Tümünü Aç</span>
              </button>
              <button
                type="button"
                onClick={handleRoleRevokeAll}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Kısıtla</span>
              </button>
              <button
                type="button"
                onClick={handleRoleResetDefaults}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Varsayılan</span>
              </button>
            </div>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ROLES_META.map((r) => {
              const isSelected = selectedRole === r.role;
              const allowedCount = (rolePerms[r.role] ?? DEFAULT_ROLE_PERMISSIONS[r.role] ?? []).length;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => setSelectedRole(r.role)}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-2xl">{r.iconText}</div>
                    <span
                      className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${
                        isSelected ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold' : r.badge
                      }`}
                    >
                      {allowedCount} / {ALL_PAGE_TABS.length} Sayfa
                    </span>
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isSelected ? 'text-amber-400' : 'text-slate-100'}`}>
                      {r.label}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-1">
                      {r.subLabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Role Summary Banner */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                {ROLES_META.find((r) => r.role === selectedRole)?.iconText}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100">
                    {ROLES_META.find((r) => r.role === selectedRole)?.label}
                  </span>
                  <span className="text-xs text-amber-400 font-mono">
                    ({currentRoleAllowedTabs.length} aktif sayfa yetkisi)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Bu role atanmış kullanıcılar sisteme giriş yaptıklarında varsayılan olarak bu sayfalara erişebilir.
                </p>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', 'OPERASYON', 'MUTFAK', 'FINANS', 'YONETIM'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    filterCategory === cat
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat === 'ALL' && 'Tümü'}
                  {cat === 'OPERASYON' && 'Masa & Sipariş'}
                  {cat === 'MUTFAK' && 'Mutfak'}
                  {cat === 'FINANS' && 'Kasa & Finans'}
                  {cat === 'YONETIM' && 'Yönetim'}
                </button>
              ))}
            </div>
          </div>

          {/* Page Permissions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredTabs.map((tab) => {
              const Icon = tab.icon;
              const isAllowed = currentRoleAllowedTabs.includes(tab.id);

              return (
                <div
                  key={tab.id}
                  onClick={() => handleRoleToggle(tab.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 group ${
                    isAllowed
                      ? 'bg-slate-950/90 border-amber-500/40 hover:border-amber-400 shadow-md shadow-amber-500/5'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-90 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
                        isAllowed
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 group-hover:bg-amber-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className={`text-sm font-bold ${isAllowed ? 'text-slate-100' : 'text-slate-400'}`}>
                          {tab.title}
                        </h5>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${tab.badgeColor}`}>
                          {tab.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {tab.description}
                      </p>
                    </div>
                  </div>

                  {/* iOS Style Switch */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
                    <button
                      type="button"
                      aria-checked={isAllowed}
                      className={`w-12 h-6 rounded-full p-1 transition-colors relative duration-200 ease-in-out focus:outline-none ${
                        isAllowed ? 'bg-amber-500 shadow-md shadow-amber-500/30' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-slate-950 shadow-sm transition-transform duration-200 ease-in-out flex items-center justify-center ${
                          isAllowed ? 'translate-x-6 bg-white' : 'translate-x-0'
                        }`}
                      >
                        {isAllowed ? (
                          <Check className="w-2.5 h-2.5 text-amber-600 stroke-[3]" />
                        ) : (
                          <X className="w-2.5 h-2.5 text-slate-500 stroke-[3]" />
                        )}
                      </div>
                    </button>

                    <span
                      className={`text-[10px] font-bold font-mono uppercase tracking-wider ${
                        isAllowed ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      {isAllowed ? 'AÇIK (Görünür)' : 'KAPALI'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: CUSTOM ROLES & GRANULAR PERMISSIONS MATRIX                        */}
      {/* ========================================================================= */}
      {mode === 'custom_roles' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                <Key className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <span>Özel Rol Tanımları ve Granüler İzin Matrisi</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    {customRoles.length} Tanımlı Rol
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Her role özel fonksiyonel izinleri (örn. <code className="text-amber-400">MASA_GOR</code>, <code className="text-amber-400">SIPARIS_OLUSTUR</code>, <code className="text-amber-400">ODEME_AL</code>, <code className="text-amber-400">KASA_YONET</code>) açıp kapatabilirsiniz.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingRole(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Özel Rol Ekle</span>
            </button>
          </div>

          {/* New Role Creation Modal / Inline Card */}
          {isCreatingRole && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newRoleName.trim()) {
                  addToast('warning', 'Uyarı', 'Lütfen rol adını giriniz.');
                  return;
                }
                const success = await saveCustomRole({
                  name: newRoleName.trim(),
                  description: newRoleDesc.trim(),
                  color: newRoleColor,
                  permissions: ['tables.view', 'MASA_GOR', 'orders.view', 'SIPARIS_GOR', 'orders.create', 'SIPARIS_OLUSTUR'],
                  allowedTabs: ['tables', 'orders'],
                });
                if (success) {
                  setIsCreatingRole(false);
                  setNewRoleName('');
                  setNewRoleDesc('');
                }
              }}
              className="p-5 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Yeni Özel Rol Oluştur</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCreatingRole(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Rol Adı</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Kıdemli Şef Garson"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Açıklama</label>
                  <input
                    type="text"
                    placeholder="Örn: Masalara müdahale ve ikram yetkisi"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Rol Rengi</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newRoleColor}
                      onChange={(e) => setNewRoleColor(e.target.value)}
                      className="w-10 h-8 rounded-lg cursor-pointer bg-slate-900 border border-slate-700"
                    />
                    <span className="text-xs font-mono text-slate-400">{newRoleColor}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingRole(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  Rolü Kaydet
                </button>
              </div>
            </form>
          )}

          {/* Roles Selector Chips / Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {customRoles.map((role) => {
              const isSelected = activeCustomRole?.id === role.id;
              const permsCount = role.permissions ? role.permissions.filter(p => !p.includes('_')).length : 0;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedCustomRoleId(role.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: role.color || '#f59e0b' }} />
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${role.isSystem ? 'bg-slate-800 text-slate-400' : 'bg-amber-500/20 text-amber-300'}`}>
                      {role.isSystem ? 'Sistem' : 'Özel'}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-100 truncate">{role.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{permsCount} Yetki Aktif</div>
                </button>
              );
            })}
          </div>

          {/* Active Role Permissions Editor */}
          {activeCustomRole && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-5">
              {/* Role Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeCustomRole.color || '#f59e0b' }} />
                    <h4 className="text-base font-bold text-slate-100">{activeCustomRole.name}</h4>
                    <span className="text-xs text-slate-400">({activeCustomRole.description || 'Açıklama belirtilmedi'})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Bu rolü kullanan kullanıcılar sadece aşağıda izin verilmiş granüler işlemleri gerçekleştirebilir.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const allPerms = ALL_SYSTEM_PERMISSIONS.flatMap((p) => [p.id, p.alias || '']).filter(Boolean);
                      await saveCustomRole({ ...activeCustomRole, permissions: allPerms });
                      addToast('info', 'Tüm Yetkiler Verildi', `${activeCustomRole.name} için tüm yetkiler açıldı.`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs hover:border-amber-500 transition-colors"
                  >
                    Tümünü Aç
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await saveCustomRole({ ...activeCustomRole, permissions: [] });
                      addToast('info', 'Tüm Yetkiler Sıfırlandı', `${activeCustomRole.name} için tüm yetkiler kapatıldı.`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs hover:border-slate-600 transition-colors"
                  >
                    Tümünü Kapat
                  </button>
                  {!activeCustomRole.isSystem && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`${activeCustomRole.name} rolünü silmek istediğinize emin misiniz?`)) {
                          await deleteCustomRole(activeCustomRole.id);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs"
                      title="Rolü Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['ALL', 'Masalar', 'Siparişler', 'Ödemeler & Kasa', 'Mutfak & Bar', 'Ürünler & Menü', 'Stok & Reçete', 'Raporlar', 'Personel & Roller', 'Yazıcı & Donanım', 'Güvenlik & Denetim', 'Genel Ayarlar'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPermissionCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all ${
                      permissionCategoryFilter === cat
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat === 'ALL' ? 'Tüm Kategoriler' : cat}
                  </button>
                ))}
              </div>

              {/* Permissions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ALL_SYSTEM_PERMISSIONS.filter(
                  (p) => permissionCategoryFilter === 'ALL' || p.category === permissionCategoryFilter
                ).map((perm) => {
                  const rolePerms = activeCustomRole.permissions || [];
                  const isEnabled = rolePerms.includes(perm.id) || (perm.alias ? rolePerms.includes(perm.alias) : false);

                  return (
                    <div
                      key={perm.id}
                      onClick={async () => {
                        const hasP = rolePerms.includes(perm.id) || (perm.alias ? rolePerms.includes(perm.alias) : false);
                        let nextP: string[];
                        if (hasP) {
                          nextP = rolePerms.filter((p) => p !== perm.id && p !== perm.alias);
                        } else {
                          nextP = [...rolePerms, perm.id];
                          if (perm.alias && !nextP.includes(perm.alias)) {
                            nextP.push(perm.alias);
                          }
                        }
                        await saveCustomRole({
                          ...activeCustomRole,
                          permissions: nextP,
                        });
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                        isEnabled
                          ? 'bg-slate-900/90 border-amber-500/40 shadow-sm'
                          : 'bg-slate-900/30 border-slate-800/60 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold ${isEnabled ? 'text-slate-100' : 'text-slate-400'}`}>
                            {perm.name}
                          </span>
                          {perm.alias && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                              {perm.alias}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-500">
                            {perm.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {perm.description}
                        </p>
                      </div>

                      {/* Switch */}
                      <button
                        type="button"
                        aria-checked={isEnabled}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors relative shrink-0 ${
                          isEnabled ? 'bg-amber-500' : 'bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-slate-950 transition-transform flex items-center justify-center ${
                            isEnabled ? 'translate-x-5 bg-white' : 'translate-x-0'
                          }`}
                        >
                          {isEnabled ? (
                            <Check className="w-2.5 h-2.5 text-amber-600 stroke-[3]" />
                          ) : (
                            <X className="w-2.5 h-2.5 text-slate-500 stroke-[3]" />
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Sidebar Preview Info Footer */}
      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h6 className="text-xs font-bold text-amber-300">Canlı Senkronizasyon (Live SSE Broadcast)</h6>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Burada yapılan tüm rol veya personel bazlı yetki değişiklikleri anında kaydedilir ve açık olan tüm garson tabletleri, kasa ekranları ve mutfak monitörlerine anlık bildirimle yansıtılır.
          </p>
        </div>
      </div>
    </div>
  );
};
