import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { RestaurantTable, PaymentMethod, PaymentRecord } from '../types';
import { formatOrderNumber } from '../utils/formatters';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Split,
  Percent,
  Receipt,
  CheckCircle2,
  Printer,
  Calculator,
  ArrowRight,
  Users,
  Plus,
  Minus,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';

interface BillCheckoutModalProps {
  table: RestaurantTable;
  onClose: () => void;
  onPaymentCompleted: () => void;
}

type CheckoutMode = 'FULL' | 'SPLIT_BY_ITEMS';

export const BillCheckoutModal: React.FC<BillCheckoutModalProps> = ({
  table,
  onClose,
  onPaymentCompleted,
}) => {
  const { orders, completePayment, settings, addToast } = usePOS();

  const currentOrder = orders.find((o) => o.id === table.currentOrderId);
  const activeItems = currentOrder ? currentOrder.items.filter((i) => i.status !== 'CANCELLED' && i.quantity > 0) : [];

  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>('FULL');

  // For Split by Items: Track how many of each item is being paid for in THIS payment tranche
  const [selectedItemQuantities, setSelectedItemQuantities] = useState<Record<string, number>>({});
  const [splitPersonLabel, setSplitPersonLabel] = useState<string>('1. Kişi / Fiş');

  // Discount & Tip States
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customDiscount, setCustomDiscount] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<number>(0);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD');

  // Cash tendered for change calculation
  const [cashTendered, setCashTendered] = useState<number>(0);

  // Split bill numerical states (for manual 50/50 split)
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');

  // Thermal Receipt modal toggle
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [completedPaymentRecord, setCompletedPaymentRecord] = useState<PaymentRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const vatRate = settings?.defaultVatRate ?? 10;

  // Subtotal calculation
  const tableSubtotal = activeItems.reduce((acc, itm) => acc + itm.unitPrice * itm.quantity, 0);

  const splitSubtotal = activeItems.reduce((acc, itm) => {
    const qtyToPay = selectedItemQuantities[itm.id] || 0;
    return acc + itm.unitPrice * qtyToPay;
  }, 0);

  const currentSubtotal = checkoutMode === 'SPLIT_BY_ITEMS' ? splitSubtotal : tableSubtotal;

  // Calculations
  const calculatedDiscount = (currentSubtotal * discountPercent) / 100;
  const finalDiscount = customDiscount ? parseFloat(customDiscount) || 0 : calculatedDiscount;
  const totalAfterDiscount = Math.max(0, currentSubtotal - finalDiscount);
  const grandTotal = totalAfterDiscount + tipAmount;
  const vatAmount = Math.round((grandTotal * vatRate) / (100 + vatRate));

  const changeAmount = cashTendered > grandTotal ? cashTendered - grandTotal : 0;

  // Quick select all items for split mode
  const handleSelectAllItems = () => {
    const all: Record<string, number> = {};
    activeItems.forEach((i) => {
      all[i.id] = i.quantity;
    });
    setSelectedItemQuantities(all);
  };

  const handleClearSelectedItems = () => {
    setSelectedItemQuantities({});
  };

  const handleItemQtyChange = (itemId: string, maxQty: number, delta: number) => {
    setSelectedItemQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const handleCompleteCheckout = async () => {
    if (checkoutMode === 'SPLIT_BY_ITEMS' && splitSubtotal <= 0) {
      addToast('warning', 'Ürün Seçilmedi', 'Lütfen bu ödemede tahsil edilecek en az bir ürün seçin.');
      return;
    }

    setIsProcessing(true);

    const paidItems =
      checkoutMode === 'SPLIT_BY_ITEMS'
        ? Object.entries(selectedItemQuantities)
            .filter(([_, qty]) => Number(qty) > 0)
            .map(([itemId, quantity]) => ({ itemId, quantity: Number(quantity) }))
        : undefined;

    const splitBreakdown =
      paymentMethod === 'SPLIT'
        ? {
            cash: parseFloat(splitCash) || 0,
            creditCard: parseFloat(splitCard) || 0,
          }
        : undefined;

    const result = await completePayment({
      tableId: table.id,
      paymentMethod,
      discountAmount: finalDiscount,
      tipAmount,
      totalAmount: grandTotal,
      splitBreakdown,
      paidItems,
      isPartial: checkoutMode === 'SPLIT_BY_ITEMS',
      splitPersonLabel: checkoutMode === 'SPLIT_BY_ITEMS' ? splitPersonLabel : undefined,
    });

    setIsProcessing(false);

    if (result && result.payment) {
      setCompletedPaymentRecord(result.payment);
      setShowReceiptModal(true);

      // Reset selection for next split tranche
      setSelectedItemQuantities({});
      setCustomDiscount('');
      setDiscountPercent(0);
      setTipAmount(0);
      setCashTendered(0);

      // Auto increment next person label e.g. "2. Kişi / Fiş"
      const match = splitPersonLabel.match(/(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        setSplitPersonLabel(`${nextNum}. Kişi / Fiş`);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 md:p-4 overflow-y-auto">
        <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col md:flex-row max-h-[94vh]">
          {/* Left Side: Order Breakdown & Selection */}
          <div className="w-full md:w-5/12 bg-slate-950 p-5 md:p-6 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-black text-slate-100">{table.name} Hesabı</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>Garson: {table.currentWaiterName || 'Kemal'}</span>
                    {currentOrder && (
                      <span className="text-amber-400 font-mono font-bold">
                        • Sipariş No: {formatOrderNumber(currentOrder)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {table.section} Katı
                </span>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 my-3.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCheckoutMode('FULL')}
                  className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    checkoutMode === 'FULL'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tüm Masa (Tek Fiş)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutMode('SPLIT_BY_ITEMS');
                    if (Object.keys(selectedItemQuantities).length === 0 && activeItems.length > 0) {
                      // default select 1st item or 1 of each
                    }
                  }}
                  className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    checkoutMode === 'SPLIT_BY_ITEMS'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Ürün / Kişi Ayır</span>
                </button>
              </div>

              {/* Split by items helper info & controls */}
              {checkoutMode === 'SPLIT_BY_ITEMS' && (
                <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300">Bu Kişinin / Fişin Adı:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleSelectAllItems}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700"
                      >
                        Tümünü Seç
                      </button>
                      <button
                        type="button"
                        onClick={handleClearSelectedItems}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200"
                      >
                        Temizle
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={splitPersonLabel}
                    onChange={(e) => setSplitPersonLabel(e.target.value)}
                    placeholder="Örn: 1. Kişi (Ahmet), Hamburger & Kola Fişi"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Ödemesi alınan ürünler masadan düşecek, kalan ürünler masada açık kalacaktır.
                  </p>
                </div>
              )}

              {/* Items list */}
              <div className="py-2 space-y-2 max-h-64 overflow-y-auto pr-1">
                {activeItems.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">Masada aktif sipariş kalemi kalmadı.</p>
                ) : (
                  activeItems.map((item) => {
                    const selectedQty = selectedItemQuantities[item.id] || 0;
                    const isFullySelected = selectedQty === item.quantity;

                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-2xl border transition-all ${
                          checkoutMode === 'SPLIT_BY_ITEMS'
                            ? selectedQty > 0
                              ? 'bg-amber-500/10 border-amber-500/40 text-slate-100'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                            : 'bg-slate-900/60 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex-1 pr-2">
                            <div className="font-bold flex items-center gap-1.5">
                              <span className="text-amber-400 font-mono-numbers">{item.quantity}x</span>
                              <span>{item.productName}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Birim: ₺{item.unitPrice} • Toplam: ₺{item.unitPrice * item.quantity}
                            </div>
                          </div>

                          {checkoutMode === 'SPLIT_BY_ITEMS' ? (
                            <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 p-1 rounded-xl border border-slate-800">
                              <button
                                type="button"
                                onClick={() => handleItemQtyChange(item.id, item.quantity, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center font-mono font-bold text-amber-400 text-xs">
                                {selectedQty}/{item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleItemQtyChange(item.id, item.quantity, 1)}
                                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono-numbers font-bold text-slate-300">
                              ₺{(item.unitPrice * item.quantity).toLocaleString('tr-TR')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Subtotal Summary on Left */}
            <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>{checkoutMode === 'SPLIT_BY_ITEMS' ? 'Seçilen Ürünler Tutarı:' : 'Ara Toplam:'}</span>
                <span className="font-mono-numbers font-bold text-slate-200">₺{currentSubtotal.toLocaleString('tr-TR')}</span>
              </div>
              {finalDiscount > 0 && (
                <div className="flex justify-between text-rose-400 font-semibold">
                  <span>İndirim:</span>
                  <span className="font-mono-numbers">-₺{finalDiscount.toFixed(2)}</span>
                </div>
              )}
              {tipAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Bahşiş:</span>
                  <span className="font-mono-numbers">+₺{tipAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>KDV Dahil (%{vatRate}):</span>
                <span className="font-mono-numbers">₺{vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-100 pt-2 border-t border-slate-800">
                <span>{checkoutMode === 'SPLIT_BY_ITEMS' ? 'Bu Kişinin Ödeyeceği:' : 'Ödenecek Tutar:'}</span>
                <span className="font-mono-numbers text-amber-400 text-xl">₺{grandTotal.toLocaleString('tr-TR')}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Payment Methods, Discounts, Tips & Actions */}
          <div className="w-full md:w-7/12 p-5 md:p-6 flex flex-col justify-between overflow-y-auto bg-slate-900">
            {/* Top Bar with Close button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>{checkoutMode === 'SPLIT_BY_ITEMS' ? 'Parçalı Fiş & Ödeme Alma' : 'Masa Ödeme & Kasa İşlemi'}</span>
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Payment Method Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Ödeme Yöntemi Seçin:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'CREDIT_CARD'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs">Kredi Kartı</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'CASH'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="text-xs">Nakit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TRANSFER')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'TRANSFER'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="text-xs">Havale/FAST</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('SPLIT');
                      setSplitCash((grandTotal / 2).toFixed(0));
                      setSplitCard((grandTotal / 2).toFixed(0));
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'SPLIT'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Split className="w-5 h-5" />
                    <span className="text-xs">Karma (Nakit+Kart)</span>
                  </button>
                </div>
              </div>

              {/* Cash Quick Tendered Buttons & Change Calculation */}
              {paymentMethod === 'CASH' && (
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Alınan Nakit Para:</span>
                    <input
                      type="number"
                      value={cashTendered || ''}
                      onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-right font-mono font-bold text-amber-400 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Fast cash buttons */}
                  <div className="flex items-center gap-1.5">
                    {[100, 200, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashTendered(amt)}
                        className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 font-mono-numbers"
                      >
                        ₺{amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCashTendered(grandTotal)}
                      className="px-2.5 py-1.5 bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold"
                    >
                      Tam
                    </button>
                  </div>

                  {cashTendered > grandTotal && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-bold text-emerald-400">
                      <span>Para Üstü:</span>
                      <span className="text-base font-mono-numbers font-black">
                        ₺{changeAmount.toLocaleString('tr-TR')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Split Payment Inputs */}
              {paymentMethod === 'SPLIT' && (
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Nakit Tutarı (₺):
                    </label>
                    <input
                      type="number"
                      value={splitCash}
                      onChange={(e) => setSplitCash(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Kredi Kartı (₺):
                    </label>
                    <input
                      type="number"
                      value={splitCard}
                      onChange={(e) => setSplitCard(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-100"
                    />
                  </div>
                </div>
              )}

              {/* Discount Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase">İndirim Uygula:</span>
                  {finalDiscount > 0 && (
                    <span className="text-xs text-rose-400 font-bold font-mono-numbers">
                      -₺{finalDiscount.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setDiscountPercent(pct);
                        setCustomDiscount('');
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        discountPercent === pct && !customDiscount
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      %{pct}
                    </button>
                  ))}
                  <input
                    type="number"
                    placeholder="₺ Özel"
                    value={customDiscount}
                    onChange={(e) => {
                      setCustomDiscount(e.target.value);
                      setDiscountPercent(0);
                    }}
                    className="w-20 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-center font-mono text-rose-300 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Tip / Bahşiş Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase">Garson Bahşişi:</span>
                  {tipAmount > 0 && (
                    <span className="text-xs text-emerald-400 font-bold font-mono-numbers">
                      +₺{tipAmount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 20, 50, 100, 150].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTipAmount(amt)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        tipAmount === amt
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {amt === 0 ? 'Yok' : `₺${amt}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                onClick={handleCompleteCheckout}
                disabled={isProcessing || (checkoutMode === 'SPLIT_BY_ITEMS' && splitSubtotal <= 0)}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm tracking-wide rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
              >
                {isProcessing ? (
                  <span className="animate-spin w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    <span>
                      {checkoutMode === 'SPLIT_BY_ITEMS'
                        ? `${splitPersonLabel} ÖDEMESİNİ AL & FİŞ KES (₺${grandTotal.toLocaleString('tr-TR')})`
                        : `ÖDEMEYİ TAMAMLA VE MASAYI KAPAT (₺${grandTotal.toLocaleString('tr-TR')})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Thermal Receipt Modal */}
      {showReceiptModal && completedPaymentRecord && (
        <ThermalReceiptModal
          payment={completedPaymentRecord}
          onClose={() => {
            setShowReceiptModal(false);
            onPaymentCompleted();
            if (checkoutMode === 'FULL' || activeItems.length <= 1) {
              onClose();
            }
          }}
        />
      )}
    </>
  );
};
