import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { Order, OrderItem, ProductStation } from '../types';
import { formatOrderNumber } from '../utils/formatters';
import {
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronRight,
  Filter,
  Check,
  User,
  Coffee,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const KDSView: React.FC = () => {
  const { orders, tables, updateItemStatus, updateTableStatus, addToast, currentUser, hasPermission } = usePOS();
  const [selectedStation, setSelectedStation] = useState<string>(() => {
    if (currentUser?.role === 'BARISTA') return 'BAR';
    if (currentUser?.role === 'KITCHEN') return 'MUTFAK';
    return 'ALL';
  });
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  const canManage = hasPermission('kitchen.manage') || hasPermission('MUTFAK_YONET');

  // Tick timer every 5 seconds for elapsed timer update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter((o) => o.status === 'ACTIVE');

  // Filter items in orders based on selected station
  const stationOrders = activeOrders
    .map((order) => {
      const filteredItems = order.items.filter((item) => {
        if (item.status === 'CANCELLED' || item.status === 'SERVED') return false;
        if (selectedStation === 'ALL') return true;
        const normItemStation = (item.station || 'MUTFAK').toString().toUpperCase();
        if (selectedStation === 'MUTFAK') {
          return normItemStation === 'MUTFAK' || normItemStation === 'IZGARA' || normItemStation === 'PIZZA';
        }
        if (selectedStation === 'BAR') {
          return normItemStation === 'BAR';
        }
        if (selectedStation === 'TATLI') {
          return normItemStation === 'TATLI';
        }
        return normItemStation === (selectedStation as string).toUpperCase();
      });

      return {
        ...order,
        items: filteredItems,
      };
    })
    .filter((o) => o.items.length > 0);

  const getElapsedFormatted = (createdAt: string) => {
    const diffMs = currentTime - new Date(createdAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getElapsedMinutes = (createdAt: string) => {
    return Math.floor((currentTime - new Date(createdAt).getTime()) / 60000);
  };

  const handleMarkAllReady = async (order: Order) => {
    if (!canManage) {
      addToast('warning', 'Yetki Yetersiz', 'Mutfak durumunu güncellemek için MUTFAK_YONET yetkisi gereklidir.');
      return;
    }
    for (const item of order.items) {
      if (item.status !== 'READY' && item.status !== 'SERVED' && item.status !== 'CANCELLED') {
        await updateItemStatus(item.id, 'READY');
      }
    }
    // Update table status to READY if all items ready
    await updateTableStatus(order.tableId, 'READY');
    addToast('success', 'Sipariş Hazır!', `${order.tableName} siparişi servise hazırlandı.`);
  };

  const handleMarkItemStatus = async (item: OrderItem, nextStatus: OrderItem['status']) => {
    if (!canManage) {
      addToast('warning', 'Yetki Yetersiz', 'Sipariş kalemini güncellemek için MUTFAK_YONET yetkisi gereklidir.');
      return;
    }
    await updateItemStatus(item.id, nextStatus);
  };

  const handlePrintKitchenTicket = (order: Order) => {
    window.print();
  };

  const stations: { id: ProductStation | 'ALL' | 'MUTFAK'; label: string; icon: string }[] = [
    { id: 'ALL', label: 'Tümünü Gör', icon: '🔥' },
    { id: 'MUTFAK', label: 'Mutfak', icon: '🍳' },
    { id: 'BAR', label: 'Bar & İçecek', icon: '🍹' },
    { id: 'TATLI', label: 'Tatlı & Kahve', icon: '🍰' },
    { id: 'IZGARA', label: 'Izgara / Ocak', icon: '🥩' },
    { id: 'PIZZA', label: 'Fırın & Pizza', icon: '🍕' },
  ];

  return (
    <div className="space-y-5">
      {/* Top Station Selector Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
              <span>KDS - Mutfak Ekranı</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono-numbers">
                {stationOrders.length} Aktif Adisyon
              </span>
            </h1>
            <p className="text-xs text-slate-400">Canlı İstasyon ve Sipariş Yönetimi</p>
          </div>
        </div>

        {/* Stations Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {stations.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStation(st.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedStation === st.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <span>{st.icon}</span>
              <span>{st.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {stationOrders.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/40 rounded-3xl border border-slate-800">
          <CheckCircle2 className="w-16 h-16 text-emerald-400/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-200">Mutfakta bekleyen sipariş yok!</h3>
          <p className="text-xs text-slate-400 mt-1">Yeni bir sipariş girildiğinde buraya otomatik olarak düşecektir.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {stationOrders.map((order) => {
            const elapsedMins = getElapsedMinutes(order.createdAt);
            const isUrgent = elapsedMins >= 15;
            const isWarning = elapsedMins >= 8 && elapsedMins < 15;
            const allReady = order.items.every((i) => i.status === 'READY');

            return (
              <div
                key={order.id}
                className={`bg-slate-900 rounded-3xl border shadow-2xl overflow-hidden flex flex-col justify-between transition-all ${
                  isUrgent
                    ? 'border-rose-500 shadow-rose-500/10'
                    : isWarning
                    ? 'border-amber-500/60 shadow-amber-500/10'
                    : 'border-slate-800'
                }`}
              >
                {/* Ticket Header */}
                <div
                  className={`p-4 border-b flex items-center justify-between ${
                    isUrgent
                      ? 'bg-rose-950/50 border-rose-900/60'
                      : isWarning
                      ? 'bg-amber-950/40 border-amber-900/60'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-slate-100">{order.tableName}</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {formatOrderNumber(order)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <User className="w-3 h-3 text-amber-400" />
                      <span>{order.waiterName.split(' ')[0]}</span>
                      <span>•</span>
                      <span>{order.items.length} Kalem</span>
                    </div>
                  </div>

                  {/* Elapsed Timer Counter */}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border ${
                      isUrgent
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{getElapsedFormatted(order.createdAt)}</span>
                  </div>
                </div>

                {/* Ticket Note if exists */}
                {order.generalNote && (
                  <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                    <span>📌 Not:</span>
                    <span>{order.generalNote}</span>
                  </div>
                )}

                {/* Items List */}
                <div className="p-4 flex-1 space-y-2.5 overflow-y-auto max-h-80">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        handleMarkItemStatus(
                          item,
                          item.status === 'READY' ? 'PREPARING' : item.status === 'NEW' ? 'PREPARING' : 'READY'
                        )
                      }
                      className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-2 ${
                        item.status === 'READY'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                          : item.status === 'PREPARING'
                          ? 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                          : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border ${
                            item.status === 'READY'
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : item.status === 'PREPARING'
                              ? 'bg-amber-500 border-amber-400 text-slate-950'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {item.status === 'READY' ? <Check className="w-4 h-4 stroke-[3]" /> : item.quantity}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-100">{item.productName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {item.station}
                            </span>
                          </div>

                          {/* Customizations / Modifiers */}
                          <div className="mt-1 space-y-0.5 text-xs">
                            {item.customization?.extras && item.customization.extras.length > 0 && (
                              <p className="text-emerald-400 font-medium">
                                + {item.customization.extras.map((e) => e.name).join(', ')}
                              </p>
                            )}
                            {item.customization?.removedIngredients && item.customization.removedIngredients.length > 0 && (
                              <p className="text-rose-400 font-medium">
                                - {item.customization.removedIngredients.join(', ')}
                              </p>
                            )}
                            {item.customization?.specialNote && (
                              <p className="text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded-md mt-0.5">
                                👨‍🍳 "{item.customization.specialNote}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span className="text-[10px] font-bold shrink-0 mt-0.5">
                        {item.status === 'READY' ? (
                          <span className="text-emerald-400">✓ HAZIR</span>
                        ) : item.status === 'PREPARING' || item.status === 'ACCEPTED' ? (
                          <span className="text-amber-400">HAZIRLANIYOR</span>
                        ) : item.status === 'SERVED' ? (
                          <span className="text-blue-400">SERVİS EDİLDİ</span>
                        ) : (
                          <span className="text-rose-400">YENİ</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Ticket Bottom Actions */}
                <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleMarkAllReady(order)}
                    className={`flex-1 py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-[0.98] ${
                      allReady
                        ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20 hover:bg-emerald-400'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>{allReady ? 'SERVİSE ÇIKAR (HAZIR)' : 'TÜMÜNÜ HAZIRLA'}</span>
                  </button>

                  <button
                    onClick={() => handlePrintKitchenTicket(order)}
                    title="Mutfak Fişi Yazdır"
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
