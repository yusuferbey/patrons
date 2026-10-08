import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { formatOrderNumber, formatRoleTR } from '../utils/formatters';
import {
  ShieldAlert,
  Clock,
  User,
  Info,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  X,
  CreditCard,
  Utensils,
  Settings as SettingsIcon,
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = usePOS();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dateFilterPreset, setDateFilterPreset] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Extract unique users
  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach((log) => {
      if (log.userName) set.add(log.userName);
    });
    return Array.from(set);
  }, [auditLogs]);

  // Filter audit logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const logDate = new Date(log.timestamp);
      const now = new Date();

      // Date filtering
      if (dateFilterPreset === 'TODAY') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (logDate < todayStart) return false;
      } else if (dateFilterPreset === 'YESTERDAY') {
        const yestStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (logDate < yestStart || logDate >= todayStart) return false;
      } else if (dateFilterPreset === 'LAST_7_DAYS') {
        const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        if (logDate < sevenDaysAgo) return false;
      } else if (dateFilterPreset === 'CUSTOM') {
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (logDate < s) return false;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (logDate > e) return false;
        }
      }

      // User filter
      if (selectedUser !== 'ALL' && log.userName !== selectedUser) {
        return false;
      }

      // Category / Action type filter
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'ORDER' && !log.action.toLowerCase().includes('sipariş') && !log.action.toLowerCase().includes('mutfak')) return false;
        if (selectedCategory === 'PAYMENT' && !log.action.toLowerCase().includes('ödeme') && !log.action.toLowerCase().includes('hesap') && !log.action.toLowerCase().includes('kasa')) return false;
        if (selectedCategory === 'CANCEL' && !log.action.toLowerCase().includes('iptal') && !log.action.toLowerCase().includes('ikram')) return false;
        if (selectedCategory === 'TRANSFER' && !log.action.toLowerCase().includes('transfer') && !log.action.toLowerCase().includes('taşı') && !log.action.toLowerCase().includes('birleştir')) return false;
      }

      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(query);
        const matchesDetails = log.details.toLowerCase().includes(query);
        const matchesUser = log.userName.toLowerCase().includes(query);
        const matchesId = log.id.toLowerCase().includes(query);
        if (!matchesAction && !matchesDetails && !matchesUser && !matchesId) return false;
      }

      return true;
    });
  }, [auditLogs, dateFilterPreset, startDate, endDate, selectedUser, selectedCategory, searchTerm]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedUser('ALL');
    setSelectedCategory('ALL');
    setDateFilterPreset('ALL');
    setStartDate('');
    setEndDate('');
  };

  const getLogIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('iptal') || act.includes('silindi')) {
      return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
    if (act.includes('ödeme') || act.includes('kasa') || act.includes('hesap')) {
      return <CreditCard className="w-4 h-4 text-emerald-400" />;
    }
    if (act.includes('sipariş') || act.includes('mutfak')) {
      return <Utensils className="w-4 h-4 text-amber-400" />;
    }
    if (act.includes('ayar') || act.includes('demo')) {
      return <SettingsIcon className="w-4 h-4 text-sky-400" />;
    }
    return <Info className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Denetim Kayıtları & Güvenlik Günlüğü</span>
          </h1>
          <p className="text-xs text-slate-400">Garson işlemleri, masa transferleri, iptaller ve kasa hareketleri kayıtları</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-mono text-amber-300 font-bold border border-slate-700">
            Toplam: {filteredLogs.length} Kayıt
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Filtreleme & Tarih Seçimi</span>
          </h3>
          {(searchTerm || selectedUser !== 'ALL' || selectedCategory !== 'ALL' || dateFilterPreset !== 'ALL' || startDate || endDate) && (
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
          <label className="text-[11px] font-bold text-slate-400 uppercase block">Tarih Aralığı:</label>
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
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Bitiş:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Category, User, and Text Search Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">İşlem Türü:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Tüm İşlemler</option>
              <option value="ORDER">Sipariş & Mutfak</option>
              <option value="PAYMENT">Ödeme & Kasa</option>
              <option value="CANCEL">İptal & İadeler</option>
              <option value="TRANSFER">Masa Taşıma / Transfer</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Personel / Kullanıcı:</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Tüm Personel</option>
              {uniqueUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Arama:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="İşlem adı, masa veya detay ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Seçili filtrelere uygun denetim kaydı bulunamadı.</p>
            <button
              onClick={clearFilters}
              className="mt-3 px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-amber-400 font-bold hover:bg-slate-700 transition-colors"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 transition-colors flex items-start justify-between gap-4 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 mt-0.5 shadow-sm">
                  {getLogIcon(log.action)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-100 text-xs">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                      {log.orderNumber ? `Sipariş No: ${formatOrderNumber(log.orderNumber)}` : `Kayıt: ${formatOrderNumber(log.id)}`}
                    </span>
                    <span className="text-[10px] text-amber-400/90 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {formatRoleTR(log.userRole) || 'Yönetici'}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed text-[11.5px]">{log.details}</p>
                </div>
              </div>

              <div className="text-right shrink-0 text-[11px] text-slate-400">
                <div className="flex items-center gap-1 justify-end text-slate-200 font-bold">
                  <User className="w-3 h-3 text-amber-400" />
                  <span>{log.userName}</span>
                </div>
                <div className="flex items-center gap-1 justify-end font-mono mt-0.5 text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{new Date(log.timestamp).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center gap-1 justify-end font-mono text-[10px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(log.timestamp).toLocaleTimeString('tr-TR')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
