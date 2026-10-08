import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { RestaurantTable } from '../types';
import { X, ArrowRightLeft, Merge, CheckCircle2 } from 'lucide-react';

interface TableTransferMergeModalProps {
  type: 'transfer' | 'merge';
  sourceTable: RestaurantTable;
  onClose: () => void;
}

export const TableTransferMergeModal: React.FC<TableTransferMergeModalProps> = ({
  type,
  sourceTable,
  onClose,
}) => {
  const { tables, transferTable, mergeTables } = usePOS();
  const [targetTableId, setTargetTableId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // For transfer: target table MUST be EMPTY
  // For merge: target table must be active (or can be any other table)
  const availableTargetTables = tables.filter((t) => {
    if (t.id === sourceTable.id) return false;
    if (type === 'transfer') return t.status === 'EMPTY';
    return true; // merge can merge with any table
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTableId) return;

    setLoading(true);
    if (type === 'transfer') {
      await transferTable(sourceTable.id, targetTableId);
    } else {
      await mergeTables(targetTableId, sourceTable.id);
    }
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            {type === 'transfer' ? (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                <Merge className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                {type === 'transfer' ? 'Masa Taşıma' : 'Masa Birleştirme'}
              </h3>
              <p className="text-xs text-slate-400">Kaynak: {sourceTable.name} (₺{sourceTable.totalAmount})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {type === 'transfer' ? 'Hedef Boş Masa Seçin:' : 'Hangi Masayla Birleştirilsin:'}
            </label>

            {availableTargetTables.length === 0 ? (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                {type === 'transfer' ? 'Şu anda taşınabilecek boş masa bulunmuyor.' : 'Uygun masa yok.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {availableTargetTables.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTargetTableId(t.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      targetTableId === t.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {t.section} • {t.status === 'EMPTY' ? 'Boş' : `Dolu (₺${t.totalAmount})`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={!targetTableId || loading}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-40"
            >
              {loading ? 'İşleniyor...' : type === 'transfer' ? 'Masayı Taşı' : 'Masaları Birleştir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
