import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { RestaurantTable } from '../types';
import { X, Plus, Trash2, Check, AlertCircle, Users, Square, Circle, RectangleHorizontal, UserCheck, Layers, PlusCircle } from 'lucide-react';
import { getSectionIcon } from './SectionManagementModal';

interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableToEdit?: RestaurantTable | null;
  defaultSection?: string;
}

const CAPACITY_PRESETS = [2, 4, 6, 8, 10, 12];

export const TableFormModal: React.FC<TableFormModalProps> = ({
  isOpen,
  onClose,
  tableToEdit,
  defaultSection,
}) => {
  const { tables, sections, users, saveTable, deleteTable, addSection } = usePOS();

  const isEdit = Boolean(tableToEdit);

  // Form State
  const [name, setName] = useState('');
  const [section, setSection] = useState('Salon');
  const [capacity, setCapacity] = useState(4);
  const [shape, setShape] = useState<'RECTANGLE' | 'ROUND' | 'SQUARE'>('RECTANGLE');
  const [responsibleWaiterId, setResponsibleWaiterId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inline Add New Section State
  const [isAddingNewSection, setIsAddingNewSection] = useState(false);
  const [inlineSectionName, setInlineSectionName] = useState('');

  // Collect all unique sections
  const allSections = Array.from(
    new Set([
      'Salon',
      'Teras',
      ...sections,
      ...tables.map((t) => t.section).filter(Boolean),
    ])
  );

  // Suggest next table name
  const getNextTableName = (targetSection: string) => {
    const existingInSec = tables.filter(
      (t) => t.section.toLowerCase() === targetSection.toLowerCase()
    );
    return `Masa ${existingInSec.length + 1}`;
  };

  useEffect(() => {
    if (isOpen) {
      if (tableToEdit) {
        setName(tableToEdit.name);
        setSection(tableToEdit.section);
        setCapacity(tableToEdit.capacity || 4);
        setShape((tableToEdit.shape as any) || 'RECTANGLE');
        setResponsibleWaiterId(tableToEdit.responsibleWaiterId || '');
      } else {
        const initialSec = defaultSection && defaultSection !== 'Tümü' ? defaultSection : (allSections[0] || 'Salon');
        setSection(initialSec);
        setName(getNextTableName(initialSec));
        setCapacity(4);
        setShape('RECTANGLE');
        setResponsibleWaiterId('');
      }
      setIsAddingNewSection(false);
      setInlineSectionName('');
      setErrorMsg(null);
    }
  }, [isOpen, tableToEdit, defaultSection]);

  if (!isOpen) return null;

  const handleSectionChange = (newSec: string) => {
    setSection(newSec);
    if (!isEdit) {
      setName(getNextTableName(newSec));
    }
  };

  const handleCreateInlineSection = async () => {
    const trimmed = inlineSectionName.trim();
    if (!trimmed) return;
    const ok = await addSection(trimmed);
    if (ok) {
      setSection(trimmed);
      setIsAddingNewSection(false);
      setInlineSectionName('');
      if (!isEdit) {
        setName(getNextTableName(trimmed));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Lütfen masa adını belirtin.');
      return;
    }
    if (capacity <= 0) {
      setErrorMsg('Kapasite en az 1 kişi olmalıdır.');
      return;
    }

    // Check duplicate name in same section
    const isDuplicate = tables.some(
      (t) =>
        t.id !== tableToEdit?.id &&
        t.section.toLowerCase() === section.toLowerCase() &&
        t.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (isDuplicate) {
      setErrorMsg(`"${section}" bölümünde "${name}" isimli bir masa zaten var.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const selectedWaiter = users.find((u) => u.id === responsibleWaiterId);

    const payload: Partial<RestaurantTable> = {
      ...(tableToEdit ? { id: tableToEdit.id } : {}),
      name: name.trim(),
      section,
      capacity: Number(capacity),
      shape,
      responsibleWaiterId: selectedWaiter ? selectedWaiter.id : undefined,
      responsibleWaiterName: selectedWaiter ? selectedWaiter.name : undefined,
    };

    const success = await saveTable(payload);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!tableToEdit) return;
    if (tableToEdit.status !== 'EMPTY' && tableToEdit.status !== 'RESERVED') {
      alert('Açık siparişi olan masa silinemez. Lütfen önce hesabı kapatın.');
      return;
    }
    if (window.confirm(`"${tableToEdit.name}" masasını salon planından silmek istediğinize emin misiniz?`)) {
      setIsSubmitting(true);
      const success = await deleteTable(tableToEdit.id);
      setIsSubmitting(false);
      if (success) {
        onClose();
      }
    }
  };

  const waiters = users.filter((u) => u.active !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 tracking-tight">
                {isEdit ? 'Masayı Düzenle' : 'Yeni Masa Ekle'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEdit
                  ? `${tableToEdit?.name} masa bilgilerini ve mekanını güncelleyin`
                  : 'Restoranınıza yeni masa tanımlayın'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Mekan / Bölüm
              </label>
              {!isAddingNewSection && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewSection(true)}
                  className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Yeni Mekan Ekle</span>
                </button>
              )}
            </div>

            {isAddingNewSection ? (
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-amber-500/40 space-y-2">
                <span className="text-[11px] font-bold text-amber-300 block">
                  Yeni Mekan / Bölüm Oluştur:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inlineSectionName}
                    onChange={(e) => setInlineSectionName(e.target.value)}
                    placeholder="Örn: Çatı Katı, Havuz Başı, Balkon..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateInlineSection}
                    disabled={!inlineSectionName.trim()}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors shrink-0"
                  >
                    Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewSection(false);
                      setInlineSectionName('');
                    }}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allSections.map((sec) => {
                  const isSelected = section === sec;
                  const icon = getSectionIcon(sec);
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleSectionChange(sec)}
                      className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="text-base shrink-0">{icon}</span>
                      <span className="text-xs font-bold truncate">{sec}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Table Name / Number */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Masa Adı / Numarası
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Masa 8, T-2, VIP Loca"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Capacity */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Kişi Kapasitesi
              </label>
              <span className="text-xs font-mono font-bold text-amber-400">
                {capacity} Kişilik
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {CAPACITY_PRESETS.map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => setCapacity(cap)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    capacity === cap
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {cap} Kişi
                </button>
              ))}
            </div>

            <input
              type="number"
              min={1}
              max={50}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
              placeholder="Özel Kapasite Girin"
            />
          </div>

          {/* Shape Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Masa Şekli
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setShape('RECTANGLE')}
                className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                  shape === 'RECTANGLE'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <RectangleHorizontal className="w-5 h-5" />
                <span>Dikdörtgen</span>
              </button>
              <button
                type="button"
                onClick={() => setShape('SQUARE')}
                className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                  shape === 'SQUARE'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Square className="w-5 h-5" />
                <span>Kare</span>
              </button>
              <button
                type="button"
                onClick={() => setShape('ROUND')}
                className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                  shape === 'ROUND'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Circle className="w-5 h-5" />
                <span>Yuvarlak</span>
              </button>
            </div>
          </div>

          {/* Responsible Waiter (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Sorumlu Garson (İsteğe Bağlı)
            </label>
            <select
              value={responsibleWaiterId}
              onChange={(e) => setResponsibleWaiterId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
            >
              <option value="">-- Herhangi Bir Garson / Ortak --</option>
              {waiters.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.role === 'WAITER' ? 'Garson' : w.role})
                </option>
              ))}
            </select>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting || (tableToEdit?.status !== 'EMPTY' && tableToEdit?.status !== 'RESERVED')}
                className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 text-rose-400 hover:text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Masayı Sil</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-[0.98]"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isEdit ? 'Değişiklikleri Kaydet' : 'Masayı Oluştur'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
