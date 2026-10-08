import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { PaymentRecord, RestaurantTable } from '../types';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Banknote,
  Smartphone,
  Split,
  Search,
  Filter,
  DollarSign,
  PieChart as PieIcon,
  Award,
  Coffee,
  XCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Receipt,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  generateA4ReportHtml,
  printHtmlDirectly,
  openReceiptInNewTab,
  downloadReceiptHtml,
} from '../utils/printReceipt';

import { ThermalReceiptModal } from './ThermalReceiptModal';
import { formatOrderNumber, formatRoleTR } from '../utils/formatters';

type ReportTab = 'overview' | 'products' | 'staff' | 'cancellations' | 'transactions';
type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all';

export const ReportsView: React.FC = () => {
  const { payments, orders, products, categories, users, cashRegister } = usePOS();
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<PaymentRecord | null>(null);

  // Product tab specific filters
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('ALL');
  const [productStationFilter, setProductStationFilter] = useState<string>('ALL');
  const [productSearch, setProductSearch] = useState<string>('');
  const [expandedProductDetail, setExpandedProductDetail] = useState<string | null>(null);

  // Filter payments based on date range
  const filteredPayments = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return payments.filter((p) => {
      const dateStr = p.createdAt || p.timestamp || '';
      const pTime = dateStr ? new Date(dateStr).getTime() : Date.now();

      if (dateFilter === 'today') return pTime >= startOfToday;
      if (dateFilter === 'yesterday') return pTime >= startOfYesterday && pTime < startOfToday;
      if (dateFilter === 'week') return pTime >= startOfWeek;
      if (dateFilter === 'month') return pTime >= startOfMonth;
      if (dateFilter === 'custom') {
        if (customStartDate) {
          const s = new Date(customStartDate);
          s.setHours(0, 0, 0, 0);
          if (pTime < s.getTime()) return false;
        }
        if (customEndDate) {
          const e = new Date(customEndDate);
          e.setHours(23, 59, 59, 999);
          if (pTime > e.getTime()) return false;
        }
        return true;
      }
      return true; // 'all'
    });
  }, [payments, dateFilter, customStartDate, customEndDate]);

  // Aggregate Metrics
  const totalRevenue = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + (p.totalAmount ?? p.finalAmount ?? p.subtotal ?? 0), 0);
  }, [filteredPayments]);

  const totalSubtotal = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + (p.subtotal ?? p.totalAmount ?? 0), 0);
  }, [filteredPayments]);

  const totalDiscounts = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + (p.discountAmount || 0), 0);
  }, [filteredPayments]);

  const totalTips = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + (p.tipAmount || 0), 0);
  }, [filteredPayments]);

  const totalTicketCount = filteredPayments.length;
  const averageTicket = totalTicketCount > 0 ? Math.round(totalRevenue / totalTicketCount) : 0;

  // Breakdown by payment methods
  const paymentMethodStats = useMemo(() => {
    let cash = 0;
    let creditCard = 0;
    let transfer = 0;

    filteredPayments.forEach((p) => {
      const method = p.paymentMethod || p.method || 'CASH';
      const amount = p.totalAmount ?? p.finalAmount ?? p.subtotal ?? 0;

      if (method === 'CASH') {
        cash += amount;
      } else if (method === 'CREDIT_CARD') {
        creditCard += amount;
      } else if (method === 'TRANSFER' || method === 'HAVALE') {
        transfer += amount;
      } else if (method === 'PARTIAL' || method === 'SPLIT') {
        const split = p.splitBreakdown || p.partialBreakdown;
        if (split) {
          if (Array.isArray(split)) {
            split.forEach((s: any) => {
              if (s.method === 'CASH') cash += Number(s.amount) || 0;
              if (s.method === 'CREDIT_CARD') creditCard += Number(s.amount) || 0;
              if (s.method === 'HAVALE' || s.method === 'TRANSFER') transfer += Number(s.amount) || 0;
            });
          } else {
            cash += Number(split.cash) || 0;
            creditCard += Number(split.creditCard) || 0;
          }
        } else {
          creditCard += amount;
        }
      } else {
        creditCard += amount;
      }
    });

    const total = cash + creditCard + transfer || 1;
    return {
      cash,
      creditCard,
      transfer,
      cashPercent: Math.round((cash / total) * 100),
      cardPercent: Math.round((creditCard / total) * 100),
      transferPercent: Math.round((transfer / total) * 100),
    };
  }, [filteredPayments]);

  const paymentPieData = useMemo(() => [
    { name: 'Kredi Kartı', value: paymentMethodStats.creditCard || 1, color: '#3b82f6' },
    { name: 'Nakit', value: paymentMethodStats.cash || 1, color: '#10b981' },
    { name: 'Havale/FAST', value: paymentMethodStats.transfer || 0, color: '#f59e0b' },
  ].filter(i => i.value > 0), [paymentMethodStats]);

  // Hourly Revenue chart
  const hourlyRevenueData = useMemo(() => {
    const hoursMap: Record<string, { hour: string; revenue: number; count: number }> = {
      '11:00': { hour: '11:00', revenue: 1400, count: 3 },
      '12:00': { hour: '12:00', revenue: 3800, count: 9 },
      '13:00': { hour: '13:00', revenue: 5600, count: 14 },
      '14:00': { hour: '14:00', revenue: 4200, count: 10 },
      '15:00': { hour: '15:00', revenue: 2900, count: 6 },
      '16:00': { hour: '16:00', revenue: 3300, count: 8 },
      '17:00': { hour: '17:00', revenue: 4800, count: 11 },
      '18:00': { hour: '18:00', revenue: 7600, count: 18 },
      '19:00': { hour: '19:00', revenue: 9400, count: 22 },
      '20:00': { hour: '20:00', revenue: 10800, count: 26 },
      '21:00': { hour: '21:00', revenue: 7900, count: 17 },
      '22:00': { hour: '22:00', revenue: 3900, count: 9 },
    };

    // Add live payments
    filteredPayments.forEach((p) => {
      const dateStr = p.createdAt || p.timestamp;
      if (dateStr) {
        const date = new Date(dateStr);
        const h = `${String(date.getHours()).padStart(2, '0')}:00`;
        const amt = p.totalAmount ?? p.finalAmount ?? 0;
        if (hoursMap[h]) {
          hoursMap[h].revenue += amt;
          hoursMap[h].count += 1;
        }
      }
    });

    return Object.values(hoursMap);
  }, [filteredPayments]);

  // Product Sales Breakdown with daily history
  const productSalesMap = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        name: string;
        category: string;
        price: number;
        quantity: number;
        revenue: number;
        station: string;
        dailyHistory: Record<string, { date: string; count: number; revenue: number }>;
      }
    > = {};

    // From payment itemsSummary
    filteredPayments.forEach((p) => {
      const pDateStr = p.createdAt || p.timestamp;
      const dateKey = pDateStr ? new Date(pDateStr).toISOString().split('T')[0] : 'Bugün';

      if (p.itemsSummary && Array.isArray(p.itemsSummary)) {
        p.itemsSummary.forEach((item) => {
          const matchedProd = products.find((prod) => prod.name.toLowerCase() === item.name.toLowerCase());
          const cat = matchedProd ? categories.find((c) => c.id === matchedProd.categoryId)?.name || 'Genel' : 'Genel';
          const stn = matchedProd ? matchedProd.station : 'MUTFAK';
          const unitPrice = item.price ? Math.round(item.price / (item.quantity || 1)) : (matchedProd?.price || 0);

          if (!map[item.name]) {
            map[item.name] = {
              id: item.name,
              name: item.name,
              category: cat,
              price: unitPrice,
              quantity: 0,
              revenue: 0,
              station: stn,
              dailyHistory: {},
            };
          }
          map[item.name].quantity += item.quantity || 1;
          map[item.name].revenue += item.price || 0;

          if (!map[item.name].dailyHistory[dateKey]) {
            map[item.name].dailyHistory[dateKey] = {
              date: dateKey,
              count: 0,
              revenue: 0,
            };
          }
          map[item.name].dailyHistory[dateKey].count += item.quantity || 1;
          map[item.name].dailyHistory[dateKey].revenue += item.price || 0;
        });
      }
    });

    // Seed mock volume if newly booted
    products.slice(0, 10).forEach((prod, idx) => {
      if (!map[prod.name]) {
        const qty = 18 - idx;
        const rev = qty * prod.price;
        const todayKey = new Date().toISOString().split('T')[0];
        map[prod.name] = {
          id: prod.id,
          name: prod.name,
          category: categories.find((c) => c.id === prod.categoryId)?.name || 'Menü',
          price: prod.price,
          quantity: qty,
          revenue: rev,
          station: prod.station,
          dailyHistory: {
            [todayKey]: { date: todayKey, count: qty, revenue: rev },
          },
        };
      }
    });

    return Object.values(map);
  }, [filteredPayments, products, categories]);

  // Filtered & Sorted Product Sales
  const filteredProductSales = useMemo(() => {
    return productSalesMap
      .filter((p) => {
        if (productCategoryFilter !== 'ALL' && p.category !== productCategoryFilter) return false;
        if (productStationFilter !== 'ALL' && p.station !== productStationFilter) return false;
        if (productSearch.trim()) {
          const q = productSearch.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [productSalesMap, productCategoryFilter, productStationFilter, productSearch]);

  // Category Revenue Data for Chart
  const categoryRevenueData = useMemo(() => {
    const catMap: Record<string, number> = {};
    productSalesMap.forEach((item) => {
      catMap[item.category] = (catMap[item.category] || 0) + item.revenue;
    });

    return Object.entries(catMap).map(([name, revenue]) => ({
      name,
      revenue,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [productSalesMap]);

  // Waiter Staff Stats
  const staffStats = useMemo(() => {
    const waiters = users.filter((u) => u.role === 'WAITER' || u.role === 'ADMIN');
    return waiters.map((w, idx) => {
      const wPayments = filteredPayments.filter((p) => p.waiterName?.toLowerCase().includes(w.name.split(' ')[0].toLowerCase()));
      const liveRev = wPayments.reduce((acc, p) => acc + (p.totalAmount ?? p.finalAmount ?? 0), 0);
      const liveTips = wPayments.reduce((acc, p) => acc + (p.tipAmount || 0), 0);
      const baseRev = w.id === 'usr-1' ? 7800 : w.id === 'usr-2' ? 5400 : 3200;
      const baseTips = w.id === 'usr-1' ? 380 : 240;

      return {
        id: w.id,
        name: w.name,
        avatar: w.avatar,
        role: w.role,
        ticketCount: wPayments.length + (w.id === 'usr-1' ? 18 : 12),
        totalRevenue: liveRev + baseRev,
        totalTips: liveTips + baseTips,
        avgTicket: Math.round((liveRev + baseRev) / (wPayments.length + (w.id === 'usr-1' ? 18 : 12))),
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [users, filteredPayments]);

  // Cancelled items
  const cancelledList = useMemo(() => {
    const activeCancelled = orders
      .flatMap((o) =>
        o.items
          .filter((i) => i.status === 'CANCELLED')
          .map((i) => ({
            id: i.id,
            tableName: o.tableName,
            productName: i.productName,
            quantity: i.quantity,
            price: i.unitPrice * i.quantity,
            reason: i.cancelReason || 'Müşteri talebi',
            cancelledBy: i.cancelledBy || 'Garson',
            timestamp: i.cancelledAt || o.createdAt,
          }))
      );

    const mockCancelled = [
      {
        id: 'cnc-1',
        tableName: 'Masa 2',
        productName: 'Yayık Ayran (300ml)',
        quantity: 1,
        price: 45,
        reason: 'Müşteri siparişi Kola olarak değiştirdi',
        cancelledBy: 'Ahmet Yılmaz',
        timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
      {
        id: 'cnc-2',
        tableName: 'Teras 4',
        productName: 'Çıtır Patates Sepeti',
        quantity: 1,
        price: 130,
        reason: 'Gecikme nedeniyle müşteri iptal etti',
        cancelledBy: 'Can Demir',
        timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      },
    ];

    return [...activeCancelled, ...mockCancelled];
  }, [orders]);

  const totalCancelledLoss = cancelledList.reduce((acc, c) => acc + c.price, 0);

  // Search filtered payments table
  const searchPayments = useMemo(() => {
    if (!searchTerm) return filteredPayments;
    const term = searchTerm.toLowerCase();
    return filteredPayments.filter(
      (p) =>
        p.tableName?.toLowerCase().includes(term) ||
        p.waiterName?.toLowerCase().includes(term) ||
        p.cashierName?.toLowerCase().includes(term) ||
        p.id?.toLowerCase().includes(term)
    );
  }, [filteredPayments, searchTerm]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Fiş No', 'Masa', 'Garson', 'Kasa Sorumlusu', 'Ödeme Yöntemi', 'Tarih Saat', 'Ara Toplam', 'İndirim', 'Bahşiş', 'Tahsil Edilen'];
    const rows = filteredPayments.map((p) => {
      const created = p.createdAt || p.timestamp || new Date().toISOString();
      const method = p.paymentMethod || p.method || 'CASH';
      const tot = p.totalAmount ?? p.finalAmount ?? 0;
      return [
        `#${p.id.slice(-6).toUpperCase()}`,
        `"${p.tableName}"`,
        `"${p.waiterName}"`,
        `"${p.cashierName || 'Kasa'}"`,
        method,
        `"${new Date(created).toLocaleString('tr-TR')}"`,
        (p.subtotal || tot).toFixed(2),
        (p.discountAmount || 0).toFixed(2),
        (p.tipAmount || 0).toFixed(2),
        tot.toFixed(2),
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kasa_Raporu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getA4ReportHtml = () => {
    const periodLabel = dateFilter === 'today' ? 'Bugün' : dateFilter === 'yesterday' ? 'Dün' : dateFilter === 'week' ? 'Bu Hafta' : dateFilter === 'month' ? 'Bu Ay' : 'Tüm Zamanlar';
    return generateA4ReportHtml({
      periodLabel,
      totalRevenue,
      totalTicketCount,
      averageTicket,
      paymentMethodStats,
      totalDiscounts,
      totalTips,
      totalCancelledLoss,
      payments: filteredPayments,
    });
  };

  const handlePrint = () => {
    const html = getA4ReportHtml();
    printHtmlDirectly(html);
  };

  const handleDownloadReport = () => {
    const html = getA4ReportHtml();
    const filename = `mali-rapor-${dateFilter}-${new Date().toISOString().split('T')[0]}.html`;
    downloadReceiptHtml(html, filename);
  };

  const handleOpenReportNewTab = () => {
    const html = getA4ReportHtml();
    openReceiptInNewTab(html);
  };

  const getMethodBadge = (m?: string) => {
    switch (m) {
      case 'CREDIT_CARD':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1"><CreditCard className="w-3 h-3" /> Kredi Kartı</span>;
      case 'CASH':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1"><Banknote className="w-3 h-3" /> Nakit</span>;
      case 'TRANSFER':
      case 'HAVALE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1"><Smartphone className="w-3 h-3" /> Havale/FAST</span>;
      case 'SPLIT':
      case 'PARTIAL':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1"><Split className="w-3 h-3" /> Parçalı</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">{m || 'POS'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/70 p-4 md:p-5 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span>Kasa Raporları & Finansal Analiz</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gelir tabloları, tahsilat yöntemleri, ürün karlılığı ve personel performans analizleri
          </p>
        </div>

        {/* Date Filter & Export Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Date Selector */}
          <div className="flex flex-wrap items-center bg-slate-950 border border-slate-800 rounded-2xl p-1 text-xs">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                dateFilter === 'today' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bugün
            </button>
            <button
              onClick={() => setDateFilter('yesterday')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                dateFilter === 'yesterday' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dün
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                dateFilter === 'week' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bu Hafta
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                dateFilter === 'month' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bu Ay
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                dateFilter === 'custom' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Özel Tarih
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                dateFilter === 'all' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tümü
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
            title="Excel / CSV İndir"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
            title="Mali Raporu HTML / PDF formatında indir"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Raporu İndir</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır (A4 Rapor)</span>
            </button>
            <button
              onClick={handleOpenReportNewTab}
              title="Yeni Sekmede Aç & Görüntüle"
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker bar if selected */}
      {dateFilter === 'custom' && (
        <div className="flex flex-wrap items-center gap-4 bg-slate-900 border border-amber-500/30 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">Tarih Aralığı Seçin:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Başlangıç:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Bitiş:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
          {(customStartDate || customEndDate) && (
            <button
              onClick={() => {
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium ml-auto"
            >
              Temizle
            </button>
          )}
        </div>
      )}

      {/* Main KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Net Satış */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl relative overflow-hidden">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Toplam Net Satış</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono-numbers mt-2">
            ₺{totalRevenue.toLocaleString('tr-TR')}
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{totalTicketCount} Adisyon Tahsil Edildi</span>
          </div>
        </div>

        {/* Kredi Kartı Cirosu */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kredi Kartı (POS)</span>
          <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono-numbers mt-2">
            ₺{paymentMethodStats.creditCard.toLocaleString('tr-TR')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-semibold">
            Toplam cironun %{paymentMethodStats.cardPercent}'i
          </div>
        </div>

        {/* Nakit Cirosu */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nakit Tahsilat</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono-numbers mt-2">
            ₺{paymentMethodStats.cash.toLocaleString('tr-TR')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-semibold">
            Toplam cironun %{paymentMethodStats.cashPercent}'i
          </div>
        </div>

        {/* Ortalama Masa Sepeti */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ortalama Hesap (AOV)</span>
          <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono-numbers mt-2">
            ₺{averageTicket.toLocaleString('tr-TR')}
          </div>
          <div className="text-[11px] text-purple-300 mt-1 font-semibold">
            Masa başına düşen hasılat
          </div>
        </div>
      </div>

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-400">Uygulanan İndirimler:</span>
          <span className="font-bold text-rose-400 font-mono-numbers">₺{totalDiscounts.toLocaleString('tr-TR')}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-400">Garson Bahşiş Havuzu:</span>
          <span className="font-bold text-purple-400 font-mono-numbers">₺{totalTips.toLocaleString('tr-TR')}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-400">Havale / FAST Satış:</span>
          <span className="font-bold text-amber-400 font-mono-numbers">₺{paymentMethodStats.transfer.toLocaleString('tr-TR')}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-400">İptal / Zayi Tutarı:</span>
          <span className="font-bold text-red-500 font-mono-numbers">₺{totalCancelledLoss.toLocaleString('tr-TR')}</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Genel Gelir & Grafikler</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>Ürün & Menü Karlılığı</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'staff'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Personel & Garson Raporu</span>
        </button>

        <button
          onClick={() => setActiveTab('cancellations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'cancellations'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>İptal & Zayi Dökümü ({cancelledList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Tahsilat & Fiş Listesi ({filteredPayments.length})</span>
        </button>
      </div>

      {/* Tab 1: OVERVIEW CHARTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hourly Revenue Chart */}
            <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Saatlik Satış & Ciro Trendi</h3>
                  <p className="text-xs text-slate-400">Günün saatlerine göre satış dağılımı</p>
                </div>
                <span className="text-xs font-bold text-amber-400 font-mono">₺ Ciro / Saat</span>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyRevenueData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reportRevGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₺${val / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#fbbf24' }}
                      formatter={(val: any) => [`₺${Number(val).toLocaleString('tr-TR')}`, 'Ciro']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#reportRevGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Method Pie Chart */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="font-bold text-slate-100 text-sm">Ödeme Kanalları Dağılımı</h3>
                <p className="text-xs text-slate-400">Nakit vs Kredi Kartı vs Havale</p>
              </div>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {paymentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      formatter={(val: any) => [`₺${Number(val).toLocaleString('tr-TR')}`, 'Tutar']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Kredi Kartı / POS:</span>
                  </div>
                  <strong className="text-slate-100">₺{paymentMethodStats.creditCard.toLocaleString('tr-TR')} (%{paymentMethodStats.cardPercent})</strong>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Nakit:</span>
                  </div>
                  <strong className="text-slate-100">₺{paymentMethodStats.cash.toLocaleString('tr-TR')} (%{paymentMethodStats.cashPercent})</strong>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Havale / FAST:</span>
                  </div>
                  <strong className="text-slate-100">₺{paymentMethodStats.transfer.toLocaleString('tr-TR')} (%{paymentMethodStats.transferPercent})</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Category Performance Bar Chart */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-sm">Kategori Bazında Hasılat Dağılımı</h3>
              <p className="text-xs text-slate-400">Menü kategorilerinin ciroya katkısı</p>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₺${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    formatter={(val: any) => [`₺${Number(val).toLocaleString('tr-TR')}`, 'Toplam Satış']}
                  />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: PRODUCT SALES & PROFITABILITY ANALYSIS */}
      {activeTab === 'products' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span>Ürün ve Menü Karlılığı & Satış Raporu</span>
                <span className="text-xs font-normal text-slate-400">
                  ({dateFilter === 'custom' ? `${customStartDate || 'Başlangıç'} - ${customEndDate || 'Bitiş'}` : dateFilter === 'today' ? 'Bugün' : dateFilter === 'yesterday' ? 'Dün' : dateFilter === 'week' ? 'Son 7 Gün' : dateFilter === 'month' ? 'Bu Ay' : 'Tüm Zamanlar'})
                </span>
              </h3>
              <p className="text-xs text-slate-400">Ürün bazında satış adetleri, ciro katkısı ve tarih bazlı satış dökümü</p>
            </div>
            <span className="text-xs font-bold text-amber-400 font-mono self-start sm:self-auto bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
              {filteredProductSales.length} Ürün Listeleniyor
            </span>
          </div>

          {/* Filter Toolbar for Products */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kategori Filtresi:</label>
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Tüm Kategoriler</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mutfak/İstasyon:</label>
              <select
                value={productStationFilter}
                onChange={(e) => setProductStationFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Tüm İstasyonlar</option>
                <option value="MUTFAK">MUTFAK</option>
                <option value="BAR">BAR</option>
                <option value="TATLI">TATLI</option>
                <option value="FIRIN">FIRIN</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ürün Arama:</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ürün veya kategori ara..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Sıra</th>
                  <th className="p-3.5">Ürün Adı</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Birim Fiyat</th>
                  <th className="p-3.5 text-center">Satılan Adet</th>
                  <th className="p-3.5 text-right">Toplam Hasılat</th>
                  <th className="p-3.5 text-center">Tarih Dağılımı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProductSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      Seçili filtrelere veya tarihe uygun ürün satışı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredProductSales.map((prod, idx) => {
                    const isExpanded = expandedProductDetail === prod.name;
                    const historyEntries = Object.values(prod.dailyHistory || {}) as Array<{ date: string; count: number; revenue: number }>;

                    return (
                      <React.Fragment key={prod.name}>
                        <tr
                          onClick={() => setExpandedProductDetail(isExpanded ? null : prod.name)}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <td className="p-3.5 font-mono font-bold text-slate-400">#{idx + 1}</td>
                          <td className="p-3.5 font-bold text-slate-100 flex items-center gap-2">
                            {idx === 0 && '👑'}
                            <span>{prod.name}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                              {prod.category}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-300">
                            ₺{prod.price.toLocaleString('tr-TR')}
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold text-amber-400 text-sm">
                            {prod.quantity} Adet
                          </td>
                          <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-sm">
                            ₺{prod.revenue.toLocaleString('tr-TR')}
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedProductDetail(isExpanded ? null : prod.name);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                            >
                              {isExpanded ? 'Kapat ▴' : `Günlük Dağılım (${historyEntries.length} Gün) ▾`}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Day/Month Breakdown */}
                        {isExpanded && (
                          <tr className="bg-slate-950/80">
                            <td colSpan={7} className="p-4 border-t border-b border-amber-500/20">
                              <div className="space-y-3">
                                <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{prod.name} - Gün / Tarih Bazlı Satış Detayı</span>
                                </h5>

                                {historyEntries.length === 0 ? (
                                  <p className="text-[11px] text-slate-500">Bu ürün için seçili aralıkta gün dökümü yok.</p>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {historyEntries.map((entry) => (
                                      <div
                                        key={entry.date}
                                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                                      >
                                        <div>
                                          <span className="text-[10px] text-slate-400 font-mono block">{entry.date}</span>
                                          <span className="text-xs font-bold text-amber-400 font-mono">{entry.count} Adet</span>
                                        </div>
                                        <span className="text-xs font-black text-emerald-400 font-mono">₺{entry.revenue.toLocaleString('tr-TR')}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: STAFF & WAITER PERFORMANCE */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staffStats.map((staff, idx) => (
              <div key={staff.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={staff.avatar} alt={staff.name} className="w-12 h-12 rounded-2xl object-cover border border-amber-500/30" />
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        <span>{staff.name}</span>
                        {idx === 0 && <span className="text-xs">👑</span>}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {formatRoleTR(staff.role)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xl font-black text-amber-400 font-mono">#{idx + 1}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Toplam Satış Cirosu:</span>
                    <span className="font-mono font-black text-emerald-400">₺{staff.totalRevenue.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kapatılan Adisyon:</span>
                    <span className="font-mono font-bold text-slate-200">{staff.ticketCount} Adet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Toplanan Bahşiş:</span>
                    <span className="font-mono font-bold text-purple-400">+₺{staff.totalTips}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ortalama Adisyon:</span>
                    <span className="font-mono text-slate-300">₺{staff.avgTicket}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: CANCELLATIONS & LOSS REPORT */}
      {activeTab === 'cancellations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>İptal Edilen Ürün & Zayi Denetim Raporu</span>
              </h3>
              <p className="text-xs text-slate-400">Müşteri veya mutfak kaynaklı iptaller, gerekçeleri ve oluşan mali kayıp</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Toplam Zayi Kaybı:</span>
              <span className="text-sm font-black text-rose-400 font-mono-numbers">₺{totalCancelledLoss.toLocaleString('tr-TR')}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Masa</th>
                  <th className="p-4">İptal Edilen Ürün</th>
                  <th className="p-4">Adet</th>
                  <th className="p-4">İptal Gerekçesi</th>
                  <th className="p-4">İşlemi Yapan</th>
                  <th className="p-4">Saat</th>
                  <th className="p-4 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cancelledList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-200">{c.tableName}</td>
                    <td className="p-4 font-bold text-rose-300">{c.productName}</td>
                    <td className="p-4 font-mono font-bold text-slate-300">{c.quantity}x</td>
                    <td className="p-4 text-slate-400 italic">"{c.reason}"</td>
                    <td className="p-4 text-slate-300">{c.cancelledBy}</td>
                    <td className="p-4 font-mono text-slate-500">
                      {new Date(c.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-rose-400">
                      ₺{c.price.toLocaleString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: DETAILED TRANSACTIONS & RECEIPTS TABLE */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Masa, garson veya fiş no ara..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <span className="text-xs text-slate-400">
              Gösterilen: <strong className="text-slate-100 font-mono">{searchPayments.length}</strong> / {filteredPayments.length} Tahsilat
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Fiş No</th>
                    <th className="p-4">Masa</th>
                    <th className="p-4">Garson</th>
                    <th className="p-4">Kasa</th>
                    <th className="p-4">Ödeme Yöntemi</th>
                    <th className="p-4">Tarih & Saat</th>
                    <th className="p-4">İndirim / Bahşiş</th>
                    <th className="p-4 text-right">Tahsil Edilen</th>
                    <th className="p-4 text-center">Fiş</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {searchPayments.map((p) => {
                    const total = p.totalAmount ?? p.finalAmount ?? p.subtotal ?? 0;
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
                        <td className="p-4 text-slate-400">{p.cashierName || 'Elif Kasa'}</td>
                        <td className="p-4">{getMethodBadge(method)}</td>
                        <td className="p-4 font-mono text-slate-400">
                          {new Date(created).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} • {new Date(created).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="p-4 text-xs">
                          {p.discountAmount > 0 && <span className="text-rose-400 block">-₺{p.discountAmount} İndirim</span>}
                          {p.tipAmount > 0 && <span className="text-emerald-400 block">+₺{p.tipAmount} Bahşiş</span>}
                          {(!p.discountAmount || p.discountAmount === 0) && (!p.tipAmount || p.tipAmount === 0) && <span className="text-slate-500">-</span>}
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
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Modal Preview */}
      {selectedPaymentForReceipt && (
        <ThermalReceiptModal
          payment={selectedPaymentForReceipt}
          onClose={() => setSelectedPaymentForReceipt(null)}
        />
      )}
    </div>
  );
};
