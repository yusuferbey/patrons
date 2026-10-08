import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { PaymentRecord, RestaurantTable } from '../types';
import { formatOrderNumber } from '../utils/formatters';
import {
  CreditCard,
  Printer,
  Search,
  Receipt,
  Banknote,
  Smartphone,
  Split,
  Calendar,
  Filter,
  X,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { ThermalReceiptModal } from './ThermalReceiptModal';

export const PaymentsListView: React.FC<{ onOpenCheckout?: (table: RestaurantTable) => void }> = () => {
  const { payments } = usePOS();
  const [search, setSearch] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [dateFilterPreset, setDateFilterPreset] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<PaymentRecord | null>(null);

  // Filter payments
  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const created = p.createdAt || p.timestamp || '';
      const pTime = created ? new Date(created) : new Date();
      const now = new Date();

      // Date filtering
      if (dateFilterPreset === 'TODAY') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (pTime < todayStart) return false;
      } else if (dateFilterPreset === 'YESTERDAY') {
        const yestStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (pTime < yestStart || pTime >= todayStart) return false;
      } else if (dateFilterPreset === 'LAST_7_DAYS') {
        const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        if (pTime < sevenDaysAgo) return false;
      } else if (dateFilterPreset === 'CUSTOM') {
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (pTime < s) return false;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (pTime > e) return false;
        }
      }

      // Method filtering
      const method = p.paymentMethod || p.method || 'CASH';
      if (methodFilter !== 'ALL' && method !== methodFilter) {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTable = p.tableName.toLowerCase().includes(q);
        const matchWaiter = (p.waiterName || '').toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        if (!matchTable && !matchWaiter && !matchId) return false;
      }

      return true;
    });
  }, [payments, dateFilterPreset, startDate, endDate, methodFilter, search]);

  // Aggregate stats
  const totalAmount = useMemo(() => {
    return filtered.reduce((sum, p) => sum + (p.totalAmount ?? p.finalAmount ?? 0), 0);
  }, [filtered]);

  const totalDiscount = useMemo(() => {
    return filtered.reduce((sum, p) => sum + (p.discountAmount || 0), 0);
  }, [filtered]);

  const totalTip = useMemo(() => {
    return filtered.reduce((sum, p) => sum + (p.tipAmount || 0), 0);
  }, [filtered]);

  const clearFilters = () => {
    setSearch('');
    setMethodFilter('ALL');
    setDateFilterPreset('ALL');
    setStartDate('');
    setEndDate('');
  };

  const getMethodBadge = (m?: string) => {
    switch (m) {
      case 'CREDIT_CARD':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <CreditCard className="w-3 h-3" /> Kredi Kartı
          </span>
        );
      case 'CASH':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Banknote className="w-3 h-3" /> Nakit
          </span>
        );
      case 'TRANSFER':
      case 'HAVALE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Smartphone className="w-3 h-3" /> Havale/FAST
          </span>
        );
      case 'SPLIT':
      case 'PARTIAL':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <Split className="w-3 h-3" /> Parçalı
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">{m || 'POS'}</span>;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <span>Ödeme & Hesap Geçmişi</span>
          </h1>
          <p className="text-xs text-slate-400">Tahsil edilen adisyonlar, tarih filtresi ve fiş kayıtları</p>
        </div>

        {/* Quick summary stats pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-medium">Toplam Tahsilat:</span>
            <span className="text-sm font-black text-emerald-400 font-mono">₺{totalAmount.toLocaleString('tr-TR')}</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-medium">İşlem Sayısı:</span>
            <span className="text-sm font-bold text-amber-400 font-mono">{filtered.length} Fiş</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Tarih & Ödeme Filtreleri</span>
          </h3>
          {(search || methodFilter !== 'ALL' || dateFilterPreset !== 'ALL' || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
            >
              <X className="w-3.5 h-3.5" />
              <span>Filtreleri Temizle</span>
            </button>
          )}
        </div>

        {/* Date presets */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase block">Tarih Aralığı Seçimi:</label>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'Tüm Zamanlar' },
              { id: 'TODAY', label: 'Bugün' },
              { id: 'YESTERDAY', label: 'Dün' },
              { id: 'LAST_7_DAYS', label: 'Son 7 Gün' },
              { id: 'CUSTOM', label: 'Özel Tarih Aralığı' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDateFilterPreset(preset.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  dateFilterPreset === preset.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {dateFilterPreset === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-3 pt-2 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Başlangıç:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Bitiş:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Method Filter & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Ödeme Türü:</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Tüm Yöntemler</option>
              <option value="CASH">Nakit</option>
              <option value="CREDIT_CARD">Kredi Kartı</option>
              <option value="TRANSFER">Havale / FAST</option>
              <option value="SPLIT">Parçalı Ödeme</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Arama:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Masa adı, garson veya fiş no..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">Fiş No</th>
                <th className="p-4">Masa</th>
                <th className="p-4">Garson</th>
                <th className="p-4">Ödeme Yöntemi</th>
                <th className="p-4">Tarih & Saat</th>
                <th className="p-4">İndirim / Bahşiş</th>
                <th className="p-4 text-right">Tahsil Edilen Tutar</th>
                <th className="p-4 text-center">Fiş</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Seçili filtrelere uygun ödeme kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const total = p.totalAmount ?? p.finalAmount ?? 0;
                  const method = p.paymentMethod || p.method || 'CASH';
                  const created = p.createdAt || p.timestamp || new Date().toISOString();

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-amber-400">
                        <div>{p.paymentNumber ? `#${p.paymentNumber}` : formatOrderNumber(p.id)}</div>
                        {p.orderNumber && (
                          <div className="text-[10px] text-slate-400 font-medium">Sipariş: {formatOrderNumber(p.orderNumber)}</div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-100">{p.tableName}</td>
                      <td className="p-4 text-slate-400">{p.waiterName}</td>
                      <td className="p-4">{getMethodBadge(method)}</td>
                      <td className="p-4 font-mono text-slate-400">
                        {new Date(created).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(created).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="p-4 text-xs">
                        {p.discountAmount > 0 && <span className="text-rose-400 block">-₺{p.discountAmount} İndirim</span>}
                        {p.tipAmount > 0 && <span className="text-emerald-400 block">+₺{p.tipAmount} Bahşiş</span>}
                        {p.discountAmount === 0 && p.tipAmount === 0 && <span className="text-slate-500">-</span>}
                      </td>
                      <td className="p-4 text-right font-mono font-black text-slate-100 text-sm">
                        ₺{total.toLocaleString('tr-TR')}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedPaymentForReceipt(p)}
                          title="Fişi Görüntüle & Yazdır"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPaymentForReceipt && (
        <ThermalReceiptModal
          payment={selectedPaymentForReceipt}
          onClose={() => setSelectedPaymentForReceipt(null)}
        />
      )}
    </div>
  );
};
