import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { RestaurantTable, TableStatus, TableSection } from '../types';
import { ReservationModal } from './ReservationModal';
import { TableFormModal } from './TableFormModal';
import { SectionManagementModal, getSectionIcon } from './SectionManagementModal';
import {
  Plus,
  Receipt,
  Users,
  Clock,
  QrCode,
  ArrowRightLeft,
  Merge,
  Filter,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  CalendarDays,
  Bookmark,
  UserCheck,
  Edit2,
  Trash2,
  Layers,
} from 'lucide-react';

interface TablesViewProps {
  onSelectTableForOrder: (table: RestaurantTable) => void;
  onOpenTableDetail: (table: RestaurantTable) => void;
  onOpenBillCheckout: (table: RestaurantTable) => void;
  onOpenTransferMerge: (type: 'transfer' | 'merge', table: RestaurantTable) => void;
  onOpenQRModal: (table: RestaurantTable) => void;
}

export const TablesView: React.FC<TablesViewProps> = ({
  onSelectTableForOrder,
  onOpenTableDetail,
  onOpenBillCheckout,
  onOpenTransferMerge,
  onOpenQRModal,
}) => {
  const {
    tables,
    sections,
    selectedSection,
    setSelectedSection,
    currentUser,
    reservations,
    seatReservation,
    deleteTable,
  } = usePOS();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reservationModalTable, setReservationModalTable] = useState<RestaurantTable | null>(null);

  // Table Management Modal States
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [tableToEdit, setTableToEdit] = useState<RestaurantTable | null>(null);
  const [tableToDelete, setTableToDelete] = useState<RestaurantTable | null>(null);

  // Section Management Modal State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState<boolean>(false);

  // Combine unique sections
  const dynamicSections: (string | 'Tümü')[] = [
    'Tümü',
    ...Array.from(
      new Set([
        'Salon',
        'Teras',
        ...sections,
        ...tables.map((t) => t.section).filter(Boolean),
      ])
    ),
  ];

  const filteredTables = tables.filter((table) => {
    const matchSection = selectedSection === 'Tümü' || table.section === selectedSection;
    const matchStatus = statusFilter === 'ALL' || table.status === statusFilter;
    return matchSection && matchStatus;
  });

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'EMPTY':
        return {
          badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          border: 'border-slate-800 hover:border-emerald-500/50',
          headerBg: 'bg-slate-900',
          label: 'BOŞ',
          dot: 'bg-emerald-400',
        };
      case 'OCCUPIED':
        return {
          badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          border: 'border-blue-500/40 hover:border-blue-500',
          headerBg: 'bg-blue-950/30',
          label: 'DOLU',
          dot: 'bg-blue-400',
        };
      case 'KITCHEN':
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
          border: 'border-amber-500/50 hover:border-amber-500',
          headerBg: 'bg-amber-950/30',
          label: 'MUTFAKTA',
          dot: 'bg-amber-400',
        };
      case 'ORDER_PENDING':
        return {
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          border: 'border-orange-500/40 hover:border-orange-500',
          headerBg: 'bg-orange-950/30',
          label: 'SİPARİŞ BEKLİYOR',
          dot: 'bg-orange-400',
        };
      case 'READY':
        return {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-bounce',
          border: 'border-emerald-500/60 hover:border-emerald-400',
          headerBg: 'bg-emerald-950/40',
          label: 'SERVİSE HAZIR',
          dot: 'bg-emerald-400',
        };
      case 'BILL_REQUESTED':
        return {
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse',
          border: 'border-rose-500/60 hover:border-rose-400',
          headerBg: 'bg-rose-950/40',
          label: 'HESAP İSTENDİ',
          dot: 'bg-rose-400',
        };
      case 'RESERVED':
        return {
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          border: 'border-purple-500/40 hover:border-purple-500',
          headerBg: 'bg-purple-950/30',
          label: 'REZERVE',
          dot: 'bg-purple-400',
        };
    }
  };

  const getMinutesElapsed = (openedAt?: string) => {
    if (!openedAt) return null;
    const mins = Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000);
    return mins > 0 ? `${mins} dk` : 'Yeni açıldı';
  };

  // Counts for status overview
  const totalTables = tables.length;
  const emptyCount = tables.filter((t) => t.status === 'EMPTY').length;
  const occupiedCount = tables.filter((t) => t.status !== 'EMPTY' && t.status !== 'RESERVED').length;
  const kitchenCount = tables.filter((t) => t.status === 'KITCHEN').length;
  const readyCount = tables.filter((t) => t.status === 'READY').length;
  const billCount = tables.filter((t) => t.status === 'BILL_REQUESTED').length;
  const reservedCount = tables.filter((t) => t.status === 'RESERVED').length;

  return (
    <div className="space-y-5">
      {/* Top Header & Section Filter Pills + Action Buttons */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3.5">
        {/* Row 1: Section Pills + Section Management + Add Table */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Sections List */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {dynamicSections.map((sec) => {
              const icon = sec === 'Tümü' ? '🏛️' : getSectionIcon(sec);
              const count = sec === 'Tümü' ? tables.length : tables.filter((t) => t.section === sec).length;
              const isSelected = selectedSection === sec;

              return (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-slate-100 border border-slate-700/60'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{sec === 'Tümü' ? 'Tüm Katlar' : sec}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${
                      isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900/80 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Mekan Ekle / Yönet Button */}
            <button
              onClick={() => setIsSectionModalOpen(true)}
              title="Mekan / Bölüm Ekle & Düzenle"
              className="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Mekan Ekle</span>
            </button>
          </div>

          {/* Right Action: Yeni Masa Ekle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setTableToEdit(null);
                setIsTableModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Yeni Masa Ekle</span>
            </button>
          </div>
        </div>

        {/* Row 2: Status Filter Bar + Quick Reservation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg font-bold border transition-colors shrink-0 ${
                statusFilter === 'ALL'
                  ? 'bg-slate-700 text-slate-100 border-slate-500'
                  : 'bg-slate-800/40 text-slate-400 border-slate-800'
              }`}
            >
              Tümü ({totalTables})
            </button>
            <button
              onClick={() => setStatusFilter('EMPTY')}
              className={`px-2.5 py-1.5 rounded-lg font-bold border flex items-center gap-1.5 transition-colors shrink-0 ${
                statusFilter === 'EMPTY'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                  : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Boş ({emptyCount})
            </button>
            <button
              onClick={() => setStatusFilter('RESERVED')}
              className={`px-2.5 py-1.5 rounded-lg font-bold border flex items-center gap-1.5 transition-colors shrink-0 ${
                statusFilter === 'RESERVED'
                  ? 'bg-purple-950 text-purple-300 border-purple-500'
                  : 'bg-purple-950/30 text-purple-400 border-purple-900/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Rezerve ({reservedCount})
            </button>
            <button
              onClick={() => setStatusFilter('KITCHEN')}
              className={`px-2.5 py-1.5 rounded-lg font-bold border flex items-center gap-1.5 transition-colors shrink-0 ${
                statusFilter === 'KITCHEN'
                  ? 'bg-amber-950 text-amber-300 border-amber-500'
                  : 'bg-amber-950/30 text-amber-400 border-amber-900/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Mutfakta ({kitchenCount})
            </button>
            <button
              onClick={() => setStatusFilter('READY')}
              className={`px-2.5 py-1.5 rounded-lg font-bold border flex items-center gap-1.5 transition-colors shrink-0 ${
                statusFilter === 'READY'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                  : 'bg-emerald-950/30 text-emerald-300 border-emerald-900/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Hazır ({readyCount})
            </button>
            <button
              onClick={() => setStatusFilter('BILL_REQUESTED')}
              className={`px-2.5 py-1.5 rounded-lg font-bold border flex items-center gap-1.5 transition-colors shrink-0 ${
                statusFilter === 'BILL_REQUESTED'
                  ? 'bg-rose-950 text-rose-300 border-rose-500'
                  : 'bg-rose-950/30 text-rose-400 border-rose-900/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              Hesap ({billCount})
            </button>
          </div>

          {/* Quick Reservation Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setReservationModalTable(tables[0] || null)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Rezervasyon Yap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Tables or Empty State */}
      {filteredTables.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto my-8 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-3xl shadow-lg">
            {selectedSection !== 'Tümü' ? getSectionIcon(selectedSection) : '🍽️'}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {selectedSection !== 'Tümü'
                ? `"${selectedSection}" Bölümünde Masa Yok`
                : 'Filtreye Uygun Masa Bulunamadı'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {selectedSection !== 'Tümü'
                ? `Bu alana hemen yeni masa tanımlayabilir veya diğer mekanları görüntüleyebilirsiniz.`
                : 'Filtre kriterlerinizi değiştirin veya yeni bir masa oluşturun.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTableToEdit(null);
              setIsTableModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>
              {selectedSection !== 'Tümü' ? `"${selectedSection}" Bölümüne Masa Ekle` : 'Yeni Masa Ekle'}
            </span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredTables.map((table) => {
          const cfg = getStatusColor(table.status);
          const elapsed = getMinutesElapsed(table.openedAt);
          const hasOrder = table.status !== 'EMPTY' && table.status !== 'RESERVED';

          return (
            <div
              key={table.id}
              className={`bg-slate-900 rounded-2xl sm:rounded-3xl border ${cfg.border} shadow-xl hover:shadow-2xl transition-all duration-200 flex flex-col justify-between overflow-hidden group`}
            >
              {/* Card Top */}
              <div className={`p-3 sm:p-4 ${cfg.headerBg} border-b border-slate-800/60`}>
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-slate-100 tracking-tight truncate">{table.name}</h3>
                      {table.mergedWith && table.mergedWith.length > 0 && (
                        <span className="text-[9px] sm:text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1 py-0.5 rounded font-bold">
                          +{table.mergedWith.join(', ')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">{table.section} • {table.capacity} Kişi</p>
                  </div>

                  {/* Status Badge and Table Actions (Edit & Delete) */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTableToEdit(table);
                          setIsTableModalOpen(true);
                        }}
                        title="Masayı Düzenle"
                        className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasOrder) {
                            alert('Açık siparişi olan masa silinemez. Lütfen önce hesabı kapatın.');
                            return;
                          }
                          setTableToDelete(table);
                        }}
                        disabled={hasOrder}
                        title={hasOrder ? 'Açık hesabı olan masa silinemez' : 'Masayı Sil / Çıkar'}
                        className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold tracking-wider border flex items-center gap-1 shrink-0 ${cfg.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      <span className="hidden xs:inline sm:inline">{cfg.label}</span>
                      <span className="inline xs:hidden sm:hidden">{cfg.label.slice(0, 5)}</span>
                    </span>
                  </div>
                </div>

                {/* Reservation Notes if any */}
                {table.status === 'RESERVED' && table.reservationNotes && (
                  <div className="mt-2 p-1.5 sm:p-2 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-200 text-[11px] sm:text-xs line-clamp-2">
                    📌 {table.reservationNotes}
                  </div>
                )}

                {/* Table Info & Price when active */}
                {hasOrder && (
                  <div className="mt-2.5 pt-2.5 sm:mt-3 sm:pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1">
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium">Toplam</span>
                      <span className="text-lg sm:text-xl font-extrabold text-amber-400 font-mono-numbers">
                        ₺{table.totalAmount.toLocaleString('tr-TR')}
                      </span>
                      {elapsed && (
                        <div className="flex items-center gap-1 text-amber-300 text-[10px] sm:text-[11px] font-mono font-medium mt-0.5">
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{elapsed}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      {table.currentWaiterName && (
                        <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium block bg-slate-800/80 px-1.5 sm:px-2 py-0.5 rounded-lg border border-slate-700 truncate max-w-[80px] sm:max-w-none">
                          {table.currentWaiterName.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Action Buttons Footer */}
              <div className="p-2 sm:p-3 bg-slate-950/60 flex items-center justify-between gap-1 sm:gap-1.5">
                {table.status === 'EMPTY' ? (
                  <>
                    <button
                      onClick={() => onSelectTableForOrder(table)}
                      className="flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                      <span className="truncate">Sipariş Aç</span>
                    </button>
                    <button
                      onClick={() => setReservationModalTable(table)}
                      title="Bu Masaya Rezervasyon Yap"
                      className="p-2 sm:p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-800/50 transition-colors shrink-0"
                    >
                      <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => onOpenQRModal(table)}
                      title="Masa QR Menü"
                      className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors shrink-0"
                    >
                      <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </>
                ) : table.status === 'RESERVED' ? (
                  <>
                    <button
                      onClick={async () => {
                        const associatedRes = table.currentReservationId
                          ? reservations.find((r) => r.id === table.currentReservationId)
                          : reservations.find((r) => r.tableId === table.id && r.status === 'CONFIRMED');
                        if (associatedRes) {
                          await seatReservation(associatedRes);
                        }
                        onSelectTableForOrder(table);
                      }}
                      className="flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
                    >
                      <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                      <span className="truncate">Masaya Al</span>
                    </button>
                    <button
                      onClick={() => onOpenTableDetail(table)}
                      className="py-2 sm:py-2.5 px-2 sm:px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] sm:text-xs border border-slate-700 shrink-0"
                    >
                      Detay
                    </button>
                    <button
                      onClick={() => onOpenQRModal(table)}
                      className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 shrink-0"
                    >
                      <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    {/* Detay & Sipariş Ekle */}
                    <button
                      onClick={() => onOpenTableDetail(table)}
                      className="flex-1 py-2 px-1.5 sm:px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] sm:text-xs flex items-center justify-center border border-slate-700 transition-colors"
                    >
                      <span>Detay</span>
                    </button>

                    <button
                      onClick={() => onSelectTableForOrder(table)}
                      className="flex-1 py-2 px-1.5 sm:px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] sm:text-xs flex items-center justify-center gap-0.5 border border-amber-500/40 transition-colors"
                    >
                      <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Ekle</span>
                    </button>

                    {/* Hesabı Gör / Ödeme Al */}
                    <button
                      onClick={() => onOpenBillCheckout(table)}
                      className="flex-1 py-2 px-1.5 sm:px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[10px] sm:text-xs flex items-center justify-center gap-0.5 shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                      <Receipt className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                      <span>Hesap</span>
                    </button>

                    {/* QR Code */}
                    <button
                      onClick={() => onOpenQRModal(table)}
                      title="Masa QR Menü"
                      className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors shrink-0"
                    >
                      <QrCode className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Quick Reservation Modal */}
      {reservationModalTable && (
        <ReservationModal
          preselectedTable={reservationModalTable}
          onClose={() => setReservationModalTable(null)}
        />
      )}

      {/* Add / Edit Table Modal */}
      {isTableModalOpen && (
        <TableFormModal
          isOpen={isTableModalOpen}
          onClose={() => {
            setIsTableModalOpen(false);
            setTableToEdit(null);
          }}
          tableToEdit={tableToEdit}
          defaultSection={selectedSection}
        />
      )}

      {/* Section Management Modal */}
      {isSectionModalOpen && (
        <SectionManagementModal
          isOpen={isSectionModalOpen}
          onClose={() => setIsSectionModalOpen(false)}
          onSelectSection={(secName) => setSelectedSection(secName as any)}
        />
      )}

      {/* Delete Table Confirmation Modal */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100">Masayı Sil</h3>
                <p className="text-xs text-slate-400">
                  "{tableToDelete.name}" ({tableToDelete.section})
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bu masayı salon planından silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTableToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (tableToDelete) {
                    await deleteTable(tableToDelete.id);
                    setTableToDelete(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-slate-100 text-xs font-bold shadow-md shadow-rose-600/20 transition-colors"
              >
                Evet, Masayı Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
