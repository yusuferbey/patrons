import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import {
  User,
  RestaurantTable,
  Category,
  Product,
  Order,
  OrderItem,
  PaymentRecord,
  CashRegister,
  AuditLog,
  RestaurantSettings,
  ServerSyncEvent,
  KitchenStation,
  TableSection,
  Reservation,
  ReservationStatus,
  UserRole,
  ActiveTab,
  RolePermissionsMap,
  DEFAULT_ROLE_PERMISSIONS,
  Restaurant,
  BillingDetails,
  PaymentTransaction,
  TenantSubscriptionInfo,
  CustomRole,
  ALL_SYSTEM_PERMISSIONS,
  DEFAULT_ROLE_GRANULAR_PERMISSIONS,
} from '../types';
import { sounds } from '../utils/audio';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
}

interface POSContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  currentRestaurant: Restaurant | null;
  setCurrentRestaurant: (r: Restaurant | null) => void;
  restaurants: Restaurant[];
  activeTenantId: string;
  switchRestaurant: (restaurantId: string) => Promise<void>;
  saveRestaurant: (restaurantData: Partial<Restaurant>) => Promise<boolean>;
  deleteRestaurant: (restaurantId: string) => Promise<boolean>;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  users: User[];
  tables: RestaurantTable[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  payments: PaymentRecord[];
  cashRegister: CashRegister | null;
  auditLogs: AuditLog[];
  settings: RestaurantSettings | null;
  reservations: Reservation[];
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  isLoading: boolean;
  isOnline: boolean;
  selectedTable: RestaurantTable | null;
  setSelectedTable: (table: RestaurantTable | null) => void;
  selectedSection: TableSection | 'Tümü';
  setSelectedSection: (sec: TableSection | 'Tümü') => void;
  selectedStation: KitchenStation | 'TÜMÜ';
  setSelectedStation: (station: KitchenStation | 'TÜMÜ') => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  isWaiterMobileMode: boolean;
  setIsWaiterMobileMode: (val: boolean) => void;
  
  // Actions
  refreshAllData: () => Promise<void>;
  loginUser: (username: string, pin?: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (data: {
    restaurantName: string;
    ownerName: string;
    email: string;
    password: string;
    phone?: string;
    concept?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => void;
  createOrAppendOrder: (
    tableId: string,
    items: any[],
    notes?: string,
    guestCount?: number,
    options?: { source?: 'POS' | 'WAITER_MOBILE' | 'QR'; deviceType?: string; waiterId?: string; waiterName?: string }
  ) => Promise<{ success: boolean; orderNumber?: string }>;
  updateItemStatus: (itemId: string, status: string) => Promise<boolean>;
  batchUpdateOrderStatus: (orderId: string, status: string, station?: string) => Promise<boolean>;
  cancelOrderItem: (itemId: string, reason: string) => Promise<boolean>;
  reduceOrderItem: (itemId: string, delta?: number, reason?: string) => Promise<boolean>;
  changeTableWaiter: (tableId: string, newWaiterId: string, newWaiterName: string) => Promise<boolean>;
  completePayment: (paymentData: any) => Promise<any>;
  transferTable: (fromTableId: string, toTableId: string) => Promise<boolean>;
  mergeTables: (primaryTableId: string, secondaryTableId: string) => Promise<boolean>;
  updateTableStatus: (tableId: string, status: string, guestCount?: number) => Promise<boolean>;
  updateProductStock: (productId: string, delta?: number, exactValue?: number) => Promise<boolean>;
  saveProduct: (productData: Partial<Product>) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  saveTable: (tableData: Partial<RestaurantTable>) => Promise<boolean>;
  deleteTable: (tableId: string) => Promise<boolean>;
  sections: string[];
  addSection: (name: string) => Promise<boolean>;
  deleteSection: (name: string) => Promise<boolean>;
  saveCategory: (categoryData: Partial<Category>) => Promise<boolean>;
  deleteCategory: (categoryId: string) => Promise<boolean>;
  saveUser: (userData: Partial<User>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  closeCashRegister: (actualCash: number, notes: string) => Promise<boolean>;
  addCashTransaction: (type: 'IN' | 'OUT', amount: number, reason: string) => Promise<boolean>;
  createReservation: (data: Partial<Reservation>) => Promise<boolean>;
  updateReservation: (id: string, data: Partial<Reservation>) => Promise<boolean>;
  updateReservationStatus: (id: string, status: ReservationStatus, reason?: string) => Promise<boolean>;
  seatReservation: (reservation: Reservation) => Promise<boolean>;
  deleteReservation: (id: string) => Promise<boolean>;
  updateSettings: (newSettings: Partial<RestaurantSettings>) => Promise<boolean>;
  resetDemoDatabase: () => Promise<void>;
  hasTabPermission: (role: UserRole | undefined, tab: ActiveTab) => boolean;
  getUserEffectiveTabs: (user: User | null | undefined) => ActiveTab[];
  hasUserTabPermission: (user: User | null | undefined, tab: ActiveTab) => boolean;
  updateRolePermissions: (role: UserRole, allowedTabs: ActiveTab[]) => Promise<boolean>;
  toggleRoleTabPermission: (role: UserRole, tab: ActiveTab) => Promise<boolean>;
  resetRolePermissions: (role?: UserRole) => Promise<boolean>;
  updateUserCustomPermissions: (userId: string, customEnabled: boolean, allowedTabs?: ActiveTab[]) => Promise<boolean>;
  toggleUserTabPermission: (userId: string, tab: ActiveTab) => Promise<boolean>;
  resetUserToRolePermissions: (userId: string) => Promise<boolean>;
  fetchBillingInfo: () => Promise<TenantSubscriptionInfo | null>;
  updateBillingDetails: (details: Partial<BillingDetails>) => Promise<boolean>;
  subscribeToPlan: (data: { plan: string; billingCycle: string; cardHolder?: string }) => Promise<{ success: boolean; message?: string }>;
  customRoles: CustomRole[];
  saveCustomRole: (role: Partial<CustomRole>) => Promise<boolean>;
  deleteCustomRole: (roleId: string) => Promise<boolean>;
  hasPermission: (permission: string, user?: User | null) => boolean;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('patron_pos_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(() => {
    const saved = localStorage.getItem('patron_pos_restaurant');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const currentUserRef = useRef<User | null>(currentUser);
  currentUserRef.current = currentUser;
  const currentRestaurantRef = useRef<Restaurant | null>(currentRestaurant);
  currentRestaurantRef.current = currentRestaurant;

  const activeTenantId = currentRestaurant?.id || currentUser?.restaurantId || 'rest-1';

  // Multi-Tenant Aware Fetch Helper
  const authFetch = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers);
    const user = currentUserRef.current;
    const rest = currentRestaurantRef.current;
    if (user?.token) {
      headers.set('Authorization', `Bearer ${user.token}`);
    }
    const tenantId = rest?.id || user?.restaurantId || 'rest-1';
    if (tenantId) {
      headers.set('x-restaurant-id', tenantId);
    }
    return fetch(url, {
      ...init,
      headers,
    });
  }, []);

  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [sections, setSections] = useState<string[]>(['Salon', 'Teras', 'Bahçe', 'VIP']);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [selectedSection, setSelectedSection] = useState<TableSection | 'Tümü'>('Tümü');
  const [selectedStation, setSelectedStation] = useState<KitchenStation | 'TÜMÜ'>('TÜMÜ');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('patron_sound_enabled') !== 'false';
  });
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('patron_theme') as 'dark' | 'light';
    return saved === 'light' ? 'light' : 'dark';
  });
  const [isWaiterMobileMode, setIsWaiterMobileMode] = useState<boolean>(false);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
    localStorage.setItem('patron_sound_enabled', String(next));
  };

  const setTheme = (t: 'dark' | 'light') => {
    setThemeState(t);
    localStorage.setItem('patron_theme', t);
    if (t === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
    };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all initial data
  const refreshAllData = useCallback(async () => {
    try {
      const [
        usersRes,
        tablesRes,
        categoriesRes,
        productsRes,
        ordersRes,
        paymentsRes,
        cashRes,
        auditRes,
        settingsRes,
        reservationsRes,
        restaurantsRes,
        sectionsRes,
        rolesRes,
      ] = await Promise.all([
        authFetch('/api/users').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        authFetch('/api/tables').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        authFetch('/api/categories').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        authFetch('/api/products').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        authFetch('/api/orders').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        authFetch('/api/payments').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        authFetch('/api/cash-register').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        authFetch('/api/audit-logs').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        authFetch('/api/settings').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        authFetch('/api/reservations').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        authFetch('/api/restaurants').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        authFetch('/api/sections').then((r) => (r.ok ? r.json() : [])).catch(() => []),
        authFetch('/api/roles').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);

      setUsers(usersRes || []);
      setCustomRoles(rolesRes || []);
      setTables(tablesRes || []);
      if (Array.isArray(sectionsRes) && sectionsRes.length > 0) {
        setSections(sectionsRes);
      } else if (Array.isArray(tablesRes) && tablesRes.length > 0) {
        const tableSecs = Array.from(new Set(tablesRes.map((t: RestaurantTable) => t.section).filter(Boolean)));
        setSections(Array.from(new Set(['Salon', 'Teras', 'Bahçe', 'VIP', ...tableSecs])));
      }
      setCategories(categoriesRes || []);
      setProducts(productsRes || []);
      setOrders(ordersRes || []);
      setPayments(paymentsRes || []);
      setCashRegister(cashRes || null);
      setAuditLogs(auditRes || []);
      setSettings(settingsRes || null);
      setReservations(reservationsRes || []);

      if (Array.isArray(restaurantsRes) && restaurantsRes.length > 0) {
        setRestaurants(restaurantsRes);
        if (!currentRestaurantRef.current) {
          const userRest = currentUserRef.current?.restaurantId;
          const match = restaurantsRes.find((r: Restaurant) => r.id === userRest) || restaurantsRes[0];
          setCurrentRestaurant(match);
          localStorage.setItem('patron_pos_restaurant', JSON.stringify(match));
        } else {
          // Keep currentRestaurant refreshed
          const current = restaurantsRes.find((r: Restaurant) => r.id === currentRestaurantRef.current?.id);
          if (current) {
            setCurrentRestaurant(current);
            localStorage.setItem('patron_pos_restaurant', JSON.stringify(current));
          }
        }
      }
      setIsOnline(true);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  // Setup SSE Realtime Sync
  useEffect(() => {
    refreshAllData();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setIsOnline(true);
      };

      eventSource.onmessage = (e) => {
        try {
          const event: ServerSyncEvent = JSON.parse(e.data);
          if (event.type === 'ORDER_CREATED') {
            refreshAllData();
            sounds.playNewOrderSound();
            if (currentUser?.role === 'KITCHEN' || currentUser?.role === 'ADMIN') {
              addToast('info', '🔔 Yeni Sipariş!', `${event.data?.table?.name || 'Masa'} için mutfağa sipariş düştü.`);
            }
          } else if (event.type === 'ITEM_STATUS_CHANGED' || event.type === 'ORDER_UPDATED') {
            refreshAllData();
            if (event.data?.item?.status === 'READY') {
              sounds.playReadySound();
              if (currentUser?.role === 'WAITER' || currentUser?.role === 'ADMIN') {
                addToast('success', '🟢 Servise Hazır!', `${event.data?.item?.tableName} - ${event.data?.item?.productName} hazırlandı.`);
              }
            }
          } else if (event.type === 'PAYMENT_COMPLETED') {
            refreshAllData();
            sounds.playPaymentSuccessSound();
            if (currentUser?.role === 'CASHIER' || currentUser?.role === 'ADMIN') {
              addToast('success', '💵 Ödeme Alındı', `${event.data?.table?.name || 'Masa'} hesabı kapatıldı.`);
            }
          } else {
            refreshAllData();
          }
        } catch (err) {
          console.error('Error handling SSE event:', err);
        }
      };

      eventSource.onerror = () => {
        setIsOnline(false);
      };
    } catch (err) {
      console.warn('SSE not available:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [refreshAllData, currentUser, addToast]);

  // Auth methods
  const loginUser = async (identifier: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const trimmedUser = (identifier || '').trim();
      const secret = (password || '').trim();

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: trimmedUser,
          username: trimmedUser,
          password: secret,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('patron_pos_user', JSON.stringify(data.user));
        if (data.restaurant) {
          setCurrentRestaurant(data.restaurant);
          localStorage.setItem('patron_pos_restaurant', JSON.stringify(data.restaurant));
        }
        addToast('success', 'Giriş Başarılı', `Hoş geldiniz, ${data.user.name}`);
        setTimeout(() => {
          refreshAllData();
        }, 50);
        return { success: true };
      } else {
        const errorMsg = data.error || 'Kullanıcı adı veya şifre hatalı.';
        addToast('error', 'Giriş Başarısız', errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = 'Giriş yapılırken sunucu bağlantı hatası oluştu.';
      addToast('error', 'Hata', errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const registerUser = async (data: {
    restaurantName: string;
    ownerName: string;
    email: string;
    password: string;
    phone?: string;
    concept?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (res.ok && resData.user) {
        setCurrentUser(resData.user);
        localStorage.setItem('patron_pos_user', JSON.stringify(resData.user));
        if (resData.restaurant) {
          setCurrentRestaurant(resData.restaurant);
          localStorage.setItem('patron_pos_restaurant', JSON.stringify(resData.restaurant));
        }
        addToast(
          'success',
          '🎉 7 Günlük Ücretsiz Deneme Başladı!',
          `Hoş geldiniz, ${resData.user.name}. Tüm PRO özellikler 7 gün boyunca hizmetinizdedir.`
        );
        setTimeout(() => {
          refreshAllData();
        }, 50);
        return { success: true };
      } else {
        const errorMsg = resData.error || 'Kayıt sırasında bir hata oluştu.';
        addToast('error', 'Kayıt Başarısız', errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = 'Sunucu bağlantı hatası oluştu. Lütfen tekrar deneyiniz.';
      addToast('error', 'Hata', errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('patron_pos_user');
    localStorage.removeItem('patron_pos_restaurant');
    addToast('info', 'Çıkış Yapıldı', 'Oturumunuz güvenle kapatıldı.');
  };

  const switchRestaurant = async (restaurantId: string) => {
    const found = restaurants.find((r) => r.id === restaurantId);
    if (found) {
      setCurrentRestaurant(found);
      localStorage.setItem('patron_pos_restaurant', JSON.stringify(found));
      addToast('info', 'İşletme Değiştirildi', `${found.name} çalışma alanına geçildi.`);
      setTimeout(() => {
        refreshAllData();
      }, 50);
    }
  };

  const saveRestaurant = async (restaurantData: Partial<Restaurant>): Promise<boolean> => {
    try {
      const isNew = !restaurantData.id;
      const url = isNew ? '/api/restaurants' : `/api/restaurants/${restaurantData.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurantData),
      });
      const data = await res.json();
      if (res.ok) {
        addToast('success', 'Başarılı', `İşletme ${isNew ? 'oluşturuldu' : 'güncellendi'}.`);
        await refreshAllData();
        return true;
      } else {
        addToast('error', 'Hata', data.error || 'İşlem başarısız.');
        return false;
      }
    } catch (err) {
      addToast('error', 'Hata', 'Sunucu bağlantı hatası.');
      return false;
    }
  };

  const deleteRestaurant = async (restaurantId: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/restaurants/${restaurantId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        addToast('info', 'İşletme Donduruldu', 'İşletme pasif duruma alındı.');
        await refreshAllData();
        return true;
      } else {
        addToast('error', 'Hata', data.error || 'İşlem başarısız.');
        return false;
      }
    } catch (err) {
      addToast('error', 'Hata', 'Sunucu bağlantı hatası.');
      return false;
    }
  };

  // Actions
  const createOrAppendOrder = async (
    tableId: string,
    items: any[],
    notes?: string,
    guestCount?: number,
    options?: { source?: 'POS' | 'WAITER_MOBILE' | 'QR'; deviceType?: string; waiterId?: string; waiterName?: string }
  ): Promise<{ success: boolean; orderNumber?: string }> => {
    try {
      const res = await authFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          waiterId: options?.waiterId || currentUser?.id,
          waiterName: options?.waiterName || currentUser?.name,
          guestCount,
          items,
          notes,
          source: options?.source || 'POS',
          deviceType: options?.deviceType || (options?.source === 'WAITER_MOBILE' ? 'MOBILE' : 'DESKTOP'),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast('success', '✓ Sipariş Gönderildi', `${data.table?.name} siparişi mutfağa başarıyla iletildi.`);
        refreshAllData();
        return { success: true, orderNumber: data.orderNumber || data.order?.orderNumber };
      } else {
        addToast('error', 'Sipariş Hatası', data.error || 'Sipariş gönderilemedi.');
        return { success: false };
      }
    } catch (err) {
      addToast('error', 'Hata', 'Sipariş iletilirken bağlantı hatası.');
      return { success: false };
    }
  };

  const updateItemStatus = async (itemId: string, status: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/orders/items/${itemId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userName: currentUser?.name }),
      });
      if (res.ok) {
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const batchUpdateOrderStatus = async (orderId: string, status: string, station?: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/orders/${orderId}/batch-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, station, userName: currentUser?.name }),
      });
      if (res.ok) {
        addToast('success', 'Durum Güncellendi', `Siparişler ${status} olarak güncellendi.`);
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const cancelOrderItem = async (itemId: string, reason: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/orders/items/${itemId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, cancelledBy: currentUser?.name }),
      });
      if (res.ok) {
        addToast('warning', 'Ürün İptal Edildi', 'Seçilen ürün iptal edildi ve stok iade edildi.');
        sounds.playWarningSound();
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const reduceOrderItem = async (itemId: string, delta: number = 1, reason: string = 'Müşteri talebi'): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/orders/items/${itemId}/reduce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delta,
          reason,
          userName: currentUser?.name,
          userRole: currentUser?.role,
        }),
      });
      if (res.ok) {
        addToast('info', 'Ürün Adedi Güncellendi', `Seçilen ürün adedi ${delta} adet azaltıldı.`);
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const changeTableWaiter = async (tableId: string, newWaiterId: string, newWaiterName: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/tables/${tableId}/change-waiter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newWaiterId,
          newWaiterName,
          changedBy: currentUser?.name,
        }),
      });
      if (res.ok) {
        addToast('success', 'Garson Güncellendi', `Masa sorumlusu ${newWaiterName} olarak atandı.`);
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const completePayment = async (paymentData: any): Promise<any> => {
    try {
      const res = await authFetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentData,
          cashierName: currentUser?.name || 'Elif Kasa',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast('success', '✓ Ödeme Tamamlandı', `${data.table?.name || 'Masa'} kapatıldı ve satış kaydedildi.`);
        refreshAllData();
        return data;
      } else {
        addToast('error', 'Ödeme Hatası', data.error || 'Ödeme alınamadı.');
        return false;
      }
    } catch (err) {
      addToast('error', 'Hata', 'Ödeme tamamlanırken hata oluştu.');
      return false;
    }
  };

  const transferTable = async (fromTableId: string, toTableId: string): Promise<boolean> => {
    try {
      const res = await authFetch('/api/tables/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromTableId, toTableId, userName: currentUser?.name }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast('success', 'Masa Taşındı', `${data.fromTable?.name} siparişi ${data.toTable?.name}'e taşındı.`);
        refreshAllData();
        return true;
      } else {
        addToast('error', 'Masa Taşıma Hatası', data.error || 'Masa taşınamadı.');
        return false;
      }
    } catch (err) {
      addToast('error', 'Hata', 'Masa taşınamadı.');
      return false;
    }
  };

  const mergeTables = async (primaryTableId: string, secondaryTableId: string): Promise<boolean> => {
    try {
      const res = await authFetch('/api/tables/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryTableId, secondaryTableId, userName: currentUser?.name }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast('success', 'Masa Birleştirildi', 'Masalar başarıyla tek hesapta birleştirildi.');
        refreshAllData();
        return true;
      } else {
        addToast('error', 'Birleştirme Hatası', data.error || 'Masalar birleştirilemedi.');
        return false;
      }
    } catch (err) {
      addToast('error', 'Hata', 'Masa birleştirilemedi.');
      return false;
    }
  };

  const updateTableStatus = async (tableId: string, status: string, guestCount?: number): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/tables/${tableId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, guestCount, waiterId: currentUser?.id, waiterName: currentUser?.name }),
      });
      if (res.ok) {
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const updateProductStock = async (productId: string, delta?: number, exactValue?: number): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/products/${productId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta, exactValue }),
      });
      if (res.ok) {
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const saveProduct = async (productData: Partial<Product>): Promise<boolean> => {
    try {
      const isEdit = Boolean(productData.id);
      const url = isEdit ? `/api/products/${productData.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (res.ok) {
        addToast('success', 'Ürün Kaydedildi', `${productData.name} başarıyla güncellendi.`);
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('info', 'Ürün Silindi', 'Ürün menüden kaldırıldı.');
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const saveCategory = async (categoryData: Partial<Category>): Promise<boolean> => {
    try {
      const isEdit = Boolean(categoryData.id);
      const url = isEdit ? `/api/categories/${categoryData.id}` : '/api/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      if (res.ok) {
        addToast('success', 'Kategori Kaydedildi', `${categoryData.name} kaydedildi.`);
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const deleteCategory = async (categoryId: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('info', 'Kategori Silindi', 'Kategori kaldırıldı.');
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const saveTable = async (tableData: Partial<RestaurantTable>): Promise<boolean> => {
    try {
      const isEdit = Boolean(tableData.id);
      const url = isEdit ? `/api/tables/${tableData.id}` : '/api/tables';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tableData,
          restaurantId: activeTenantId,
        }),
      });
      if (res.ok) {
        addToast('success', isEdit ? 'Masa Güncellendi' : 'Yeni Masa Eklendi', `${tableData.name || 'Masa'} başarıyla kaydedildi.`);
        refreshAllData();
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        addToast('error', 'İşlem Başarısız', err.error || 'Masa kaydedilemedi.');
        return false;
      }
    } catch (err) {
      addToast('error', 'Hata', 'Masa kaydedilirken bir hata oluştu.');
      return false;
    }
  };

  const deleteTable = async (tableId: string): Promise<boolean> => {
    try {
      const targetTable = tables.find((t) => t.id === tableId);
      if (targetTable && targetTable.status !== 'EMPTY' && targetTable.status !== 'RESERVED') {
        addToast('error', 'Masa Silinemez', 'Açık hesabı veya aktif siparişi olan masa silinemez. Lütfen önce hesabı kapatın.');
        return false;
      }

      const res = await authFetch(`/api/tables/${tableId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('info', 'Masa Silindi', 'Masa salon planından kaldırıldı.');
        refreshAllData();
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        addToast('error', 'Silinemedi', err.error || 'Masa silinemedi.');
        return false;
      }
    } catch (err) {
      addToast('error', 'Hata', 'Masa silinirken bir hata oluştu.');
      return false;
    }
  };

  const addSection = async (name: string): Promise<boolean> => {
    try {
      const trimmed = name.trim();
      if (!trimmed) {
        addToast('error', 'Geçersiz İsim', 'Lütfen geçerli bir mekan/bölüm adı giriniz.');
        return false;
      }
      const res = await authFetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, restaurantId: activeTenantId }),
      });
      if (res.ok) {
        addToast('success', 'Mekan Eklendi', `"${trimmed}" bölümü başarıyla oluşturuldu.`);
        refreshAllData();
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        addToast('error', 'Hata', err.error || 'Mekan eklenemedi.');
        return false;
      }
    } catch (err) {
      addToast('error', 'Hata', 'Mekan eklenirken bir hata oluştu.');
      return false;
    }
  };

  const deleteSection = async (name: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/sections/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        addToast('info', 'Mekan Silindi', `"${name}" bölümü kaldırıldı.`);
        if (selectedSection === name) {
          setSelectedSection('Tümü');
        }
        refreshAllData();
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        addToast('error', 'Silinemedi', err.error || 'Bölüm silinemedi.');
        return false;
      }
    } catch (err) {
      addToast('error', 'Hata', 'Bölüm silinirken bir hata oluştu.');
      return false;
    }
  };

  const saveUser = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const isEdit = Boolean(userData.id);
      const url = isEdit ? `/api/users/${userData.id}` : '/api/users';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (res.ok) {
        addToast('success', 'Personel Kaydedildi', `${userData.name} güncellendi.`);
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('info', 'Personel Silindi', 'Personel sistemden kaldırıldı.');
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const closeCashRegister = async (actualCash: number, notes: string): Promise<boolean> => {
    try {
      const res = await authFetch('/api/cash-register/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualCash, notes, closedBy: currentUser?.name }),
      });
      if (res.ok) {
        addToast('success', 'Z Raporu Alındı', 'Günlük kasa kapanışı başarıyla yapıldı.');
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const addCashTransaction = async (type: 'IN' | 'OUT', amount: number, reason: string): Promise<boolean> => {
    try {
      const res = await authFetch('/api/cash-register/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount, reason, userName: currentUser?.name }),
      });
      if (res.ok) {
        addToast('success', 'Kasa İşlemi Kaydedildi', `₺${amount} ${type === 'IN' ? 'girişi' : 'çıkışı'} yapıldı.`);
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const updateSettings = async (newSettings: Partial<RestaurantSettings>): Promise<boolean> => {
    try {
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        addToast('success', 'Ayarlar Kaydedildi', 'Sistem ayarları güncellendi.');
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const createReservation = async (data: Partial<Reservation>): Promise<boolean> => {
    try {
      const res = await authFetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          createdBy: currentUser?.name || 'Garson',
        }),
      });
      if (res.ok) {
        addToast('success', 'Rezervasyon Kaydedildi', `${data.customerName} için ${data.tableName} rezervasyonu açıldı.`);
        refreshAllData();
        return true;
      }
      const err = await res.json();
      addToast('error', 'Hata', err.error || 'Rezervasyon oluşturulamadı.');
      return false;
    } catch (err) {
      addToast('error', 'Bağlantı Hatası', 'Sunucuya ulaşılamadı.');
      return false;
    }
  };

  const updateReservation = async (id: string, data: Partial<Reservation>): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        addToast('success', 'Rezervasyon Güncellendi', 'Rezervasyon bilgileri başarıyla kaydedildi.');
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const updateReservationStatus = async (id: string, status: ReservationStatus, reason?: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/reservations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reason,
          waiterName: currentUser?.name,
          waiterId: currentUser?.id,
        }),
      });
      if (res.ok) {
        if (status === 'CANCELLED') {
          addToast('info', 'Rezervasyon İptal Edildi', 'Masa boşaltıldı.');
        } else if (status === 'NO_SHOW') {
          addToast('warning', 'Müşteri Gelmedi', 'Rezervasyon gelmedi olarak işaretlendi.');
        } else if (status === 'SEATED') {
          addToast('success', 'Masaya Alındı', 'Masa açıldı ve kullanıma hazır.');
        }
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const seatReservation = async (reservation: Reservation): Promise<boolean> => {
    return updateReservationStatus(reservation.id, 'SEATED');
  };

  const deleteReservation = async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/reservations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        addToast('info', 'Rezervasyon Silindi', 'Kayıt sistemden kaldırıldı.');
        refreshAllData();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const resetDemoDatabase = async (): Promise<void> => {
    try {
      const res = await authFetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        addToast('info', 'Demo Sıfırlandı', 'Tüm masalar, ürünler ve siparişler başlangıç durumuna getirildi.');
        refreshAllData();
      }
    } catch (err) {
      addToast('error', 'Hata', 'Sıfırlanamadı.');
    }
  };

  // Keep currentUser in sync if updated from server/SSE
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const updated = users.find((u) => u.id === currentUser.id);
      if (
        updated &&
        (updated.customPermissionsEnabled !== currentUser.customPermissionsEnabled ||
          JSON.stringify(updated.allowedTabs) !== JSON.stringify(currentUser.allowedTabs) ||
          updated.role !== currentUser.role ||
          updated.name !== currentUser.name)
      ) {
        setCurrentUser(updated);
        localStorage.setItem('patron_pos_user', JSON.stringify(updated));
      }
    }
  }, [users, currentUser]);

  const getUserEffectiveTabs = useCallback(
    (user: User | null | undefined): ActiveTab[] => {
      if (!user) return [];
      if (user.role === 'SUPER_ADMIN') {
        return (
          DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN || [
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
          ]
        );
      }
      const rolePerms = settings?.rolePermissions || DEFAULT_ROLE_PERMISSIONS;

      if (user.role === 'ADMIN') {
        const adminTabs = rolePerms.ADMIN && rolePerms.ADMIN.length > 0 ? rolePerms.ADMIN : DEFAULT_ROLE_PERMISSIONS.ADMIN;
        if (user.customPermissionsEnabled && Array.isArray(user.allowedTabs) && user.allowedTabs.length > 0) {
          return user.allowedTabs;
        }
        return adminTabs;
      }

      if (user.customPermissionsEnabled && Array.isArray(user.allowedTabs)) {
        return user.allowedTabs;
      }

      if (user.customRoleId) {
        const customRole = customRoles.find((r) => r.id === user.customRoleId);
        if (customRole && Array.isArray(customRole.allowedTabs) && customRole.allowedTabs.length > 0) {
          return customRole.allowedTabs;
        }
      }

      return rolePerms[user.role] ?? DEFAULT_ROLE_PERMISSIONS[user.role] ?? [];
    },
    [settings, customRoles]
  );

  const hasUserTabPermission = useCallback(
    (user: User | null | undefined, tab: ActiveTab): boolean => {
      if (!user) return false;
      const effectiveTabs = getUserEffectiveTabs(user);
      return effectiveTabs.includes(tab);
    },
    [getUserEffectiveTabs]
  );

  const hasTabPermission = useCallback(
    (role: UserRole | undefined, tab: ActiveTab): boolean => {
      if (!role) return false;
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true; // Master access
      const currentRolePerms = settings?.rolePermissions || DEFAULT_ROLE_PERMISSIONS;
      const allowed = currentRolePerms[role] || DEFAULT_ROLE_PERMISSIONS[role] || [];
      return allowed.includes(tab);
    },
    [settings]
  );

  const hasPermission = useCallback(
    (permission: string, user?: User | null): boolean => {
      const targetUser = user !== undefined ? user : currentUserRef.current;
      if (!targetUser) return false;

      // Super admin has unrestricted permission everywhere
      if (targetUser.role === 'SUPER_ADMIN') return true;

      // Owner and Admin have master permission within their tenant unless specifically custom-restricted
      if ((targetUser.role === 'ADMIN' || targetUser.role === 'OWNER') && !targetUser.customPermissionsEnabled) {
        return true;
      }

      const permDef = ALL_SYSTEM_PERMISSIONS.find(
        (p) => p.id === permission || (p.alias && p.alias === permission)
      );
      const permId = permDef?.id || permission;
      const permAlias = permDef?.alias;

      // 1. Direct user custom permissions
      if (Array.isArray(targetUser.permissions) && targetUser.permissions.length > 0) {
        if (
          targetUser.permissions.includes(permId) ||
          (permAlias && targetUser.permissions.includes(permAlias))
        ) {
          return true;
        }
      }

      // 2. Custom Role assigned to user
      if (targetUser.customRoleId) {
        const customRole = customRoles.find((r) => r.id === targetUser.customRoleId);
        if (customRole) {
          if (
            customRole.permissions.includes(permId) ||
            (permAlias && customRole.permissions.includes(permAlias))
          ) {
            return true;
          }
        }
      }

      // 3. Fallback to default role granular permissions
      const roleDefaults = DEFAULT_ROLE_GRANULAR_PERMISSIONS[targetUser.role] || [];
      if (
        roleDefaults.includes(permId) ||
        (permAlias && roleDefaults.includes(permAlias))
      ) {
        return true;
      }

      return false;
    },
    [customRoles]
  );

  const updateRolePermissions = async (role: UserRole, allowedTabs: ActiveTab[]): Promise<boolean> => {
    const currentRolePerms = {
      ...(settings?.rolePermissions || DEFAULT_ROLE_PERMISSIONS),
      [role]: allowedTabs,
    };
    return updateSettings({
      rolePermissions: currentRolePerms,
    });
  };

  const toggleRoleTabPermission = async (role: UserRole, tab: ActiveTab): Promise<boolean> => {
    const currentRolePerms = settings?.rolePermissions || DEFAULT_ROLE_PERMISSIONS;
    const currentTabs = currentRolePerms[role] || DEFAULT_ROLE_PERMISSIONS[role] || [];
    const newTabs = currentTabs.includes(tab)
      ? currentTabs.filter((t) => t !== tab)
      : [...currentTabs, tab];
    return updateRolePermissions(role, newTabs);
  };

  const resetRolePermissions = async (role?: UserRole): Promise<boolean> => {
    let newPermissions: RolePermissionsMap;
    if (role) {
      newPermissions = {
        ...(settings?.rolePermissions || DEFAULT_ROLE_PERMISSIONS),
        [role]: DEFAULT_ROLE_PERMISSIONS[role],
      };
    } else {
      newPermissions = { ...DEFAULT_ROLE_PERMISSIONS };
    }
    return updateSettings({
      rolePermissions: newPermissions,
    });
  };

  const updateUserCustomPermissions = async (
    userId: string,
    customEnabled: boolean,
    allowedTabs?: ActiveTab[]
  ): Promise<boolean> => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return false;

    const defaultTabsForRole =
      (settings?.rolePermissions?.[targetUser.role] ?? DEFAULT_ROLE_PERMISSIONS[targetUser.role]) || [];

    const finalTabs = allowedTabs !== undefined ? allowedTabs : targetUser.allowedTabs || defaultTabsForRole;

    return saveUser({
      ...targetUser,
      customPermissionsEnabled: customEnabled,
      allowedTabs: finalTabs,
    });
  };

  const toggleUserTabPermission = async (userId: string, tab: ActiveTab): Promise<boolean> => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return false;

    const currentTabs = getUserEffectiveTabs(targetUser);
    const newTabs = currentTabs.includes(tab)
      ? currentTabs.filter((t) => t !== tab)
      : [...currentTabs, tab];

    return saveUser({
      ...targetUser,
      customPermissionsEnabled: true,
      allowedTabs: newTabs,
    });
  };

  const resetUserToRolePermissions = async (userId: string): Promise<boolean> => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return false;

    const defaultTabsForRole =
      (settings?.rolePermissions?.[targetUser.role] ?? DEFAULT_ROLE_PERMISSIONS[targetUser.role]) || [];

    return saveUser({
      ...targetUser,
      customPermissionsEnabled: false,
      allowedTabs: [...defaultTabsForRole],
    });
  };

  const fetchBillingInfo = async (): Promise<TenantSubscriptionInfo | null> => {
    try {
      const res = await authFetch('/api/billing');
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch billing info', err);
      return null;
    }
  };

  const updateBillingDetails = async (details: Partial<BillingDetails>): Promise<boolean> => {
    try {
      const res = await authFetch('/api/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      if (res.ok) {
        addToast('success', 'Fatura Bilgileri Güncellendi', 'Fatura ve şirket detaylarınız başarıyla kaydedildi.');
        refreshAllData();
        return true;
      }
      addToast('error', 'Hata', 'Fatura bilgileri güncellenemedi.');
      return false;
    } catch (err) {
      addToast('error', 'Hata', 'Bağlantı hatası.');
      return false;
    }
  };

  const subscribeToPlan = async (data: {
    plan: string;
    billingCycle: string;
    cardHolder?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await authFetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        addToast('success', 'Tebrikler! 🎉', result.message || 'Aboneliğiniz başarıyla aktif edildi.');
        refreshAllData();
        return { success: true, message: result.message };
      }
      addToast('error', 'Ödeme Alınamadı', result.error || 'Abonelik işlemi tamamlanamadı.');
      return { success: false, message: result.error };
    } catch (err) {
      addToast('error', 'Hata', 'Bağlantı hatası oluştu.');
      return { success: false, message: 'Bağlantı hatası oluştu.' };
    }
  };

  const saveCustomRole = async (roleData: Partial<CustomRole>): Promise<boolean> => {
    try {
      const isEdit = !!roleData.id && customRoles.some((r) => r.id === roleData.id);
      const url = isEdit ? `/api/roles/${roleData.id}` : '/api/roles';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(roleData),
      });
      if (res.ok) {
        const saved = await res.json();
        setCustomRoles((prev) => {
          if (isEdit) {
            return prev.map((r) => (r.id === saved.id ? saved : r));
          }
          return [...prev, saved];
        });
        addToast('success', 'Rol Kaydedildi', `${saved.name} rolü başarıyla kaydedildi.`);
        return true;
      }
      const err = await res.json().catch(() => ({}));
      addToast('error', 'Hata', err.error || 'Rol kaydedilemedi.');
      return false;
    } catch {
      addToast('error', 'Hata', 'Sunucuya bağlanılamadı.');
      return false;
    }
  };

  const deleteCustomRole = async (roleId: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/roles/${roleId}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomRoles((prev) => prev.filter((r) => r.id !== roleId));
        addToast('info', 'Rol Silindi', 'Özel rol sistemden kaldırıldı.');
        return true;
      }
      const err = await res.json().catch(() => ({}));
      addToast('error', 'Hata', err.error || 'Rol silinemedi.');
      return false;
    } catch {
      addToast('error', 'Hata', 'İşlem başarısız oldu.');
      return false;
    }
  };

  return (
    <POSContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        currentRestaurant,
        setCurrentRestaurant,
        restaurants,
        activeTenantId,
        switchRestaurant,
        saveRestaurant,
        deleteRestaurant,
        authFetch,
        users,
        tables,
        categories,
        products,
        orders,
        payments,
        cashRegister,
        auditLogs,
        settings,
        reservations,
        toasts,
        addToast,
        removeToast,
        isLoading,
        isOnline,
        selectedTable,
        setSelectedTable,
        selectedSection,
        setSelectedSection,
        selectedStation,
        setSelectedStation,
        soundEnabled,
        toggleSound,
        theme,
        setTheme,
        isWaiterMobileMode,
        setIsWaiterMobileMode,
        refreshAllData,
        loginUser,
        registerUser,
        logoutUser,
        createOrAppendOrder,
        updateItemStatus,
        batchUpdateOrderStatus,
        cancelOrderItem,
        reduceOrderItem,
        changeTableWaiter,
        completePayment,
        transferTable,
        mergeTables,
        updateTableStatus,
        updateProductStock,
        saveProduct,
        deleteProduct,
        saveTable,
        deleteTable,
        sections,
        addSection,
        deleteSection,
        saveCategory,
        deleteCategory,
        saveUser,
        deleteUser,
        closeCashRegister,
        addCashTransaction,
        createReservation,
        updateReservation,
        updateReservationStatus,
        seatReservation,
        deleteReservation,
        updateSettings,
        resetDemoDatabase,
        hasTabPermission,
        getUserEffectiveTabs,
        hasUserTabPermission,
        updateRolePermissions,
        toggleRoleTabPermission,
        resetRolePermissions,
        updateUserCustomPermissions,
        toggleUserTabPermission,
        resetUserToRolePermissions,
        fetchBillingInfo,
        updateBillingDetails,
        subscribeToPlan,
        customRoles,
        saveCustomRole,
        deleteCustomRole,
        hasPermission,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) throw new Error('usePOS must be used within POSProvider');
  return context;
};
