export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'WAITER' | 'KITCHEN' | 'BARISTA' | 'CASHIER';

export type SubscriptionPlan = 'TRIAL' | 'STARTER' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'TRIAL';

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  maxTables?: number;
  maxStaff?: number;
  features?: string[];
}

export interface BillingDetails {
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  billingEmail: string;
  address?: string;
}

export interface PaymentTransaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  planName: string;
  invoiceUrl?: string;
}

export interface TenantSubscriptionInfo {
  planName: string;
  planType: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'PAST_DUE';
  priceMonthly: number;
  daysRemaining: number;
  trialEndsAt: string;
  billingDetails: BillingDetails;
  transactions: PaymentTransaction[];
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  taxOffice?: string;
  billingEmail?: string;
  billingDetails?: BillingDetails;
  transactions?: PaymentTransaction[];
  logo?: string;
  currency: string;
  subscription: Subscription;
  sections?: string[];
  active: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  restaurantId?: string;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  pin?: string;
  pinCode?: string;
  token?: string;
  avatar?: string;
  active: boolean;
  phone?: string;
  dailySales?: number;
  customRoleId?: string;
  permissions?: string[];
  customPermissionsEnabled?: boolean;
  allowedTabs?: ActiveTab[];
}

export type TableStatus =
  | 'EMPTY'           // BOŞ
  | 'OCCUPIED'        // DOLU
  | 'ORDER_PENDING'   // SİPARİŞ BEKLİYOR
  | 'KITCHEN'         // MUTFAKTA
  | 'READY'           // SERVİS BEKLİYOR
  | 'BILL_REQUESTED'  // HESAP İSTENDİ
  | 'RESERVED';       // REZERVE

export type TableSection = 'Salon' | 'Teras' | 'Bahçe' | 'VIP' | 'İç Mekan' | 'Bahçe / Teras' | 'VIP Salon' | string;

export interface RestaurantTable {
  id: string;
  restaurantId?: string;
  number?: number;
  name: string;
  section: TableSection;
  capacity: number;
  status: TableStatus;
  shape?: 'RECTANGLE' | 'ROUND' | 'SQUARE' | string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  currentOrderId?: string;
  currentWaiterId?: string;
  currentWaiterName?: string;
  responsibleWaiterId?: string;
  responsibleWaiterName?: string;
  tableOwnerId?: string;
  tableOwnerName?: string;
  lastActionById?: string;
  lastActionByName?: string;
  guestCount?: number;
  openedAt?: string;
  billRequestedAt?: string;
  reservationNotes?: string;
  currentReservationId?: string;
  totalAmount?: number;
  mergedWith?: string[]; // E.g. ["4", "5"]
}

export type ReservationStatus = 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW';

export interface Reservation {
  id: string;
  restaurantId?: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  tableId: string;
  tableName: string;
  section: TableSection;
  reservationDate: string; // YYYY-MM-DD
  reservationTime: string; // HH:mm
  status: ReservationStatus;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  seatedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface Category {
  id: string;
  restaurantId?: string;
  name: string;
  icon: string;
  sortOrder: number;
  active: boolean;
  color?: string;
  defaultStation?: KitchenStation;
}

export type KitchenStation = 'IZGARA' | 'PIZZA' | 'BAR' | 'TATLI' | 'MUTFAK' | 'Izgara' | 'Pizza' | 'Bar' | 'Tatlı';
export type ProductStation = KitchenStation;

export interface ProductExtra {
  id: string;
  name: string;
  price: number;
}

export type ProductUnit = 'adet' | 'kg' | 'gr' | 'lt' | 'porsiyon' | 'paket';

export type InventoryUnit = 'g' | 'kg' | 'adet' | 'ml' | 'L' | 'porsiyon';

export interface RecipeItem {
  inventoryItemId: string;
  inventoryItemName: string;
  amount: number;
  unit: InventoryUnit;
}

export interface InventoryItem {
  id: string;
  restaurantId?: string;
  name: string;
  category: string;
  unit: InventoryUnit;
  currentStock: number;
  minimumStock: number;
  unitCost: number;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  restaurantId?: string;
  inventoryItemId: string;
  inventoryItemName: string;
  type: 'SALE_DEDUCT' | 'MANUAL_ADD' | 'WASTE' | 'ORDER_CANCEL_RESTORE';
  quantityChange: number;
  unit: InventoryUnit;
  stockBefore: number;
  stockAfter: number;
  relatedOrderId?: string;
  relatedOrderNumber?: number | string;
  relatedProductName?: string;
  performedBy: string;
  timestamp: string;
  note?: string;
}

export interface Product {
  id: string;
  restaurantId?: string;
  name: string;
  categoryId: string;
  description?: string;
  price: number;
  costPrice?: number;
  photo?: string;
  stock?: number;
  unit?: ProductUnit;
  inStock?: boolean;
  active: boolean;
  station?: KitchenStation;
  popular?: boolean;
  vatRate?: number; // e.g. 10 for %10
  sortOrder?: number;
  extras?: ProductExtra[];
  removableIngredients?: string[];
  recipe?: RecipeItem[];
}

export interface OrderItemCustomization {
  extras?: ProductExtra[];
  removedIngredients?: string[];
  specialNote?: string;
}

export type OrderItemStatus =
  | 'NEW'        // YENİ
  | 'ACCEPTED'   // KABUL EDİLDİ / HAZIRLANIYOR
  | 'PREPARING'  // HAZIRLANIYOR
  | 'READY'      // HAZIR / SERVİSE HAZIR
  | 'SERVED'     // SERVİS EDİLDİ
  | 'CANCELLED'; // İPTAL

export interface OrderItem {
  id: string;
  restaurantId?: string;
  orderId?: string;
  orderNumber?: string;
  tableId?: string;
  tableName?: string;
  productId: string;
  productName: string;
  productPhoto?: string;
  categoryId?: string;
  station: KitchenStation;
  unitPrice: number;
  quantity: number;
  customization?: OrderItemCustomization;
  status: OrderItemStatus;
  addedByWaiterId?: string;
  addedByWaiterName?: string;
  source?: 'POS' | 'WAITER_MOBILE' | 'QR';
  batchId?: string;
  createdAt?: string;
  preparingAt?: string;
  readyAt?: string;
  servedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  cancelledBy?: string;
}

export type OrderStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  restaurantId?: string;
  orderNumber?: number | string;
  tableId: string;
  tableName: string;
  waiterId: string;
  waiterName: string;
  responsibleWaiterId?: string;
  responsibleWaiterName?: string;
  source?: 'POS' | 'WAITER_MOBILE' | 'QR';
  deviceType?: 'DESKTOP' | 'MOBILE' | 'TABLET';
  guestCount: number;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
  generalNote?: string;
  status: OrderStatus;
  createdAt: string;
  completedAt?: string;
}

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'HAVALE' | 'TRANSFER' | 'SPLIT' | 'PARTIAL';

export interface PartialPaymentBreakdown {
  cash: number;
  creditCard: number;
}

export interface PaymentRecord {
  id: string;
  restaurantId?: string;
  orderId?: string;
  orderNumber?: number | string;
  paymentNumber?: number;
  tableId: string;
  tableName: string;
  waiterName: string;
  cashierName?: string;
  items?: { productName: string; quantity: number; unitPrice: number; customization?: OrderItemCustomization }[];
  itemsSummary?: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discountPercent?: number;
  discountAmount: number;
  tipAmount: number;
  totalAmount?: number;
  finalAmount?: number;
  vatAmount?: number;
  paymentMethod?: PaymentMethod;
  method?: PaymentMethod;
  splitBreakdown?: PartialPaymentBreakdown;
  partialBreakdown?: PartialPaymentBreakdown[] | any;
  isPartial?: boolean;
  splitPersonLabel?: string;
  notes?: string;
  createdAt?: string;
  timestamp?: string;
}

export interface CashRegister {
  id: string;
  restaurantId?: string;
  date: string;
  openingBalance: number;
  cashSales: number;
  cardSales: number;
  transferSales: number;
  totalSales: number;
  discountsGiven: number;
  refunds: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt?: string;
  notes?: string;
}

export interface CancelledItemRecord {
  id: string;
  restaurantId?: string;
  orderId: string;
  tableName: string;
  productName: string;
  quantity: number;
  price: number;
  reason: string;
  cancelledBy: string;
  timestamp: string;
}

export type AuditEventType =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'TABLE_OPENED'
  | 'TABLE_CLOSED'
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_CANCELLED'
  | 'ITEM_ADDED'
  | 'ITEM_REMOVED'
  | 'ITEM_CANCELLED'
  | 'ORDER_SENT_KITCHEN'
  | 'ORDER_SENT_BAR'
  | 'ORDER_ACCEPTED'
  | 'ORDER_PREPARING'
  | 'ORDER_READY'
  | 'ITEM_SERVED'
  | 'ALL_ITEMS_SERVED'
  | 'WAITER_CHANGED'
  | 'TABLE_TRANSFERRED'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_CANCELLED'
  | 'DISCOUNT_APPLIED'
  | 'PRICE_CHANGED'
  | 'STOCK_DECREASED'
  | 'STOCK_INCREASED';

export interface AuditLog {
  id: string;
  businessId?: string;
  restaurantId?: string;
  timestamp: string;
  userId?: string;
  userName: string;
  userRole: UserRole;
  performedBy?: string;
  action: string;
  eventType?: AuditEventType;
  details: string;
  category: 'AUTH' | 'ORDER' | 'KITCHEN' | 'PAYMENT' | 'TABLE' | 'PRODUCT' | 'SETTINGS' | 'STOCK' | 'RESERVATION' | 'ROLES' | 'PRINTER';
  orderNumber?: number | string;
  orderId?: string;
  orderItemId?: string;
  tableId?: string;
  tableName?: string;
  productName?: string;
  actionType?: string;
  itemsSummary?: string;
  meta?: any;
}

export type ActiveTab =
  | 'dashboard'
  | 'tables'
  | 'reservations'
  | 'orders'
  | 'kitchen'
  | 'products'
  | 'categories'
  | 'stock'
  | 'staff'
  | 'payments'
  | 'cash-register'
  | 'reports'
  | 'audit-logs'
  | 'settings'
  | 'roles'
  | 'printers'
  | 'super-admin'
  | 'billing';

// -------------------------------------------------------------
// Granular Permissions & Custom Roles
// -------------------------------------------------------------
export interface PermissionDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  alias?: string;
}

export const ALL_SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // Masalar & Kat Planı
  { id: 'tables.view', alias: 'MASA_GOR', name: 'Masaları Görüntüle', category: 'Masalar', description: 'Kat planı ve masa durumlarını izleme' },
  { id: 'tables.edit', alias: 'MASA_DUZENLE', name: 'Masa Düzenle & Taşı', category: 'Masalar', description: 'Masa açma, kapatma, transfer ve birleştirme' },
  
  // Sipariş & Adisyon
  { id: 'orders.view', alias: 'SIPARIS_GOR', name: 'Siparişleri Görüntüle', category: 'Siparişler', description: 'Tüm siparişleri ve adisyon detaylarını görme' },
  { id: 'orders.create', alias: 'SIPARIS_OLUSTUR', name: 'Sipariş Oluştur', category: 'Siparişler', description: 'Masaya ürün ekleme ve sipariş gönderme' },
  { id: 'orders.edit', alias: 'SIPARIS_DUZENLE', name: 'Sipariş Düzenle', category: 'Siparişler', description: 'Mevcut sipariş kalemlerini artırma/azaltma' },
  { id: 'orders.cancel', alias: 'SIPARIS_SIL', name: 'Ürün İptal & İkram', category: 'Siparişler', description: 'Adisyondan ürün çıkarma ve iptal işlemi' },
  { id: 'orders.serve', alias: 'SERVIS_ET', name: 'Servis İşlemleri', category: 'Siparişler', description: 'Hazır siparişleri servis edildi olarak işaretleme' },

  // Ödemeler & Kasa
  { id: 'payments.view', alias: 'ODEME_GOR', name: 'Ödemeleri Görüntüle', category: 'Ödemeler & Kasa', description: 'Hesap dökümlerini ve tahsilat geçmişini görme' },
  { id: 'payments.create', alias: 'ODEME_AL', name: 'Ödeme Al & Hesap Kapat', category: 'Ödemeler & Kasa', description: 'Nakit, kart, havale ve parçalı ödeme alma' },
  { id: 'payments.discount', alias: 'INDIRIM_YAP', name: 'İndirim & İkram Uygula', category: 'Ödemeler & Kasa', description: 'Özel yüzde ve tutar indirimi tanımlama' },
  { id: 'cash.manage', alias: 'KASA_YONET', name: 'Günlük Kasa Yönetimi', category: 'Ödemeler & Kasa', description: 'Kasa açılış, kapanış ve para giriş/çıkış' },

  // Mutfak & Bar KDS
  { id: 'kitchen.view', alias: 'MUTFAK_GOR', name: 'Mutfak KDS Ekranı', category: 'Mutfak & Bar', description: 'Mutfak istasyonlarını görüntüleme' },
  { id: 'kitchen.manage', alias: 'MUTFAK_YONET', name: 'Mutfak Durum Güncelleme', category: 'Mutfak & Bar', description: 'Siparişi kabul etme, hazırlama ve hazır etme' },
  { id: 'bar.view', alias: 'BAR_GOR', name: 'Barista & Bar Ekranı', category: 'Mutfak & Bar', description: 'İçecek ve bar siparişlerini yönetme' },

  // Ürünler, Menü & Reçeteler
  { id: 'products.view', alias: 'URUN_GOR', name: 'Menüyü Görüntüle', category: 'Ürünler & Menü', description: 'Fiyat ve ürün listesini inceleme' },
  { id: 'products.manage', alias: 'URUN_YONET', name: 'Ürün Ekle / Düzenle / Sil', category: 'Ürünler & Menü', description: 'Yeni ürün, kategori, fiyat ve görsel güncelleme' },
  { id: 'inventory.view', alias: 'STOK_GOR', name: 'Stok Durumunu Gör', category: 'Stok & Reçete', description: 'Mevcut hammadde ve porsiyon stoklarını izleme' },
  { id: 'inventory.manage', alias: 'STOK_YONET', name: 'Stok Giriş & Reçete Tanımla', category: 'Stok & Reçete', description: 'Mal kabul, zayi girişi ve ürün reçetesi düzenleme' },

  // Raporlar & Analiz
  { id: 'reports.view', alias: 'RAPOR_GOR', name: 'Ciro & Raporları Görüntüle', category: 'Raporlar', description: 'Finansal analiz, ciro grafiği ve satış raporları' },

  // Personel, Roller & Sistem
  { id: 'users.manage', alias: 'PERSONEL_YONET', name: 'Personel Yönetimi', category: 'Personel & Roller', description: 'Personel ekleme, silme ve şifre/PIN güncelleme' },
  { id: 'roles.manage', alias: 'ROL_YONET', name: 'Özel Rol ve Yetki Matrisi', category: 'Personel & Roller', description: 'Yeni rol oluşturma ve yetkileri düzenleme' },
  { id: 'printers.manage', alias: 'YAZICI_YONET', name: 'Yazıcı & Fiş Şablonları', category: 'Yazıcı & Donanım', description: 'Termal yazıcılar ve fiş alanlarını ayarlama' },
  { id: 'audit.view', alias: 'DENETIM_GOR', name: 'Denetim Kayıtları (Audit Log)', category: 'Güvenlik & Denetim', description: 'Sistemdeki tüm işlem geçmişini ve logları inceleme' },
  { id: 'settings.manage', alias: 'AYAR_YONET', name: 'Sistem Ayarları', category: 'Genel Ayarlar', description: 'Restoran adı, logo, KDV ve sistem parametreleri' },
];

export const DEFAULT_ROLE_GRANULAR_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ALL_SYSTEM_PERMISSIONS.flatMap((p) => [p.id, p.alias || '']).filter(Boolean),
  OWNER: ALL_SYSTEM_PERMISSIONS.flatMap((p) => [p.id, p.alias || '']).filter(Boolean),
  ADMIN: ALL_SYSTEM_PERMISSIONS.flatMap((p) => [p.id, p.alias || '']).filter(Boolean),
  MANAGER: [
    'tables.view', 'MASA_GOR',
    'tables.edit', 'MASA_DUZENLE',
    'orders.view', 'SIPARIS_GOR',
    'orders.create', 'SIPARIS_OLUSTUR',
    'orders.edit', 'SIPARIS_DUZENLE',
    'orders.cancel', 'SIPARIS_SIL',
    'orders.serve', 'SERVIS_ET',
    'payments.view', 'ODEME_GOR',
    'payments.create', 'ODEME_AL',
    'payments.discount', 'INDIRIM_YAP',
    'cash.manage', 'KASA_YONET',
    'kitchen.view', 'MUTFAK_GOR',
    'kitchen.manage', 'MUTFAK_YONET',
    'bar.view', 'BAR_GOR',
    'products.view', 'URUN_GOR',
    'products.manage', 'URUN_YONET',
    'inventory.view', 'STOK_GOR',
    'inventory.manage', 'STOK_YONET',
    'reports.view', 'RAPOR_GOR',
    'users.manage', 'PERSONEL_YONET',
    'printers.manage', 'YAZICI_YONET',
    'audit.view', 'DENETIM_GOR'
  ],
  WAITER: [
    'tables.view', 'MASA_GOR',
    'tables.edit', 'MASA_DUZENLE',
    'orders.view', 'SIPARIS_GOR',
    'orders.create', 'SIPARIS_OLUSTUR',
    'orders.edit', 'SIPARIS_DUZENLE',
    'orders.serve', 'SERVIS_ET',
    'kitchen.view', 'MUTFAK_GOR',
    'products.view', 'URUN_GOR'
  ],
  KITCHEN: [
    'kitchen.view', 'MUTFAK_GOR',
    'kitchen.manage', 'MUTFAK_YONET',
    'orders.view', 'SIPARIS_GOR',
    'inventory.view', 'STOK_GOR',
    'products.view', 'URUN_GOR'
  ],
  BARISTA: [
    'kitchen.view', 'MUTFAK_GOR',
    'bar.view', 'BAR_GOR',
    'kitchen.manage', 'MUTFAK_YONET',
    'orders.view', 'SIPARIS_GOR',
    'inventory.view', 'STOK_GOR',
    'products.view', 'URUN_GOR'
  ],
  CASHIER: [
    'tables.view', 'MASA_GOR',
    'orders.view', 'SIPARIS_GOR',
    'payments.view', 'ODEME_GOR',
    'payments.create', 'ODEME_AL',
    'payments.discount', 'INDIRIM_YAP',
    'cash.manage', 'KASA_YONET',
    'reports.view', 'RAPOR_GOR'
  ]
};

export interface CustomRole {
  id: string;
  restaurantId?: string;
  name: string;
  description: string;
  isSystem: boolean;
  color?: string;
  permissions: string[];
  allowedTabs: ActiveTab[];
  userCount?: number;
  createdAt: string;
}

// -------------------------------------------------------------
// Printers & Printer Templates
// -------------------------------------------------------------
export type PrinterType = 'THERMAL_80MM' | 'THERMAL_58MM';
export type PrinterStation = 'MUTFAK' | 'BAR' | 'KASA' | 'TÜMÜ';

export interface Printer {
  id: string;
  restaurantId?: string;
  name: string;
  type: PrinterType;
  station: PrinterStation;
  ipAddress: string;
  port?: number;
  status: 'ONLINE' | 'OFFLINE';
  active: boolean;
  isDefault: boolean;
}

export interface PrinterTemplateFields {
  showRestaurantName: boolean;
  showLogo: boolean;
  showTableNumber: boolean;
  showOrderNumber: boolean;
  showWaiter: boolean;
  showDate: boolean;
  showTime: boolean;
  showProductName: boolean;
  showQuantity: boolean;
  showProductNote: boolean;
  showExtras: boolean;
  showItemPrice: boolean;
  showTotalPrice: boolean;
  showOrderStatus: boolean;
  showCustomerNote: boolean;
  headerText?: string;
  footerText?: string;
}

export interface PrinterTemplate {
  id: string;
  restaurantId?: string;
  name: string;
  printerId: string;
  station: PrinterStation;
  target: 'KITCHEN_TICKET' | 'BAR_TICKET' | 'CUSTOMER_BILL';
  fields: PrinterTemplateFields;
}

export type RolePermissionsMap = {
  SUPER_ADMIN?: ActiveTab[];
  OWNER: ActiveTab[];
  ADMIN: ActiveTab[];
  MANAGER: ActiveTab[];
  WAITER: ActiveTab[];
  KITCHEN: ActiveTab[];
  BARISTA: ActiveTab[];
  CASHIER: ActiveTab[];
};

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionsMap = {
  SUPER_ADMIN: [
    'super-admin',
    'dashboard',
    'tables',
    'reservations',
    'orders',
    'kitchen',
    'products',
    'categories',
    'stock',
    'staff',
    'payments',
    'cash-register',
    'reports',
    'audit-logs',
    'settings',
    'roles',
    'printers',
    'billing',
  ],
  OWNER: [
    'dashboard',
    'tables',
    'reservations',
    'orders',
    'kitchen',
    'products',
    'categories',
    'stock',
    'staff',
    'payments',
    'cash-register',
    'reports',
    'audit-logs',
    'settings',
    'roles',
    'printers',
    'billing',
  ],
  ADMIN: [
    'dashboard',
    'tables',
    'reservations',
    'orders',
    'kitchen',
    'products',
    'categories',
    'stock',
    'staff',
    'payments',
    'cash-register',
    'reports',
    'audit-logs',
    'settings',
    'roles',
    'printers',
    'billing',
  ],
  MANAGER: [
    'dashboard',
    'tables',
    'reservations',
    'orders',
    'kitchen',
    'products',
    'categories',
    'stock',
    'staff',
    'payments',
    'cash-register',
    'reports',
    'audit-logs',
  ],
  WAITER: ['tables', 'reservations', 'orders', 'payments'],
  KITCHEN: ['kitchen', 'stock'],
  BARISTA: ['kitchen', 'stock'],
  CASHIER: ['tables', 'reservations', 'payments', 'cash-register', 'reports'],
};

export interface RestaurantSettings {
  restaurantId?: string;
  name: string;
  slogan: string;
  logo: string;
  address: string;
  phone?: string;
  taxNumber: string;
  currency: string;
  defaultVatRate: number;
  defaultServiceCharge: number;
  soundEnabled: boolean;
  autoPrintKitchen: boolean;
  theme: 'dark' | 'light' | 'system';
  receiptFooter?: string;
  rolePermissions?: RolePermissionsMap;
}

export interface ServerSyncEvent {
  type:
    | 'ORDER_CREATED'
    | 'ORDER_UPDATED'
    | 'TABLE_UPDATED'
    | 'PAYMENT_COMPLETED'
    | 'ITEM_STATUS_CHANGED'
    | 'RESERVATION_CREATED'
    | 'RESERVATION_UPDATED'
    | 'RESERVATION_DELETED'
    | 'RESTAURANT_UPDATED'
    | 'SYNC_ALL';
  restaurantId?: string;
  data?: any;
  timestamp: string;
}
