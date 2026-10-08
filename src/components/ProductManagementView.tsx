import React, { useState, useRef } from 'react';
import { usePOS } from '../context/POSContext';
import { Product, ProductStation } from '../types';
import { Plus, Edit2, Trash2, Search, Coffee, Check, X, Sparkles, Upload, ImagePlus } from 'lucide-react';

export const ProductManagementView: React.FC = () => {
  const { products, categories, saveProduct, deleteProduct } = usePOS();
  const [search, setSearch] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);

  // Form state for Add/Edit
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<string>('');
  const [station, setStation] = useState<ProductStation>('Izgara');
  const [photo, setPhoto] = useState<string>('');
  const [stock, setStock] = useState<number>(50);

  // File upload state & ref
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Görsel boyutu en fazla 5MB olabilir.');
      return;
    }
    setFileInfo({ name: file.name, size: formatBytes(file.size) });
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPhoto('');
    setFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCat === 'ALL' || p.categoryId === selectedCat;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description);
    setPrice(p.price);
    setCategoryId(p.categoryId);
    setStation(p.station);
    setPhoto(p.photo || '');
    setFileInfo(p.photo ? { name: `${p.name} görseli`, size: 'Mevcut Görsel' } : null);
    setStock(p.stock);
    setIsNewModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice(150);
    setCategoryId(categories[0]?.id || 'cat-1');
    setStation('Izgara');
    setPhoto('');
    setFileInfo(null);
    setStock(50);
    setIsNewModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProduct({
      id: editingProduct ? editingProduct.id : undefined,
      name,
      description,
      price: Number(price),
      categoryId,
      station,
      photo: photo || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      stock: Number(stock),
      inStock: Number(stock) > 0,
      active: true,
    });
    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-400" />
            <span>Ürün & Menü Yönetimi</span>
          </h1>
          <p className="text-xs text-slate-400">Restoran menüsündeki tüm yemek ve içecekleri yönetin</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Yeni Ürün Ekle</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün ara..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCat('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${
              selectedCat === 'ALL' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            Tümü ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${
                selectedCat === c.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table/Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
          >
            <div className="relative h-36">
              <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 flex gap-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/90 text-amber-300 backdrop-blur-md">
                  {p.station}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${
                  p.inStock ? 'bg-emerald-950/90 text-emerald-400' : 'bg-rose-950/90 text-rose-400'
                }`}>
                  Stok: {p.stock}
                </span>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">{p.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">{p.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-base font-black text-amber-400 font-mono-numbers">
                  ₺{p.price.toLocaleString('tr-TR')}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`${p.name} ürününü silmek istediğinize emin misiniz?`)) {
                        deleteProduct(p.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Product Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100">
                {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ürün Adı</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Gurme Dana Burger"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fiyat (₺)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Stok Miktarı</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Kategori</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mutfak İstasyonu</label>
                  <select
                    value={station}
                    onChange={(e) => setStation(e.target.value as ProductStation)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Izgara">Izgara & Sıcak</option>
                    <option value="Pizza">Pizza & Fırın</option>
                    <option value="Bar">Bar & İçecek</option>
                    <option value="Tatlı">Tatlı & Kahve</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Ürün Görseli</label>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {!photo ? (
                  /* Empty Dropzone State */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processFile(file);
                    }}
                    className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 flex flex-col items-center justify-center text-center transition-all group ${
                      isDragging
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-700 bg-slate-900/50 hover:border-amber-500/50 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all shadow-inner mb-2">
                      <ImagePlus className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
                      Görsel yüklemek için tıklayın veya sürükleyin
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      PNG, JPG, WEBP - Maks 5MB
                    </span>
                  </div>
                ) : (
                  /* Preview State */
                  <div className="relative rounded-2xl bg-slate-950/60 border border-slate-800 p-3 flex items-center gap-3.5">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 shadow-md">
                      <img
                        src={photo}
                        alt="Ürün Önizleme"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 truncate">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{fileInfo?.name || 'Görsel Seçildi'}</span>
                      </div>
                      {fileInfo?.size && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {fileInfo.size}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Farklı Görsel Seç</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      title="Görseli Kaldır"
                      className="p-1.5 rounded-xl bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Açıklama</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
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
