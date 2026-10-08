import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePOS } from '../context/POSContext';
import { Order, OrderItem, RestaurantTable, PaymentRecord } from '../types';
import { formatOrderNumber, formatPaymentMethodTR } from '../utils/formatters';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import {
  UtensilsCrossed,
  Clock,
  User,
  CreditCard,
  Calendar,
  RotateCcw,
  Search,
  ChevronDown,
  X,
  Receipt,
  Eye,
  Check,
  Filter,
  DollarSign,
  LayoutGrid,
  List,
  Printer,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

interface OrdersListViewProps {
  onOpenTableDetail: (table: RestaurantTable) => void;
  onOpenOrderCreator: (table: RestaurantTable) => void;
  onOpenCheckout: (table: RestaurantTable) => void;
}

type OrderStatusFilter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
type PaymentFilter = 'ALL' | 'CASH' | 'CREDIT_CARD' | 'SPLIT' | 'HAVALE' | 'UNPAID';
type DateFilterPreset = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL' | 'CUSTOM';

export const OrdersListView: React.FC<OrdersListViewProps> = ({
  onOpenTableDetail,
  onOpenOrderCreator,
  onOpenCheckout,
}) => {
  const { orders, tables, payments, users, refreshAllData, addToast } = usePOS();

  // Filter States
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [dateFilterPreset, setDateFilterPreset] = useState<DateFilterPreset>('TODAY');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Dropdown Popover Open States
  const [openDropdown, setOpenDropdown] = useState<'status' | 'payment' | 'staff' | 'date' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<PaymentRecord | null>(null);

  // Live timer tick every 10 seconds for real-time elapsed seating duration
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format Elapsed Time
  const formatElapsedTime = (openedAtStr?: string, createdAtStr?: string) => {
    const startTimeStr = openedAtStr || createdAtStr;
    if (!startTimeStr) return '0 dk';
    const startMs = new Date(startTimeStr).getTime();
    const diffMins = Math.max(0, Math.floor((currentTime - startMs) / 60000));
    if (diffMins < 60) {
      return `${diffMins} dk`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} sa ${mins} dk`;
  };

  // Extract unique staff list
  const staffList = useMemo(() => {
    const namesSet = new Set<string>();
    users.forEach((u) => {
      if (u.name) namesSet.add(u.name.trim());
    });
    orders.forEach((o) => {
      if (o.waiterName) namesSet.add(o.waiterName.trim());
    });
    return Array.from(namesSet).sort();
  }, [users, orders]);

  // Handle Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAllData();
      addToast('success', 'Yenilendi', 'Sipariş ve adisyon verileri güncellendi.');
    } catch {
      addToast('error', 'Hata', 'Veriler yenilenirken bir sorun oluştu.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setPaymentFilter('ALL');
    setStaffFilter('ALL');
    setDateFilterPreset('TODAY');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setOpenDropdown(null);
  };

  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    paymentFilter !== 'ALL' ||
    staffFilter !== 'ALL' ||
    dateFilterPreset !== 'TODAY' ||
    search.trim() !== '';

  // Filter Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }

      // Associated payment (if exists)
      const payment = payments.find(
        (p) =>
          p.orderId === order.id ||
          (order.orderNumber && String(p.orderNumber) === String(order.orderNumber)) ||
          p.tableId === order.tableId
      );

      // 2. Payment Method / Status Filter
      if (paymentFilter !== 'ALL') {
        if (paymentFilter === 'UNPAID') {
          if (order.status !== 'ACTIVE') return false;
        } else {
          // Check payment method
          if (!payment) return false;
          const method = (payment.paymentMethod || payment.method || '').toUpperCase();
          if (paymentFilter === 'CASH' && method !== 'CASH') return false;
          if (paymentFilter === 'CREDIT_CARD' && method !== 'CREDIT_CARD') return false;
          if (paymentFilter === 'SPLIT' && method !== 'SPLIT' && method !== 'PARTIAL') return false;
          if (paymentFilter === 'HAVALE' && method !== 'HAVALE' && method !== 'TRANSFER') return false;
        }
      }

      // 3. Staff Filter
      if (staffFilter !== 'ALL') {
        const waiter = (order.waiterName || '').trim();
        if (waiter !== staffFilter) return false;
      }

      // 4. Date Filter
      const orderDateStr = order.createdAt || '';
      if (orderDateStr) {
        const orderTime = new Date(orderDateStr);
        const now = new Date();

        if (dateFilterPreset === 'TODAY') {
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (orderTime < todayStart) return false;
        } else if (dateFilterPreset === 'YESTERDAY') {
          const yestStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (orderTime < yestStart || orderTime >= todayStart) return false;
        } else if (dateFilterPreset === 'THIS_WEEK') {
          // Beginning of the week (Monday)
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const weekStart = new Date(now.setDate(diff));
          weekStart.setHours(0, 0, 0, 0);
          if (orderTime < weekStart) return false;
        } else if (dateFilterPreset === 'THIS_MONTH') {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          if (orderTime < monthStart) return false;
        } else if (dateFilterPreset === 'CUSTOM') {
          if (startDate) {
            const s = new Date(startDate);
            s.setHours(0, 0, 0, 0);
            if (orderTime < s) return false;
          }
          if (endDate) {
            const e = new Date(endDate);
            e.setHours(23, 59, 59, 999);
            if (orderTime > e) return false;
          }
        }
      }

      // 5. Search Term Filter (order no, table name, staff, customer, product items)
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const orderNumStr = String(order.orderNumber || formatOrderNumber(order)).toLowerCase();
        const tableName = (order.tableName || '').toLowerCase();
        const waiterName = (order.waiterName || '').toLowerCase();
        const notes = (order.notes || order.generalNote || '').toLowerCase();
        const hasItemMatch = order.items.some((i) => (i.productName || '').toLowerCase().includes(term));

        if (
          !orderNumStr.includes(term) &&
          !tableName.includes(term) &&
          !waiterName.includes(term) &&
          !notes.includes(term) &&
          !hasItemMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [orders, payments, statusFilter, paymentFilter, staffFilter, dateFilterPreset, startDate, endDate, search]);

  // Dynamic Date Label for card header
  const dateLabel = useMemo(() => {
    switch (dateFilterPreset) {
      case 'TODAY':
        return 'Bugün';
      case 'YESTERDAY':
        return 'Dün';
      case 'THIS_WEEK':
        return 'Bu Hafta';
      case 'THIS_MONTH':
        return 'Bu Ay';
      case 'ALL':
        return 'Tüm Zamanlar';
      case 'CUSTOM':
        return startDate && endDate ? `${startDate} - ${endDate}` : 'Özel Tarih';
      default:
        return 'Bugün';
    }
  }, [dateFilterPreset, startDate, endDate]);

  // Labels for dropdown buttons
  const statusButtonLabel = useMemo(() => {
    switch (statusFilter) {
      case 'ALL':
        return 'Tüm Siparişler';
      case 'ACTIVE':
        return 'Açık / Aktif';
      case 'COMPLETED':
        return 'Tamamlandı';
      case 'CANCELLED':
        return 'İptal Edildi';
      default:
        return 'Tüm Siparişler';
    }
  }, [statusFilter]);

  const paymentButtonLabel = useMemo(() => {
    switch (paymentFilter) {
      case 'ALL':
        return 'Ödeme: Tümü';
      case 'CASH':
        return 'Ödeme: Nakit';
      case 'CREDIT_CARD':
        return 'Ödeme: Kredi Kartı';
      case 'SPLIT':
        return 'Ödeme: Parçalı';
      case 'HAVALE':
        return 'Ödeme: Havale';
      case 'UNPAID':
        return 'Ödeme: Açık / Bekliyor';
      default:
        return 'Ödeme: Tümü';
    }
  }, [paymentFilter]);

  const staffButtonLabel = useMemo(() => {
    return staffFilter === 'ALL' ? 'Personel: Tümü' : `Personel: ${staffFilter.split(' ')[0]}`;
  }, [staffFilter]);

  const dateButtonLabel = useMemo(() => {
    return dateLabel;
  }, [dateLabel]);

  // Open thermal receipt modal for any order
  const handleOpenReceipt = (order: Order) => {
    const existingPayment = payments.find(
      (p) =>
        p.orderId === order.id ||
        (order.orderNumber && String(p.orderNumber) === String(order.orderNumber)) ||
        p.tableId === order.tableId
    );

    if (existingPayment) {
      setSelectedPaymentForReceipt(existingPayment);
    } else {
      // Synthesize a printable payment receipt record from order
      const activeItems = order.items.filter((i) => i.status !== 'CANCELLED');
      const subtotal = activeItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
      const synthPayment: PaymentRecord = {
        id: `rec-${order.id}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableId: order.tableId,
        tableName: order.tableName,
        waiterName: order.waiterName,
        items: activeItems.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          customization: i.customization,
        })),
        subtotal: subtotal,
        discountAmount: 0,
        tipAmount: 0,
        totalAmount: subtotal,
        finalAmount: subtotal,
        paymentMethod: 'CASH',
        createdAt: order.completedAt || order.createdAt,
      };
      setSelectedPaymentForReceipt(synthPayment);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section with Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left Title & Subtitle */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            <span>Siparişler</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Sipariş geçmişinizi görüntüleyin ve filtreleyin
          </p>
        </div>

        {/* Right Filter Pills & Refresh Button */}
        <div ref={dropdownRef} className="flex items-center flex-wrap gap-2 text-xs font-semibold">
          {/* 1. Sipariş Durumu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 transition-all shrink-0 ${
                statusFilter !== 'ALL'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>{statusButtonLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  openDropdown === 'status' ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>

            {openDropdown === 'status' && (
              <div className="absolute left-0 xl:left-auto xl:right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                    statusFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <span>Tüm Siparişler</span>
                  {statusFilter === 'ALL' && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ACTIVE');
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Açık / Aktif</span>
                  </div>
                  {statusFilter === 'ACTIVE' && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('COMPLETED');
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                    statusFilter === 'COMPLETED'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Tamamlandı / Ödendi</span>
                  </div>
                  {statusFilter === 'COMPLETED' && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('CANCELLED');
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                    statusFilter === 'CANCELLED'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>İptal Edildi</span>
                  </div>
                  {statusFilter === 'CANCELLED' && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
              </div>
            )}
          </div>

          {/* 2. Ödeme Yöntemi Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'payment' ? null : 'payment')}
              className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 transition-all shrink-0 ${
                paymentFilter !== 'ALL'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>{paymentButtonLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  openDropdown === 'payment' ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>

            {openDropdown === 'payment' && (
              <div className="absolute left-0 xl:left-auto xl:right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                {[
                  { key: 'ALL', label: 'Tümü' },
                  { key: 'CASH', label: 'Nakit' },
                  { key: 'CREDIT_CARD', label: 'Kredi Kartı' },
                  { key: 'SPLIT', label: 'Parçalı Ödeme' },
                  { key: 'HAVALE', label: 'Havale / EFT' },
                  { key: 'UNPAID', label: 'Ödenmedi / Bekliyor' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setPaymentFilter(item.key as PaymentFilter);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                      paymentFilter === item.key
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    {paymentFilter === item.key && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Personel Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'staff' ? null : 'staff')}
              className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 transition-all shrink-0 ${
                staffFilter !== 'ALL'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>{staffButtonLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  openDropdown === 'staff' ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>

            {openDropdown === 'staff' && (
              <div className="absolute left-0 xl:left-auto xl:right-0 mt-2 w-56 max-h-64 overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setStaffFilter('ALL');
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                    staffFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <span>Tümü</span>
                  {staffFilter === 'ALL' && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
                {staffList.map((staffName) => (
                  <button
                    key={staffName}
                    type="button"
                    onClick={() => {
                      setStaffFilter(staffName);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors truncate ${
                      staffFilter === staffName
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <span className="truncate">{staffName}</span>
                    {staffFilter === staffName && <Check className="w-4 h-4 stroke-[3] shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Tarih Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
              className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 transition-all shrink-0 ${
                dateFilterPreset !== 'TODAY'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{dateButtonLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  openDropdown === 'date' ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>

            {openDropdown === 'date' && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                {[
                  { key: 'TODAY', label: 'Bugün' },
                  { key: 'YESTERDAY', label: 'Dün' },
                  { key: 'THIS_WEEK', label: 'Bu Hafta' },
                  { key: 'THIS_MONTH', label: 'Bu Ay' },
                  { key: 'ALL', label: 'Tüm Zamanlar' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setDateFilterPreset(item.key as DateFilterPreset);
                      setStartDate('');
                      setEndDate('');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                      dateFilterPreset === item.key
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    {dateFilterPreset === item.key && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                ))}

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider px-2 block">
                    Özel Tarih Aralığı
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 px-1">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-0.5">Başlangıç</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setDateFilterPreset('CUSTOM');
                        }}
                        className="w-full px-2 py-1 text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-0.5">Bitiş</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setDateFilterPreset('CUSTOM');
                        }}
                        className="w-full px-2 py-1 text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  {startDate && endDate && (
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(null)}
                      className="w-full mt-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors text-center"
                    >
                      Uygula
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 5. Yenile Butonu (Refresh) */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Siparişleri Yenile"
            className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Container Card (matching the screenshot) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
        {/* Header of the Inner Card: Date - Siparişler & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-tight">
              {dateLabel} - Siparişler
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {filteredOrders.length} sipariş bulundu
            </p>
          </div>

          {/* Search Bar & View Mode Toggle */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Sipariş no, masa, müşteri, personel..."
                className="w-full bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 focus:border-amber-500 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Switcher (Grid / Table) */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/80 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Kart Görünümü"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Liste Görünümü"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {filteredOrders.length === 0 ? (
          /* Empty State - Matched Exactly to Screenshot */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center my-4">
            <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
              <Clock className="w-7 h-7 text-slate-300" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold text-slate-100">Henüz Sipariş Yok</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
              Seçilen tarih ve filtrelerde sipariş bulunamadı. Farklı bir tarih deneyin.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold border border-slate-700 transition-colors"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const table = tables.find((t) => t.id === order.tableId);
              const activeItems = order.items.filter((i) => i.status !== 'CANCELLED');
              const totalAmount = activeItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
              const seatingDuration = formatElapsedTime(table?.openedAt, order.createdAt);

              // Associated payment if completed
              const payment = payments.find(
                (p) =>
                  p.orderId === order.id ||
                  (order.orderNumber && String(p.orderNumber) === String(order.orderNumber)) ||
                  p.tableId === order.tableId
              );

              const formattedTime = order.createdAt
                ? new Date(order.createdAt).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              const formattedDate = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                  })
                : '';

              return (
                <div
                  key={order.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all group"
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-slate-100">
                            {order.tableName}
                          </h3>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-800">
                            {formatOrderNumber(order)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-amber-400" />
                            <span>{order.waiterName || 'Garson'}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>
                              {formattedDate}, {formattedTime}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shrink-0 ${
                          order.status === 'ACTIVE'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : order.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            order.status === 'ACTIVE'
                              ? 'bg-amber-400 animate-pulse'
                              : order.status === 'COMPLETED'
                              ? 'bg-emerald-400'
                              : 'bg-rose-400'
                          }`}
                        />
                        <span>
                          {order.status === 'ACTIVE'
                            ? 'Açık Masa'
                            : order.status === 'COMPLETED'
                            ? 'Tamamlandı'
                            : 'İptal Edildi'}
                        </span>
                      </span>
                    </div>

                    {/* Payment Info Badge if completed */}
                    {order.status === 'COMPLETED' && payment && (
                      <div className="flex items-center justify-between text-[11px] bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ödeme Yöntemi:</span>
                        </span>
                        <span className="font-bold text-emerald-300">
                          {formatPaymentMethodTR(payment.paymentMethod || payment.method)}
                        </span>
                      </div>
                    )}

                    {/* Items List Preview */}
                    <div className="py-1 space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {order.items.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center text-xs py-0.5"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono font-bold text-amber-400 shrink-0">
                              {item.quantity}x
                            </span>
                            <span className="text-slate-200 truncate">{item.productName}</span>
                          </div>
                          <span className="text-slate-400 font-mono shrink-0 ml-2">
                            ₺{(item.unitPrice * item.quantity).toLocaleString('tr-TR')}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <p className="text-[10px] text-slate-500 italic pt-0.5">
                          +{order.items.length - 4} diğer ürün...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Total Amount & Action Buttons */}
                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-end justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Toplam Tutar</span>
                      <span className="text-xl font-black text-amber-400 font-mono-numbers">
                        ₺{totalAmount.toLocaleString('tr-TR')}
                      </span>

                      {/* Seating Duration if active */}
                      {order.status === 'ACTIVE' && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-medium font-mono mt-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 w-fit">
                          <Clock className="w-3 h-3 text-amber-400 animate-spin-slow" />
                          <span>Oturma: {seatingDuration}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Print Receipt / Adisyon Fişi */}
                      <button
                        type="button"
                        onClick={() => handleOpenReceipt(order)}
                        title="Adisyon / Bilgi Fişi Yazdır"
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Detail Button */}
                      {table && (
                        <button
                          type="button"
                          onClick={() => onOpenTableDetail(table)}
                          className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-800 transition-colors"
                        >
                          Detay
                        </button>
                      )}

                      {/* Checkout Button if ACTIVE */}
                      {order.status === 'ACTIVE' && table && (
                        <button
                          type="button"
                          onClick={() => onOpenCheckout(table)}
                          className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
                        >
                          Hesap Al
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table List View */
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4 font-bold">Sipariş No</th>
                  <th className="py-3 px-4 font-bold">Masa</th>
                  <th className="py-3 px-4 font-bold">Tarih & Saat</th>
                  <th className="py-3 px-4 font-bold">Personel</th>
                  <th className="py-3 px-4 font-bold">Ürünler</th>
                  <th className="py-3 px-4 font-bold">Durum</th>
                  <th className="py-3 px-4 font-bold">Ödeme</th>
                  <th className="py-3 px-4 font-bold text-right">Tutar</th>
                  <th className="py-3 px-4 font-bold text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((order) => {
                  const table = tables.find((t) => t.id === order.tableId);
                  const activeItems = order.items.filter((i) => i.status !== 'CANCELLED');
                  const totalAmount = activeItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);

                  const payment = payments.find(
                    (p) =>
                      p.orderId === order.id ||
                      (order.orderNumber && String(p.orderNumber) === String(order.orderNumber)) ||
                      p.tableId === order.tableId
                  );

                  const formattedDateTime = order.createdAt
                    ? new Date(order.createdAt).toLocaleString('tr-TR', {
                        day: 'numeric',
                        month: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-';

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-950/50 transition-colors text-slate-300"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {formatOrderNumber(order)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-100">{order.tableName}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {formattedDateTime}
                      </td>
                      <td className="py-3 px-4">{order.waiterName || 'Garson'}</td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                            order.status === 'ACTIVE'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : order.status === 'COMPLETED'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {order.status === 'ACTIVE'
                            ? 'Açık'
                            : order.status === 'COMPLETED'
                            ? 'Tamamlandı'
                            : 'İptal'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {order.status === 'COMPLETED' && payment ? (
                          <span className="text-[11px] font-medium text-emerald-400">
                            {formatPaymentMethodTR(payment.paymentMethod || payment.method)}
                          </span>
                        ) : order.status === 'ACTIVE' ? (
                          <span className="text-[11px] text-amber-400/80">Bekliyor</span>
                        ) : (
                          <span className="text-[11px] text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-right text-slate-100">
                        ₺{totalAmount.toLocaleString('tr-TR')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(order)}
                            title="Fiş Yazdır"
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {table && (
                            <button
                              type="button"
                              onClick={() => onOpenTableDetail(table)}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-[11px] border border-slate-800"
                            >
                              Detay
                            </button>
                          )}
                          {order.status === 'ACTIVE' && table && (
                            <button
                              type="button"
                              onClick={() => onOpenCheckout(table)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px]"
                            >
                              Hesap
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Thermal Receipt Print Modal */}
      {selectedPaymentForReceipt && (
        <ThermalReceiptModal
          payment={selectedPaymentForReceipt}
          onClose={() => setSelectedPaymentForReceipt(null)}
        />
      )}
    </div>
  );
};
