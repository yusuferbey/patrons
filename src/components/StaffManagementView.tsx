import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { Users, Plus, ShieldCheck, KeyRound, Check, X, Trash2, Sliders, Shield, UserCheck, CreditCard } from 'lucide-react';
import { User, UserRole } from '../types';
import { RolePermissionsManager } from './RolePermissionsManager';

export const StaffManagementView: React.FC = () => {
  const { users, saveUser, deleteUser, getUserEffectiveTabs, addToast } = usePOS();
  const [activeTab, setActiveTab] = useState<'staff' | 'permissions'>('staff');
  const [targetUserId, setTargetUserId] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [role, setRole] = useState<UserRole>('WAITER');
  const [pin, setPin] = useState<string>('1234');

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: Partial<User> = {
      name,
      username,
      role,
      pin,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      active: true,
    };
    await saveUser(newUser);
    setName('');
    setUsername('');
    setPin('1234');
    setIsModalOpen(false);
  };

  const handleDeleteStaff = async (id: string) => {
    if (confirm('Bu personeli sistemden silmek istediğinize emin misiniz?')) {
      await deleteUser(id);
    }
  };

  const handleEditUserPermissions = (userId: string) => {
    setTargetUserId(userId);
    setActiveTab('permissions');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Personel & Kişiye Özel Yetkilendirme</span>
          </h1>
          <p className="text-xs text-slate-400">Garson, mutfak ve kasa personellerinin PIN kodlarını, rollerini ve kişiye özel sayfa izinlerini yönetin</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'staff'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Personeller ({users.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetUserId(undefined);
                setActiveTab('permissions');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'permissions'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Yetki ve Erişim Matrisi</span>
            </button>
          </div>

          {activeTab === 'staff' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Yeni Personel</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'permissions' ? (
        <RolePermissionsManager initialTargetUserId={targetUserId} initialMode="user" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const uTabs = getUserEffectiveTabs(u);
          const hasCash = uTabs.includes('payments') || uTabs.includes('cash-register');
          const isCustom = !!u.customPermissionsEnabled;

          return (
            <div
              key={u.id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col justify-between gap-4 shadow-xl relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-2xl object-cover border border-amber-500/30" />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        u.active ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{u.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {u.role === 'WAITER' ? 'Garson' : u.role === 'CASHIER' ? 'Kasiyer' : u.role === 'KITCHEN' ? 'Mutfak' : 'Patron'}
                      </span>
                      <span className="text-xs font-mono text-slate-400 font-medium flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-amber-500/70" /> PIN: ••••
                      </span>
                    </div>
                  </div>
                </div>

                {u.username !== 'admin' && (
                  <button
                    onClick={() => handleDeleteStaff(u.id)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                    title="Personeli Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Permissions Summary & Quick Action */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isCustom ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ⚡ Özel Yetkili ({uTabs.length} Sayfa)
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      🔗 Rol Standart ({uTabs.length} Sayfa)
                    </span>
                  )}

                  {hasCash && u.role === 'WAITER' && (
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <CreditCard className="w-2.5 h-2.5" /> Kasa İzinli
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleEditUserPermissions(u.id)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[11px] font-bold transition-all flex items-center gap-1 border border-slate-700"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Yetkiler</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base">Yeni Personel Ekle</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Garson Selin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Kullanıcı Adı</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="selin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rol</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="WAITER">Garson</option>
                  <option value="KITCHEN">Mutfak Şefi</option>
                  <option value="CASHIER">Kasa Görevlisi</option>
                  <option value="ADMIN">Yönetici / Müdür</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hızlı Giriş PIN Kodu</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
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
