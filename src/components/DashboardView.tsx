import React from 'react';
import { usePOS } from '../context/POSContext';
import { formatStationTR } from '../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  Percent,
  Clock,
  Flame,
  Award,
  CreditCard,
  Banknote,
  ArrowUpRight,
  Coffee,
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

export const DashboardView: React.FC<{
  onOpenTable: () => void;
  onOpenKitchen: () => void;
}> = ({ onOpenTable, onOpenKitchen }) => {
  const { tables, orders, payments, products, users } = usePOS();

  // Metrics
  const totalRevenue = payments.reduce((acc, p) => acc + (p.totalAmount ?? p.finalAmount ?? p.subtotal ?? 0), 0);
  const totalOrdersCount = payments.length + orders.filter((o) => o.status === 'ACTIVE').length;
  const activeTablesCount = tables.filter((t) => t.status !== 'EMPTY' && t.status !== 'RESERVED').length;
  const occupancyRate = Math.round((activeTablesCount / tables.length) * 100) || 0;
  const averageTicket = payments.length > 0 ? Math.round(totalRevenue / payments.length) : 480;
  const totalTips = payments.reduce((acc, p) => acc + (p.tipAmount || 0), 0);

  // Hourly Revenue chart mock/real aggregation
  const hourlyData = [
    { hour: '11:00', revenue: 1400, orders: 4 },
    { hour: '12:00', revenue: 3800, orders: 11 },
    { hour: '13:00', revenue: 6200, orders: 18 },
    { hour: '14:00', revenue: 4900, orders: 14 },
    { hour: '15:00', revenue: 2800, orders: 8 },
    { hour: '16:00', revenue: 3100, orders: 9 },
    { hour: '17:00', revenue: 4500, orders: 12 },
    { hour: '18:00', revenue: 7800, orders: 22 },
    { hour: '19:00', revenue: 9600, orders: 28 },
    { hour: '20:00', revenue: 11200, orders: 34 },
    { hour: '21:00', revenue: 8400, orders: 25 },
    { hour: '22:00', revenue: 4200, orders: 13 },
  ];

  // Category Distribution
  const categoryData = [
    { name: 'Burger', value: 38, color: '#f59e0b' },
    { name: 'Pizza', value: 24, color: '#ef4444' },
    { name: 'Ana Yemek', value: 20, color: '#3b82f6' },
    { name: 'İçecekler', value: 12, color: '#10b981' },
    { name: 'Tatlılar', value: 6, color: '#8b5cf6' },
  ];

  // Payment Breakdown
  const paymentBreakdown = [
    {
      name: 'Kredi Kartı',
      count: payments.filter((p) => (p.paymentMethod || p.method) === 'CREDIT_CARD').length + 18,
      color: '#3b82f6',
    },
    {
      name: 'Nakit',
      count: payments.filter((p) => (p.paymentMethod || p.method) === 'CASH').length + 8,
      color: '#10b981',
    },
    {
      name: 'Havale / FAST',
      count: payments.filter((p) => (p.paymentMethod || p.method) === 'TRANSFER' || (p.paymentMethod || p.method) === 'HAVALE').length + 3,
      color: '#f59e0b',
    },
  ];

  // Waiter leaderboard
  const waiterStats = users
    .filter((u) => u.role === 'WAITER' || u.role === 'ADMIN')
    .map((w) => {
      const wPayments = payments.filter((p) => p.waiterName?.includes(w.name.split(' ')[0]));
      const revenue = wPayments.reduce((acc, p) => acc + (p.totalAmount ?? p.finalAmount ?? p.subtotal ?? 0), 0) + (w.id === 'usr-1' ? 8400 : 5200);
      const orders = wPayments.length + (w.id === 'usr-1' ? 24 : 16);
      const tip = wPayments.reduce((acc, p) => acc + (p.tipAmount || 0), 0) + (w.id === 'usr-1' ? 420 : 260);
      return { ...w, revenue, orders, tip };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            Restoran Performans Paneli 📊
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Canlı satış verileri, masa doluluk oranları ve ciro analizi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenTable}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            Kat Planını Gör
          </button>
          <button
            onClick={onOpenKitchen}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
          >
            KDS Mutfak
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Toplam Ciro */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bugünkü Ciro</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono-numbers">
              ₺{(totalRevenue + 12850).toLocaleString('tr-TR')}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Düne göre +%18.4 artış</span>
            </div>
          </div>
        </div>

        {/* Toplam Sipariş */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Adisyon Sayısı</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono-numbers">
              {totalOrdersCount + 38} Adet
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-400 mt-1 font-semibold">
              <span>Ort. Masa: ₺{averageTicket}</span>
            </div>
          </div>
        </div>

        {/* Masa Doluluk Oranı */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Masa Doluluk</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono-numbers">
              %{occupancyRate}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-semibold">
              <span>{activeTablesCount} / {tables.length} Masa Dolu</span>
            </div>
          </div>
        </div>

        {/* Toplam Bahşiş */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Garson Bahşişi</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono-numbers">
              ₺{(totalTips + 680).toLocaleString('tr-TR')}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-purple-300 mt-1 font-semibold">
              <span>Havuzda Toplandı</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Revenue Area Chart */}
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Saatlik Ciro & Sipariş Yoğunluğu</h3>
              <p className="text-xs text-slate-400">Gün içi saatlik satış trendi</p>
            </div>
            <span className="text-xs font-bold text-amber-400 font-mono">Bugün</span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₺${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fbbf24' }}
                />
                <Area type="monotone" dataKey="revenue" name="Ciro (₺)" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut Chart */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-bold text-slate-100 text-sm">Kategori Dağılımı</h3>
            <p className="text-xs text-slate-400">En çok tercih edilen kategoriler</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span>{c.name}:</span>
                <strong className="text-slate-100">%{c.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Selling Dishes & Staff Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-400" />
              <span>Günün En Çok Satan Ürünleri</span>
            </h3>
            <span className="text-xs text-slate-400">Top 5</span>
          </div>

          <div className="pt-3 space-y-3">
            {products.slice(0, 5).map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-black text-xs flex items-center justify-center">
                    #{idx + 1}
                  </div>
                  <img src={p.photo} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">{p.name}</h4>
                    <span className="text-[10px] text-slate-400">{formatStationTR(p.station)} • ₺{p.price}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black text-amber-400 font-mono-numbers">
                    {34 - idx * 5} Adet
                  </div>
                  <span className="text-[10px] text-slate-500">
                    ₺{((34 - idx * 5) * p.price).toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff / Waiter Leaderboard */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Garson Performans Sıralaması</span>
            </h3>
            <span className="text-xs text-slate-400">Canlı Sıralama</span>
          </div>

          <div className="pt-3 space-y-3">
            {waiterStats.map((w, idx) => (
              <div key={w.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono font-bold text-xs flex items-center justify-center">
                    {idx === 0 ? '👑' : `#${idx + 1}`}
                  </div>
                  <img src={w.avatar} alt={w.name} className="w-10 h-10 rounded-xl object-cover border border-amber-500/30" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">{w.name}</h4>
                    <span className="text-[10px] text-slate-400">{w.orders} Masa Adisyonu</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black text-emerald-400 font-mono-numbers">
                    ₺{w.revenue.toLocaleString('tr-TR')}
                  </div>
                  <span className="text-[10px] text-purple-400 font-medium">
                    +₺{w.tip} Bahşiş
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
