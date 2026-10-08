import React, { useState, useMemo } from 'react';
import { PaymentRecord } from '../types';
import { formatOrderNumber, formatPaymentMethodTR } from '../utils/formatters';
import { X, Printer, CheckCircle2, ExternalLink, Copy, Check, Download, Info } from 'lucide-react';
import {
  generateThermalReceiptHtml,
  createReceiptBlobUrl,
  downloadReceiptHtml,
} from '../utils/printReceipt';

interface ThermalReceiptModalProps {
  payment: PaymentRecord;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ payment, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printSuccessNotice, setPrintSuccessNotice] = useState<boolean>(false);

  const htmlContent = useMemo(() => {
    return generateThermalReceiptHtml(payment);
  }, [payment]);

  const blobUrl = useMemo(() => {
    return createReceiptBlobUrl(htmlContent);
  }, [htmlContent]);

  const handlePrint = () => {
    setIsPrinting(true);
    setPrintSuccessNotice(true);
    try {
      window.print();
    } catch (err) {
      console.warn('Window print trigger:', err);
    }
    setTimeout(() => {
      setIsPrinting(false);
    }, 1200);
  };

  const receiptNoStr = payment.paymentNumber ? `#${payment.paymentNumber}` : formatOrderNumber(payment.id);

  const handleDownload = () => {
    const filename = `fis-${receiptNoStr.replace('#', '')}-${payment.tableName.replace(/\s+/g, '_')}.html`;
    downloadReceiptHtml(htmlContent, filename);
  };

  const handleCopyText = () => {
    const total = payment.totalAmount ?? payment.finalAmount ?? 0;
    const itemsText = (payment.items || payment.itemsSummary || [])
      .map(
        (i: any) =>
          `${i.quantity || 1}x ${i.productName || i.name} - ₺${(
            (i.unitPrice || i.price || 0) * (i.quantity || 1)
          ).toFixed(2)}`
      )
      .join('\n');

    const text = `================================\nÖZER RESTAURANT - BİLGİ FİŞİ\n================================\nMasa: ${
      payment.tableName
    }\nFiş No: ${receiptNoStr}${payment.orderNumber ? `\nSipariş No: ${formatOrderNumber(payment.orderNumber)}` : ''}\nGarson: ${
      payment.waiterName || 'Ahmet Yılmaz'
    }\nTarih: ${new Date(
      payment.createdAt || payment.timestamp || Date.now()
    ).toLocaleString('tr-TR')}\n--------------------------------\n${itemsText}\n--------------------------------\nAra Toplam: ₺${(
      payment.subtotal || total
    ).toFixed(2)}\nİndirim: ₺${payment.discountAmount || 0}\nBahşiş: ₺${
      payment.tipAmount || 0
    }\nTOPLAM: ₺${total.toFixed(2)}\nÖdeme: ${
      formatPaymentMethodTR(payment.paymentMethod || payment.method)
    }\n================================`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentMethod = payment.paymentMethod || payment.method || 'CREDIT_CARD';
  const totalAmount = payment.totalAmount ?? payment.finalAmount ?? 0;
  const createdAtStr = payment.createdAt || payment.timestamp || new Date().toISOString();
  const itemsList =
    payment.items ||
    (payment.itemsSummary || []).map((i: any) => ({
      productName: i.name || i.productName || 'Ürün',
      quantity: i.quantity || 1,
      unitPrice: i.price ?? i.unitPrice ?? 0,
      customization: i.customization,
    }));

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl my-auto flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-black text-sm text-slate-100">Tahsilat Başarılı • Fiş Hazır</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="my-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {/* Printable 80mm Visual Thermal Paper */}
          <div
            id="printable-receipt"
            className="bg-white text-slate-950 p-5 rounded-2xl shadow-xl font-mono text-xs border border-slate-200 leading-relaxed select-all"
          >
            {/* Store Branding */}
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-400">
              <div className="text-base font-black tracking-widest uppercase">ÖZER RESTAURANT</div>
              <div className="text-[10px] text-slate-700 font-bold">LEZZET & KEYİF NOKTASI</div>
              <div className="text-[9px] text-slate-500 mt-1">Bağdat Cad. No: 142 Kadıköy / İSTANBUL</div>
              <div className="text-[9px] text-slate-500">Tel: 0216 555 40 40 • VKN: 8492019482</div>
            </div>

            {/* Receipt Meta */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Masa: <strong>{payment.tableName}</strong></span>
                <span>Fiş: <strong>{receiptNoStr}</strong></span>
              </div>
              {payment.orderNumber && (
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Sipariş No:</span>
                  <strong>{formatOrderNumber(payment.orderNumber)}</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span>Garson: {payment.waiterName || 'Ahmet Yılmaz'}</span>
                <span>Tarih: {new Date(createdAtStr).toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>Kasa: KASA-1 ({payment.cashierName || 'Elif Kasa'})</span>
                <span>Saat: {new Date(createdAtStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Items List */}
            <div className="py-2 border-b-2 border-dashed border-slate-400 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">SİPARİŞ KALEMLERİ</div>
              {itemsList.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px] items-start">
                  <div className="flex-1 pr-2">
                    <span className="font-bold">{item.quantity}x</span> {item.productName}
                    {item.customization && (
                      <div className="text-[9px] text-slate-500 italic pl-3">• {item.customization}</div>
                    )}
                  </div>
                  <div className="font-bold font-mono text-right whitespace-nowrap">
                    ₺{((item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="py-2 border-b-2 border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-700">
                <span>Ara Toplam:</span>
                <span>₺{(payment.subtotal || totalAmount).toFixed(2)}</span>
              </div>

              {payment.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>İndirim Tutarı:</span>
                  <span>-₺{payment.discountAmount.toFixed(2)}</span>
                </div>
              )}

              {payment.tipAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Garson Bahşişi:</span>
                  <span>+₺{payment.tipAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-[10px] text-slate-500">
                <span>KDV Dahil (%10):</span>
                <span>₺{(payment.vatAmount || totalAmount * 0.1).toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-900 mt-1">
                <span>TOPLAM TUTAR:</span>
                <span>₺{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Details */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[11px]">
              <div className="flex justify-between font-bold">
                <span>ÖDEME YÖNTEMİ:</span>
                <span>
                  {currentMethod === 'CREDIT_CARD'
                    ? 'KREDİ KARTI / POS'
                    : currentMethod === 'CASH'
                    ? 'NAKİT'
                    : currentMethod === 'TRANSFER'
                    ? 'HAVALE / FAST'
                    : 'PARÇALI ÖDEME'}
                </span>
              </div>

              {payment.splitBreakdown && (
                <div className="mt-1 pl-2 text-[10px] text-slate-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span>• Nakit Tahsilat:</span>
                    <span className="font-mono">₺{payment.splitBreakdown.cash?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Kredi Kartı:</span>
                    <span className="font-mono">₺{payment.splitBreakdown.creditCard?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-[10px] text-slate-500 space-y-1">
              <div className="font-bold text-slate-800">AFİYET OLSUN</div>
              <div>Bizi tercih ettiğiniz için teşekkür ederiz.</div>
              <div className="text-[8px] text-slate-400 uppercase tracking-widest pt-1">
                Mali Değeri Yoktur • Bilgi Fişidir
              </div>
            </div>
          </div>
        </div>

        {/* Informative notice if iframe restricts print dialog */}
        {printSuccessNotice && (
          <div className="mb-2 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2 shrink-0">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Yazdırma komutu verildi. Tarayıcı diyaloğu açılmadıysa <strong>"Yeni Sekmede Aç"</strong> butonuna basabilirsiniz.</span>
          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="space-y-2 pt-1 shrink-0 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            {/* Direct Window Print */}
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="py-3 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Yazıcıya Gönderiliyor...' : 'Yazdır (80mm)'}</span>
            </button>

            {/* Guaranteed Open in New Tab via Blob Link */}
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Yeni Sekmede Aç</span>
            </a>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {/* Download Standalone Receipt File */}
              <button
                onClick={handleDownload}
                title="Fişi HTML / PDF formatında cihazınıza indirin"
                className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Fişi İndir</span>
              </button>

              {/* Copy Plain Text for WhatsApp/Bluetooth */}
              <button
                onClick={handleCopyText}
                className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Kopyalandı' : 'Metni Kopyala'}</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
