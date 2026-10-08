import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { Restaurant, Subscription } from '../types';
import {
  Building2,
  Plus,
  Search,
  ShieldCheck,
  Calendar,
  Users,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Edit2,
  Lock,
  Unlock,
  RefreshCw,
  TrendingUp,
  X,
  Store,
  ExternalLink,
} from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const {
    currentUser,
    restaurants,
    currentRestaurant,
    switchRestaurant,
    saveRestaurant,
    deleteRestaurant,
    addToast,
    refreshAllData,
  } = usePOS();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'TRIAL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Partial<Restaurant> | null>(null);

  // Strictly enforce Super Admin access
  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center space-y-4 bg-slate-900 border border-red-500/30 rounded-3xl shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Yetkisiz Erişim (403 Forbidden)</h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
          Bu alan yalnızca SaaS Platform Süper Yöneticisi (Super Admin) erişimine açıktır. Mevcut hesabınızla bu sayfayı görüntüleme izniniz bulunmamaktadır.
        </p>
      </div>
    );
  }

  // Filtered restaurants
  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.phone && r.phone.includes(searchTerm));

    const matchesStatus =
      statusFilter === 'ALL' || (r.subscription && r.subscription.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  // Summary Metrics
  const totalTenants = restaurants.length;
  const activeTenants = restaurants.filter((r) => r.subscription?.status === 'ACTIVE').length;
  const trialTenants = restaurants.filter((r) => r.subscription?.status === 'TRIAL').length;
  const suspendedTenants = restaurants.filter(
    (r) => r.subscription?.status === 'SUSPENDED' || r.subscription?.status === 'EXPIRED'
  ).length;

  const handleOpenAddModal = () => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    setEditingRestaurant({
      name: '',
      slug: '',
      phone: '',
      email: '',
      address: '',
      subscription: {
        plan: 'PRO',
        status: 'ACTIVE',
        startDate: new Date().toISOString().split('T')[0],
        endDate: nextMonth.toISOString().split('T')[0],
        maxTables: 25,
        maxStaff: 10,
        autoRenew: true,
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (restaurant: Restaurant) => {
    setEditingRestaurant(JSON.parse(JSON.stringify(restaurant)));
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant?.name || !editingRestaurant?.slug) {
      addToast('warning', 'Eksik Alan', 'Lütfen işletme adı ve alan adını (slug) girin.');
      return;
    }

    const success = await saveRestaurant(editingRestaurant);
    if (success) {
      setIsModalOpen(false);
      setEditingRestaurant(null);
    }
  };

  const handleToggleStatus = async (restaurant: Restaurant) => {
    const isCurrentlyActive = restaurant.subscription.status === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';

    const updated: Restaurant = {
      ...restaurant,
      subscription: {
        ...restaurant.subscription,
        status: newStatus,
      },
    };

    const ok = await saveRestaurant(updated);
    if (ok) {
      addToast(
        newStatus === 'ACTIVE' ? 'success' : 'warning',
        'Durum Güncellendi',
        `${restaurant.name} işletmesi ${newStatus === 'ACTIVE' ? 'aktif edildi' : 'askıya alındı'}.`
      );
    }
  };

  const handleExtendSubscription = async (restaurant: Restaurant, days: number = 30) => {
    const currentEnd = new Date(restaurant.subscription.endDate || new Date());
    const newEnd = new Date(Math.max(currentEnd.getTime(), Date.now()) + days * 24 * 60 * 60 * 1000);

    const updated: Restaurant = {
      ...restaurant,
      subscription: {
        ...restaurant.subscription,
        endDate: newEnd.toISOString().split('T')[0],
        status: 'ACTIVE',
      },
    };

    const ok = await saveRestaurant(updated);
    if (ok) {
      addToast('success', 'Abonelik Uzatıldı', `${restaurant.name} aboneliği ${days} gün uzatıldı.`);
    }
  };

  const getStatusBadge = (status: Subscription['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Aktif
          </span>
        );
      case 'TRIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" />
            Deneme
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Lock className="w-3.5 h-3.5" />
            Askıya Alındı
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Süresi Doldu
          </span>
        );
      default:
        return null;
    }
  };

  const getPlanBadge = (plan: Subscription['plan']) => {
    switch (plan) {
      case 'ENTERPRISE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">ENTERPRISE</span>;
      case 'PRO':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">PRO</span>;
      case 'STARTER':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">STARTER</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-700 text-slate-300 border border-slate-600">FREE</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                Süper Admin Platform Yönetimi
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                MULTI-TENANT SAAS
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Kayıtlı restoranları, paket aboneliklerini, limitleri ve erişim durumlarını tek merkezden yönetin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refreshAllData()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
            title="Verileri Yenile"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Yeni İşletme Ekle</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Toplam İşletme</span>
            <Store className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono-numbers">{totalTenants}</div>
          <p className="text-xs text-slate-500 mt-1">Sistemdeki kayıtlı restoranlar</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Aktif Abonelik</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono-numbers">{activeTenants}</div>
          <p className="text-xs text-emerald-500/70 mt-1">Kesintisiz POS hizmeti alanlar</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Deneme Sürecinde</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono-numbers">{trialTenants}</div>
          <p className="text-xs text-blue-500/70 mt-1">14 günlük ücretsiz deneme</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Askıda / Biten</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono-numbers">{suspendedTenants}</div>
          <p className="text-xs text-rose-500/70 mt-1">Yenileme bekleyen işletmeler</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="İşletme adı, slug veya telefon ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/70 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'EXPIRED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {st === 'ALL'
                ? 'Tümü'
                : st === 'ACTIVE'
                ? 'Aktif'
                : st === 'TRIAL'
                ? 'Deneme'
                : st === 'SUSPENDED'
                ? 'Askıda'
                : 'Süresi Dolan'}
            </button>
          ))}
        </div>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRestaurants.map((restaurant) => {
          const isCurrent = currentRestaurant?.id === restaurant.id;
          const sub = restaurant.subscription;
          const daysLeft = sub?.endDate
            ? Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <div
              key={restaurant.id}
              className={`flex flex-col justify-between p-5 rounded-2xl bg-slate-900/80 border transition-all ${
                isCurrent
                  ? 'border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'border-slate-800 hover:border-slate-700/80'
              }`}
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-base">
                      {restaurant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-100 text-base">{restaurant.name}</h3>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-slate-950">
                            SEÇİLİ
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono">slug: {restaurant.slug}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(sub.status)}
                    {getPlanBadge(sub.plan)}
                  </div>
                </div>

                {/* Subscription Details */}
                <div className="my-3.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Bitiş Tarihi:
                    </span>
                    <span className="font-medium text-slate-200 font-mono-numbers">
                      {sub.endDate || 'Süresiz'}
                      {daysLeft !== null && (
                        <span
                          className={`ml-1.5 font-bold ${
                            daysLeft > 7
                              ? 'text-emerald-400'
                              : daysLeft > 0
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          ({daysLeft > 0 ? `${daysLeft} gün kaldı` : 'Süre doldu'})
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      Masa Limiti:
                    </span>
                    <span className="font-bold text-slate-200 font-mono-numbers">
                      {sub.maxTables} Masa
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      Personel Limiti:
                    </span>
                    <span className="font-bold text-slate-200 font-mono-numbers">
                      {sub.maxStaff} Kullanıcı
                    </span>
                  </div>
                </div>

                {/* Contact snippet */}
                {(restaurant.phone || restaurant.email) && (
                  <p className="text-xs text-slate-400 truncate mb-3">
                    {restaurant.phone && <span>📞 {restaurant.phone}</span>}
                    {restaurant.phone && restaurant.email && <span className="mx-1.5">•</span>}
                    {restaurant.email && <span>✉️ {restaurant.email}</span>}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => switchRestaurant(restaurant.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:text-white'
                    }`}
                  >
                    <span>{isCurrent ? 'İşletmedesiniz' : 'İşletmeye Geç'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(restaurant)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => handleToggleStatus(restaurant)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-colors border ${
                      sub.status === 'ACTIVE'
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {sub.status === 'ACTIVE' ? 'Askıya Al' : 'Aktif Et'}
                  </button>

                  <button
                    onClick={() => handleExtendSubscription(restaurant, 30)}
                    className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 transition-colors"
                  >
                    +30 Gün Uzat
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredRestaurants.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <Store className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">İşletme Bulunamadı</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Arama kriterlerinize uygun işletme bulunamadı veya henüz başka bir işletme eklenmedi.
            </p>
          </div>
        )}
      </div>

      {/* Edit / Add Restaurant Modal */}
      {isModalOpen && editingRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    {editingRestaurant.id ? 'İşletme Bilgilerini Düzenle' : 'Yeni İşletme (Tenant) Ekle'}
                  </h2>
                  <p className="text-xs text-slate-400">Özer POS Multi-Tenant SaaS Entegrasyonu</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Core Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  İşletme Temel Bilgileri
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">
                      İşletme Adı <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Lezzet Durağı"
                      value={editingRestaurant.name || ''}
                      onChange={(e) =>
                        setEditingRestaurant({
                          ...editingRestaurant,
                          name: e.target.value,
                          slug: editingRestaurant.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">
                      Alt Alan Adı / Slug <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="lezzet-duragi"
                      value={editingRestaurant.slug || ''}
                      onChange={(e) =>
                        setEditingRestaurant({
                          ...editingRestaurant,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Telefon</label>
                    <input
                      type="tel"
                      placeholder="0555 123 4567"
                      value={editingRestaurant.phone || ''}
                      onChange={(e) => setEditingRestaurant({ ...editingRestaurant, phone: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">E-Posta</label>
                    <input
                      type="email"
                      placeholder="yonetim@restoran.com"
                      value={editingRestaurant.email || ''}
                      onChange={(e) => setEditingRestaurant({ ...editingRestaurant, email: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription & Limits */}
              <div className="pt-3 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Abonelik Paketi & Kapasite Limitleri
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Abonelik Paketi</label>
                    <select
                      value={editingRestaurant.subscription?.plan || 'PRO'}
                      onChange={(e) =>
                        setEditingRestaurant({
                          ...editingRestaurant,
                          subscription: {
                            ...editingRestaurant.subscription!,
                            plan: e.target.value as any,
                          },
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="FREE">FREE (Temel)</option>
                      <option value="STARTER">STARTER (Başlangıç)</option>
                      <option value="PRO">PRO (Profesyonel)</option>
                      <option value="ENTERPRISE">ENTERPRISE (Kurumsal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Hesap Durumu</label>
                    <select
                      value={editingRestaurant.subscription?.status || 'ACTIVE'}
                      onChange={(e) =>
                        setEditingRestaurant({
                          ...editingRestaurant,
                          subscription: {
                            ...editingRestaurant.subscription!,
                            status: e.target.value as any,
                          },
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="ACTIVE">ACTIVE (Aktif - Tam Yetki)</option>
                      <option value="TRIAL">TRIAL (Deneme Süreci)</option>
                      <option value="SUSPENDED">SUSPENDED (Askıda - Salt Okunur)</option>
                      <option value="EXPIRED">EXPIRED (Süresi Dolmuş)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Maksimum Masa Sayısı</label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={editingRestaurant.subscription?.maxTables || 25}
                      onChange={(e) =>
                        setEditingRestaurant({
                          ...editingRestaurant,
                          subscription: {
                            ...editingRestaurant.subscription!,
                            maxTables: Number(e.target.value) || 25,
                          },
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono-numbers"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Maksimum Personel Sayısı</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editingRestaurant.subscription?.maxStaff || 10}
                      onChange={(e) =>
                        setEditingRestaurant({
                          ...editingRestaurant,
                          subscription: {
                            ...editingRestaurant.subscription!,
                            maxStaff: Number(e.target.value) || 10,
                          },
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono-numbers"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Başlangıç Tarihi</label>
                    <input
                      type="date"
                      value={editingRestaurant.subscription?.startDate || ''}
                      onChange={(e) =>
                        setEditingRestaurant({
                          ...editingRestaurant,
                          subscription: {
                            ...editingRestaurant.subscription!,
                            startDate: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Bitiş Tarihi</label>
                    <input
                      type="date"
                      value={editingRestaurant.subscription?.endDate || ''}
                      onChange={(e) =>
                        setEditingRestaurant({
                          ...editingRestaurant,
                          subscription: {
                            ...editingRestaurant.subscription!,
                            endDate: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  {editingRestaurant.id ? 'Değişiklikleri Kaydet' : 'İşletmeyi Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
