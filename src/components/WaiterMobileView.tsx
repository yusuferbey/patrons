import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { RestaurantTable, Product, OrderItem, Category, TableSection } from '../types';
import { formatOrderNumber } from '../utils/formatters';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  ArrowLeft,
  User as UserIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  LogOut,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  ChefHat,
  Monitor,
  Flame,
  Check,
  X,
  Coffee,
  Receipt,
  Utensils,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedExtras: { name: string; price: number }[];
  removedIngredients: string[];
  itemNotes: string;
  unitPrice: number;
}

export const WaiterMobileView: React.FC = () => {
  const {
    currentUser,
    logoutUser,
    tables,
    categories,
    products,
    orders,
    createOrAppendOrder,
    updateItemStatus,
    reduceOrderItem,
    cancelOrderItem,
    updateTableStatus,
    soundEnabled,
    toggleSound,
    theme,
    setTheme,
    setIsWaiterMobileMode,
    isOnline,
    refreshAllData,
    addToast,
  } = usePOS();

  // Navigation state inside mobile waiter view:
  // 'tables' -> table grid
  // 'table-detail' -> view selected table's current adisyon and orders
  // 'order-creator' -> product catalog & taking order for selected table
  const [viewState, setViewState] = useState<'tables' | 'table-detail' | 'order-creator'>('tables');
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  // Table filters
  const [tableFilter, setTableFilter] = useState<'ALL' | 'MY_TABLES' | 'OCCUPIED' | 'EMPTY' | 'READY' | 'BILL'>('ALL');
  const [sectionFilter, setSectionFilter] = useState<TableSection | 'ALL'>('ALL');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Order taking state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [productSearch, setProductSearch] = useState<string>('');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [customExtras, setCustomExtras] = useState<{ name: string; price: number }[]>([]);
  const [customRemoved, setCustomRemoved] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [customQty, setCustomQty] = useState<number>(1);

  const [orderGeneralNotes, setOrderGeneralNotes] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderSuccessData, setOrderSuccessData] = useState<{ orderNumber?: string; tableName: string; total: number; itemCount: number } | null>(null);

  // Item cancellation / reduction modal state
  const [reduceItemTarget, setReduceItemTarget] = useState<OrderItem | null>(null);
  const [reduceReason, setReduceReason] = useState<string>('Müşteri vazgeçti');

  // Quick Guest selector modal when opening empty table
  const [openTableGuestModal, setOpenTableGuestModal] = useState<RestaurantTable | null>(null);

  // Real-time notification for items ready in kitchen
  const readyItems = useMemo(() => {
    const list: { item: OrderItem; table: RestaurantTable }[] = [];
    orders.forEach((ord) => {
      if (ord.status === 'ACTIVE') {
        const tbl = tables.find((t) => t.id === ord.tableId);
        if (tbl) {
          ord.items.forEach((itm) => {
            if (itm.status === 'READY') {
              list.push({ item: itm, table: tbl });
            }
          });
        }
      }
    });
    return list;
  }, [orders, tables]);

  // Filtered tables list
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      // Section filter
      if (sectionFilter !== 'ALL' && t.section !== sectionFilter) return false;

      // Status / Ownership filter
      if (tableFilter === 'MY_TABLES') {
        const isMy = t.responsibleWaiterId === currentUser?.id || t.currentWaiterId === currentUser?.id;
        if (!isMy) return false;
      } else if (tableFilter === 'OCCUPIED') {
        if (t.status === 'EMPTY' || t.status === 'RESERVED') return false;
      } else if (tableFilter === 'EMPTY') {
        if (t.status !== 'EMPTY') return false;
      } else if (tableFilter === 'READY') {
        if (t.status !== 'READY') return false;
      } else if (tableFilter === 'BILL') {
        if (t.status !== 'BILL_REQUESTED') return false;
      }

      // Search
      if (tableSearch.trim()) {
        const query = tableSearch.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(query);
        const matchesNumber = String(t.number).includes(query);
        const matchesWaiter = (t.responsibleWaiterName || t.currentWaiterName || '').toLowerCase().includes(query);
        if (!matchesName && !matchesNumber && !matchesWaiter) return false;
      }

      return true;
    });
  }, [tables, tableFilter, sectionFilter, tableSearch, currentUser]);

  // Current active order for selected table
  const currentTableOrder = useMemo(() => {
    if (!selectedTable) return null;
    return orders.find((o) => o.id === selectedTable.currentOrderId && o.status === 'ACTIVE') || null;
  }, [orders, selectedTable]);

  // Group current table order items by batch/time and waiter
  const groupedOrderItems = useMemo(() => {
    if (!currentTableOrder) return [];
    const groups: {
      key: string;
      waiterName: string;
      timeStr: string;
      source: string;
      items: OrderItem[];
    }[] = [];

    currentTableOrder.items.forEach((item) => {
      const waiter = item.addedByWaiterName || currentTableOrder.waiterName || 'Garson';
      const time = item.createdAt
        ? new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        : 'Sipariş';
      const source = item.source === 'WAITER_MOBILE' ? '📱 Mobil' : '💻 POS';
      const key = `${waiter}-${time}-${item.batchId || ''}`;

      let grp = groups.find((g) => g.key === key);
      if (!grp) {
        grp = { key, waiterName: waiter, timeStr: time, source, items: [] };
        groups.push(grp);
      }
      grp.items.push(item);
    });

    return groups;
  }, [currentTableOrder]);

  // Filtered products for order creation
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;
      if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) return false;
      if (productSearch.trim()) {
        const query = productSearch.toLowerCase();
        return p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
      }
      return true;
    });
  }, [products, selectedCategory, productSearch]);

  // Cart total calculations
  const cartTotalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const cartTotalCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Handle table selection
  const handleTableClick = (table: RestaurantTable) => {
    setSelectedTable(table);
    if (table.status === 'EMPTY') {
      setGuestCount(2);
      setOpenTableGuestModal(table);
    } else {
      setViewState('table-detail');
    }
  };

  const handleStartOrderForEmptyTable = (table: RestaurantTable, guests: number) => {
    setOpenTableGuestModal(null);
    setSelectedTable(table);
    setGuestCount(guests);
    setCart([]);
    setOrderGeneralNotes('');
    setViewState('order-creator');
  };

  // Direct quick add to cart
  const handleQuickAddToCart = (product: Product) => {
    if (!product.inStock) {
      addToast('warning', 'Stok Yetersiz', `${product.name} şu anda stokta kalmadı.`);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.product.id === product.id &&
          i.selectedExtras.length === 0 &&
          i.removedIngredients.length === 0 &&
          !i.itemNotes
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
            product,
            quantity: 1,
            selectedExtras: [],
            removedIngredients: [],
            itemNotes: '',
            unitPrice: product.price,
          },
        ];
      }
    });

    sounds.playAddSound();
  };

  // Open customizer
  const handleOpenCustomizer = (product: Product) => {
    setCustomizingProduct(product);
    setCustomExtras([]);
    setCustomRemoved([]);
    setCustomNotes('');
    setCustomQty(1);
  };

  const handleAddCustomizedProduct = () => {
    if (!customizingProduct) return;
    const extrasTotal = customExtras.reduce((acc, e) => acc + e.price, 0);
    const unitPrice = customizingProduct.price + extrasTotal;

    setCart((prev) => [
      ...prev,
      {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
        product: customizingProduct,
        quantity: customQty,
        selectedExtras: customExtras,
        removedIngredients: customRemoved,
        itemNotes: customNotes,
        unitPrice,
      },
    ]);

    setCustomizingProduct(null);
    sounds.playAddSound();
  };

  // Modify cart item quantity
  const handleUpdateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Send order to kitchen
  const handleSendOrder = async () => {
    if (!selectedTable || cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    const itemsPayload = cart.map((c) => ({
      productId: c.product.id,
      productName: c.product.name,
      productPhoto: c.product.photo,
      categoryId: c.product.categoryId,
      station: c.product.station,
      unitPrice: c.unitPrice,
      quantity: c.quantity,
      customization: {
        extras: c.selectedExtras,
        removedIngredients: c.removedIngredients,
        notes: c.itemNotes,
      },
    }));

    const result = await createOrAppendOrder(
      selectedTable.id,
      itemsPayload,
      orderGeneralNotes,
      guestCount,
      {
        source: 'WAITER_MOBILE',
        deviceType: 'MOBILE',
        waiterId: currentUser?.id,
        waiterName: currentUser?.name,
      }
    );

    setIsSubmitting(false);

    if (result && typeof result === 'object' && result.success) {
      sounds.playOrderSuccessSound();
      setOrderSuccessData({
        orderNumber: result.orderNumber,
        tableName: selectedTable.name,
        total: cartTotalAmount,
        itemCount: cartTotalCount,
      });
      setCart([]);
      setShowCartDrawer(false);
    }
  };

  // Mark an item as served
  const handleMarkServed = async (itemId: string) => {
    await updateItemStatus(itemId, 'SERVED');
    sounds.playNotificationSound();
    addToast('success', 'Servis Edildi', 'Ürün servis edildi olarak işaretlendi.');
  };

  // Submit item reduction / cancel
  const handleConfirmReduce = async () => {
    if (!reduceItemTarget) return;
    await reduceOrderItem(reduceItemTarget.id, 1, reduceReason);
    setReduceItemTarget(null);
  };

  // Request bill for table
  const handleRequestBill = async (table: RestaurantTable) => {
    await updateTableStatus(table.id, 'BILL_REQUESTED');
    addToast('info', 'Hesap İstendi', `${table.name} için kasa ekranına hesap talebi gönderildi.`);
  };

  // Serve all pending/ready items for table
  const handleServeAll = async () => {
    if (!selectedTable) return;
    try {
      const res = await fetch(`/api/tables/${selectedTable.id}/serve-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          performedBy: currentUser?.name || 'Garson',
          performedRole: currentUser?.role || 'WAITER',
        }),
      });
      if (res.ok) {
        sounds.playNotificationSound();
        addToast('success', '✓ Tümünü Servis Et', `${selectedTable.name} masasının tüm siparişleri servis edildi olarak işaretlendi.`);
        refreshAllData();
      }
    } catch (err) {
      addToast('error', 'Hata', 'İşlem gerçekleştirilemedi.');
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased ${theme}`}>
      {/* 1. Mobile Waiter Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          {viewState !== 'tables' ? (
            <button
              onClick={() => {
                if (viewState === 'order-creator' && selectedTable?.status !== 'EMPTY') {
                  setViewState('table-detail');
                } else {
                  setViewState('tables');
                }
              }}
              className="p-2 -ml-1 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <Utensils className="w-5 h-5 stroke-[2.5]" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold text-slate-100 leading-tight">
                {viewState === 'tables' && 'ÖZER GARSON'}
                {viewState === 'table-detail' && (selectedTable?.name || 'Masa Detayı')}
                {viewState === 'order-creator' && `${selectedTable?.name} • Sipariş`}
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Mobil
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[160px] sm:max-w-xs">
              Garson: <strong className="text-amber-400">{currentUser?.name}</strong>
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {/* Online SSE status indicator */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="hidden xs:inline">{isOnline ? 'Canlı' : 'Koptu'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 active:scale-95 transition-all"
            title="Ses"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Switch to Desktop POS if Admin or user wants */}
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'CASHIER') && (
            <button
              onClick={() => setIsWaiterMobileMode(false)}
              className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 active:scale-95 transition-all"
              title="Masaüstü POS Görünümüne Geç"
            >
              <Monitor className="w-4 h-4" />
            </button>
          )}

          {/* Logout */}
          <button
            onClick={logoutUser}
            className="p-2 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 active:scale-95 transition-all"
            title="Çıkış Yap"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Top Ready Items Banner (Real-time Waiter Alert) */}
      {readyItems.length > 0 && viewState === 'tables' && (
        <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between shadow-inner animate-fade-in">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 animate-bounce">
              <Bell className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-200 truncate">
              <strong className="text-emerald-400">{readyItems.length} ürün servise hazır!</strong>
              <span className="text-slate-400 ml-1">
                ({readyItems.map((r) => `${r.table.name}: ${r.item.productName}`).join(', ')})
              </span>
            </div>
          </div>
          <button
            onClick={() => setTableFilter('READY')}
            className="shrink-0 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] rounded-lg shadow-sm transition-all"
          >
            Gör
          </button>
        </div>
      )}

      {/* 3. Main Views */}
      <main className="flex-1 pb-24 overflow-y-auto">
        {/* =========================================================================
            VIEW 1: TABLES GRID (GARSON ANA SAYFA)
           ========================================================================= */}
        {viewState === 'tables' && (
          <div className="p-3.5 space-y-3.5 max-w-2xl mx-auto">
            {/* Search and Quick Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Masa ara (Örn: 5, Salon, Ahmet)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                {tableSearch && (
                  <button
                    onClick={() => setTableSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  onClick={() => setTableFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    tableFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  Tüm Masalar ({tables.length})
                </button>
                <button
                  onClick={() => setTableFilter('MY_TABLES')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    tableFilter === 'MY_TABLES'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  Benim Masalarım
                </button>
                <button
                  onClick={() => setTableFilter('OCCUPIED')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    tableFilter === 'OCCUPIED'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  Dolu ({tables.filter((t) => t.status !== 'EMPTY' && t.status !== 'RESERVED').length})
                </button>
                <button
                  onClick={() => setTableFilter('EMPTY')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    tableFilter === 'EMPTY'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  Boş ({tables.filter((t) => t.status === 'EMPTY').length})
                </button>
                <button
                  onClick={() => setTableFilter('READY')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    tableFilter === 'READY'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 text-emerald-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  🟢 Servis Bekleyen
                </button>
                <button
                  onClick={() => setTableFilter('BILL')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    tableFilter === 'BILL'
                      ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
                      : 'bg-slate-900 text-purple-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  💳 Hesap İstendi
                </button>
              </div>

              {/* Section Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {(['ALL', 'Salon', 'Teras', 'Bahçe', 'VIP'] as const).map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSectionFilter(sec)}
                    className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                      sectionFilter === sec
                        ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sec === 'ALL' ? 'Tüm Katlar' : sec}
                  </button>
                ))}
              </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredTables.map((table) => {
                const isEmpty = table.status === 'EMPTY';
                const isReady = table.status === 'READY';
                const isKitchen = table.status === 'KITCHEN';
                const isBill = table.status === 'BILL_REQUESTED';
                const isMyTable =
                  table.responsibleWaiterId === currentUser?.id || table.currentWaiterId === currentUser?.id;

                return (
                  <button
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className={`relative p-3.5 rounded-2xl border text-left flex flex-col justify-between min-h-[140px] transition-all active:scale-[0.98] ${
                      isEmpty
                        ? 'bg-slate-900/60 border-slate-800/80 hover:border-emerald-500/40'
                        : isReady
                        ? 'bg-gradient-to-b from-emerald-950/60 to-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                        : isBill
                        ? 'bg-gradient-to-b from-purple-950/60 to-slate-900 border-purple-500/60'
                        : isKitchen
                        ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/40'
                        : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    {/* Top Row: Number & Status Badge */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border ${
                            isEmpty
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : isReady
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                              : isBill
                              ? 'bg-purple-500 text-slate-950 border-purple-400'
                              : isKitchen
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-blue-600 text-white border-blue-500'
                          }`}
                        >
                          {table.number}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-100 truncate">{table.name}</h3>
                          <span className="text-[10px] text-slate-400">{table.section}</span>
                        </div>
                      </div>

                      {/* Status Icon */}
                      <div>
                        {isEmpty && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                            Boş
                          </span>
                        )}
                        {isReady && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Servis
                          </span>
                        )}
                        {isKitchen && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Mutfak
                          </span>
                        )}
                        {isBill && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Hesap
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Waiter & Duration */}
                    <div className="my-2 space-y-0.5 text-[11px]">
                      {!isEmpty ? (
                        <>
                          <p className="text-slate-400 truncate flex items-center gap-1">
                            <UserIcon className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">
                              {table.responsibleWaiterName || table.currentWaiterName || 'Garson'}
                            </span>
                            {isMyTable && (
                              <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-bold">
                                Siz
                              </span>
                            )}
                          </p>
                          {table.openedAt && (
                            <p className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-400 shrink-0" />
                              {new Date(table.openedAt).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-slate-500 text-xs italic">Sipariş için tıkla</p>
                      )}
                    </div>

                    {/* Bottom: Total Bill or Quick Add */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      {!isEmpty ? (
                        <>
                          <span className="text-[10px] text-slate-400">Tutar:</span>
                          <strong className="font-extrabold text-amber-400 text-sm">
                            ₺{table.totalAmount.toLocaleString('tr-TR')}
                          </strong>
                        </>
                      ) : (
                        <span className="w-full text-center py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-[11px] border border-emerald-500/20 flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3" /> Masayı Aç
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: TABLE DETAIL (MEVCUT ADİSYON & SİPARİŞ GEÇMİŞİ)
           ========================================================================= */}
        {viewState === 'table-detail' && selectedTable && (
          <div className="p-4 space-y-4 max-w-xl mx-auto">
            {/* Table Overview Header Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                    {selectedTable.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-slate-100">{selectedTable.name}</h2>
                      {currentTableOrder && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                          {formatOrderNumber(currentTableOrder)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{selectedTable.section} Katı</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 uppercase font-bold">Toplam Tutar</span>
                  <div className="text-2xl font-black text-amber-400">
                    ₺{selectedTable.totalAmount.toLocaleString('tr-TR')}
                  </div>
                </div>
              </div>

              {/* Responsible Waiter Banner (Multi-waiter explanation) */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <UserIcon className="w-4 h-4 text-amber-400" />
                    Sorumlu Garson:
                  </span>
                  <strong className="text-slate-200 font-bold">
                    {selectedTable.responsibleWaiterName || selectedTable.currentWaiterName || 'Ahmet Yılmaz'}
                  </strong>
                </div>

                {/* Friendly notification if performing waiter is different */}
                {selectedTable.responsibleWaiterName &&
                  selectedTable.responsibleWaiterName !== currentUser?.name && (
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        Sorumlu garson <strong>{selectedTable.responsibleWaiterName}</strong>. Ek siparişler adisyona
                        ve mutfağa sizin adınızla (<strong>{currentUser?.name}</strong>) kaydedilecektir.
                      </span>
                    </div>
                  )}
              </div>

              {/* Big Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => {
                    setCart([]);
                    setOrderGeneralNotes('');
                    setViewState('order-creator');
                  }}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>YENİ SİPARİŞ</span>
                </button>

                <button
                  onClick={() => handleRequestBill(selectedTable)}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Receipt className="w-4 h-4 text-purple-400" />
                  <span>HESAP İSTE</span>
                </button>
              </div>

              {currentTableOrder?.items.some((i) => i.status !== 'SERVED' && i.status !== 'CANCELLED') && (
                <button
                  onClick={handleServeAll}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-extrabold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <CheckCheck className="w-5 h-5 stroke-[2.5]" />
                  <span>TÜMÜNÜ SERVİS ET</span>
                </button>
              )}
            </div>

            {/* Grouped Order Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  📋 Adisyondaki Siparişler ({currentTableOrder ? currentTableOrder.items.length : 0})
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">Zaman & Garson Bazlı</span>
              </div>

              {groupedOrderItems.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-3xl text-slate-500">
                  <Utensils className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Bu masada henüz kayıtlı sipariş bulunmuyor.</p>
                </div>
              ) : (
                groupedOrderItems.map((group) => (
                  <div
                    key={group.key}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md space-y-3"
                  >
                    {/* Group Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-400" />
                          {group.timeStr}
                        </span>
                        <span className="font-bold text-slate-200">{group.waiterName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{group.source}</span>
                    </div>

                    {/* Items in this batch */}
                    <div className="space-y-2.5">
                      {group.items.map((item) => {
                        const isCancelled = item.status === 'CANCELLED';
                        const isReady = item.status === 'READY';
                        const isServed = item.status === 'SERVED';
                        const isPreparing = item.status === 'PREPARING' || item.status === 'ACCEPTED';
                        const isNew = item.status === 'NEW';

                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                              isCancelled
                                ? 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60'
                                : isReady
                                ? 'bg-emerald-950/30 border-emerald-500/40'
                                : 'bg-slate-950 border-slate-800/80'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm text-amber-400">
                                  {item.quantity}x
                                </span>
                                <h4
                                  className={`font-bold text-sm truncate ${
                                    isCancelled ? 'line-through text-slate-500' : 'text-slate-100'
                                  }`}
                                >
                                  {item.productName}
                                </h4>
                              </div>

                              {/* Customization extras or removed ingredients */}
                              {item.customization && (
                                <div className="text-[11px] text-slate-400 mt-0.5 space-x-1">
                                  {item.customization.extras?.map((e) => (
                                    <span key={e.name} className="text-amber-400/90 font-medium">
                                      +{e.name}
                                    </span>
                                  ))}
                                  {item.customization.removedIngredients?.map((r) => (
                                    <span key={r} className="text-rose-400/90 font-medium">
                                      (Çıkar: {r})
                                    </span>
                                  ))}
                                  {item.customization.notes && (
                                    <span className="text-slate-400 italic">"{item.customization.notes}"</span>
                                  )}
                                </div>
                              )}

                              {/* Status Tag */}
                              <div className="mt-1.5 flex items-center gap-1.5">
                                {isNew && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    🔴 Mutfakta Yeni
                                  </span>
                                )}
                                {isPreparing && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    🟡 Hazırlanıyor
                                  </span>
                                )}
                                {isReady && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                                    🟢 Servise Hazır
                                  </span>
                                )}
                                {isServed && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    🔵 Servis Edildi
                                  </span>
                                )}
                                {isCancelled && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-500">
                                    İptal ({item.cancelReason || 'Müşteri talebi'})
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Item Price & Quick Actions */}
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className="font-extrabold text-sm text-slate-200">
                                ₺{(item.unitPrice * item.quantity).toLocaleString('tr-TR')}
                              </span>

                              {!isCancelled && (
                                <div className="flex items-center gap-1">
                                  {isReady && (
                                    <button
                                      onClick={() => handleMarkServed(item.id)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shadow-sm flex items-center gap-1 active:scale-95 transition-all"
                                      title="Servis Edildi Olarak İşaretle"
                                    >
                                      <Check className="w-3 h-3 stroke-[3]" /> Servis Et
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setReduceItemTarget(item)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 active:scale-95 transition-all text-[11px]"
                                    title="Adet Azalt / İptal Et"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3: ORDER CREATOR (MENÜ, KATEGORİLER & SEPET)
           ========================================================================= */}
        {viewState === 'order-creator' && selectedTable && (
          <div className="p-3.5 space-y-3.5 max-w-2xl mx-auto">
            {/* Search and Category Scroller */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Ürün veya lezzet ara..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Categories Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                    selectedCategory === 'ALL'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  🍽️ Tümü
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredProducts.map((product) => {
                const cartQty = cart
                  .filter((c) => c.product.id === product.id)
                  .reduce((acc, c) => acc + c.quantity, 0);

                return (
                  <div
                    key={product.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between hover:border-amber-500/40 transition-all group relative overflow-hidden"
                  >
                    {/* Image & Stock */}
                    <div
                      className="relative h-28 rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => handleOpenCustomizer(product)}
                    >
                      <img
                        src={product.photo}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                      {/* Station badge */}
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-950/80 backdrop-blur-sm text-slate-300 border border-slate-700">
                        {product.station}
                      </span>

                      {/* Stock badge */}
                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/80 text-white">
                          Son {product.stock}
                        </span>
                      )}

                      {/* Cart badge */}
                      {cartQty > 0 && (
                        <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg">
                          {cartQty}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="my-2 cursor-pointer" onClick={() => handleOpenCustomizer(product)}>
                      <h4 className="font-extrabold text-xs text-slate-100 truncate">{product.name}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{product.description}</p>
                    </div>

                    {/* Price and Add button */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <strong className="font-extrabold text-sm text-amber-400">
                        ₺{product.price.toLocaleString('tr-TR')}
                      </strong>

                      <button
                        onClick={() => handleQuickAddToCart(product)}
                        className="w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-md active:scale-95 transition-all"
                        title="Hızlı Ekle"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          4. FLOATING STICKY CART BAR (WHEN ORDERING)
         ========================================================================= */}
      {viewState === 'order-creator' && cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 p-3 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
          <button
            onClick={() => setShowCartDrawer(true)}
            className="w-full max-w-xl mx-auto py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-2xl shadow-amber-500/40 flex items-center justify-between active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold text-xs">
                {cartTotalCount}
              </div>
              <span className="text-sm">Siparişi Gör & Onayla</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-black">₺{cartTotalAmount.toLocaleString('tr-TR')}</span>
              <Send className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* =========================================================================
          5. CART & ORDER CONFIRMATION DRAWER / MODAL
         ========================================================================= */}
      {showCartDrawer && selectedTable && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl mx-auto bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-100 flex items-center gap-2">
                  <span>{selectedTable.name} Sipariş Özeti</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold">
                    {cartTotalCount} Ürün
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Giren Garson: <strong className="text-slate-200">{currentUser?.name}</strong>
                </p>
              </div>

              <button
                onClick={() => setShowCartDrawer(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-100 truncate">{item.product.name}</h4>
                    <div className="text-[11px] text-slate-400 space-x-1">
                      {item.selectedExtras.map((e) => (
                        <span key={e.name} className="text-amber-400">
                          +{e.name}
                        </span>
                      ))}
                      {item.removedIngredients.map((r) => (
                        <span key={r} className="text-rose-400">
                          (Çıkar: {r})
                        </span>
                      ))}
                      {item.itemNotes && <span className="italic">"{item.itemNotes}"</span>}
                    </div>
                    <span className="font-mono font-bold text-xs text-amber-400">
                      ₺{(item.unitPrice * item.quantity).toLocaleString('tr-TR')}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
                    <button
                      onClick={() => handleUpdateCartQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-black text-sm text-slate-100 w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateCartQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Order General Notes */}
              <div className="space-y-1 pt-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Masa / Mutfak Genel Notu (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={orderGeneralNotes}
                  onChange={(e) => setOrderGeneralNotes(e.target.value)}
                  placeholder="Örn: Acil servis, doğum günü masası..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Drawer Footer / Submit Button */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase">Sipariş Toplamı:</span>
                <span className="text-xl font-black text-amber-400">
                  ₺{cartTotalAmount.toLocaleString('tr-TR')}
                </span>
              </div>

              <button
                onClick={handleSendOrder}
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <span className="animate-spin w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>🚀 ONAYLA VE MUTFAĞA GÖNDER</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. PRODUCT CUSTOMIZER MODAL
         ========================================================================= */}
      {customizingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 my-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={customizingProduct.photo}
                  alt={customizingProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-800"
                />
                <div>
                  <h3 className="font-extrabold text-base text-slate-100">{customizingProduct.name}</h3>
                  <span className="text-sm font-black text-amber-400">
                    ₺{customizingProduct.price.toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setCustomizingProduct(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Extras Selection */}
            {customizingProduct.extras && customizingProduct.extras.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ekstra Malzemeler
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {customizingProduct.extras.map((extra) => {
                    const isSelected = customExtras.some((e) => e.name === extra.name);
                    return (
                      <button
                        key={extra.name}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setCustomExtras((prev) => prev.filter((e) => e.name !== extra.name));
                          } else {
                            setCustomExtras((prev) => [...prev, extra]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span>{extra.name}</span>
                        <span className="text-amber-400">+₺{extra.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Removable Ingredients */}
            {customizingProduct.removableIngredients && customizingProduct.removableIngredients.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Çıkarılacak Malzemeler
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {customizingProduct.removableIngredients.map((item) => {
                    const isRemoved = customRemoved.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          if (isRemoved) {
                            setCustomRemoved((prev) => prev.filter((r) => r !== item));
                          } else {
                            setCustomRemoved((prev) => [...prev, item]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                          isRemoved
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 line-through'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {item} {isRemoved ? '✕' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special Note */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Özel Pişirme / Servis Notu
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Örn: Et orta-iyi pişsin, buzsuz olsun..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quantity Stepper & Submit */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono font-black text-base text-slate-100 w-6 text-center">
                  {customQty}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomQty((q) => q + 1)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddCustomizedProduct}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span>Sepete Ekle</span>
                <span className="font-mono">
                  (₺
                  {(
                    (customizingProduct.price + customExtras.reduce((acc, e) => acc + e.price, 0)) *
                    customQty
                  ).toLocaleString('tr-TR')}
                  )
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. OPEN EMPTY TABLE GUEST COUNT SELECTOR MODAL
         ========================================================================= */}
      {openTableGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xl border border-emerald-500/30">
              {openTableGuestModal.number}
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-100">{openTableGuestModal.name} Açılıyor</h3>
              <p className="text-xs text-slate-400 mt-1">Kaç kişi için sipariş alacaksınız?</p>
            </div>

            {/* Quick Guest Count Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setGuestCount(num)}
                  className={`py-3 rounded-xl font-mono font-black text-base transition-all ${
                    guestCount === num
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 scale-105'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpenTableGuestModal(null)}
                className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => handleStartOrderForEmptyTable(openTableGuestModal, guestCount)}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                <span>Siparişi Başlat</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. REDUCE ITEM QUANTITY / CANCEL REASON MODAL
         ========================================================================= */}
      {reduceItemTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <h3 className="font-extrabold text-base text-slate-100">Adet Azalt / İptal</h3>
              </div>
              <button
                onClick={() => setReduceItemTarget(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              <strong className="text-amber-400">{reduceItemTarget.productName}</strong> için 1 adet azaltılacak.
              Lütfen sebep belirtiniz:
            </p>

            <div className="space-y-1.5">
              {[
                'Müşteri vazgeçti',
                'Yanlış girildi / Hatalı sipariş',
                'Ürün tükendi',
                'Mutfak gecikmesi',
                'Müşteri memnuniyetsizliği',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setReduceReason(reason)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                    reduceReason === reason
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReduceItemTarget(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmReduce}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30"
              >
                Onayla & Azalt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          9. ORDER SUCCESS FEEDBACK MODAL
         ========================================================================= */}
      {orderSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Sipariş No: {formatOrderNumber(orderSuccessData.orderNumber)}
              </span>
              <h3 className="text-xl font-black text-slate-100 mt-2">Sipariş Mutfağa İletildi!</h3>
              <p className="text-xs text-slate-400 mt-1">
                <strong className="text-slate-200">{orderSuccessData.tableName}</strong> için{' '}
                {orderSuccessData.itemCount} adet ürün mutfak ekranına ve adisyona eklendi.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Eklenen Tutar:</span>
              <strong className="text-amber-400 font-extrabold text-sm">
                ₺{orderSuccessData.total.toLocaleString('tr-TR')}
              </strong>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOrderSuccessData(null);
                  setViewState('table-detail');
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20"
              >
                Adisyonu Görüntüle
              </button>

              <button
                type="button"
                onClick={() => {
                  setOrderSuccessData(null);
                  setViewState('tables');
                }}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Masa Listesine Dön
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
