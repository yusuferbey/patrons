import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { Reservation, RestaurantTable } from '../types';
import {
  X,
  Calendar,
  Clock,
  Users,
  User,
  Phone,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';

interface ReservationModalProps {
  reservation?: Reservation | null; // If provided, edit mode; else create mode
  preselectedTable?: RestaurantTable | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  reservation,
  preselectedTable,
  onClose,
  onSuccess,
}) => {
  const { tables, createReservation, updateReservation, currentUser } = usePOS();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [customerName, setCustomerName] = useState(reservation?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(reservation?.customerPhone || '');
  const [guestCount, setGuestCount] = useState<number>(reservation?.guestCount || preselectedTable?.capacity || 2);
  const [tableId, setTableId] = useState<string>(reservation?.tableId || preselectedTable?.id || (tables[0]?.id || ''));
  const [reservationDate, setReservationDate] = useState<string>(reservation?.reservationDate || todayStr);
  const [reservationTime, setReservationTime] = useState<string>(reservation?.reservationTime || '19:30');
  const [notes, setNotes] = useState<string>(reservation?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick note suggestions
  const noteSuggestions = [
    '🎂 Doğum Günü',
    '💍 Yıldönümü',
    '💼 İş Yemeği',
    '🪟 Pencere Kenarı',
    '👶 Mama Sandalyesi',
    '🍰 Pasta Getirilecek',
    '🤫 Sakin Köşe',
  ];

  const timeSlots = [
    '12:00', '12:30', '13:00', '13:30', '14:00',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  const handleAddNoteTag = (tag: string) => {
    if (!notes) {
      setNotes(tag);
    } else if (!notes.includes(tag)) {
      setNotes(`${notes}, ${tag}`);
    }
  };

  const selectedTableObj = tables.find((t) => t.id === tableId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;
    if (!tableId) return;

    setIsSubmitting(true);

    const payload: Partial<Reservation> = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      guestCount: Number(guestCount) || 2,
      tableId,
      tableName: selectedTableObj?.name || 'Masa',
      section: selectedTableObj?.section || 'Salon',
      reservationDate,
      reservationTime,
      notes: notes.trim(),
    };

    let ok = false;
    if (reservation) {
      ok = await updateReservation(reservation.id, payload);
    } else {
      ok = await createReservation(payload);
    }

    setIsSubmitting(false);
    if (ok) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {reservation ? 'Rezervasyonu Düzenle' : 'Yeni Masa Rezervasyonu'}
              </h2>
              <p className="text-xs text-slate-400">
                Misafir bilgileri, tarih, saat ve masa seçimini belirleyin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Guest Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Müşteri Adı & Soyadı *</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Örn: Arda Güler"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Telefon Numarası</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Örn: 0532 555 12 34"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rezervasyon Tarihi *</span>
                </span>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setReservationDate(todayStr)}
                    className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                      reservationDate === todayStr ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Bugün
                  </button>
                  <button
                    type="button"
                    onClick={() => setReservationDate(tomorrowStr)}
                    className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                      reservationDate === tomorrowStr ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Yarın
                  </button>
                </div>
              </label>
              <input
                type="date"
                required
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Saat *</span>
              </label>
              <input
                type="time"
                required
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Quick Time Slots */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Hızlı Saat Seçimi:</span>
            <div className="flex flex-wrap gap-1.5">
              {timeSlots.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setReservationTime(slot)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    reservationTime === slot
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Guest Count & Table Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Kişi Sayısı</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center rounded-xl bg-slate-800/80 border border-slate-700 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full text-center bg-transparent text-slate-100 font-bold text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setGuestCount((c) => c + 1)}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="flex gap-1">
                  {[2, 4, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGuestCount(num)}
                      className={`px-2.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        guestCount === num
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Masa Seçimi *</span>
                {selectedTableObj && (
                  <span className="text-[11px] text-amber-400">
                    {selectedTableObj.section} • {selectedTableObj.capacity} Kişilik
                  </span>
                )}
              </label>
              <select
                required
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.section} - {t.capacity} Kişilik) - {t.status === 'EMPTY' ? '🟢 Boş' : t.status === 'RESERVED' ? '🟣 Rezerve' : '🔴 Dolu'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes & Special Requests */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Özel İstekler & Notlar</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: Cam kenarı masa tercih edildi, pasta için servis tabağı hazırlanacak..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {noteSuggestions.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleAddNoteTag(tag)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700/80 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !customerName.trim()}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Kaydediliyor...' : reservation ? 'Güncellemeyi Kaydet' : 'Rezervasyonu Oluştur'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
