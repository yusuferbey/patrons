import { PaymentRecord, CashRegister } from '../types';
import { formatOrderNumber, formatPaymentMethodTR } from './formatters';

/**
 * Generates clean standalone 80mm thermal receipt HTML string
 */
export function generateThermalReceiptHtml(payment: PaymentRecord): string {
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

  const getMethodName = (m: string) => {
    switch (m) {
      case 'CREDIT_CARD':
        return 'KREDİ KARTI / POS';
      case 'CASH':
        return 'NAKİT';
      case 'TRANSFER':
      case 'HAVALE':
        return 'HAVALE / FAST';
      case 'SPLIT':
      case 'PARTIAL':
        return 'PARÇALI ÖDEME';
      default:
        return m;
    }
  };

  const itemsRows = itemsList
    .map(
      (item) => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; line-height: 1.3;">
      <div style="flex: 1; padding-right: 6px;">
        <span style="font-weight: bold;">${item.quantity}x</span> ${item.productName}
      </div>
      <div style="font-weight: bold; text-align: right; white-space: nowrap;">
        ₺${(item.unitPrice * item.quantity).toFixed(2)}
      </div>
    </div>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Adisyon Fişi - ${formatOrderNumber(payment.paymentNumber || payment.id)} - Masa ${payment.tableName}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      width: 78mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 6mm 4mm;
      font-family: 'Courier New', Courier, monospace, system-ui, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .border-dashed { border-top: 1px dashed #444; }
    .border-double { border-top: 2px dashed #000; }
    .py-1 { padding-top: 4px; padding-bottom: 4px; }
    .py-2 { padding-top: 8px; padding-bottom: 8px; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .no-print-bar {
      margin-bottom: 12px;
      padding: 8px;
      background: #f1f5f9;
      border-radius: 6px;
      text-align: center;
    }
    .print-btn {
      background: #0f172a;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
    }
    @media print {
      .no-print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <button class="print-btn" onclick="window.print()">🖨️ Bu Fişi Yazdır (Ctrl + P)</button>
  </div>

  <div class="text-center" style="margin-bottom: 8px;">
    <div style="font-size: 16px; font-weight: 900; letter-spacing: 1px;">ÖZER RESTAURANT</div>
    <div style="font-size: 10px; margin-top: 2px;">Lezzet & Keyif Noktası</div>
    <div style="font-size: 9px; color: #333;">Bağdat Caddesi No: 142 Kadıköy / İSTANBUL</div>
    <div style="font-size: 9px; color: #333;">Tel: 0216 555 40 40 • VKN: 8492019482</div>
  </div>

  <div class="border-dashed py-1" style="font-size: 11px; margin-bottom: 6px;">
    <div class="flex-between">
      <span>Masa: <strong>${payment.tableName}</strong></span>
      <span>Fiş: <strong>${formatOrderNumber(payment.paymentNumber || payment.id)}</strong></span>
    </div>
    ${
      payment.orderNumber
        ? `<div class="flex-between" style="font-size: 10px; color: #444;">
            <span>Sipariş No:</span>
            <span><strong>${formatOrderNumber(payment.orderNumber)}</strong></span>
          </div>`
        : ''
    }
    <div class="flex-between">
      <span>Garson: ${payment.waiterName || 'Ahmet Yılmaz'}</span>
      <span>Tarih: ${new Date(createdAtStr).toLocaleDateString('tr-TR')}</span>
    </div>
    <div class="flex-between" style="font-size: 10px; color: #444;">
      <span>Kasa: KASA-1 (${payment.cashierName || 'Elif Kasa'})</span>
      <span>Saat: ${new Date(createdAtStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  </div>

  <div class="border-double py-2">
    <div style="font-size: 10px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase;">SİPARİŞ DETAYI</div>
    ${itemsRows}
  </div>

  <div class="border-double py-2" style="font-size: 11px;">
    <div class="flex-between">
      <span>Ara Toplam:</span>
      <span>₺${(payment.subtotal || totalAmount).toFixed(2)}</span>
    </div>
    ${
      payment.discountAmount > 0
        ? `<div class="flex-between" style="color: #b91c1c;">
            <span>İndirim Tutarı:</span>
            <span>-₺${payment.discountAmount.toFixed(2)}</span>
          </div>`
        : ''
    }
    ${
      payment.tipAmount > 0
        ? `<div class="flex-between">
            <span>Garson Bahşişi:</span>
            <span>+₺${payment.tipAmount.toFixed(2)}</span>
          </div>`
        : ''
    }
    <div class="flex-between" style="font-size: 10px; color: #444;">
      <span>KDV Dahil (%10):</span>
      <span>₺${(payment.vatAmount || totalAmount * 0.1).toFixed(2)}</span>
    </div>
    <div class="flex-between font-black" style="font-size: 14px; margin-top: 6px; padding-top: 4px; border-top: 1px solid #000;">
      <span>TOPLAM TUTAR:</span>
      <span>₺${totalAmount.toFixed(2)}</span>
    </div>
  </div>

  <div class="border-dashed py-1" style="font-size: 11px;">
    <div class="flex-between font-bold">
      <span>ÖDEME ŞEKLİ:</span>
      <span>${getMethodName(currentMethod)}</span>
    </div>
    ${
      payment.splitBreakdown
        ? `<div style="font-size: 10px; padding-left: 8px; margin-top: 2px;">
            <div>• Nakit: ₺${payment.splitBreakdown.cash?.toFixed(2) || '0.00'}</div>
            <div>• Kredi Kartı: ₺${payment.splitBreakdown.creditCard?.toFixed(2) || '0.00'}</div>
          </div>`
        : ''
    }
  </div>

  <div class="text-center" style="margin-top: 12px; font-size: 10px; color: #333;">
    <div style="font-weight: bold; font-size: 11px;">AFİYET OLSUN</div>
    <div>Bizi tercih ettiğiniz için teşekkür ederiz.</div>
    <div style="font-size: 8px; color: #666; margin-top: 4px;">MALİ DEĞERİ YOKTUR • BİLGİ FİŞİDİR</div>
  </div>
</body>
</html>`;
}

/**
 * Generates clean standalone 80mm Z-Report HTML string
 */
export function generateZReportHtml(
  cashRegister: CashRegister | null,
  totals: {
    cashSales: number;
    cardSales: number;
    transferSales: number;
    totalSales: number;
    openingBalance: number;
    cashIn: number;
    cashOut: number;
    expectedCash: number;
    cashierName?: string;
  }
): string {
  const actualCash = cashRegister?.actualCash;
  const difference = cashRegister?.difference;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Mali Z-Raporu - Gün Sonu Kasa Devri</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      width: 78mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 6mm 4mm;
      font-family: 'Courier New', Courier, monospace, system-ui, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .border-dashed { border-top: 1px dashed #444; }
    .border-double { border-top: 2px dashed #000; }
    .py-1 { padding-top: 4px; padding-bottom: 4px; }
    .py-2 { padding-top: 8px; padding-bottom: 8px; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .no-print-bar {
      margin-bottom: 12px;
      padding: 8px;
      background: #f1f5f9;
      border-radius: 6px;
      text-align: center;
    }
    .print-btn {
      background: #0f172a;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
    }
    @media print {
      .no-print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <button class="print-btn" onclick="window.print()">🖨️ Z-Raporunu Yazdır (Ctrl + P)</button>
  </div>

  <div class="text-center" style="margin-bottom: 8px;">
    <div style="font-size: 16px; font-weight: 900; letter-spacing: 1px;">ÖZER RESTAURANT</div>
    <div style="font-size: 12px; font-weight: bold; margin-top: 2px;">GÜN SONU MALİ Z-RAPORU</div>
    <div style="font-size: 9px; color: #333;">VKN: 8492019482 • KASA NO: 01</div>
    <div style="font-size: 9px; color: #333;">
      Tarih: ${new Date().toLocaleDateString('tr-TR')} • Saat: ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
    </div>
  </div>

  <div class="border-double py-2" style="font-size: 11px;">
    <div class="flex-between">
      <span>AÇILIŞ BAKİYESİ:</span>
      <span class="font-bold">₺${totals.openingBalance.toFixed(2)}</span>
    </div>
    <div class="flex-between">
      <span>NAKİT SATIŞLAR:</span>
      <span class="font-bold">₺${totals.cashSales.toFixed(2)}</span>
    </div>
    <div class="flex-between">
      <span>KREDİ KARTI (POS):</span>
      <span class="font-bold">₺${totals.cardSales.toFixed(2)}</span>
    </div>
    <div class="flex-between">
      <span>HAVALE / FAST:</span>
      <span class="font-bold">₺${totals.transferSales.toFixed(2)}</span>
    </div>
    <div class="flex-between">
      <span>KASAYA GİRİŞ (AVANS):</span>
      <span class="font-bold">+₺${totals.cashIn.toFixed(2)}</span>
    </div>
    <div class="flex-between">
      <span>KASADAN ÇIKIŞ (GİDER):</span>
      <span class="font-bold">-₺${totals.cashOut.toFixed(2)}</span>
    </div>
  </div>

  <div class="border-double py-2" style="font-size: 12px;">
    <div class="flex-between font-black" style="font-size: 14px;">
      <span>TOPLAM SATIŞ:</span>
      <span>₺${totals.totalSales.toFixed(2)}</span>
    </div>
    <div class="flex-between font-bold" style="margin-top: 4px;">
      <span>KASADA BEKLENEN:</span>
      <span>₺${totals.expectedCash.toFixed(2)}</span>
    </div>
    ${
      actualCash !== undefined
        ? `<div class="flex-between font-bold" style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #666;">
            <span>SAYILAN FİİLİ NAKİT:</span>
            <span>₺${actualCash.toFixed(2)}</span>
          </div>`
        : ''
    }
    ${
      difference !== undefined
        ? `<div class="flex-between font-black">
            <span>KASA FARKI:</span>
            <span>${
              difference === 0
                ? 'TAM (₺0.00)'
                : difference > 0
                ? `+₺${difference.toFixed(2)} FAZLA`
                : `-₺${Math.abs(difference).toFixed(2)} EKSİK`
            }</span>
          </div>`
        : ''
    }
  </div>

  <div class="border-dashed py-2 text-center" style="font-size: 9px; color: #444;">
    <div>Kasa Sorumlusu: ${totals.cashierName || 'Elif Kasa'}</div>
    <div>İşbu belge gün sonu kasa devir tutanağıdır.</div>
    <div style="display: flex; justify-content: space-around; margin-top: 16px; font-size: 8px; color: #888;">
      <span>İmza (Kasa)</span>
      <span>İmza (Müdür)</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates clean standalone A4 Financial & POS Report HTML string
 */
export function generateA4ReportHtml(data: {
  periodLabel: string;
  totalRevenue: number;
  totalTicketCount: number;
  averageTicket: number;
  paymentMethodStats: {
    cash: number;
    creditCard: number;
    transfer: number;
    cashPercent: number;
    cardPercent: number;
    transferPercent: number;
  };
  totalDiscounts: number;
  totalTips: number;
  totalCancelledLoss: number;
  payments: PaymentRecord[];
}): string {
  const rowsHtml = data.payments
    .slice(0, 50)
    .map((p) => {
      const created = p.createdAt || p.timestamp || new Date().toISOString();
      const tot = p.totalAmount ?? p.finalAmount ?? 0;
      const method = p.paymentMethod || p.method || 'CASH';
      return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 6px 8px; font-family: monospace;">${p.paymentNumber ? `#${p.paymentNumber}` : formatOrderNumber(p.id)}</td>
        <td style="padding: 6px 8px; font-weight: bold;">${p.tableName}</td>
        <td style="padding: 6px 8px;">${p.waiterName}</td>
        <td style="padding: 6px 8px;">${formatPaymentMethodTR(method)}</td>
        <td style="padding: 6px 8px;">${new Date(created).toLocaleDateString('tr-TR')} ${new Date(created).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>
        <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: bold;">₺${tot.toFixed(2)}</td>
      </tr>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Mali Rapor - ${data.periodLabel}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      color: #0f172a;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 10px;
      border-radius: 8px;
    }
    .kpi-title { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; }
    .kpi-val { font-size: 18px; font-weight: 900; margin-top: 4px; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #0f172a; color: #fff; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; }
    .no-print-bar {
      margin-bottom: 12px;
      padding: 8px;
      background: #f1f5f9;
      border-radius: 6px;
      text-align: right;
    }
    .print-btn {
      background: #0f172a;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    }
    @media print {
      .no-print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <button class="print-btn" onclick="window.print()">🖨️ A4 Raporu Yazdır / PDF Kaydet</button>
  </div>

  <div class="header">
    <div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 900;">ÖZER RESTAURANT</h1>
      <p style="margin: 2px 0 0 0; color: #475569; font-size: 12px;">Mali Kasa & Satış Analiz Raporu (${data.periodLabel})</p>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748b;">
      <div>Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
      <div>VKN: 8492019482 • Kasa No: 01</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Toplam Net Satış</div>
      <div class="kpi-val" style="color: #b45309;">₺${data.totalRevenue.toLocaleString('tr-TR')}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${data.totalTicketCount} Adisyon</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Kredi Kartı (POS)</div>
      <div class="kpi-val" style="color: #1d4ed8;">₺${data.paymentMethodStats.creditCard.toLocaleString('tr-TR')}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Pay: %${data.paymentMethodStats.cardPercent}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Nakit Tahsilat</div>
      <div class="kpi-val" style="color: #047857;">₺${data.paymentMethodStats.cash.toLocaleString('tr-TR')}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Pay: %${data.paymentMethodStats.cashPercent}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Ortalama Adisyon</div>
      <div class="kpi-val" style="color: #7e22ce;">₺${data.averageTicket.toLocaleString('tr-TR')}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Masa Başı</div>
    </div>
  </div>

  <div style="margin-bottom: 20px; font-size: 11px; background: #f1f5f9; padding: 10px; border-radius: 8px; display: flex; justify-content: space-between;">
    <span>Uygulanan İndirim: <strong>₺${data.totalDiscounts.toFixed(2)}</strong></span>
    <span>Garson Bahşişleri: <strong>₺${data.totalTips.toFixed(2)}</strong></span>
    <span>Havale / FAST: <strong>₺${data.paymentMethodStats.transfer.toFixed(2)}</strong></span>
    <span>İptal / Zayi Kaybı: <strong>₺${data.totalCancelledLoss.toFixed(2)}</strong></span>
  </div>

  <h3 style="font-size: 13px; margin: 0 0 6px 0;">Tahsilat & Fiş Kayıtları Dökümü</h3>
  <table>
    <thead>
      <tr>
        <th>Fiş No</th>
        <th>Masa</th>
        <th>Garson</th>
        <th>Yöntem</th>
        <th>Tarih & Saat</th>
        <th style="text-align: right;">Tahsil Edilen</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 10px;">
    <span>Özer POS Restoran Otomasyon Sistemi</span>
    <span>Sayfa 1 / 1</span>
  </div>
</body>
</html>`;
}

/**
 * Creates a downloadable/viewable Blob URL from HTML content
 */
export function createReceiptBlobUrl(htmlContent: string): string {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  return URL.createObjectURL(blob);
}

/**
 * Downloads HTML file directly (works 100% reliably on all browsers and iframes)
 */
export function downloadReceiptHtml(htmlContent: string, filename: string = 'fis.html') {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Universal print handler that triggers window.print directly on current page
 * with proper CSS visibility or opens in new tab via blob
 */
export function printHtmlDirectly(htmlContent: string): boolean {
  // If we have an on-screen printable receipt container, try direct window.print()
  try {
    window.print();
    return true;
  } catch (err) {
    console.warn('Standard window.print() failed:', err);
  }

  // Fallback: create blob URL and open
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (e) {
    console.error('Blob open failed:', e);
  }

  return false;
}

/**
 * Opens receipt in new tab using Blob URL (bypasses popup blocker)
 */
export function openReceiptInNewTab(htmlContent: string) {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
