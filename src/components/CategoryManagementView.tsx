import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { Layers, Plus, Edit2, Trash2, X, Smile } from 'lucide-react';
import { Category } from '../types';

const EMOJI_PRESETS = [
  {
    category: '🍔 Fast Food & Burger',
    emojis: ['🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🍗', '🥓'],
  },
  {
    category: '🥩 Ana Yemek & Izgara',
    emojis: ['🥩', '🍖', '🍳', '🥘', '🍲', '🍜', '🍝', '🍛', '🍱', '🍣'],
  },
  {
    category: '☕ İçecek & Kahve',
    emojis: ['☕', '🍵', '🥤', '🧃', '🍺', '🍻', '🍷', '🍸', '🍹', '🍶'],
  },
  {
    category: '🍰 Tatlı & Fırın',
    emojis: ['🍰', '🧁', '🎂', '🍩', '🍨', '🍧', '🍦', '🍪', '🥐', '🥨', '🥞', '🧇'],
  },
  {
    category: '🥗 Kahvaltı & Salata',
    emojis: ['🥗', '🧀', '🥖', '🍞', '🥑', '🍅', '🥒', '🌽', '🫒', '🥚'],
  },
  {
    category: '🍽️ Restoran & Servis',
    emojis: ['🍽️', '🥢', '🍴', '🥄', '🥡', '🫖', '🏺', '👑', '⭐', '🔥'],
  },
];

export const CategoryManagementView: React.FC = () => {
  const { categories, setCategories, addToast } = usePOS();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState<string>('');
  const [icon, setIcon] = useState<string>('🍔');

  const handleOpenEdit = (c: Category) => {
    setEditingCat(c);
    setName(c.name);
    setIcon(c.icon);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingCat(null);
    setName('');
    setIcon('🍽️');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCat) {
      setCategories(categories.map((c) => (c.id === editingCat.id ? { ...c, name, icon } : c)));
      addToast('success', 'Kategori Güncellendi', `${name} kategorisi güncellendi.`);
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name,
        icon,
        sortOrder: categories.length + 1,
        active: true,
      };
      setCategories([...categories, newCat]);
      addToast('success', 'Yeni Kategori', `${name} kategorisi eklendi.`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
      setCategories(categories.filter((c) => c.id !== id));
      addToast('info', 'Kategori Silindi', 'Kategori menüden kaldırıldı.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>Kategori Yönetimi</span>
          </h1>
          <p className="text-xs text-slate-400">Menü kategorilerini ve özel emoji simgelerini belirleyin</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Kategori Ekle</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-colors shadow-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 rounded-xl bg-slate-800 border border-slate-700">{cat.icon}</span>
              <div>
                <h3 className="font-bold text-sm text-slate-100">{cat.name}</h3>
                <span className="text-[11px] text-slate-400">Sıra: {cat.sortOrder}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base">
                {editingCat ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Kategori Adı</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Kahvaltı, Makarnalar, Sıcak İçecekler"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Emoji Selector Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kategori Emojisi Seçin</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Seçili:</span>
                    <span className="text-xl p-1 bg-slate-800 rounded-lg border border-amber-500/40">{icon}</span>
                  </div>
                </div>

                {/* Custom Emoji Input */}
                <input
                  type="text"
                  required
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="Veya klavyenizden emoji yapıştırın..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 mb-2 focus:outline-none focus:border-amber-500 font-mono"
                />

                {/* Quick Emoji Palettes */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5 max-h-48 overflow-y-auto">
                  {EMOJI_PRESETS.map((group) => (
                    <div key={group.category} className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">{group.category}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {group.emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setIcon(emoji)}
                            className={`text-lg p-1.5 rounded-xl transition-transform hover:scale-125 border ${
                              icon === emoji
                                ? 'bg-amber-500/20 border-amber-500 scale-110 shadow-sm shadow-amber-500/30'
                                : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:bg-amber-400"
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
