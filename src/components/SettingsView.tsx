import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { Settings, Printer, Volume2, Moon, Sun, RotateCcw, Save, ShieldCheck, Building, Percent, Sliders, FileText } from 'lucide-react';
import { RolePermissionsManager } from './RolePermissionsManager';
import { PrinterManagementView } from './PrinterManagementView';

export const SettingsView: React.FC = () => {
  const { soundEnabled, toggleSound, theme, setTheme, settings, updateSettings, resetDemoDatabase, addToast } = usePOS();
  const [activeTabSection, setActiveTabSection] = useState<'permissions' | 'printers' | 'templates' | 'general'>('permissions');

  const [restaurantName, setRestaurantName] = useState<string>('ÖZER RESTAURANT');
  const [address, setAddress] = useState<string>('Bağdat Caddesi No: 142 Kadıköy / İSTANBUL');
  const [phone, setPhone] = useState<string>('0216 555 40 40');
  const [taxNumber, setTaxNumber] = useState<string>('8492019482');
  const [vatRate, setVatRate] = useState<number>(10);
  const [receiptFooter, setReceiptFooter] = useState<string>('Afiyet olsun! Bizi tercih ettiğiniz için teşekkür ederiz.');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (settings) {
      setRestaurantName(settings.name || 'ÖZER RESTAURANT');
      setAddress(settings.address || 'Bağdat Caddesi No: 142 Kadıköy / İSTANBUL');
      setPhone(settings.phone || '0216 555 40 40');
      setTaxNumber(settings.taxNumber || '8492019482');
      setVatRate(settings.defaultVatRate ?? 10);
      setReceiptFooter(settings.receiptFooter || 'Afiyet olsun! Bizi tercih ettiğiniz için teşekkür ederiz.');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateSettings({
      name: restaurantName,
      address,
      phone,
      taxNumber,
      defaultVatRate: Number(vatRate) || 10,
      receiptFooter,
    });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <span>Sistem & Yetki Yönetimi</span>
          </h1>
          <p className="text-xs text-slate-400">Rol yetki matrisi, sayfa erişim izinleri, restoran profili, KDV oranları ve genel POS parametreleri</p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTabSection('permissions')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTabSection === 'permissions'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Rol & Yetkiler</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabSection('printers')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTabSection === 'printers'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Termal Yazıcılar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabSection('templates')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTabSection === 'templates'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Fiş Şablonları</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabSection('general')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTabSection === 'general'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Genel & KDV</span>
          </button>
        </div>
      </div>

      {activeTabSection === 'permissions' ? (
        <RolePermissionsManager />
      ) : activeTabSection === 'printers' ? (
        <PrinterManagementView initialTab="printers" />
      ) : activeTabSection === 'templates' ? (
        <PrinterManagementView initialTab="templates" />
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
        {/* Dynamic VAT / KDV Settings */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-400" />
            <span>Varsayılan KDV Oranı & Vergi Parametreleri</span>
          </h3>
          <p className="text-xs text-slate-400">
            Sürekli değişen KDV oranlarına göre fişlerde ve hesaplarda otomatik uygulanacak KDV oranını belirleyin:
          </p>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {[1, 8, 10, 18, 20].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setVatRate(rate)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                    vatRate === rate
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  %{rate} KDV
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="text-xs font-bold text-slate-300">Özel KDV Oranı (%):</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={vatRate}
                onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                className="w-28 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-400 font-mono font-bold text-center focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-400">
                (Şu an uygulanan oran: <strong className="text-amber-400">%{vatRate}</strong>)
              </span>
            </div>
          </div>
        </div>

        {/* Restaurant Profile */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-400" />
            <span>Restoran Bilgileri & Fiş Başlığı</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Restoran Adı</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Telefon</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Adres</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Vergi Kimlik No (VKN)</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fiş Alt Bilgi Notu</label>
            <input
              type="text"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Audio & Display Preferences */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Ses ve Arayüz Tercihleri</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-200 block">Sipariş & Mutfak Sesleri</span>
                <span className="text-[11px] text-slate-500">Mutfak bildirimi ve ödeme sesleri</span>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  soundEnabled
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {soundEnabled ? 'Açık 🔊' : 'Kapalı 🔇'}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-200 block">Tema Seçimi</span>
                <span className="text-[11px] text-slate-500">Koyu veya açık tema modu</span>
              </div>
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200"
              >
                {theme === 'dark' ? 'Koyu Mod 🌙' : 'Açık Mod ☀️'}
              </button>
            </div>
          </div>
        </div>

        {/* Database reset */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-xl">
          <h3 className="font-bold text-rose-400 text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Demo Veritabanını Başlangıç Durumuna Getir</span>
          </h3>
          <p className="text-xs text-slate-400">
            Tüm masaları, siparişleri ve ödemeleri demo başlangıç durumuna sıfırlar.
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm('Tüm veriler başlangıç demo durumuna getirilsin mi?')) {
                resetDemoDatabase();
              }
            }}
            className="py-2 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 text-xs font-bold transition-colors"
          >
            Verileri Sıfırla
          </button>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'KAYDEDİLİYOR...' : 'Tüm Ayarları Kaydet'}</span>
        </button>
      </form>
      )}
    </div>
  );
};
