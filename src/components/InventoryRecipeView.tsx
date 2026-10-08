import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { Product } from '../types';
import {
  Package,
  Layers,
  History,
  Plus,
  Minus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Scale,
  ArrowDownRight,
  ArrowUpRight,
  Save,
  X,
  ChefHat,
  DollarSign,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';

export interface RawMaterial {
  id: string;
  name: string;
  unit: 'kg' | 'gr' | 'lt' | 'ml' | 'adet';
  currentStock: number;
  minStockAlert: number;
  costPerUnit: number;
  category?: string;
  station?: 'KITCHEN' | 'BAR' | 'MAIN_STORAGE';
}

export interface InventoryTransaction {
  id: string;
  timestamp: string;
  rawItemId: string;
  rawItemName: string;
  changeAmount: number;
  previousStock: number;
  newStock: number;
  unit: string;
  type: 'PURCHASE' | 'USAGE' | 'WASTE' | 'CORRECTION' | 'ORDER_DEDUCTION';
  performedBy: string;
  reason: string;
  relatedOrderId?: string;
}

export const InventoryRecipeView: React.FC = () => {
  const { products, refreshAllData, addToast } = usePOS();
  const [activeTab, setActiveTab] = useState<'raw_materials' | 'recipes' | 'history'>('raw_materials');
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Adjust Stock Modal State
  const [adjustModalItem, setAdjustModalItem] = useState<RawMaterial | null>(null);
  const [adjustType, setAdjustType] = useState<'ADD' | 'SUBTRACT' | 'WASTE'>('ADD');
  const [adjustAmount, setAdjustAmount] = useState<string>('5');
  const [adjustReason, setAdjustReason] = useState<string>('Mal Kabul / Tedarik Girişi');

  // Add/Edit Raw Material Modal State
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [matName, setMatName] = useState<string>('');
  const [matUnit, setMatUnit] = useState<'kg' | 'gr' | 'lt' | 'ml' | 'adet'>('kg');
  const [matStock, setMatStock] = useState<string>('10');
  const [matMinAlert, setMatMinAlert] = useState<string>('2');
  const [matCost, setMatCost] = useState<string>('150');
  const [matStation, setMatStation] = useState<'KITCHEN' | 'BAR' | 'MAIN_STORAGE'>('KITCHEN');

  // Recipe Editor Modal State
  const [recipeModalProduct, setRecipeModalProduct] = useState<Product | null>(null);
  const [currentRecipe, setCurrentRecipe] = useState<{ rawItemId: string; quantity: number; unit: string }[]>([]);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const [invRes, transRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/inventory/transactions'),
      ]);

      if (invRes.ok) {
        const data = await invRes.json();
        setMaterials(data);
      }
      if (transRes.ok) {
        const tData = await transRes.json();
        setTransactions(tData);
      }
    } catch (e) {
      console.error('Error fetching inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Stock Adjustment Submit
  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem) return;

    const amountNum = parseFloat(adjustAmount) || 0;
    if (amountNum <= 0) {
      addToast('warning', 'Geçersiz Miktar', 'Lütfen 0 dan büyük bir miktar girin.');
      return;
    }

    const delta = adjustType === 'ADD' ? amountNum : -amountNum;

    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawItemId: adjustModalItem.id,
          amount: delta,
          type: adjustType === 'ADD' ? 'PURCHASE' : adjustType === 'WASTE' ? 'WASTE' : 'USAGE',
          reason: adjustReason,
        }),
      });

      if (res.ok) {
        addToast(
          'success',
          'Stok Güncellendi',
          `${adjustModalItem.name} için ${delta > 0 ? '+' : ''}${delta} ${adjustModalItem.unit} uygulandı.`
        );
        setAdjustModalItem(null);
        fetchInventoryData();
      }
    } catch {
      addToast('error', 'Hata', 'Stok güncellenemedi.');
    }
  };

  // Save Raw Material (Create/Edit)
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: RawMaterial = {
      id: editingMaterial ? editingMaterial.id : `raw-${Date.now()}`,
      name: matName,
      unit: matUnit,
      currentStock: parseFloat(matStock) || 0,
      minStockAlert: parseFloat(matMinAlert) || 1,
      costPerUnit: parseFloat(matCost) || 0,
      station: matStation,
    };

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        addToast('success', 'Hammadde Kaydedildi', `${matName} başarıyla listeye eklendi.`);
        setIsMaterialModalOpen(false);
        fetchInventoryData();
      }
    } catch {
      addToast('error', 'Hata', 'Hammadde kaydedilemedi.');
    }
  };

  // Open Recipe Modal
  const handleOpenRecipeModal = (p: Product) => {
    setRecipeModalProduct(p);
    setCurrentRecipe((p as any).recipe ? [...(p as any).recipe] : []);
  };

  // Add Item to Recipe
  const handleAddRecipeIngredient = (rawItemId: string) => {
    const raw = materials.find((m) => m.id === rawItemId);
    if (!raw) return;
    if (currentRecipe.some((r) => r.rawItemId === rawItemId)) {
      addToast('warning', 'Zaten Ekli', `${raw.name} zaten bu reçetede mevcut.`);
      return;
    }

    const defaultQty = raw.unit === 'gr' ? 100 : raw.unit === 'ml' ? 100 : 1;
    setCurrentRecipe([...currentRecipe, { rawItemId, quantity: defaultQty, unit: raw.unit }]);
  };

  const handleUpdateRecipeItemQty = (rawItemId: string, qty: number) => {
    setCurrentRecipe(
      currentRecipe.map((item) => (item.rawItemId === rawItemId ? { ...item, quantity: Math.max(0.01, qty) } : item))
    );
  };

  const handleRemoveRecipeIngredient = (rawItemId: string) => {
    setCurrentRecipe(currentRecipe.filter((item) => item.rawItemId !== rawItemId));
  };

  // Save Product Recipe
  const handleSaveRecipe = async () => {
    if (!recipeModalProduct) return;

    try {
      const res = await fetch(`/api/products/${recipeModalProduct.id}/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe: currentRecipe }),
      });

      if (res.ok) {
        addToast('success', 'Reçete Kaydedildi', `${recipeModalProduct.name} reçetesi güncellendi. Siparişlerde otomatik stok düşümü devrede.`);
        setRecipeModalProduct(null);
        refreshAllData();
      }
    } catch {
      addToast('error', 'Hata', 'Reçete kaydedilemedi.');
    }
  };

  // Filtered materials
  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  // Filtered products for recipe tab
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Sub Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('raw_materials')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'raw_materials'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Depo & Hammadde Stoğu ({materials.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'recipes'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Ürün Reçeteleri & Maliyet</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Stok Hareket Geçmişi ({transactions.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'raw_materials' && (
            <button
              onClick={() => {
                setEditingMaterial(null);
                setMatName('');
                setMatUnit('kg');
                setMatStock('10');
                setMatMinAlert('2');
                setMatCost('150');
                setMatStation('KITCHEN');
                setIsMaterialModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Yeni Hammadde Ekle</span>
            </button>
          )}
          <button
            onClick={fetchInventoryData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. RAW MATERIALS TAB */}
      {activeTab === 'raw_materials' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hammadde ara (Örn: Dana Kıyma, Kaşar, Kahve Çekirdeği)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((item) => {
              const isLowStock = item.currentStock <= item.minStockAlert;
              return (
                <div
                  key={item.id}
                  className={`bg-slate-900 border rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between ${
                    isLowStock ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm">{item.name}</h3>
                        <span className="text-[11px] text-slate-400">
                          {item.station === 'KITCHEN' ? '🍳 Mutfak' : item.station === 'BAR' ? '☕ Bar' : '📦 Ana Depo'}
                        </span>
                      </div>
                      {isLowStock && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Kritik Stok
                        </span>
                      )}
                    </div>

                    <div className="my-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Mevcut Miktar</span>
                        <div className="text-xl font-black text-amber-400 font-mono-numbers">
                          {item.currentStock.toLocaleString('tr-TR')} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Birim Maliyet</span>
                        <div className="text-sm font-bold text-slate-300 font-mono-numbers">
                          ₺{item.costPerUnit.toLocaleString('tr-TR')} / {item.unit}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>Kritik Alarm Eşiği:</span>
                      <strong className="text-slate-300">{item.minStockAlert} {item.unit}</strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 mt-3">
                    <button
                      onClick={() => {
                        setAdjustModalItem(item);
                        setAdjustType('ADD');
                        setAdjustAmount('5');
                        setAdjustReason('Mal Kabul / Sevkiyat Girişi');
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1 border border-emerald-500/30 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Giriş</span>
                    </button>

                    <button
                      onClick={() => {
                        setAdjustModalItem(item);
                        setAdjustType('SUBTRACT');
                        setAdjustAmount('1');
                        setAdjustReason('Mutfak Kullanımı / Manuel Çıkış');
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 border border-slate-700 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Çıkış</span>
                    </button>

                    <button
                      onClick={() => {
                        setAdjustModalItem(item);
                        setAdjustType('WASTE');
                        setAdjustAmount('1');
                        setAdjustReason('Bozulma / Fire / Zayi');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30 transition-colors"
                      title="Fire / Zayi Kaydet"
                    >
                      Fire
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. RECIPES TAB */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl text-xs text-slate-300 flex items-center gap-3">
            <ChefHat className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <strong className="text-amber-400">Otomatik Stok Düşüm Sistemi:</strong> Bir ürün sipariş edildiğinde veya adisyona eklendiğinde, burada tanımlanan reçetedeki hammadde miktarları depodan anında ve otomatik olarak düşülür.
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Menü ürünü ara..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const recipe = (product as any).recipe as { rawItemId: string; quantity: number; unit: string }[] | undefined;
              const hasRecipe = recipe && recipe.length > 0;

              // Calculate portion raw cost
              let portionCost = 0;
              if (hasRecipe) {
                recipe.forEach((r) => {
                  const raw = materials.find((m) => m.id === r.rawItemId);
                  if (raw) {
                    if (raw.unit === 'kg' && r.unit === 'gr') {
                      portionCost += (raw.costPerUnit / 1000) * r.quantity;
                    } else if (raw.unit === 'lt' && r.unit === 'ml') {
                      portionCost += (raw.costPerUnit / 1000) * r.quantity;
                    } else {
                      portionCost += raw.costPerUnit * r.quantity;
                    }
                  }
                });
              }

              return (
                <div
                  key={product.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={product.photo || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120'}
                        alt={product.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-800 shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm">{product.name}</h3>
                        <span className="text-xs font-bold text-amber-400 font-mono-numbers">
                          Satış: ₺{product.price.toLocaleString('tr-TR')}
                        </span>
                      </div>
                    </div>

                    {hasRecipe ? (
                      <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 mb-3 text-xs">
                        <div className="flex justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-1">
                          <span>Hammadde ({recipe.length} Kalem)</span>
                          <span className="font-bold text-emerald-400">Maliyet: ~₺{portionCost.toFixed(2)}</span>
                        </div>
                        {recipe.map((r) => {
                          const raw = materials.find((m) => m.id === r.rawItemId);
                          return (
                            <div key={r.rawItemId} className="flex justify-between text-[11px] text-slate-300">
                              <span>• {raw ? raw.name : 'Bilinmeyen Hammadde'}</span>
                              <strong className="font-mono text-amber-300">
                                {r.quantity} {r.unit}
                              </strong>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 text-center mb-3">
                        <p className="text-xs text-slate-500 italic">Henüz reçete tanımlanmamış.</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenRecipeModal(product)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{hasRecipe ? 'Reçeteyi Güncelle' : '+ Reçete Tanımla'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. TRANSACTIONS HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>Depo & Stok Hareket Kütüğü</span>
              </h3>
              <p className="text-xs text-slate-400">Siparişlerden otomatik düşümler, mal kabul girişleri ve fire kayıtları</p>
            </div>
            <span className="text-xs font-mono text-slate-500 font-bold">Toplam {transactions.length} Kayıt</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Henüz stok hareketi kaydedilmedi.</p>
            ) : (
              transactions.map((tr) => {
                const isPositive = tr.changeAmount > 0;
                return (
                  <div
                    key={tr.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tr.type === 'WASTE'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {isPositive ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-100">{tr.rawItemName}</strong>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              tr.type === 'ORDER_DEDUCTION'
                                ? 'bg-blue-500/20 text-blue-300'
                                : tr.type === 'PURCHASE'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {tr.type === 'ORDER_DEDUCTION'
                              ? '🍽️ Reçeteden Düşüm'
                              : tr.type === 'PURCHASE'
                              ? '📦 Mal Girişi'
                              : '⚠️ Fire/Zayi'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{tr.reason}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm font-black font-mono-numbers ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {tr.changeAmount} {tr.unit}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        Kalan: {tr.newStock} {tr.unit} • {new Date(tr.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <span>Stok Hareketi: {adjustModalItem.name}</span>
            </h2>

            <form onSubmit={handleConfirmAdjust} className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('ADD');
                    setAdjustReason('Mal Kabul / Sevkiyat Girişi');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    adjustType === 'ADD' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-400'
                  }`}
                >
                  + Giriş
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('SUBTRACT');
                    setAdjustReason('Mutfak Kullanımı / Manuel Çıkış');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    adjustType === 'SUBTRACT' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400'
                  }`}
                >
                  - Çıkış
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('WASTE');
                    setAdjustReason('Bozulma / Fire / Zayi');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    adjustType === 'WASTE' ? 'bg-rose-500 text-white' : 'bg-slate-950 text-slate-400'
                  }`}
                >
                  ⚠️ Fire
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Miktar ({adjustModalItem.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hareket Sebebi / Not</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  Onayla ve Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD/EDIT MATERIAL MODAL */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              <span>Yeni Depo Hammaddesi Ekle</span>
            </h2>

            <form onSubmit={handleSaveMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hammadde Adı</label>
                <input
                  type="text"
                  required
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  placeholder="Örn: Dana Kıyma (%20 Yağlı)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ölçü Birimi</label>
                  <select
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="gr">Gram (gr)</option>
                    <option value="lt">Litre (lt)</option>
                    <option value="ml">Mililitre (ml)</option>
                    <option value="adet">Adet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Bulunduğu Depo</label>
                  <select
                    value={matStation}
                    onChange={(e) => setMatStation(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="KITCHEN">🍳 Mutfak Deposu</option>
                    <option value="BAR">☕ Bar Deposu</option>
                    <option value="MAIN_STORAGE">📦 Ana Soğuk Hava Deposu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Açılış Stoğu</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={matStock}
                    onChange={(e) => setMatStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Kritik Alarm</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={matMinAlert}
                    onChange={(e) => setMatMinAlert(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-rose-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Birim Maliyet (₺)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={matCost}
                    onChange={(e) => setMatCost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
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

      {/* RECIPE BUILDER MODAL */}
      {recipeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <ChefHat className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-slate-100">
                  {recipeModalProduct.name} - Ürün Reçetesi
                </h2>
              </div>
              <button
                onClick={() => setRecipeModalProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Recipe Ingredients */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Reçetedeki Hammaddeler:</span>
              {currentRecipe.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                  Bu ürüne henüz hammadde eklenmedi. Aşağıdan hammadde seçin.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-1">
                  {currentRecipe.map((r) => {
                    const raw = materials.find((m) => m.id === r.rawItemId);
                    return (
                      <div
                        key={r.rawItemId}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 text-xs">{raw?.name}</span>
                          <span className="text-[10px] text-slate-500">({raw?.unit})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={r.quantity}
                            onChange={(e) => handleUpdateRecipeItemQty(r.rawItemId, parseFloat(e.target.value) || 0)}
                            className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-amber-400 text-right focus:outline-none focus:border-amber-500"
                          />
                          <span className="text-xs text-slate-400 w-8">{r.unit}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipeIngredient(r.rawItemId)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Add Ingredient Selector */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase">Hammadde Ekle:</span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                {materials.map((m) => {
                  const isAdded = currentRecipe.some((r) => r.rawItemId === m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => handleAddRecipeIngredient(m.id)}
                      disabled={isAdded}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                        isAdded
                          ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                          : 'bg-slate-800 text-slate-200 hover:bg-amber-500 hover:text-slate-950'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRecipeModalProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSaveRecipe}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
              >
                Reçeteyi Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
