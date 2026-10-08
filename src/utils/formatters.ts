// Turkish localization formatters and Order ID helpers

export function formatOrderNumber(
  orderOrVal?: { orderNumber?: number | string; id?: string } | number | string | null
): string {
  if (!orderOrVal) return '#1042';

  // If object passed
  if (typeof orderOrVal === 'object') {
    if (orderOrVal.orderNumber !== undefined && orderOrVal.orderNumber !== null && String(orderOrVal.orderNumber).trim() !== '') {
      const cleanNum = String(orderOrVal.orderNumber).replace(/^#/, '');
      return `#${cleanNum}`;
    }
    if (orderOrVal.id) {
      const match = String(orderOrVal.id).match(/\d+/g);
      if (match && match.length > 0) {
        const lastDigits = match[match.length - 1];
        if (lastDigits.length >= 3) {
          return `#${lastDigits.slice(-4)}`;
        }
      }
      return `#1042`;
    }
    return '#1042';
  }

  // If number or string passed
  const str = String(orderOrVal).trim();
  if (str.startsWith('#')) return str;
  const digitsOnly = str.replace(/[^0-9]/g, '');
  if (digitsOnly.length > 0) {
    return `#${digitsOnly.slice(-4)}`;
  }
  return `#${str}`;
}

export function formatStatusTR(status?: string | null): string {
  if (!status) return '';
  const upper = status.toUpperCase().trim();

  switch (upper) {
    // Order Item / Ticket Statuses
    case 'SERVED':
      return 'SERVİS EDİLDİ';
    case 'READY':
      return 'HAZIR';
    case 'WAITING':
      return 'BEKLİYOR';
    case 'KITCHEN':
      return 'MUTFAK';
    case 'NEW':
      return 'YENİ';
    case 'PREPARING':
      return 'HAZIRLANIYOR';
    case 'ACCEPTED':
      return 'HAZIRLANIYOR'; // Mutfağa kabul edildi / hazırlanıyor
    case 'COMPLETED':
      return 'TAMAMLANDI';
    case 'CANCELLED':
      return 'İPTAL EDİLDİ';
    case 'PENDING':
      return 'BEKLİYOR';
    case 'PAID':
      return 'ÖDENDİ';
    case 'UNPAID':
      return 'ÖDENMEDİ';

    // Table Statuses
    case 'EMPTY':
      return 'BOŞ';
    case 'OCCUPIED':
      return 'DOLU';
    case 'BILL_REQUESTED':
      return 'HESAP İSTENDİ';
    case 'RESERVED':
      return 'REZERVE';
    case 'ORDER_PENDING':
      return 'BEKLİYOR';
    case 'ACTIVE':
      return 'BEKLİYOR';

    default:
      return status;
  }
}

export function formatPaymentMethodTR(method?: string | null): string {
  if (!method) return 'Ödeme';
  const upper = method.toUpperCase().trim();

  switch (upper) {
    case 'CASH':
      return 'Nakit';
    case 'CREDIT_CARD':
      return 'Kredi Kartı';
    case 'HAVALE':
    case 'TRANSFER':
      return 'Havale / EFT';
    case 'SPLIT':
    case 'PARTIAL':
      return 'Parçalı Ödeme';
    default:
      return method;
  }
}

export function formatRoleTR(role?: string | null): string {
  if (!role) return '';
  const upper = role.toUpperCase().trim();

  switch (upper) {
    case 'ADMIN':
      return 'Yönetici';
    case 'CASHIER':
      return 'Kasiyer';
    case 'WAITER':
      return 'Garson';
    case 'KITCHEN':
      return 'Mutfak';
    default:
      return role;
  }
}

export function formatCategoryTR(cat?: string | null): string {
  if (!cat) return 'Genel';
  const upper = cat.toUpperCase().trim();

  switch (upper) {
    case 'AUTH':
      return 'Giriş / Kimlik';
    case 'ORDER':
      return 'Sipariş';
    case 'KITCHEN':
      return 'Mutfak';
    case 'PAYMENT':
      return 'Ödeme & Kasa';
    case 'TABLE':
      return 'Masa İşlemleri';
    case 'PRODUCT':
      return 'Ürün & Menü';
    case 'SETTINGS':
      return 'Ayarlar';
    case 'STOCK':
      return 'Stok Takibi';
    case 'RESERVATION':
      return 'Rezervasyon';
    default:
      return cat;
  }
}

export function formatStationTR(station?: string | null): string {
  if (!station) return 'Mutfak';
  const upper = station.toUpperCase().trim();
  switch (upper) {
    case 'KITCHEN':
      return 'Mutfak';
    case 'BAR':
      return 'Bar';
    default:
      return station;
  }
}
