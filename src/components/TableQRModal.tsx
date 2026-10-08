import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RestaurantTable } from '../types';
import { X, Printer, Download, Sparkles, Crown } from 'lucide-react';

interface TableQRModalProps {
  table: RestaurantTable;
  onClose: () => void;
}

export const TableQRModal: React.FC<TableQRModalProps> = ({ table, onClose }) => {
  const qrValue = `${window.location.origin}/menu?table=${table.number}&id=${table.id}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2 font-bold">
            <Crown className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Masa QR Menü Kartı</h3>
          <p className="text-xs text-slate-400">{table.name} ({table.section} Katı)</p>
        </div>

        {/* QR Card Container */}
        <div id="printable-receipt" className="bg-white text-slate-950 p-6 rounded-2xl flex flex-col items-center justify-center shadow-inner border border-slate-200 text-center">
          <div className="text-[11px] font-black uppercase tracking-widest text-amber-600 mb-1">
            ÖZER RESTAURANT
          </div>
          <div className="text-xl font-extrabold text-slate-900 mb-3">
            {table.name}
          </div>

          <div className="p-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl mb-3">
            <QRCodeSVG value={qrValue} size={160} level="H" includeMargin />
          </div>

          <p className="text-xs text-slate-600 font-medium">
            Kameranız ile okutarak temassız menüyü görüntüleyin.
          </p>
          <span className="text-[10px] text-slate-400 font-mono mt-2 block">
            ID: {table.id}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>QR Kartını Yazdır</span>
          </button>
        </div>
      </div>
    </div>
  );
};
