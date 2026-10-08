import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { Product, ProductUnit } from '../types';
import {
  Package,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Search,
  Scale,
  ArrowDownRight,
  ArrowUpRight,
  Layers,
  History,
  X,
  Save,
  ChefHat,
  Boxes,
} from 'lucide-react';
import { InventoryRecipeView } from './InventoryRecipeView';

export const StockManagementView: React.FC = () => {
  const { products, categories, saveProduct, addToast } = usePOS();
  const [stockMode, setStockMode] = useState<'products' | 'raw_and_recipes'>('products');
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [adjustAmount, setAdjustAmount] = useState<string>('10');
  const [adjustUnit, setAdjustUnit] = useState<ProductUnit>('adet');
  const [adjustReason, setAdjustReason] = useState<string>('Sevkiyat / Tedarik Girişi');

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdjustModal = (product: Product, type: 'ADD' | 'SUBTRACT') => {
    setSelectedProductForModal(product);
    setAdjustType(type);
    setAdjustUnit(product.unit || 'adet');
    setAdjustAmount(product.unit === 'kg' ? '5' : '10');
    setAdjustReason(type === 'ADD' ? 'Sevkiyat / Mal Kabul Girişi' : 'Zayi / Fire / Tüketim Çıkışı');
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForModal) return;

    const amountNum = parseFloat(adjustAmount) || 0;
    if (amountNum <= 0) {
      addToast('warning', 'Geçersiz Miktar', 'Lütfen 0 dan büyük bir miktar giriniz.');
      return;
    }

    const currentStock = selectedProductForModal.stock || 0;
    const delta = adjustType === 'ADD' ? amountNum : -amountNum;
    const newStock = Math.max(0, Math.round((currentStock + delta) * 100) / 100);

    await saveProduct({
      ...selectedProductForModal,
      stock: newStock,
      unit: adjustUnit,
      inStock: newStock > 0,
    });

    addToast(
      'success',
      'Stok Güncellendi',
      `${selectedProductForModal.name} için ${adjustType === 'ADD' ? '+' : '-'}${amountNum} ${adjustUnit} uygulandı. (Yeni Stok: ${newStock} ${adjustUnit})`
    );

    setSelectedProductForModal(null);
  };

  const handleQuickAdd = async (product: Product, delta: number) => {
    const unit = product.unit || 'adet';
    const newStock = Math.max(0, Math.round((product.stock + delta) * 100) / 100);
    await saveProduct({
      ...product,
      stock: newStock,
      inStock: newStock > 0,
    });
    addToast('info', 'Stok Güncellendi', `${product.name} ${delta > 0 ? '+' : ''}${delta} ${unit} (Yeni: ${newStock} ${unit})`);
  };

  const handleSetZero = async (product: Product) => {
    await saveProduct({
      ...product,
      stock: 0,
      inStock: false,
    });
    addToast('warning', 'Ürün Tükendi', `${product.name} tükendi olarak işaretlendi.`);
  };

  const handleChangeUnitDirectly = async (product: Product, newUnit: ProductUnit) => {
    await saveProduct({
      ...product,
      unit: newUnit,
    });
    addToast('info', 'Birim Değiştirildi', `${product.name} birimi ${newUnit} olarak güncellendi.`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <span>Stok & Reçete Yönetimi</span>
          </h1>
          <p className="text-xs text-slate-400">Menü ürün stokları, hammadde deposu, reçeteler ve otomatik stok düşüm kütüğü</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setStockMode('products')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              stockMode === 'products'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Menü Ürün Stokları</span>
          </button>
          <button
            type="button"
            onClick={() => setStockMode('raw_and_recipes')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              stockMode === 'raw_and_recipes'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Hammadde & Reçeteler</span>
          </button>
        </div>
      </div>

      {stockMode === 'raw_and_recipes' ? (
        <InventoryRecipeView />
      ) : (
        <>
          {/* Filters Bar for Products */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Kategori Filtresi:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Tüm Kategoriler ({products.length} Ürün)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ürün ara..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-4">Ürün</th>
                <th className="p-4">İstasyon</th>
                <th className="p-4">Fiyat</th>
                <th className="p-4">Birim Türü</th>
                <th className="p-4">Mevcut Stok</th>
                <th className="p-4">Durum</th>
                <th className="p-4 text-center">Hızlı Ekle/Çıkar</th>
                <th className="p-4 text-right">Detaylı Stok Hareketi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Aramaya uygun ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const unit = p.unit || 'adet';
                  const isKg = unit === 'kg' || unit === 'gr';

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img src={p.photo} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <div className="font-bold text-slate-100">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{p.id}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {p.station}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-amber-400">₺{p.price}</td>
                      <td className="p-4">
                        <select
                          value={unit}
                          onChange={(e) => handleChangeUnitDirectly(p, e.target.value as ProductUnit)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                        >
                          <option value="adet">Adet (Tane)</option>
                          <option value="kg">Kilogram (KG)</option>
                          <option value="gr">Gram (GR)</option>
                          <option value="lt">Litre (LT)</option>
                          <option value="porsiyon">Porsiyon</option>
                          <option value="paket">Paket</option>
                        </select>
                      </td>
                      <td className="p-4 font-mono font-black text-sm">
                        <span className={p.stock <= (isKg ? 2 : 5) ? 'text-rose-400 font-bold' : 'text-slate-100'}>
                          {p.stock} <span className="text-[11px] font-normal text-slate-400">{unit}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        {p.inStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Stokta
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" /> Tükendi
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleQuickAdd(p, isKg ? 1 : 10)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold font-mono text-xs border border-slate-700"
                          >
                            +{isKg ? '1 kg' : '10'}
                          </button>
                          <button
                            onClick={() => handleQuickAdd(p, isKg ? 5 : 50)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold font-mono text-xs border border-slate-700"
                          >
                            +{isKg ? '5 kg' : '50'}
                          </button>
                          <button
                            onClick={() => handleSetZero(p)}
                            className="px-2 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs border border-rose-900/40"
                          >
                            Bitir
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAdjustModal(p, 'ADD')}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1"
                          >
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            <span>Stok Girişi</span>
                          </button>
                          <button
                            onClick={() => handleOpenAdjustModal(p, 'SUBTRACT')}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center gap-1"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Stok Çıkışı</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Stock Adjust Modal */}
      {selectedProductForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {adjustType === 'ADD' ? (
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">
                    {adjustType === 'ADD' ? 'Stok Girişi (Ekleme)' : 'Stok Çıkışı (Eksiltme)'}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedProductForModal.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProductForModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-4">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-400">Şu Anki Stok:</span>
                <span className="font-mono font-bold text-slate-100 text-sm">
                  {selectedProductForModal.stock} {selectedProductForModal.unit || 'adet'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                    {adjustType === 'ADD' ? 'Eklenecek Miktar:' : 'Düşülecek Miktar:'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold font-mono text-amber-400 text-center focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Birim:</label>
                  <select
                    value={adjustUnit}
                    onChange={(e) => setAdjustUnit(e.target.value as ProductUnit)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="kg">Kilogram (KG)</option>
                    <option value="adet">Adet (Tane)</option>
                    <option value="gr">Gram (GR)</option>
                    <option value="lt">Litre (LT)</option>
                    <option value="porsiyon">Porsiyon</option>
                    <option value="paket">Paket</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">İşlem Nedeni / Açıklama:</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Örn: Toptancı sevkiyatı, fire, sayım..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductForModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 text-slate-950 shadow-lg ${
                    adjustType === 'ADD'
                      ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{adjustType === 'ADD' ? 'Stok Girişini Kaydet' : 'Stok Çıkışını Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
