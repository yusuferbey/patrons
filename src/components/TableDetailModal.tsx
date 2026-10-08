import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { RestaurantTable, OrderItem } from '../types';
import { formatOrderNumber, formatRoleTR } from '../utils/formatters';
import { ReservationModal } from './ReservationModal';
import {
  X,
  Plus,
  Receipt,
  ArrowRightLeft,
  Merge,
  Clock,
  User as UserIcon,
  Trash2,
  Check,
  Flame,
  CheckCircle2,
  AlertTriangle,
  BellRing,
  Bookmark,
  Phone,
  MessageSquare,
  UserCheck,
  Edit3,
  History,
  CheckCheck,
} from 'lucide-react';

interface TableDetailModalProps {
  table: RestaurantTable;
  onClose: () => void;
  onAddOrder: (table: RestaurantTable) => void;
  onOpenCheckout: (table: RestaurantTable) => void;
  onOpenTransferMerge: (type: 'transfer' | 'merge', table: RestaurantTable) => void;
}

export const TableDetailModal: React.FC<TableDetailModalProps> = ({
  table,
  onClose,
  onAddOrder,
  onOpenCheckout,
  onOpenTransferMerge,
}) => {
  const {
    orders,
    reservations,
    users,
    currentUser,
    changeTableWaiter,
    updateItemStatus,
    cancelOrderItem,
    reduceOrderItem,
    updateTableStatus,
    seatReservation,
    updateReservationStatus,
    auditLogs,
    refreshAllData,
    addToast,
  } = usePOS();
  const [activeTab, setActiveTab] = useState<'general' | 'orders' | 'bill' | 'audit'>('orders');
  const [cancelModalItem, setCancelModalItem] = useState<OrderItem | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Müşteri vazgeçti');
  const [showEditReservationModal, setShowEditReservationModal] = useState(false);
  const [showChangeWaiter, setShowChangeWaiter] = useState(false);

  const tableAuditLogs = auditLogs.filter(
    (log) =>
      log.tableId === table.id ||
      log.meta?.tableName === table.name ||
      log.tableName === table.name ||
      log.details?.toLowerCase().includes(table.name.toLowerCase()) ||
      log.action?.toLowerCase().includes(table.name.toLowerCase())
  );

  const handleServeAll = async () => {
    try {
      const res = await fetch(`/api/tables/${table.id}/serve-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('patronpos_token') || ''}`,
        },
        body: JSON.stringify({
          performedBy: currentUser?.name || 'Garson',
          performedRole: currentUser?.role || 'WAITER',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('success', '✓ Tümünü Servis Et', `${table.name} masasındaki ${data.servedCount} adet hazır ürün masaya servis edildi.`);
        refreshAllData();
      } else {
        addToast('warning', 'Bilgi', data.message || 'Masada servis edilecek hazır durumda ürün bulunmuyor.');
      }
    } catch (err) {
      addToast('error', 'Hata', 'İşlem gerçekleştirilemedi.');
    }
  };

  const associatedRes = table.currentReservationId
    ? reservations.find((r) => r.id === table.currentReservationId)
    : reservations.find((r) => r.tableId === table.id && r.status === 'CONFIRMED');

  const currentOrder = orders.find((o) => o.id === table.currentOrderId);
  const activeItems = currentOrder ? currentOrder.items.filter((i) => i.status !== 'CANCELLED') : [];
  const cancelledItems = currentOrder ? currentOrder.items.filter((i) => i.status === 'CANCELLED') : [];

  const handleCancelSubmit = async () => {
    if (cancelModalItem) {
      await cancelOrderItem(cancelModalItem.id, cancelReason);
      setCancelModalItem(null);
    }
  };

  const handleSeatCustomer = async () => {
    if (associatedRes) {
      await seatReservation(associatedRes);
    } else {
      await updateTableStatus(table.id, 'OCCUPIED');
    }
    onAddOrder(table);
  };

  const handleCancelReservation = async () => {
    if (associatedRes) {
      await updateReservationStatus(associatedRes.id, 'CANCELLED', 'Masa detayından iptal edildi');
    } else {
      await updateTableStatus(table.id, 'EMPTY');
    }
    onClose();
  };

  const handleRequestBill = async () => {
    await updateTableStatus(table.id, 'BILL_REQUESTED');
    addToast('info', 'Hesap İstendi', `${table.name} için hesap istendi olarak işaretlendi.`);
  };

  const getItemStatusBadge = (status: OrderItem['status']) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">🔴 YENİ</span>;
      case 'ACCEPTED':
      case 'PREPARING':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">🟡 HAZIRLANIYOR</span>;
      case 'READY':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">🟢 HAZIR</span>;
      case 'SERVED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">🔵 SERVİS EDİLDİ</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-500 line-through">İPTAL EDİLDİ</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-lg">
              {table.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-100">{table.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {table.section} Katı
                </span>
                {currentOrder && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                    Sipariş No: {formatOrderNumber(currentOrder)}
                  </span>
                )}
              </div>
              <div className="flex items-center flex-wrap gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                  Sorumlu: <strong className="text-slate-200">{table.responsibleWaiterName || table.currentWaiterName || 'Atanmamış'}</strong>
                </span>
                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'CASHIER') && (
                  <button
                    onClick={() => setShowChangeWaiter(!showChangeWaiter)}
                    className="text-[10px] text-amber-400 underline hover:text-amber-300 font-semibold"
                  >
                    {showChangeWaiter ? 'Kapat' : 'Değiştir'}
                  </button>
                )}
                {table.openedAt && (
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Açılış: {new Date(table.openedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {showChangeWaiter && (
                <div className="mt-2 p-2 bg-slate-900 border border-amber-500/30 rounded-xl flex items-center gap-2">
                  <span className="text-[11px] text-slate-300">Yeni Garson:</span>
                  <select
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2 py-1"
                    onChange={async (e) => {
                      const selectedUser = users.find((u) => u.id === e.target.value);
                      if (selectedUser) {
                        await changeTableWaiter(table.id, selectedUser.id, selectedUser.name);
                        setShowChangeWaiter(false);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Garson seçin...</option>
                    {users
                      .filter((u) => u.role === 'WAITER' || u.role === 'ADMIN')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({formatRoleTR(u.role)})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Tabs Bar (Genel, Siparişler, Adisyon, Denetim Kayıtları) */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'general'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Genel</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'orders'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Siparişler ({activeItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bill')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'bill'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Adisyon</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'audit'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Denetim Kayıtları ({tableAuditLogs.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {/* TAB 1: GENEL */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Bölüm / Kat</span>
                  <strong className="text-sm text-slate-100 mt-1 block">{table.section}</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Kapasite / Misafir</span>
                  <strong className="text-sm text-slate-100 mt-1 block">{table.guestCount || 2} / {table.capacity} Kişi</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Masa Durumu</span>
                  <strong className="text-sm text-amber-400 mt-1 block">{table.status}</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Masa Sorumlusu</span>
                  <strong className="text-sm text-slate-100 mt-1 block">{table.responsibleWaiterName || table.currentWaiterName || 'Atanmamış'}</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Masa Sahibi (İlk Garson)</span>
                  <strong className="text-sm text-slate-100 mt-1 block">{table.tableOwnerName || table.responsibleWaiterName || 'Atanmamış'}</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Son İşlem Yapan</span>
                  <strong className="text-sm text-slate-100 mt-1 block">{table.lastActionByName || table.currentWaiterName || 'Sistem'}</strong>
                </div>
              </div>

              {/* Reservation Card if table is reserved */}
              {table.status === 'RESERVED' && (
                <div className="p-5 rounded-3xl bg-purple-950/40 border border-purple-800/50 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                        <Bookmark className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-base">
                          {associatedRes ? associatedRes.customerName : 'Masa Rezervasyonu'}
                        </h3>
                        <p className="text-xs text-purple-300">
                          {associatedRes ? `${associatedRes.guestCount} Kişi • ${associatedRes.reservationTime}` : 'Masa Rezerve Edildi'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {associatedRes && (
                        <button
                          onClick={() => setShowEditReservationModal(true)}
                          className="p-2 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 text-xs font-bold flex items-center gap-1 transition-colors border border-purple-700/50"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Düzenle</span>
                        </button>
                      )}
                      <button
                        onClick={handleCancelReservation}
                        className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold flex items-center gap-1 transition-colors border border-rose-800/50"
                      >
                        <span>İptal Et</span>
                      </button>
                    </div>
                  </div>

                  {associatedRes?.customerPhone && (
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <a href={`tel:${associatedRes.customerPhone}`} className="hover:text-amber-400 underline">
                        {associatedRes.customerPhone}
                      </a>
                    </div>
                  )}

                  {associatedRes?.notes && (
                    <div className="p-3 rounded-2xl bg-slate-900/70 border border-purple-900/50 text-xs text-purple-200 flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                      <span>{associatedRes.notes}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSeatCustomer}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
                  >
                    <UserCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>Misafiri Masaya Al & Sipariş Başlat</span>
                  </button>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Toplam Sipariş Tutarı</span>
                  <div className="text-xl font-bold text-amber-400">₺{table.totalAmount.toLocaleString('tr-TR')}</div>
                </div>
                <button
                  onClick={() => onAddOrder(table)}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20"
                >
                  + Yeni Sipariş Ekle
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SİPARİŞLER */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sipariş Detayları ({activeItems.length} Kalem)
                </h3>
                {activeItems.some((i) => i.status === 'READY') && (
                  <button
                    onClick={handleServeAll}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Tümünü Servis Et</span>
                  </button>
                )}
              </div>

              {activeItems.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <p className="text-slate-400 text-sm">Bu masada henüz kayıtlı sipariş yok.</p>
                  <button
                    onClick={() => onAddOrder(table)}
                    className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20"
                  >
                    + Sipariş Ekle
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={item.productPhoto || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80'}
                          alt={item.productName}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-amber-400 font-mono-numbers">{item.quantity}x</span>
                            <h4 className="font-bold text-slate-200 text-sm">{item.productName}</h4>
                            <span className="text-xs text-slate-400 font-mono-numbers">
                              (₺{(item.unitPrice * item.quantity).toLocaleString('tr-TR')})
                            </span>
                            {item.station && item.station !== 'NONE' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                                {item.station}
                              </span>
                            )}
                          </div>

                          <div className="mt-1 space-y-0.5 text-xs">
                            {(item.addedByWaiterName || item.source) && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
                                  {item.source === 'WAITER_MOBILE' ? '📱 Mobil' : '💻 POS'}
                                </span>
                                <span>Ekleyen: <strong className="text-slate-200">{item.addedByWaiterName || 'Garson'}</strong></span>
                              </div>
                            )}
                            {item.customization?.extras && item.customization.extras.length > 0 && (
                              <div className="text-emerald-400 flex items-center gap-1 font-medium">
                                <span>+</span>
                                <span>{item.customization.extras.map((e) => `${e.name} (+₺${e.price})`).join(', ')}</span>
                              </div>
                            )}
                            {item.customization?.removedIngredients && item.customization.removedIngredients.length > 0 && (
                              <div className="text-rose-400 flex items-center gap-1 font-medium">
                                <span>-</span>
                                <span>{item.customization.removedIngredients.join(', ')}</span>
                              </div>
                            )}
                            {item.customization?.specialNote && (
                              <div className="text-amber-300/90 italic">
                                💬 "{item.customization.specialNote}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status & Action */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {getItemStatusBadge(item.status)}

                        <div className="flex items-center gap-1 mt-1">
                          {item.status === 'READY' && (
                            <button
                              onClick={() => updateItemStatus(item.id, 'SERVED')}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Servis Et</span>
                            </button>
                          )}

                          {item.quantity > 1 && (
                            <button
                              onClick={() => reduceOrderItem(item.id, 1, 'Müşteri talebi')}
                              title="1 Adet Azalt"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700 transition-colors text-xs font-bold"
                            >
                              -1
                            </button>
                          )}

                          <button
                            onClick={() => setCancelModalItem(item)}
                            title="Ürünü İptal Et (Stok iade edilir)"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cancelledItems.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    İptal Edilen Ürünler ({cancelledItems.length})
                  </h4>
                  <div className="space-y-1.5 opacity-60">
                    {cancelledItems.map((c) => (
                      <div key={c.id} className="text-xs text-slate-400 flex justify-between bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                        <span className="line-through">{c.quantity}x {c.productName}</span>
                        <span className="text-rose-400/80">Sebep: {c.cancelReason || 'İptal'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADİSYON */}
          {activeTab === 'bill' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
                  <span>Ürün / Hizmet</span>
                  <div className="flex gap-8">
                    <span>Adet x Fiyat</span>
                    <span>Tutar</span>
                  </div>
                </div>

                {activeItems.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Hesaba yansıyan aktif ürün bulunmuyor.</p>
                ) : (
                  <div className="space-y-2">
                    {activeItems.map((itm) => (
                      <div key={itm.id} className="flex items-center justify-between text-xs text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-400">{itm.quantity}x</span>
                          <span>{itm.productName}</span>
                        </div>
                        <div className="flex gap-8 font-mono">
                          <span className="text-slate-400">₺{itm.unitPrice.toLocaleString('tr-TR')}</span>
                          <span className="font-bold text-slate-100">₺{(itm.unitPrice * itm.quantity).toLocaleString('tr-TR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Ara Toplam:</span>
                    <span className="font-mono">₺{table.totalAmount.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>KDV Dahil (%10):</span>
                    <span className="font-mono">₺{(table.totalAmount * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-amber-400 pt-2 border-t border-slate-800/80">
                    <span>Ödenecek Tutar:</span>
                    <span className="font-mono">₺{table.totalAmount.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRequestBill}
                  className="flex-1 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30 transition-colors"
                >
                  🔔 Hesap İstendi Olarak İşaretle
                </button>
                <button
                  onClick={() => onOpenCheckout(table)}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all"
                >
                  💳 Hesabı Gör & Ödeme Al
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DENETİM KAYITLARI */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  {table.name} Denetim ve Hareket Geçmişi
                </span>
                <span className="text-[10px] text-slate-400">Yalnızca bu masaya ait {tableAuditLogs.length} kayıt</span>
              </div>
              {tableAuditLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
                  Bu masaya ait geçmiş işlem kaydı bulunamadı.
                </p>
              ) : (
                <div className="space-y-2">
                  {tableAuditLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-start justify-between gap-3 hover:border-slate-700 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{log.action}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">{log.userName}</span>
                          {log.eventType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                              {log.eventType}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1">{log.details}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total & Action Buttons Footer */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div>
              <span className="text-xs text-slate-400">Masadaki Toplam Tutar</span>
              <div className="text-2xl font-black text-amber-400 font-mono-numbers">
                ₺{table.totalAmount.toLocaleString('tr-TR')}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeItems.some((i) => i.status !== 'SERVED') && (
                <button
                  onClick={handleServeAll}
                  className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold text-xs flex items-center gap-1.5 border border-blue-500/40 transition-colors shadow-sm"
                  title="Tüm hazır siparişleri servis edildi yap"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tümünü Servis Et</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 border transition-colors ${
                  activeTab === 'audit'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Masa Denetim Kayıtları"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>Masa Geçmişi ({tableAuditLogs.length})</span>
              </button>

              <button
                onClick={() => onOpenTransferMerge('transfer', table)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Masa Taşı</span>
              </button>

              <button
                onClick={() => onOpenTransferMerge('merge', table)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Merge className="w-3.5 h-3.5 text-indigo-400" />
                <span>Birleştir</span>
              </button>

              {table.status !== 'BILL_REQUESTED' && (
                <button
                  onClick={handleRequestBill}
                  className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs flex items-center gap-1.5 border border-rose-500/40 transition-colors"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Hesap İste</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => onAddOrder(table)}
              className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Sipariş Ekle</span>
            </button>

            <button
              onClick={() => onOpenCheckout(table)}
              className="py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              <Receipt className="w-4 h-4 stroke-[2.5]" />
              <span>Hesabı Gör & Ödeme Al</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Item Modal Dialog */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-100">Ürün İptali Onayı</h3>
            </div>

            <p className="text-sm text-slate-300 mb-4">
              <strong>{cancelModalItem.quantity}x {cancelModalItem.productName}</strong> siparişten çıkarılacak ve stok iade edilecektir.
            </p>

            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
              İptal Sebebi:
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-rose-500 mb-5"
            >
              <option value="Müşteri vazgeçti">Müşteri vazgeçti</option>
              <option value="Yanlış sipariş girildi">Yanlış sipariş girildi</option>
              <option value="Ürün kalitesi / şikayet">Ürün kalitesi / şikayet</option>
              <option value="Mutfak hazırlayamadı">Mutfak hazırlayamadı</option>
              <option value="İkram / İptal">İkram / Yönetici İptali</option>
            </select>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCancelModalItem(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Vazgeç
              </button>
              <button
                onClick={handleCancelSubmit}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20"
              >
                İptali Onayla
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Reservation Modal */}
      {showEditReservationModal && (
        <ReservationModal
          reservation={associatedRes}
          preselectedTable={table}
          onClose={() => setShowEditReservationModal(false)}
        />
      )}
    </div>
  );
};
