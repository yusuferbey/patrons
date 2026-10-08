import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Printer,
  FileText,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  DollarSign,
  Calendar,
  Clock,
  User,
  HelpCircle,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Split,
  ChevronRight,
  ExternalLink,
  Download,
} from 'lucide-react';
import {
  generateZReportHtml,
  printHtmlDirectly,
  openReceiptInNewTab,
  downloadReceiptHtml,
  createReceiptBlobUrl,
} from '../utils/printReceipt';


export const CashRegisterView: React.FC = () => {
  const { cashRegister, payments, currentUser, addCashTransaction, closeCashRegister, addToast } = usePOS();

  // Modals
  const [showInModal, setShowInModal] = useState<boolean>(false);
  const [showOutModal, setShowOutModal] = useState<boolean>(false);
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);

  // Form states
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [actualCashCount, setActualCashCount] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Derive stats from payments and cashRegister state
  const cashSales = useMemo(() => {
    return payments.reduce((acc, p) => {
      const method = p.paymentMethod || p.method || 'CASH';
      const total = p.totalAmount ?? p.finalAmount ?? 0;
      if (method === 'CASH') return acc + total;
      if (method === 'PARTIAL' || method === 'SPLIT') {
        const split = p.splitBreakdown || p.partialBreakdown;
        if (split) {
          if (Array.isArray(split)) {
            const cashPart = split.find((s: any) => s.method === 'CASH');
            return acc + (Number(cashPart?.amount) || 0);
          } else {
            return acc + (Number(split.cash) || 0);
          }
        }
      }
      return acc;
    }, 0);
  }, [payments]);

  const cardSales = useMemo(() => {
    return payments.reduce((acc, p) => {
      const method = p.paymentMethod || p.method;
      const total = p.totalAmount ?? p.finalAmount ?? 0;
      if (method === 'CREDIT_CARD') return acc + total;
      if (method === 'PARTIAL' || method === 'SPLIT') {
        const split = p.splitBreakdown || p.partialBreakdown;
        if (split) {
          if (Array.isArray(split)) {
            const cardPart = split.find((s: any) => s.method === 'CREDIT_CARD');
            return acc + (Number(cardPart?.amount) || 0);
          } else {
            return acc + (Number(split.creditCard) || 0);
          }
        }
      }
      return acc;
    }, 0);
  }, [payments]);

  const transferSales = useMemo(() => {
    return payments.reduce((acc, p) => {
      const method = p.paymentMethod || p.method;
      const total = p.totalAmount ?? p.finalAmount ?? 0;
      if (method === 'TRANSFER' || method === 'HAVALE') return acc + total;
      return acc;
    }, 0);
  }, [payments]);

  const totalSales = cashSales + cardSales + transferSales;
  const openingBalance = cashRegister?.openingBalance || 3000;
  const cashIn = cashRegister?.cashIn || 0;
  const cashOut = cashRegister?.cashOut || 0;
  const expectedCashInDrawer = openingBalance + cashSales + cashIn - cashOut;

  // Handle cash in
  const handleCashInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      addToast('error', 'Geçersiz Tutar', 'Lütfen pozitif bir tutar girin.');
      return;
    }
    if (!reason.trim()) {
      addToast('error', 'Açıklama Gerekli', 'Lütfen para giriş nedenini belirtin.');
      return;
    }

    setIsSubmitting(true);
    const success = await addCashTransaction('IN', num, reason.trim());
    setIsSubmitting(false);

    if (success) {
      setShowInModal(false);
      setAmount('');
      setReason('');
    }
  };

  // Handle cash out
  const handleCashOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      addToast('error', 'Geçersiz Tutar', 'Lütfen pozitif bir tutar girin.');
      return;
    }
    if (!reason.trim()) {
      addToast('error', 'Açıklama Gerekli', 'Lütfen para çıkış nedenini / masrafı belirtin.');
      return;
    }

    setIsSubmitting(true);
    const success = await addCashTransaction('OUT', num, reason.trim());
    setIsSubmitting(false);

    if (success) {
      setShowOutModal(false);
      setAmount('');
      setReason('');
    }
  };

  const getZReportHtml = () => {
    return generateZReportHtml(cashRegister, {
      cashSales,
      cardSales,
      transferSales,
      totalSales,
      openingBalance,
      cashIn,
      cashOut,
      expectedCash: expectedCashInDrawer,
      cashierName: currentUser?.name || 'Elif Kasa',
    });
  };

  const handlePrintZReport = () => {
    const html = getZReportHtml();
    printHtmlDirectly(html);
  };

  const handleDownloadZReport = () => {
    const html = getZReportHtml();
    const filename = `z-raporu-${new Date().toISOString().split('T')[0]}.html`;
    downloadReceiptHtml(html, filename);
  };

  const handleOpenZReportNewTab = () => {
    const html = getZReportHtml();
    openReceiptInNewTab(html);
  };

  // Handle shift close (Z-Report)
  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseFloat(actualCashCount);
    if (isNaN(count) || count < 0) {
      addToast('error', 'Geçersiz Sayım', 'Lütfen kasada sayılan fiili nakit miktarını girin.');
      return;
    }

    setIsSubmitting(true);
    const success = await closeCashRegister(count, closeNotes.trim());
    setIsSubmitting(false);

    if (success) {
      setShowCloseModal(false);
      handlePrintZReport();
    }
  };

  const isClosed = cashRegister?.status === 'CLOSED';
  const parsedCount = parseFloat(actualCashCount) || 0;
  const liveDiff = parsedCount - expectedCashInDrawer;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/70 p-4 md:p-5 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2">
                <span>Kasa Yönetimi & Vardiya Durumu</span>
                {isClosed ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Vardiya Kapatıldı (Z-Raporu Alındı)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    Kasa Aktif & Açık
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Nakit çekmecesi, giriş-çıkış hareketleri, POS cirosu ve gün sonu Z-Raporu
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => {
              setAmount('');
              setReason('');
              setShowInModal(true);
            }}
            disabled={isClosed}
            className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Kasaya Para Girişi</span>
          </button>

          <button
            onClick={() => {
              setAmount('');
              setReason('');
              setShowOutModal(true);
            }}
            disabled={isClosed}
            className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <MinusCircle className="w-4 h-4 text-rose-400" />
            <span>Kasadan Gider / Çıkış</span>
          </button>

          <button
            onClick={() => {
              setActualCashCount(expectedCashInDrawer.toString());
              setCloseNotes('');
              setShowCloseModal(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/25 transition-all"
          >
            <Lock className="w-4 h-4" />
            <span>{isClosed ? 'Z-Raporunu Tekrar Yazdır' : 'Z-Raporu Al & Kapat'}</span>
          </button>
        </div>
      </div>

      {/* Main KPI Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kasada Olması Gereken Nakit */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl relative overflow-hidden">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kasadaki Beklenen Nakit</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono-numbers mt-2">
            ₺{expectedCashInDrawer.toLocaleString('tr-TR')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Açılış: ₺{openingBalance.toLocaleString('tr-TR')}</span>
            <span>+ ₺{cashSales.toLocaleString('tr-TR')} Satış</span>
          </div>
        </div>

        {/* Kredi Kartı POS Cirosu */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kredi Kartı / POS Toplamı</span>
          <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono-numbers mt-2">
            ₺{cardSales.toLocaleString('tr-TR')}
          </div>
          <div className="text-[11px] text-blue-300 mt-1">
            Banka hesabı ile gün sonu eşleşmesi
          </div>
        </div>

        {/* Kasa Giriş & Çıkışları */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kasa Hareketleri</span>
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-[10px] text-emerald-400 block font-bold">Giriş:</span>
              <span className="text-lg font-black text-emerald-400 font-mono-numbers">+₺{cashIn.toLocaleString('tr-TR')}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-rose-400 block font-bold">Gider / Çıkış:</span>
              <span className="text-lg font-black text-rose-400 font-mono-numbers">-₺{cashOut.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>

        {/* Toplam Satış Hasılatı */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Toplam Günlük Ciro</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono-numbers mt-2">
            ₺{totalSales.toLocaleString('tr-TR')}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
            Nakit + Kart + Havale Toplamı
          </div>
        </div>
      </div>

      {/* Grid: Left Shift Details & Right Printable Thermal Z-Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Shift Details & Action Summaries (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Shift Details Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Günlük Kasa Hareket Dökümü</span>
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Kasa Açılış Saati:</span>
                <span className="font-mono font-bold text-slate-200">
                  {cashRegister?.openedAt
                    ? new Date(cashRegister.openedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                    : '09:00'} (Bugün)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Sabah Açılış Devir Nakdi:</span>
                <span className="font-mono font-bold text-slate-200">₺{openingBalance.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Nakit Satış Hasılatı:</span>
                <span className="font-mono font-bold text-emerald-400">+₺{cashSales.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Kredi Kartı / POS Tahsilatı:</span>
                <span className="font-mono font-bold text-blue-400">₺{cardSales.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Havale / FAST Tahsilatı:</span>
                <span className="font-mono font-bold text-amber-400">₺{transferSales.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Gün İçi Nakit Takviyesi (Giriş):</span>
                <span className="font-mono font-bold text-emerald-400">+₺{cashIn.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Masraf / Avans / Gider (Çıkış):</span>
                <span className="font-mono font-bold text-rose-400">-₺{cashOut.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-sm">
                <span className="font-bold text-amber-300">KASADA BULUNMASI GEREKEN:</span>
                <span className="font-mono font-black text-amber-400">₺{expectedCashInDrawer.toFixed(2)}</span>
              </div>

              {cashRegister?.status === 'CLOSED' && cashRegister.actualCash !== undefined && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>Fiili Sayılan Nakit:</span>
                    <strong className="font-mono">₺{cashRegister.actualCash.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Kasa Farkı:</span>
                    <strong
                      className={`font-mono font-black ${
                        (cashRegister.difference || 0) === 0
                          ? 'text-emerald-400'
                          : (cashRegister.difference || 0) > 0
                          ? 'text-blue-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {(cashRegister.difference || 0) === 0
                        ? 'TAM (Fark Yok ₺0.00)'
                        : (cashRegister.difference || 0) > 0
                        ? `+₺${cashRegister.difference?.toFixed(2)} (Kasa Fazlası)`
                        : `-₺${Math.abs(cashRegister.difference || 0).toFixed(2)} (Kasa Eksiği)`}
                    </strong>
                  </div>
                  {cashRegister.notes && (
                    <p className="text-[11px] text-slate-400 italic mt-1 pt-1 border-t border-slate-900">
                      Not: "{cashRegister.notes}"
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Thermal Standard 80mm Z-Report Preview (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Termal 80mm Z-Raporu Önizlemesi</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrintZReport}
                  className="py-1 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır</span>
                </button>
                <button
                  onClick={handleDownloadZReport}
                  title="HTML/PDF Fişi İndir"
                  className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">İndir</span>
                </button>
                <button
                  onClick={handleOpenZReportNewTab}
                  title="Yeni Sekmede Aç & Görüntüle"
                  className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            </div>

            {/* Thermal POS Receipt simulation */}
            <div
              id="printable-receipt"
              className="bg-white text-slate-950 p-6 rounded-2xl border border-slate-300 font-mono text-xs shadow-2xl space-y-3 select-all"
            >
              <div className="text-center pb-3 border-b-2 border-dashed border-slate-400">
                <div className="text-lg font-black tracking-widest uppercase">ÖZER POS</div>
                <div className="text-[10px] text-slate-700 font-bold">GÜN SONU MALİ Z-RAPORU</div>
                <div className="text-[9px] text-slate-500 mt-1">VKN: 8492019482 • KASA NO: 01</div>
                <div className="text-[9px] text-slate-500">
                  Tarih: {new Date().toLocaleDateString('tr-TR')} • Saat:{' '}
                  {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="py-2 space-y-1 border-b-2 border-dashed border-slate-400 text-[11px]">
                <div className="flex justify-between">
                  <span>AÇILIŞ BAKİYESİ:</span>
                  <span className="font-bold">₺{openingBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>NAKİT SATIŞLAR:</span>
                  <span className="font-bold">₺{cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>KREDİ KARTI (POS):</span>
                  <span className="font-bold">₺{cardSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>HAVALE / FAST:</span>
                  <span className="font-bold">₺{transferSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>KASAYA GİRİŞ:</span>
                  <span className="font-bold">+₺{cashIn.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-800">
                  <span>KASADAN ÇIKIŞ / GİDER:</span>
                  <span className="font-bold">-₺{cashOut.toFixed(2)}</span>
                </div>
              </div>

              <div className="py-2 space-y-1 border-b-2 border-dashed border-slate-400 text-xs font-bold">
                <div className="flex justify-between">
                  <span>TOPLAM SATIŞ:</span>
                  <span className="font-black text-sm">₺{totalSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span>KASADA BEKLENEN NAKİT:</span>
                  <span className="font-black">₺{expectedCashInDrawer.toFixed(2)}</span>
                </div>
                {cashRegister?.actualCash !== undefined && (
                  <div className="flex justify-between pt-1 border-t border-slate-300">
                    <span>SAYILAN FİİLİ NAKİT:</span>
                    <span>₺{cashRegister.actualCash.toFixed(2)}</span>
                  </div>
                )}
                {cashRegister?.difference !== undefined && (
                  <div className="flex justify-between">
                    <span>KASA FARKI:</span>
                    <span>
                      {cashRegister.difference === 0
                        ? 'TAM (₺0.00)'
                        : cashRegister.difference > 0
                        ? `+₺${cashRegister.difference.toFixed(2)} FAZLA`
                        : `-₺${Math.abs(cashRegister.difference).toFixed(2)} EKSİK`}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 text-center text-[9px] text-slate-500 space-y-1">
                <p>Kasa Sorumlusu: {currentUser?.name || 'Elif Kasa'}</p>
                <p>İşbu belge gün sonu kasa devir tutanağıdır.</p>
                <div className="pt-3 flex justify-around text-[8px] text-slate-400">
                  <span>İmza (Kasa)</span>
                  <span>İmza (Müdür)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Kasaya Para Girişi */}
      {showInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Kasaya Para Girişi (Avans / Takviye)</span>
              </h3>
              <button
                onClick={() => setShowInModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCashInSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Giriş Tutarı (₺):</label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Örn: 500"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Giriş Sebebi / Açıklama:</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Örn: Bozuk para takviyesi, Patron avans"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Kasaya Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Kasadan Gider / Para Çıkışı */}
      {showOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <MinusCircle className="w-5 h-5 text-rose-400" />
                <span>Kasadan Masraf / Para Çıkışı</span>
              </h3>
              <button
                onClick={() => setShowOutModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCashOutSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Çıkış Tutarı (₺):</label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Örn: 250"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Gider Türü / Açıklama:</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Örn: Market sebze alımı, Kurye avansı, Temizlik malzemesi"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOutModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Kasadan Düş'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gün Sonu Kasa Kapat & Z-Raporu */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                  <Lock className="w-5 h-5 text-rose-500" />
                  <span>Gün Sonu Z-Raporu Al & Kasa Devri</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lütfen kasadaki fiziksel parayı sayıp fiili miktarı girin
                </p>
              </div>
              <button
                onClick={() => setShowCloseModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseShiftSubmit} className="mt-4 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Sistemdeki Beklenen Nakit:</span>
                  <span className="font-mono font-bold text-amber-400">₺{expectedCashInDrawer.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Toplam Günlük Satış:</span>
                  <span className="font-mono font-bold text-slate-200">₺{totalSales.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Sayılmış Fiili Nakit Miktarı (₺):
                </label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  required
                  value={actualCashCount}
                  onChange={(e) => setActualCashCount(e.target.value)}
                  placeholder="Kasada çıkan para..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-base font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Real-time difference indicator */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  liveDiff === 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : liveDiff > 0
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <span className="font-semibold">Kasa Farkı:</span>
                <span className="font-mono font-black">
                  {liveDiff === 0
                    ? '✓ Kasa Tam (Fark Yok)'
                    : liveDiff > 0
                    ? `+₺${liveDiff.toFixed(2)} Fazlalık`
                    : `-₺${Math.abs(liveDiff).toFixed(2)} Eksik`}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Vardiya Kapanış Notu (Opsiyonel):
                </label>
                <textarea
                  rows={2}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Varsa kasa farkı açıklaması veya devir notu..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/25 flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmitting ? 'Kapatılıyor...' : 'Kasayı Kapat & Z-Raporu Yazdır'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
