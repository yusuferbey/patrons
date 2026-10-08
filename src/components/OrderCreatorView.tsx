import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { RestaurantTable, Product, OrderItemCustomization } from '../types';
import { ProductCustomizerModal } from './ProductCustomizerModal';
import {
  Search,
  ArrowLeft,
  ShoppingBag,
  Trash2,
  Send,
  Plus,
  Minus,
  MessageSquare,
  Users,
  Flame,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productPhoto: string;
  categoryId: string;
  station: Product['station'];
  unitPrice: number;
  quantity: number;
  customization: OrderItemCustomization;
}

interface OrderCreatorViewProps {
  table: RestaurantTable;
  onBack: () => void;
  onOrderCompleted: () => void;
}

export const OrderCreatorView: React.FC<OrderCreatorViewProps> = ({
  table,
  onBack,
  onOrderCompleted,
}) => {
  const { categories, products, createOrAppendOrder, currentUser } = usePOS();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [generalNote, setGeneralNote] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(table.guestCount || 2);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showMobileCartDrawer, setShowMobileCartDrawer] = useState<boolean>(false);

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (!p.active) return false;
    const matchCat = selectedCategoryId === 'ALL' || p.categoryId === selectedCategoryId;
    const matchSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleProductClick = (product: Product) => {
    if (!product.inStock) return;
    // If product has extras or removable options, open customizer modal
    if ((product.extras && product.extras.length > 0) || (product.removableIngredients && product.removableIngredients.length > 0)) {
      setCustomizingProduct(product);
    } else {
      // Quick add directly to cart
      addToCart({
        productId: product.id,
        productName: product.name,
        productPhoto: product.photo,
        categoryId: product.categoryId,
        station: product.station,
        unitPrice: product.price,
        quantity: 1,
        customization: { extras: [], removedIngredients: [] },
      });
    }
  };

  const addToCart = (itemData: {
    productId: string;
    productName: string;
    productPhoto: string;
    categoryId: string;
    station: Product['station'];
    unitPrice: number;
    quantity: number;
    customization: OrderItemCustomization;
  }) => {
    const extrasSum = (itemData.customization.extras || []).reduce((acc, e) => acc + e.price, 0);
    const calculatedUnitPrice = itemData.unitPrice + extrasSum;

    // Check if duplicate item with exact same customization exists in cart
    const existingIdx = cartItems.findIndex(
      (ci) =>
        ci.productId === itemData.productId &&
        JSON.stringify(ci.customization) === JSON.stringify(itemData.customization)
    );

    if (existingIdx !== -1) {
      const updated = [...cartItems];
      updated[existingIdx].quantity += itemData.quantity;
      setCartItems(updated);
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ...itemData,
        unitPrice: calculatedUnitPrice,
      };
      setCartItems((prev) => [...prev, newItem]);
    }
  };

  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const subtotal = cartItems.reduce((acc, itm) => acc + itm.unitPrice * itm.quantity, 0);
  const totalCartCount = cartItems.reduce((acc, itm) => acc + itm.quantity, 0);
  const vatAmount = subtotal * 0.1; // 10% KDV included

  const handleSendToKitchen = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    const success = await createOrAppendOrder(table.id, cartItems, generalNote, guestCount);
    setIsSubmitting(false);
    if (success) {
      setCartItems([]);
      setShowMobileCartDrawer(false);
      onOrderCompleted();
    }
  };

  const renderCartContent = (isMobileModal = false) => (
    <div className="flex flex-col justify-between h-full">
      {/* Cart Header */}
      <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-slate-100">{table.name} Sepeti</h2>
            <span className="text-xs text-slate-400 font-mono-numbers">{cartItems.length} Kalem Ürün</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cartItems.length > 0 && (
            <button
              onClick={() => setCartItems([])}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
            >
              Temizle
            </button>
          )}
          {isMobileModal && (
            <button
              onClick={() => setShowMobileCartDrawer(false)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className={`flex-1 py-4 overflow-y-auto space-y-3 ${isMobileModal ? 'max-h-[42vh]' : ''}`}>
        {cartItems.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">Sepetiniz boş</p>
            <p className="text-xs text-slate-600 mt-1">Ürün seçerek sepete ekleyin.</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 text-xs truncate">{item.productName}</h4>
                  <span className="text-xs font-bold text-amber-400 font-mono-numbers ml-2">
                    ₺{(item.unitPrice * item.quantity).toLocaleString('tr-TR')}
                  </span>
                </div>

                {/* Modifiers info */}
                <div className="mt-1 space-y-0.5 text-[11px]">
                  {item.customization?.extras && item.customization.extras.length > 0 && (
                    <p className="text-emerald-400">
                      + {item.customization.extras.map((e) => `${e.name} (+₺${e.price})`).join(', ')}
                    </p>
                  )}
                  {item.customization?.removedIngredients && item.customization.removedIngredients.length > 0 && (
                    <p className="text-rose-400">- {item.customization.removedIngredients.join(', ')}</p>
                  )}
                  {item.customization?.specialNote && (
                    <p className="text-amber-300/80 italic">💬 {item.customization.specialNote}</p>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                    <button
                      onClick={() => updateCartItemQuantity(item.id, -1)}
                      className="w-5 h-5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs font-mono-numbers text-slate-200">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartItemQuantity(item.id, 1)}
                      className="w-5 h-5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeCartItem(item.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Bottom Summary & Send Button */}
      <div className="pt-3 border-t border-slate-800 space-y-2.5">
        {/* Order Note */}
        <div className="relative">
          <MessageSquare className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={generalNote}
            onChange={(e) => setGeneralNote(e.target.value)}
            placeholder="Genel sipariş / masa notu..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Pricing breakdown */}
        <div className="space-y-1 text-xs text-slate-400">
          <div className="flex justify-between">
            <span>Ara Toplam:</span>
            <span className="font-mono-numbers font-bold text-slate-200">₺{subtotal.toLocaleString('tr-TR')}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>KDV Dahil (%10):</span>
            <span className="font-mono-numbers">₺{vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-extrabold text-slate-100 pt-1 border-t border-slate-800/80">
            <span>Genel Toplam:</span>
            <span className="font-mono-numbers text-amber-400 text-base">₺{subtotal.toLocaleString('tr-TR')}</span>
          </div>
        </div>

        {/* SİPARİŞİ MUTFAĞA GÖNDER Button */}
        <button
          onClick={handleSendToKitchen}
          disabled={cartItems.length === 0 || isSubmitting}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {isSubmitting ? (
            <span className="animate-spin w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full" />
          ) : (
            <>
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>SİPARİŞİ MUTFAĞA GÖNDER</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-6rem)]">
      {/* Left Menu Section (Categories, Search, Product Grid) */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Sticky Table Top Banner */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-100">{table.name}</h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {table.section}
                </span>
              </div>
              <p className="text-xs text-slate-400">Garson: {currentUser?.name}</p>
            </div>
          </div>

          {/* Guest Count selector */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Kişi:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center font-bold text-xs"
              >
                -
              </button>
              <span className="text-xs font-bold font-mono-numbers text-amber-400 w-4 text-center">
                {guestCount}
              </span>
              <button
                type="button"
                onClick={() => setGuestCount(guestCount + 1)}
                className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center font-bold text-xs"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ürün adı veya açıklama ile ara... (Örn: burger, somon, kola)"
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-sm"
          />
        </div>

        {/* Category Horizontal Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId('ALL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategoryId === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>🍽️</span>
            <span>Tüm Menü</span>
          </button>

          {categories
            .filter((c) => c.active)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategoryId === cat.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3.5 flex-1 overflow-y-auto">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className={`bg-slate-900 rounded-2xl border border-slate-800/80 hover:border-amber-500/50 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer group active:scale-[0.98] ${
                !product.inStock ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div className="relative h-32 w-full overflow-hidden bg-slate-950">
                <img
                  src={product.photo}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                {/* Stock status tag */}
                <div className="absolute top-2 left-2">
                  {product.inStock ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                      Stokta ({product.stock})
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/40">
                      Tükendi
                    </span>
                  )}
                </div>

                {/* Station tag */}
                <div className="absolute top-2 right-2">
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/80 text-slate-950">
                    {product.station}
                  </span>
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm line-clamp-1 group-hover:text-amber-300 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-base font-extrabold text-amber-400 font-mono-numbers">
                    ₺{product.price.toLocaleString('tr-TR')}
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-amber-500/15 group-hover:bg-amber-500 text-amber-400 group-hover:text-slate-950 flex items-center justify-center transition-all">
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Fixed / Sticky Cart on Desktop */}
      <div className="hidden lg:flex w-96 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex-col justify-between shrink-0 max-h-[calc(100vh-6rem)]">
        {renderCartContent(false)}
      </div>

      {/* Mobile Floating Sticky Cart Summary (Shown when items in cart on < lg) */}
      {cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-14 left-3 right-3 z-30">
          <button
            onClick={() => setShowMobileCartDrawer(true)}
            className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-between shadow-2xl shadow-amber-500/30 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-xs">
                {totalCartCount}
              </div>
              <span>₺{subtotal.toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span>Sepeti Gör & Onayla</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Cart Drawer Modal */}
      {showMobileCartDrawer && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-slate-950/80 backdrop-blur-sm">
          <div
            className="fixed inset-0"
            onClick={() => setShowMobileCartDrawer(false)}
          />
          <div className="relative w-full max-h-[85vh] bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl flex flex-col z-10 overflow-hidden">
            {renderCartContent(true)}
          </div>
        </div>
      )}

      {/* Product Customizer Modal */}
      {customizingProduct && (
        <ProductCustomizerModal
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
};
