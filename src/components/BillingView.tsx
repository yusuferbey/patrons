import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  Receipt,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  Sparkles,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Lock,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { TenantSubscriptionInfo, BillingDetails } from '../types';

export const BillingView: React.FC = () => {
  const { currentRestaurant, currentUser, fetchBillingInfo, updateBillingDetails, subscribeToPlan, addToast } = usePOS();

  const [billingInfo, setBillingInfo] = useState<TenantSubscriptionInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(true);

  // Edit Billing Modal State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<BillingDetails>({
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    billingEmail: '',
    address: '',
  });
  const [isSavingDetails, setIsSavingDetails] = useState<boolean>(false);

  // Subscribe Modal State
  const [showSubscribeModal, setShowSubscribeModal] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PRO' | 'ENTERPRISE'>('PRO');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [cardHolder, setCardHolder] = useState<string>(currentUser?.name || '');
  const [cardNumber, setCardNumber] = useState<string>('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('•••');
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchBillingInfo();
    if (data) {
      setBillingInfo(data);
      setEditForm(data.billingDetails);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentRestaurant?.id]);

  const handleSaveBillingDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDetails(true);
    const success = await updateBillingDetails(editForm);
    if (success) {
      setShowEditModal(false);
      await loadData();
    }
    setIsSavingDetails(false);
  };

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);
    const res = await subscribeToPlan({
      plan: selectedPlan,
      billingCycle,
      cardHolder,
    });
    if (res.success) {
      setShowSubscribeModal(false);
      await loadData();
    }
    setIsSubscribing(false);
  };

  const daysRemaining = billingInfo?.daysRemaining ?? 7;
  const isTrial = billingInfo?.planType === 'TRIAL' || currentRestaurant?.subscription?.status === 'TRIAL';

  return (
    <div id="billing-view-container" className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* A. Hero Banner                                                */}
      {/* ------------------------------------------------------------- */}
      <div
        id="billing-hero-banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl"
      >
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Faturalandırma</h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1">Abonelik ve fatura bilgilerinizi yönetin</p>
          </div>

          {/* Payment Provider Badges & Logos */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* iyzico */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-bold shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>iyzico ile Öde</span>
            </div>

            {/* Mastercard */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-slate-200 text-xs font-semibold shadow-sm">
              <div className="flex -space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 opacity-90 inline-block" />
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 opacity-90 inline-block" />
              </div>
              <span className="ml-1 text-[11px] font-bold">mastercard</span>
            </div>

            {/* Visa */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs font-extrabold tracking-wider text-blue-400 italic shadow-sm">
              VISA
            </div>

            {/* Amex */}
            <div className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-[11px] font-extrabold text-teal-400 shadow-sm">
              AMEX
            </div>

            {/* Troy */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs font-bold text-amber-300 shadow-sm flex items-center gap-1">
              <span className="text-[11px] uppercase tracking-wider">TROY</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* B. Active Plan / Subscription Status Card                     */}
      {/* ------------------------------------------------------------- */}
      <div
        id="billing-plan-card"
        className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-xl relative overflow-hidden transition-all hover:border-slate-700/80"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* POS Icon box */}
            <div className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-700/90 flex items-center justify-center shrink-0 shadow-inner">
              <Layers className="w-7 h-7 text-amber-400" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-white">
                  {billingInfo?.planName || (isTrial ? 'Deneme (Profesyonel)' : 'Profesyonel Plan')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {isTrial ? 'Deneme' : 'Aktif'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-2xl font-extrabold text-white font-mono-numbers">
                  ₺{billingInfo?.priceMonthly ?? 0}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ay</span>
                </span>

                {isTrial && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{daysRemaining} gün kaldı</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right CTA Button */}
          <div className="flex items-center gap-3">
            <button
              id="billing-subscribe-btn"
              onClick={() => setShowSubscribeModal(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              <Star className="w-4 h-4 fill-white text-white" />
              <span>{isTrial ? 'Abone Ol' : 'Planı Yükselt'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* C. Billing Details Card (Accordion)                           */}
      {/* ------------------------------------------------------------- */}
      <div id="billing-details-card" className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {/* Accordion Header */}
        <button
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-300">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Fatura Bilgileri</h3>
              <p className="text-xs text-slate-400">{billingInfo?.billingDetails?.companyName || currentRestaurant?.name || 'İşletme Bilgisi'}</p>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
            {isAccordionOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {/* Accordion Body */}
        {isAccordionOpen && (
          <div className="px-6 pb-6 pt-2 border-t border-slate-800/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-xs text-slate-400 block font-medium">Şirket / Ünvan</span>
                <span className="text-sm font-semibold text-slate-200 mt-1 block">
                  {billingInfo?.billingDetails?.companyName || currentRestaurant?.name || '-'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-xs text-slate-400 block font-medium">Vergi Kimlik / TC No</span>
                <span className="text-sm font-semibold text-slate-200 mt-1 block font-mono">
                  {billingInfo?.billingDetails?.taxNumber || currentRestaurant?.taxNumber || '-'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-xs text-slate-400 block font-medium">Vergi Dairesi</span>
                <span className="text-sm font-semibold text-slate-200 mt-1 block">
                  {billingInfo?.billingDetails?.taxOffice || 'Kadıköy Vergi Dairesi'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-xs text-slate-400 block font-medium">Fatura E-posta</span>
                <span className="text-sm font-semibold text-slate-200 mt-1 block">
                  {billingInfo?.billingDetails?.billingEmail || currentUser?.email || '-'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 sm:col-span-2">
                <span className="text-xs text-slate-400 block font-medium">Fatura Adresi</span>
                <span className="text-sm font-semibold text-slate-200 mt-1 block">
                  {billingInfo?.billingDetails?.address || currentRestaurant?.address || 'İstanbul, Türkiye'}
                </span>
              </div>
            </div>

            {/* Action footer */}
            <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-end">
              <button
                id="billing-edit-btn"
                onClick={() => {
                  if (billingInfo?.billingDetails) {
                    setEditForm(billingInfo.billingDetails);
                  }
                  setShowEditModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Bilgileri Düzenle</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* D. Transaction History Card                                   */}
      {/* ------------------------------------------------------------- */}
      <div id="billing-history-card" className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-xl">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-300">
            <Receipt className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">İşlem Geçmişi</h3>
            <p className="text-xs text-slate-400">
              {billingInfo?.transactions && billingInfo.transactions.length > 0
                ? `Toplam ${billingInfo.transactions.length} adet fatura/ödeme işlemi`
                : 'Hiçbir ödeme yok'}
            </p>
          </div>
        </div>

        {/* Table or Empty State */}
        {!billingInfo?.transactions || billingInfo.transactions.length === 0 ? (
          <div className="py-14 text-center rounded-2xl bg-slate-950/30 border border-dashed border-slate-800/80">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-500 mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-300">Hiçbir ödeme yok</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Aboneliğiniz başladığında veya faturalandırma gerçekleştiğinde tüm ödemeleriniz burada listelenir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                  <th className="pb-3 px-3">Tarih</th>
                  <th className="pb-3 px-3">Plan / Açıklama</th>
                  <th className="pb-3 px-3">Tutar</th>
                  <th className="pb-3 px-3">Durum</th>
                  <th className="pb-3 px-3 text-right">E-Fatura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {billingInfo.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5 px-3 text-xs text-slate-300">
                      {new Date(tx.date).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-white">{tx.planName}</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-200">
                      ₺{tx.amount.toLocaleString('tr-TR')}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Başarılı</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <a
                        href={tx.invoiceUrl || `/api/billing/invoice/${tx.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-700/80"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Görüntüle</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Modal: Edit Billing Info                                      */}
      {/* ------------------------------------------------------------- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Fatura Bilgilerini Düzenle</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBillingDetails} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Şirket Ünvanı / Adı</label>
                <input
                  type="text"
                  required
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                  placeholder="Örn: BigBoss Gıda ve Restoran Ltd. Şti."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Vergi Numarası / TCKN</label>
                  <input
                    type="text"
                    required
                    value={editForm.taxNumber}
                    onChange={(e) => setEditForm({ ...editForm, taxNumber: e.target.value })}
                    placeholder="10 veya 11 haneli"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Vergi Dairesi</label>
                  <input
                    type="text"
                    required
                    value={editForm.taxOffice}
                    onChange={(e) => setEditForm({ ...editForm, taxOffice: e.target.value })}
                    placeholder="Örn: Kadıköy V.D."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Fatura E-postası</label>
                <input
                  type="email"
                  required
                  value={editForm.billingEmail}
                  onChange={(e) => setEditForm({ ...editForm, billingEmail: e.target.value })}
                  placeholder="muhasebe@sirketiniz.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Fatura Adresi</label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Cadde, Mahalle, Kapı No, İlçe / İl"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSavingDetails}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingDetails ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Modal: Subscribe / Plan Selection & Checkout Modal             */}
      {/* ------------------------------------------------------------- */}
      {showSubscribeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span>Özer POS Aboneliğinizi Başlatın</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">İhtiyacınıza uygun paketi seçin, anında kullanmaya başlayın.</p>
              </div>
              <button
                onClick={() => setShowSubscribeModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cycle toggle (Monthly / Yearly) */}
            <div className="mt-5 flex items-center justify-center">
              <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    billingCycle === 'MONTHLY' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Aylık Ödeme
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('YEARLY')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    billingCycle === 'YEARLY'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Yıllık Ödeme</span>
                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                    %25 İndirim
                  </span>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
              {/* STARTER */}
              <div
                onClick={() => setSelectedPlan('STARTER')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all relative ${
                  selectedPlan === 'STARTER'
                    ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Başlangıç</div>
                <div className="text-xl font-extrabold text-white mt-1">
                  ₺{billingCycle === 'YEARLY' ? '575' : '690'}
                  <span className="text-[11px] font-normal text-slate-400">/ay</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 mt-3">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>15 Masa & Menü</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>8 Personel Hesabı</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Temel Kasa & Z Raporu</span>
                  </li>
                </ul>
              </div>

              {/* PRO */}
              <div
                onClick={() => setSelectedPlan('PRO')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all relative ${
                  selectedPlan === 'PRO'
                    ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="absolute -top-2.5 right-3 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Önerilen
                </span>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Profesyonel</div>
                <div className="text-xl font-extrabold text-white mt-1">
                  ₺{billingCycle === 'YEARLY' ? '1.075' : '1.290'}
                  <span className="text-[11px] font-normal text-slate-400">/ay</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 mt-3">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>35 Masa & VIP Localar</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>20 Personel + Garson App</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Mutfak KDS & Yazıcı</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Stok & Reçete Takibi</span>
                  </li>
                </ul>
              </div>

              {/* ENTERPRISE */}
              <div
                onClick={() => setSelectedPlan('ENTERPRISE')}
                className={`cursor-pointer rounded-2xl p-4 border transition-all relative ${
                  selectedPlan === 'ENTERPRISE'
                    ? 'bg-purple-600/10 border-purple-500 ring-2 ring-purple-500/20'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">Kurumsal</div>
                <div className="text-xl font-extrabold text-white mt-1">
                  ₺{billingCycle === 'YEARLY' ? '2.400' : '2.890'}
                  <span className="text-[11px] font-normal text-slate-400">/ay</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 mt-3">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>100+ Masa & Kat Planı</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Sınırsız Personel</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Çoklu Şube & Konsolide</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>7/24 VIP Müşteri Temsilcisi</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Payment Details Form */}
            <form onSubmit={handleSubscribeSubmit} className="mt-6 pt-5 border-t border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-200">Kredi / Banka Kartı Bilgileri</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Lock className="w-3 h-3" />
                  <span>256-bit SSL Güvenli Ödeme</span>
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Kart Üzerindeki İsim</label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Ad Soyad"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-400 block mb-1">Kart Numarası</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="•••• •••• •••• 4242"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">SKT (Ay/Yıl)</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div>
                  <div className="text-xs text-slate-400">Tahsil Edilecek Tutar:</div>
                  <div className="text-xl font-black text-white font-mono-numbers">
                    ₺
                    {billingCycle === 'YEARLY'
                      ? selectedPlan === 'STARTER'
                        ? '6.900'
                        : selectedPlan === 'ENTERPRISE'
                        ? '28.900'
                        : '12.900'
                      : selectedPlan === 'STARTER'
                      ? '690'
                      : selectedPlan === 'ENTERPRISE'
                      ? '2.890'
                      : '1.290'}
                    <span className="text-xs font-normal text-slate-400 ml-1">
                      {billingCycle === 'YEARLY' ? '/yıl (KDV dahil)' : '/ay (KDV dahil)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSubscribeModal(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={isSubscribing}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubscribing ? 'İşleniyor...' : 'Ödemeyi Tamamla ve Abone Ol'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
