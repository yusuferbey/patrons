import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import {
  Crown,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  ChevronDown,
  Clock,
  Sparkles,
  Flame,
  Smartphone,
  Menu,
  X,
  Building2,
  Store,
  CreditCard,
  Shield,
} from 'lucide-react';
import { UserRole } from '../types';
import { formatRoleTR } from '../utils/formatters';

export const Header: React.FC<{
  onNavigateToKDS?: () => void;
  onNavigateTab?: (tab: any) => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}> = ({ onNavigateToKDS, onNavigateTab, onToggleMobileMenu, isMobileMenuOpen }) => {
  const {
    currentUser,
    setCurrentUser,
    currentRestaurant,
    restaurants,
    switchRestaurant,
    users,
    logoutUser,
    isOnline,
    soundEnabled,
    toggleSound,
    theme,
    setTheme,
    setIsWaiterMobileMode,
    tables,
    orders,
    addToast,
  } = usePOS();

  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [showTenantDropdown, setShowTenantDropdown] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDateStr(
        now.toLocaleDateString('tr-TR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeTablesCount = tables.filter((t) => t.status !== 'EMPTY' && t.status !== 'RESERVED').length;
  const kitchenPendingCount = orders
    .filter((o) => o.status === 'ACTIVE')
    .flatMap((o) => o.items)
    .filter((i) => i.status === 'NEW' || i.status === 'ACCEPTED' || i.status === 'PREPARING').length;

  const handleSwitchUser = (targetUser: typeof currentUser) => {
    if (targetUser) {
      setCurrentUser(targetUser);
      localStorage.setItem('patron_pos_user', JSON.stringify(targetUser));
      setShowUserDropdown(false);
      addToast('info', 'Kullanıcı Değiştirildi', `${targetUser.name} (${formatRoleTR(targetUser.role)}) olarak devam ediliyor.`);
    }
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-bold px-2 py-0.5 rounded-full">SÜPER ADMİN</span>;
      case 'ADMIN':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2 py-0.5 rounded-full">YÖNETİCİ</span>;
      case 'WAITER':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-bold px-2 py-0.5 rounded-full">GARSON</span>;
      case 'KITCHEN':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold px-2 py-0.5 rounded-full">MUTFAK</span>;
      case 'CASHIER':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2 py-0.5 rounded-full">KASA</span>;
      default:
        return null;
    }
  };

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      {/* Brand & Connection status */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={onToggleMobileMenu}
          aria-label="Menüyü Aç/Kapat"
          className="lg:hidden p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors shrink-0"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
            <Crown className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base md:text-lg bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                ÖZER POS
              </span>
              {currentRestaurant?.subscription?.status === 'TRIAL' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold tracking-wide border border-amber-500/30">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  7 GÜN DENEME
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold tracking-widest border border-amber-500/20">
                  PRO
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden md:block">Restoran Adisyon & KDS Sistemi</p>
          </div>
        </div>

        {/* Tenant Selector for Super Admin or Current Tenant Badge */}
        {currentUser?.role === 'SUPER_ADMIN' ? (
          <div className="relative hidden xl:block">
            <button
              onClick={() => setShowTenantDropdown(!showTenantDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-semibold transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="max-w-[130px] truncate">{currentRestaurant?.name || 'İşletme Seçin'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
            </button>

            {showTenantDropdown && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-fade-in">
                <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  İşletme Çalışma Alanı
                </div>
                <div className="max-h-60 overflow-y-auto mt-1 space-y-1">
                  {restaurants.map((rest) => (
                    <button
                      key={rest.id}
                      onClick={() => {
                        switchRestaurant(rest.id);
                        setShowTenantDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left ${
                        currentRestaurant?.id === rest.id
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{rest.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {rest.subscription?.plan || 'PRO'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : currentRestaurant ? (
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-slate-200 max-w-[130px] truncate">{currentRestaurant.name}</span>
          </div>
        ) : null}

        {/* Real-time Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-300 text-[11px] font-medium">{isOnline ? 'Realtime Aktif' : 'Bağlantı Kesildi'}</span>
        </div>
      </div>

      {/* Center Live Counters */}
      <div className="hidden md:flex items-center gap-3">
        {/* Active Tables Count */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
          <span className="text-xs text-slate-400">Dolu Masa:</span>
          <span className="text-sm font-bold text-amber-400 font-mono-numbers">{activeTablesCount} / {tables.length}</span>
        </div>

        {/* Kitchen Orders Counter */}
        <button
          onClick={onNavigateToKDS}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
            kitchenPendingCount > 0
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25 animate-pulse'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-semibold">Mutfak:</span>
          <span className="text-sm font-bold font-mono-numbers">{kitchenPendingCount} Sipariş</span>
        </button>

        {/* Live Clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/40 border border-slate-800 rounded-xl text-slate-300">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-mono-numbers font-semibold text-slate-200">{timeStr}</span>
          <span className="text-[11px] text-slate-500 border-l border-slate-700 pl-2">{dateStr}</span>
        </div>
      </div>

      {/* Right User & Tools Section */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Switch to Waiter Mobile Mode button */}
        <button
          onClick={() => setIsWaiterMobileMode(true)}
          title="Garson Mobil Sipariş Ekranına Geç"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Garson Modu</span>
        </button>

        {/* Sound alert toggle */}
        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Sesli Bildirimler Açık' : 'Sesli Bildirimler Kapalı'}
          className={`p-2 rounded-xl border transition-colors ${
            soundEnabled
              ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-700'
              : 'bg-slate-800/40 border-slate-800 text-slate-500 hover:text-slate-400'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Dark / Light Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Tema Değiştir"
          className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Fast User Switcher & Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-slate-600 transition-all text-left"
          >
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser?.name}
              className="w-8 h-8 rounded-lg object-cover border border-amber-500/30"
            />
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-200 leading-tight">{currentUser?.name}</div>
              <div className="flex items-center gap-1 mt-0.5">
                {getRoleBadge(currentUser?.role)}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>

          {/* User Profile Dropdown Menu */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || `${currentUser?.username}@ozerpos.com`}</p>
              </div>

              <div className="py-1 space-y-1">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onNavigateTab?.('billing');
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span>Ödeme Bilgileri / Faturalandırma</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onNavigateTab?.('settings');
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Hesap ve Ayarlar</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logoutUser();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Oturumu Kapat</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
