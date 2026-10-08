import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { X, Plus, Trash2, Layers, AlertCircle, CheckCircle2, Sparkles, MapPin } from 'lucide-react';

interface SectionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection?: (sectionName: string) => void;
}

const QUICK_SUGGESTIONS = [
  { name: 'Bahçe', icon: '🌳' },
  { name: 'Çatı Katı', icon: '🌇' },
  { name: 'Havuz Başı', icon: '🏊' },
  { name: 'Kış Bahçesi', icon: '❄️' },
  { name: 'VIP Loca', icon: '⭐' },
  { name: 'Bar Alanı', icon: '🍸' },
  { name: 'Balkon', icon: '🪴' },
  { name: 'Alt Kat', icon: '🏛️' },
  { name: 'Veranda', icon: '☕' },
];

export const getSectionIcon = (sectionName: string): string => {
  const lower = sectionName.toLowerCase();
  if (lower.includes('salon') || lower.includes('i̇ç mekan') || lower.includes('ic mekan')) return '🍽️';
  if (lower.includes('teras')) return '🌿';
  if (lower.includes('bahçe') || lower.includes('bahce')) return '🌳';
  if (lower.includes('vip') || lower.includes('loca')) return '⭐';
  if (lower.includes('bar')) return '🍸';
  if (lower.includes('havuz')) return '🏊';
  if (lower.includes('çatı') || lower.includes('cati')) return '🌇';
  if (lower.includes('kış') || lower.includes('kis')) return '❄️';
  if (lower.includes('balkon') || lower.includes('veranda')) return '🪴';
  if (lower.includes('alt') || lower.includes('bodrum')) return '🏛️';
  return '📍';
};

export const SectionManagementModal: React.FC<SectionManagementModalProps> = ({
  isOpen,
  onClose,
  onSelectSection,
}) => {
  const { sections, addSection, deleteSection, tables, setSelectedSection } = usePOS();
  const [newSectionName, setNewSectionName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Combine unique sections from context and tables
  const allSections = Array.from(
    new Set([
      'Salon',
      'Teras',
      ...sections,
      ...tables.map((t) => t.section).filter(Boolean),
    ])
  );

  const handleAdd = async (nameToAdd?: string) => {
    const name = (nameToAdd || newSectionName).trim();
    if (!name) {
      setErrorMsg('Lütfen bir mekan/bölüm adı girin.');
      return;
    }
    if (allSections.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setErrorMsg('Bu mekan/bölüm adı zaten mevcut.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const ok = await addSection(name);
      if (ok) {
        setNewSectionName('');
        setSelectedSection(name);
        if (onSelectSection) {
          onSelectSection(name);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (sectionName: string) => {
    const count = tables.filter((t) => t.section === sectionName).length;
    if (count > 0) {
      alert(`"${sectionName}" bölümünde ${count} adet masa bulunuyor. Bölümü silmeden önce masaları silmeli veya başka bir bölüme taşımalısınız.`);
      return;
    }

    if (window.confirm(`"${sectionName}" bölümünü silmek istediğinize emin misiniz?`)) {
      await deleteSection(sectionName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 tracking-tight">Mekan & Bölüm Yönetimi</h2>
              <p className="text-xs text-slate-400">Salon, teras ve restoranınızın tüm kat / alanlarını yönetin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Add New Section Form */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/90 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Yeni Mekan / Bölüm Ekle
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => {
                    setNewSectionName(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                  placeholder="Örn: Bahçe, Çatı Katı, Havuz Başı, Bar..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAdd()}
                disabled={isSubmitting || !newSectionName.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Ekle</span>
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Suggestions Chips */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Hızlı Öneriler:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((item) => {
                  const alreadyExists = allSections.some((s) => s.toLowerCase() === item.name.toLowerCase());
                  if (alreadyExists) return null;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleAdd(item.name)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-amber-500/15 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Current Sections List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Mevcut Mekanlar ({allSections.length})
              </span>
              <span className="text-[11px] text-slate-500">Masa sayısını ve durumunu gösterir</span>
            </div>

            <div className="space-y-2">
              {allSections.map((sec) => {
                const icon = getSectionIcon(sec);
                const tableCount = tables.filter((t) => t.section === sec).length;
                const activeCount = tables.filter((t) => t.section === sec && t.status !== 'EMPTY').length;
                const canDelete = tableCount === 0;

                return (
                  <div
                    key={sec}
                    className="p-3 bg-slate-950/40 hover:bg-slate-800/40 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-lg shrink-0">
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-200 truncate">{sec}</span>
                          {sec === 'Salon' || sec === 'Teras' ? (
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-medium">
                              Varsayılan
                            </span>
                          ) : (
                            <span className="text-[9px] bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-medium">
                              Özel Alan
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{tableCount} Masa</span>
                          {activeCount > 0 && (
                            <span className="text-amber-400 font-medium">• {activeCount} Dolu/Aktif</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSection(sec);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-xs font-semibold border border-slate-700 transition-colors"
                      >
                        Görüntüle
                      </button>

                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(sec)}
                          title="Bölümü Sil"
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <div
                          title={`Bu bölümde ${tableCount} masa olduğu için silinemez.`}
                          className="p-2 text-slate-600 cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4 opacity-30" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
