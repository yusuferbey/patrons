import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { Printer as PrinterIcon, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, FileText, Send, Wifi, Settings2, Sliders, Check } from 'lucide-react';

export interface ThermalPrinter {
  id: string;
  name: string;
  ip: string;
  port: number;
  station: 'KITCHEN' | 'BAR' | 'CASHIER' | 'ALL';
  categories: string[];
  paperWidth: '80mm' | '58mm';
  isActive: boolean;
  status?: 'ONLINE' | 'OFFLINE';
  lastSeen?: string;
}

export interface PrinterTemplate {
  id: string;
  name: string;
  type: 'KITCHEN' | 'RECEIPT' | 'BAR' | 'Z_REPORT';
  headerText: string;
  footerText: string;
  showLogo: boolean;
  showQrCode: boolean;
  showTableWaiterInfo: boolean;
  fontSize: 'SMALL' | 'NORMAL' | 'LARGE';
  cutPaper: boolean;
}

interface PrinterManagementViewProps {
  initialTab?: 'printers' | 'templates';
}

export const PrinterManagementView: React.FC<PrinterManagementViewProps> = ({ initialTab = 'printers' }) => {
  const { categories, addToast, authFetch } = usePOS();
  const [subTab, setSubTab] = useState<'printers' | 'templates'>(initialTab);
  const [printers, setPrinters] = useState<ThermalPrinter[]>([]);
  const [templates, setTemplates] = useState<PrinterTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Printer Modal State
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<ThermalPrinter | null>(null);
  const [printerName, setPrinterName] = useState('');
  const [printerIp, setPrinterIp] = useState('192.168.1.200');
  const [printerPort, setPrinterPort] = useState(9100);
  const [printerStation, setPrinterStation] = useState<'KITCHEN' | 'BAR' | 'CASHIER' | 'ALL'>('KITCHEN');
  const [printerCategories, setPrinterCategories] = useState<string[]>([]);
  const [printerPaperWidth, setPrinterPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [printerIsActive, setPrinterIsActive] = useState(true);

  // New Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PrinterTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<'KITCHEN' | 'RECEIPT' | 'BAR' | 'Z_REPORT'>('KITCHEN');
  const [templateHeader, setTemplateHeader] = useState('ÖZER RESTAURANT & CAFE');
  const [templateFooter, setTemplateFooter] = useState('Bizi tercih ettiğiniz için teşekkür ederiz. Afiyet olsun!');
  const [templateShowLogo, setTemplateShowLogo] = useState(true);
  const [templateShowQr, setTemplateShowQr] = useState(true);
  const [templateShowWaiterInfo, setTemplateShowWaiterInfo] = useState(true);
  const [templateFontSize, setTemplateFontSize] = useState<'SMALL' | 'NORMAL' | 'LARGE'>('NORMAL');
  const [templateCutPaper, setTemplateCutPaper] = useState(true);

  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [printersRes, templatesRes] = await Promise.all([
        authFetch('/api/printers'),
        authFetch('/api/printer-templates'),
      ]);

      if (printersRes.ok) {
        const pData = await printersRes.json();
        setPrinters(pData);
      }
      if (templatesRes.ok) {
        const tData = await templatesRes.json();
        setTemplates(tData);
      }
    } catch (e) {
      console.error('Error loading printers data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenNewPrinter = () => {
    setEditingPrinter(null);
    setPrinterName('');
    setPrinterIp('192.168.1.' + Math.floor(100 + Math.random() * 150));
    setPrinterPort(9100);
    setPrinterStation('KITCHEN');
    setPrinterCategories([]);
    setPrinterPaperWidth('80mm');
    setPrinterIsActive(true);
    setIsPrinterModalOpen(true);
  };

  const handleOpenEditPrinter = (p: ThermalPrinter) => {
    setEditingPrinter(p);
    setPrinterName(p.name);
    setPrinterIp(p.ip);
    setPrinterPort(p.port);
    setPrinterStation(p.station);
    setPrinterCategories(p.categories || []);
    setPrinterPaperWidth(p.paperWidth || '80mm');
    setPrinterIsActive(p.isActive ?? true);
    setIsPrinterModalOpen(true);
  };

  const handleSavePrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editingPrinter ? editingPrinter.id : `printer-${Date.now()}`,
      name: printerName,
      ip: printerIp,
      port: Number(printerPort),
      station: printerStation,
      categories: printerCategories,
      paperWidth: printerPaperWidth,
      isActive: printerIsActive,
      status: 'ONLINE',
      lastSeen: new Date().toISOString(),
    };

    try {
      const res = await authFetch('/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        addToast('success', 'Yazıcı Kaydedildi', `${printerName} başarıyla yapılandırıldı.`);
        setIsPrinterModalOpen(false);
        fetchData();
      }
    } catch {
      addToast('error', 'Hata', 'Yazıcı kaydedilemedi.');
    }
  };

  const handleDeletePrinter = async (id: string, name: string) => {
    if (!confirm(`"${name}" yazıcısını silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await authFetch(`/api/printers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('info', 'Yazıcı Silindi', `${name} kaldırıldı.`);
        fetchData();
      }
    } catch {
      addToast('error', 'Hata', 'Yazıcı silinemedi.');
    }
  };

  const handleTestPrinter = async (printer: ThermalPrinter) => {
    setTestingId(printer.id);
    try {
      const res = await authFetch(`/api/printers/${printer.id}/test`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Test Başarılı', `${printer.name} (${printer.ip}:${printer.port}) test çıktısı gönderildi.`);
      } else {
        addToast('warning', 'Uyarı', data.message || 'Yazıcıya ulaşılamadı.');
      }
    } catch {
      addToast('error', 'Hata', 'Test çıktısı gönderilemedi.');
    } finally {
      setTestingId(null);
    }
  };

  // Template Handlers
  const handleOpenNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateType('KITCHEN');
    setTemplateHeader('ÖZER RESTAURANT');
    setTemplateFooter('Afiyet olsun!');
    setTemplateShowLogo(true);
    setTemplateShowQr(true);
    setTemplateShowWaiterInfo(true);
    setTemplateFontSize('NORMAL');
    setTemplateCutPaper(true);
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (t: PrinterTemplate) => {
    setEditingTemplate(t);
    setTemplateName(t.name);
    setTemplateType(t.type);
    setTemplateHeader(t.headerText);
    setTemplateFooter(t.footerText);
    setTemplateShowLogo(t.showLogo);
    setTemplateShowQr(t.showQrCode);
    setTemplateShowWaiterInfo(t.showTableWaiterInfo);
    setTemplateFontSize(t.fontSize);
    setTemplateCutPaper(t.cutPaper);
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editingTemplate ? editingTemplate.id : `tmpl-${Date.now()}`,
      name: templateName,
      type: templateType,
      headerText: templateHeader,
      footerText: templateFooter,
      showLogo: templateShowLogo,
      showQrCode: templateShowQr,
      showTableWaiterInfo: templateShowWaiterInfo,
      fontSize: templateFontSize,
      cutPaper: templateCutPaper,
    };

    try {
      const res = await authFetch('/api/printer-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        addToast('success', 'Şablon Kaydedildi', `${templateName} şablonu kaydedildi.`);
        setIsTemplateModalOpen(false);
        fetchData();
      }
    } catch {
      addToast('error', 'Hata', 'Şablon kaydedilemedi.');
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`"${name}" şablonunu silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await authFetch(`/api/printer-templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('info', 'Şablon Silindi', `${name} kaldırıldı.`);
        fetchData();
      }
    } catch {
      addToast('error', 'Hata', 'Şablon silinemedi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs: Printers vs Templates */}
      <div className="flex items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('printers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'printers'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <PrinterIcon className="w-4 h-4" />
            <span>Termal Yazıcılar ({printers.length})</span>
          </button>
          <button
            onClick={() => setSubTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'templates'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Fiş & Adisyon Şablonları ({templates.length})</span>
          </button>
        </div>

        {subTab === 'printers' ? (
          <button
            onClick={handleOpenNewPrinter}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Yeni Yazıcı Ekle</span>
          </button>
        ) : (
          <button
            onClick={handleOpenNewTemplate}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Yeni Şablon Ekle</span>
          </button>
        )}
      </div>

      {/* 1. PRINTERS TAB */}
      {subTab === 'printers' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>Ağ Yönlendirmesi:</strong> Sipariş girildiğinde ürün istasyonuna (Mutfak, Bar, Kasa) veya kategori eşlemesine göre ilgili termal yazıcıya otomatik ESC/POS komutu iletilir.
              </span>
            </div>
            <button
              onClick={fetchData}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {printers.map((printer) => (
              <div
                key={printer.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700">
                        <PrinterIcon className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm">{printer.name}</h3>
                        <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          {printer.ip}:{printer.port}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        printer.station === 'KITCHEN'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : printer.station === 'BAR'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : printer.station === 'CASHIER'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      }`}
                    >
                      {printer.station === 'KITCHEN'
                        ? '🍳 Mutfak'
                        : printer.station === 'BAR'
                        ? '☕ Bar'
                        : printer.station === 'CASHIER'
                        ? '💳 Kasa'
                        : '🌐 Genel'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80 mb-4">
                    <div className="flex justify-between">
                      <span>Kağıt Genişliği:</span>
                      <strong className="text-slate-200">{printer.paperWidth}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>İstasyon / Konum:</span>
                      <strong className="text-slate-200">{printer.station}</strong>
                    </div>
                    {printer.categories && printer.categories.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[11px] text-slate-500 block mb-1">Eşleşen Kategoriler:</span>
                        <div className="flex flex-wrap gap-1">
                          {printer.categories.map((c) => (
                            <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 border border-slate-800">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTestPrinter(printer)}
                    disabled={testingId === printer.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Send className={`w-3 h-3 text-amber-400 ${testingId === printer.id ? 'animate-bounce' : ''}`} />
                    <span>{testingId === printer.id ? 'Yazdırılıyor...' : 'Test Çıktısı'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditPrinter(printer)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700 transition-colors"
                      title="Düzenle"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePrinter(printer.id, printer.name)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. TEMPLATES TAB */}
      {subTab === 'templates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm">{tpl.name}</h3>
                        <span className="text-[11px] text-slate-400 uppercase font-mono">{tpl.type} Şablonu</span>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Preview Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-300 space-y-1.5 mb-4 shadow-inner">
                    <div className="text-center font-bold text-slate-100 border-b border-slate-800 pb-1">
                      {tpl.headerText || 'ÖZER POS'}
                    </div>
                    {tpl.showTableWaiterInfo && (
                      <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                        <span>Masa: Salon 04</span>
                        <span>Garson: Ahmet Y.</span>
                      </div>
                    )}
                    <div className="py-1 border-t border-b border-slate-800/80 space-y-0.5 text-[10px]">
                      <div className="flex justify-between">
                        <span>2x Özer Burger</span>
                        <span>₺640,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Çıtır Patates</span>
                        <span>₺120,00</span>
                      </div>
                    </div>
                    <div className="text-center text-[10px] text-slate-500 italic pt-1">
                      {tpl.footerText}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 text-[10px] mb-2">
                    {tpl.showLogo && <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Logo</span>}
                    {tpl.showQrCode && <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">QR Kod</span>}
                    {tpl.cutPaper && <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Otomatik Kesim</span>}
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Font: {tpl.fontSize}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditTemplate(tpl)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1 border border-slate-700 transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Düzenle</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRINTER MODAL */}
      {isPrinterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <PrinterIcon className="w-5 h-5 text-amber-400" />
              <span>{editingPrinter ? 'Yazıcı Yapılandırmasını Düzenle' : 'Yeni Termal Ağ Yazıcısı'}</span>
            </h2>

            <form onSubmit={handleSavePrinter} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Yazıcı Adı</label>
                <input
                  type="text"
                  required
                  value={printerName}
                  onChange={(e) => setPrinterName(e.target.value)}
                  placeholder="Örn: Mutfak Sıcak Hattı Yazıcısı"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ağ IP Adresi</label>
                  <input
                    type="text"
                    required
                    value={printerIp}
                    onChange={(e) => setPrinterIp(e.target.value)}
                    placeholder="192.168.1.200"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Port (Varsayılan: 9100)</label>
                  <input
                    type="number"
                    required
                    value={printerPort}
                    onChange={(e) => setPrinterPort(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">İstasyon Yönlendirmesi</label>
                  <select
                    value={printerStation}
                    onChange={(e) => setPrinterStation(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="KITCHEN">🍳 Mutfak İstasyonu</option>
                    <option value="BAR">☕ Bar & İçecek İstasyonu</option>
                    <option value="CASHIER">💳 Kasa / Adisyon</option>
                    <option value="ALL">🌐 Tüm İstasyonlar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Kağıt Formatı</label>
                  <select
                    value={printerPaperWidth}
                    onChange={(e) => setPrinterPaperWidth(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="80mm">80 mm (Geniş Termal)</option>
                    <option value="58mm">58 mm (Dar Termal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Özel Kategori Yönlendirmeleri (İsteğe Bağlı)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  {categories.map((c) => {
                    const isSelected = printerCategories.includes(c.name);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          if (isSelected) {
                            setPrinterCategories(printerCategories.filter((cat) => cat !== c.name));
                          } else {
                            setPrinterCategories([...printerCategories, c.name]);
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrinterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEMPLATE MODAL */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>{editingTemplate ? 'Şablonu Düzenle' : 'Yeni Fiş Şablonu'}</span>
            </h2>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Şablon Adı</label>
                  <input
                    type="text"
                    required
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Örn: Mutfak Sipariş Fişi"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Şablon Türü</label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="KITCHEN">Mutfak Hazırlık Fişi</option>
                    <option value="RECEIPT">Adisyon / Müşteri Hesabı</option>
                    <option value="BAR">Bar Fişi</option>
                    <option value="Z_REPORT">Gün Sonu Z Raporu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Başlık Yazısı</label>
                <input
                  type="text"
                  value={templateHeader}
                  onChange={(e) => setTemplateHeader(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Alt Bilgi / Not</label>
                <input
                  type="text"
                  value={templateFooter}
                  onChange={(e) => setTemplateFooter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateShowLogo}
                    onChange={(e) => setTemplateShowLogo(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span className="text-xs text-slate-300">Logo Basılsın</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateShowQr}
                    onChange={(e) => setTemplateShowQr(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span className="text-xs text-slate-300">QR Kod Basılsın</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateShowWaiterInfo}
                    onChange={(e) => setTemplateShowWaiterInfo(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span className="text-xs text-slate-300">Masa & Garson Bilgisi</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateCutPaper}
                    onChange={(e) => setTemplateCutPaper(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span className="text-xs text-slate-300">Otomatik Kağıt Kes</span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
