import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import {
  LayoutDashboard,
  Grid3X3,
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
  Receipt,
  RotateCcw,
  CalendarDays,
  Building2,
  Store,
  Shield,
  LogOut,
  ChevronUp,
} from 'lucide-react';
import { ActiveTab, DEFAULT_ROLE_PERMISSIONS } from '../types';

export { type ActiveTab };

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onCloseMobile, isMobileDrawer }) => {
  const {
    currentUser,
    currentRestaurant,
    orders,
    tables,
    reservations,
    getUserEffectiveTabs,
    hasPermission,
    resetDemoDatabase,
    logoutUser,
  } = usePOS();

  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayReservationsCount = reservations.filter(
    (r) => r.reservationDate === todayStr && r.status === 'CONFIRMED'
  ).length;

  const activeOrdersCount = orders.filter((o) => o.status === 'ACTIVE').length;
  const kitchenPendingCount = orders
    .filter((o) => o.status === 'ACTIVE')
    .flatMap((o) => o.items)
    .filter((i) => i.status === 'NEW' || i.status === 'ACCEPTED' || i.status === 'PREPARING').length;
  const billRequestedCount = tables.filter((t) => t.status === 'BILL_REQUESTED').length;

  // Master definition of all possible tabs
  const allNavItems: {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    count?: number;
    highlight?: boolean;
  }[] = [
    { id: 'super-admin', label: 'Platform & İşletmeler', icon: Building2 },
    { id: 'dashboard', label: 'Ana Panel / Dashboard', icon: LayoutDashboard },
    { id: 'tables', label: 'Masalar (Kat Planı)', icon: Grid3X3, count: tables.filter((t) => t.status !== 'EMPTY').length },
    { id: 'reservations', label: 'Rezervasyonlar', icon: CalendarDays, count: todayReservationsCount, highlight: todayReservationsCount > 0 },
    { id: 'orders', label: 'Siparişler', icon: UtensilsCrossed, count: activeOrdersCount },
    { id: 'kitchen', label: 'KDS Mutfak', icon: Flame, count: kitchenPendingCount, highlight: kitchenPendingCount > 0 },
    { id: 'products', label: 'Ürün & Menü', icon: Coffee },
    { id: 'categories', label: 'Kategoriler', icon: Layers },
    { id: 'stock', label: 'Stok Yönetimi', icon: Package },
    { id: 'staff', label: 'Personel & Garsonlar', icon: Users },
    { id: 'payments', label: 'Ödemeler', icon: CreditCard, count: billRequestedCount, highlight: billRequestedCount > 0 },
    { id: 'cash-register', label: 'Günlük Kasa', icon: Wallet },
    { id: 'reports', label: 'Raporlar & Analiz', icon: BarChart3 },
    { id: 'audit-logs', label: 'Denetim Kayıtları', icon: ShieldAlert },
    { id: 'settings', label: 'Sistem Ayarları', icon: Settings },
    { id: 'billing', label: 'Faturalandırma & Plan', icon: CreditCard },
  ];

  // Determine allowed items based on user's effective permissions (role, custom role, personal override, and granular permissions)
  const effectiveTabs = getUserEffectiveTabs(currentUser);
  const navItems = allNavItems.filter((item) => {
    // Super-admin route is strictly for SUPER_ADMIN role
    if (item.id === 'super-admin') {
      return currentUser?.role === 'SUPER_ADMIN';
    }
    // Standard tab inclusion check
    if (effectiveTabs.includes(item.id)) return true;

    // Granular alias checks fallback
    if (item.id === 'tables' && (hasPermission('MASA_GOR') || hasPermission('tables.view'))) return true;
    if (item.id === 'orders' && (hasPermission('SIPARIS_GOR') || hasPermission('orders.view'))) return true;
    if (item.id === 'kitchen' && (hasPermission('MUTFAK_GOR') || hasPermission('BAR_GOR') || hasPermission('kitchen.view'))) return true;
    if (item.id === 'products' && (hasPermission('URUN_GOR') || hasPermission('products.view'))) return true;
    if (item.id === 'categories' && (hasPermission('URUN_GOR') || hasPermission('products.view'))) return true;
    if (item.id === 'stock' && (hasPermission('STOK_GOR') || hasPermission('stock.view'))) return true;
    if (item.id === 'staff' && (hasPermission('PERSONEL_GOR') || hasPermission('staff.view'))) return true;
    if (item.id === 'payments' && (hasPermission('ODEME_GOR') || hasPermission('payments.view'))) return true;
    if (item.id === 'cash-register' && (hasPermission('KASA_GOR') || hasPermission('cash_register.view'))) return true;
    if (item.id === 'reports' && (hasPermission('RAPOR_GOR') || hasPermission('reports.view'))) return true;
    if (item.id === 'audit-logs' && (hasPermission('DENETIM_GOR') || hasPermission('audit.view'))) return true;
    if (item.id === 'settings' && (hasPermission('AYAR_GOR') || hasPermission('settings.view'))) return true;

    return false;
  });

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'PP';

  const isTrial = currentRestaurant?.subscription?.status === 'TRIAL';
  let trialDaysLeft = 7;
  if (currentRestaurant?.subscription?.endDate) {
    const parts = currentRestaurant.subscription.endDate.split('-');
    if (parts.length === 3) {
      const end = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      trialDaysLeft = Math.max(0, Math.ceil((end.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)));
    }
  }

  return (
    <aside className={`${isMobileDrawer ? 'w-full h-full' : 'w-64 min-h-[calc(100vh-4rem)]'} bg-slate-900 border-r border-slate-800 flex flex-col shrink-0`}>
      {/* Role & User Indicator Banner */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/40 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-300 truncate">
              {currentUser?.role === 'SUPER_ADMIN' && '⚡ Süper Admin (SaaS)'}
              {currentUser?.role === 'ADMIN' && '👑 Patron / Yönetim'}
              {currentUser?.role === 'WAITER' && `📱 Garson (${currentUser.name.split(' ')[0]})`}
              {currentUser?.role === 'KITCHEN' && `👨‍🍳 Mutfak (${currentUser.name.split(' ')[0]})`}
              {currentUser?.role === 'CASHIER' && `💳 Kasa (${currentUser.name.split(' ')[0]})`}
            </span>
            {currentUser?.customPermissionsEnabled && (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 whitespace-nowrap">
                Özel Yetki
              </span>
            )}
          </div>
          <span className="text-[10px] text-amber-400 font-mono font-bold shrink-0">ÖZER v2.4</span>
        </div>

        {/* Current Active Tenant Indicator */}
        {currentRestaurant && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate font-medium">{currentRestaurant.name}</span>
            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-300">
              {currentRestaurant.subscription?.plan || 'PRO'}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.length === 0 ? (
          <div className="text-center py-8 px-4 text-xs text-slate-500">
            Bu rol için henüz erişilebilir sayfa tanımlanmamış.
          </div>
        ) : (
          navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile?.();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-slate-950 stroke-[2.5]' : item.highlight ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full font-mono-numbers ${
                      isActive
                        ? 'bg-slate-950 text-amber-400'
                        : item.highlight
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })
        )}
      </nav>

      {/* User Profile Footer Card & Dropdown Menu */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 relative">
        {showUserMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="px-3 py-2 border-b border-slate-800">
              <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">
                {currentUser?.email || `${currentUser?.username}@ozerpos.com`}
              </p>
            </div>

            <div className="py-1 space-y-0.5">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setActiveTab('settings');
                  onCloseMobile?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Hesap ve Tercihler</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setActiveTab('billing');
                  onCloseMobile?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span>Ödeme Bilgileri / Faturalandırma</span>
              </button>
            </div>

            <div className="pt-1 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logoutUser();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-slate-800/80 transition-all group border border-transparent hover:border-slate-800"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate group-hover:text-white">
                {currentUser?.name}
              </div>
              <div className="text-[10px] text-amber-400 font-semibold truncate flex items-center gap-1">
                {isTrial ? (
                  <span>⭐ Deneme: {trialDaysLeft} gün</span>
                ) : (
                  <span>👑 {currentRestaurant?.subscription?.plan || 'PRO'} Aktif</span>
                )}
              </div>
            </div>
          </div>
          <ChevronUp className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform shrink-0 ${showUserMenu ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
  );
};
