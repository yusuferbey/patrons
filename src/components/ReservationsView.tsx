import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { Reservation, ReservationStatus, TableSection } from '../types';
import { ReservationModal } from './ReservationModal';
import {
  Calendar,
  Clock,
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Phone,
  MessageSquare,
  Bookmark,
  MapPin,
  Trash2,
  Edit3,
  CalendarDays,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface ReservationsViewProps {
  onOpenTableForOrder?: (tableId: string) => void;
}

export const ReservationsView: React.FC<ReservationsViewProps> = ({ onOpenTableForOrder }) => {
  const {
    reservations,
    tables,
    seatReservation,
    updateReservationStatus,
    deleteReservation,
    currentUser,
  } = usePOS();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'UPCOMING' | 'PAST'>('TODAY');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReservationStatus>('ALL');
  const [sectionFilter, setSectionFilter] = useState<TableSection | 'ALL'>('ALL');
  const [customDate, setCustomDate] = useState<string>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  // Cancellation modal state
  const [cancelModalRes, setCancelModalRes] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Müşteri rezervasyonu iptal etti');

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        res.customerName.toLowerCase().includes(q) ||
        (res.customerPhone && res.customerPhone.includes(q)) ||
        res.tableName.toLowerCase().includes(q) ||
        (res.notes && res.notes.toLowerCase().includes(q));

      // Date Filter
      let matchDate = true;
      if (customDate) {
        matchDate = res.reservationDate === customDate;
      } else if (dateFilter === 'TODAY') {
        matchDate = res.reservationDate === todayStr;
      } else if (dateFilter === 'TOMORROW') {
        matchDate = res.reservationDate === tomorrowStr;
      } else if (dateFilter === 'UPCOMING') {
        matchDate = res.reservationDate >= todayStr;
      } else if (dateFilter === 'PAST') {
        matchDate = res.reservationDate < todayStr;
      }

      // Status
      const matchStatus = statusFilter === 'ALL' || res.status === statusFilter;

      // Section
      const matchSection = sectionFilter === 'ALL' || res.section === sectionFilter;

      return matchSearch && matchDate && matchStatus && matchSection;
    });
  }, [reservations, searchQuery, dateFilter, statusFilter, sectionFilter, customDate, todayStr, tomorrowStr]);

  // Summary Metrics
  const todayReservations = reservations.filter((r) => r.reservationDate === todayStr);
  const todayGuestCount = todayReservations
    .filter((r) => r.status !== 'CANCELLED' && r.status !== 'NO_SHOW')
    .reduce((acc, r) => acc + (r.guestCount || 2), 0);
  const seatedTodayCount = todayReservations.filter((r) => r.status === 'SEATED').length;
  const confirmedTodayCount = todayReservations.filter((r) => r.status === 'CONFIRMED').length;
  const availableTablesCount = tables.filter((t) => t.status === 'EMPTY').length;

  const handleOpenEdit = (res: Reservation) => {
    setEditingReservation(res);
    setModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingReservation(null);
    setModalOpen(true);
  };

  const handleSeatCustomer = async (res: Reservation) => {
    await seatReservation(res);
  };

  const handleConfirmCancel = async () => {
    if (cancelModalRes) {
      await updateReservationStatus(cancelModalRes.id, 'CANCELLED', cancelReason);
      setCancelModalRes(null);
    }
  };

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return {
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
          label: 'Onaylı (Bekliyor)',
        };
      case 'SEATED':
        return {
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
          label: 'Masaya Alındı',
        };
      case 'CANCELLED':
        return {
          bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-400',
          label: 'İptal Edildi',
        };
      case 'NO_SHOW':
        return {
          bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
          dot: 'bg-slate-400',
          label: 'Gelmedi',
        };
      default:
        return {
          bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
          dot: 'bg-slate-400',
          label: status,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Rezervasyon Yönetimi</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Misafir rezervasyonlarını takip edin, yeni masa ayırtın ve misafirleri masaya alın.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Yeni Rezervasyon Ekle</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium block">Bugün Bekleyen</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400 font-mono-numbers">{confirmedTodayCount}</span>
            <span className="text-xs text-slate-500">Masa</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium block">Beklenen Misafir</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-100 font-mono-numbers">{todayGuestCount}</span>
            <span className="text-xs text-slate-500">Kişi</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium block">Masaya Alınan</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400 font-mono-numbers">{seatedTodayCount}</span>
            <span className="text-xs text-slate-500">Rezervasyon</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium block">Müsait Masa</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-sky-400 font-mono-numbers">{availableTablesCount}</span>
            <span className="text-xs text-slate-500">Boş</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-4">
        {/* Search Bar + Date Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Müşteri, telefon veya masa ara..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Date Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => {
                setDateFilter('TODAY');
                setCustomDate('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                dateFilter === 'TODAY' && !customDate
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Bugün ({todayReservations.length})
            </button>
            <button
              onClick={() => {
                setDateFilter('TOMORROW');
                setCustomDate('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                dateFilter === 'TOMORROW' && !customDate
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Yarın
            </button>
            <button
              onClick={() => {
                setDateFilter('UPCOMING');
                setCustomDate('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                dateFilter === 'UPCOMING' && !customDate
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Gelecek
            </button>
            <button
              onClick={() => {
                setDateFilter('ALL');
                setCustomDate('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                dateFilter === 'ALL' && !customDate
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Tüm Kayıtlar ({reservations.length})
            </button>

            {/* Custom Date Input */}
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              title="Özel Tarih Seç"
            />
          </div>
        </div>

        {/* Secondary filters: Status & Section */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Durum:</span>
            {[
              { id: 'ALL', label: 'Tümü' },
              { id: 'CONFIRMED', label: 'Onaylı / Bekliyor' },
              { id: 'SEATED', label: 'Masada' },
              { id: 'CANCELLED', label: 'İptal' },
              { id: 'NO_SHOW', label: 'Gelmedi' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === st.id
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Section Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Kat:</span>
            {(['ALL', 'Salon', 'Teras', 'Bahçe', 'VIP'] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => setSectionFilter(sec)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  sectionFilter === sec
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                {sec === 'ALL' ? 'Tümü' : sec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reservation List Cards */}
      {filteredReservations.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center">
          <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">Kayıtlı Rezervasyon Bulunamadı</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Seçilen filtrelere uygun rezervasyon bulunmuyor. Yeni bir rezervasyon oluşturabilir veya filtreleri temizleyebilirsiniz.
          </p>
          <button
            onClick={handleOpenNew}
            className="mt-5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>İlk Rezervasyonu Oluştur</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReservations.map((res) => {
            const stBadge = getStatusBadge(res.status);
            const isToday = res.reservationDate === todayStr;
            const isTomorrow = res.reservationDate === tomorrowStr;

            return (
              <div
                key={res.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                {/* Header info */}
                <div className="p-4 bg-slate-950/40 border-b border-slate-800/80">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center font-mono text-center">
                        <span className="text-[10px] text-amber-400/80 font-bold uppercase leading-none">
                          {isToday ? 'BUGÜN' : isTomorrow ? 'YARIN' : res.reservationDate.slice(5)}
                        </span>
                        <span className="text-sm font-black text-amber-300 leading-tight">
                          {res.reservationTime}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-100 text-base leading-snug">{res.customerName}</h3>
                        {res.customerPhone ? (
                          <a
                            href={`tel:${res.customerPhone}`}
                            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 mt-0.5 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{res.customerPhone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500 block mt-0.5">Telefon girilmedi</span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border flex items-center gap-1.5 shrink-0 ${stBadge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${stBadge.dot}`} />
                      {stBadge.label}
                    </span>
                  </div>
                </div>

                {/* Body details */}
                <div className="p-4 space-y-3 flex-1">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Masa</span>
                        <span className="font-bold text-slate-200">{res.tableName}</span>
                        <span className="text-[10px] text-slate-400 block">{res.section}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Kişi Sayısı</span>
                        <span className="font-bold text-slate-200">{res.guestCount} Kişi</span>
                        <span className="text-[10px] text-slate-400 block">Kayıt: {res.createdBy?.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {res.notes && (
                    <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-purple-200 text-xs flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{res.notes}</span>
                    </div>
                  )}

                  {/* Cancel / Seated timestamp info */}
                  {res.status === 'SEATED' && res.seatedAt && (
                    <div className="text-[11px] text-emerald-400/80 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Masaya alındı: {new Date(res.seatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}

                  {res.status === 'CANCELLED' && res.cancelReason && (
                    <div className="text-[11px] text-rose-400/80 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>İptal Nedeni: {res.cancelReason}</span>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                  {res.status === 'CONFIRMED' ? (
                    <>
                      <button
                        onClick={() => handleSeatCustomer(res)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
                      >
                        <UserCheck className="w-4 h-4 stroke-[2.5]" />
                        <span>Masaya Al (Masa Aç)</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(res)}
                        title="Düzenle"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setCancelModalRes(res)}
                        title="İptal Et"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOpenEdit(res)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Kayıt Detayı</span>
                      </button>

                      <button
                        onClick={() => deleteReservation(res.id)}
                        title="Sil"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reservation Create / Edit Modal */}
      {modalOpen && (
        <ReservationModal
          reservation={editingReservation}
          onClose={() => {
            setModalOpen(false);
            setEditingReservation(null);
          }}
        />
      )}

      {/* Cancel Reservation Modal */}
      {cancelModalRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Rezervasyonu İptal Et</h3>
                <p className="text-xs text-slate-400">{cancelModalRes.customerName} - {cancelModalRes.tableName}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">İptal Sebebi</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Örn: Müşteri arayıp iptal etti"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => updateReservationStatus(cancelModalRes.id, 'NO_SHOW', 'Misafir gelmedi')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Gelmedi Olarak İşaretle
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalRes(null)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20"
                >
                  İptal Et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
