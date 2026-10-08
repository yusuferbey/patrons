import React, { useState } from 'react';
import { Product, ProductExtra, OrderItemCustomization } from '../types';
import { X, Plus, Minus, Check, MessageSquare, Flame } from 'lucide-react';

interface ProductCustomizerModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (customizedItem: {
    productId: string;
    productName: string;
    productPhoto: string;
    categoryId: string;
    station: Product['station'];
    unitPrice: number;
    quantity: number;
    customization: OrderItemCustomization;
  }) => void;
}

export const ProductCustomizerModal: React.FC<ProductCustomizerModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [specialNote, setSpecialNote] = useState<string>('');

  const toggleExtra = (extra: ProductExtra) => {
    if (selectedExtras.some((e) => e.id === extra.id)) {
      setSelectedExtras(selectedExtras.filter((e) => e.id !== extra.id));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const toggleRemoval = (ing: string) => {
    if (removedIngredients.includes(ing)) {
      setRemovedIngredients(removedIngredients.filter((i) => i !== ing));
    } else {
      setRemovedIngredients([...removedIngredients, ing]);
    }
  };

  const extrasSum = selectedExtras.reduce((acc, e) => acc + e.price, 0);
  const unitTotal = product.price + extrasSum;
  const grandTotal = unitTotal * quantity;

  const handleAdd = () => {
    onAddToCart({
      productId: product.id,
      productName: product.name,
      productPhoto: product.photo,
      categoryId: product.categoryId,
      station: product.station,
      unitPrice: product.price,
      quantity,
      customization: {
        extras: selectedExtras,
        removedIngredients,
        specialNote: specialNote.trim() || undefined,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Photo & Header */}
        <div className="relative h-44 sm:h-48 shrink-0">
          <img
            src={product.photo}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-slate-950/70 hover:bg-slate-950 text-slate-300 hover:text-white backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-4 right-4">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {product.station} İSTASYONU
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 mt-1">{product.name}</h2>
            <p className="text-xs text-slate-300 line-clamp-1">{product.description}</p>
          </div>
        </div>

        {/* Options Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {/* Extras / Ek Seçenekler */}
          {product.extras && product.extras.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <span>➕ Ekstra Seçenekler</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.extras.map((extra) => {
                  const isSelected = selectedExtras.some((e) => e.id === extra.id);
                  return (
                    <button
                      key={extra.id}
                      type="button"
                      onClick={() => toggleExtra(extra)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-semibold">{extra.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">+₺{extra.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Removable Ingredients / Çıkarma Seçenekleri */}
          {product.removableIngredients && product.removableIngredients.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">
                ➖ İstemediğiniz Malzemeler
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.removableIngredients.map((ing) => {
                  const isRemoved = removedIngredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => toggleRemoval(ing)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                        isRemoved
                          ? 'bg-rose-500/15 border-rose-500 text-rose-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                          isRemoved ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isRemoved && <X className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-semibold">{ing}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chef Special Note / Pişme Tercihi */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Mutfak / Pişirme Özel Notu</span>
            </label>
            <input
              type="text"
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              placeholder="Örn: Et az pişsin, acısı bol olsun, sos ayrı kapta gelsin"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Footer: Quantity Counter + Sepete Ekle Button */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          {/* Quantity selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 flex items-center justify-center transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-extrabold text-base font-mono-numbers text-amber-400">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            className="flex-1 py-3.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-between transition-all active:scale-[0.98]"
          >
            <span>Sepete Ekle</span>
            <span className="font-mono-numbers text-base font-black">₺{grandTotal.toLocaleString('tr-TR')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
