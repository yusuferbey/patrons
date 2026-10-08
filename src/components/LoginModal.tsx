import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import {
  Crown,
  Lock,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  Sparkles,
  CheckCircle2,
  Utensils,
  Coffee,
  Flame,
  Wine,
  Croissant,
} from 'lucide-react';

type AuthMode = 'LOGIN' | 'REGISTER';

export const LoginModal: React.FC = () => {
  const { loginUser, registerUser } = usePOS();

  // Active Tab
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');

  // Login Form States
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Register Form States
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [registerEmail, setRegisterEmail] = useState<string>('');
  const [registerPhone, setRegisterPhone] = useState<string>('');
  const [registerPassword, setRegisterPassword] = useState<string>('');
  const [concept, setConcept] = useState<string>('RESTAURANT');
  const [showRegisterPassword, setShowRegisterPassword] = useState<boolean>(false);

  // Status & Feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load saved credentials preference if available
  useEffect(() => {
    const savedUser = localStorage.getItem('patron_saved_username');
    if (savedUser) {
      setIdentifier(savedUser);
    }
  }, []);

  // Clear error on input change or mode switch
  const handleClearError = () => {
    if (errorMessage) setErrorMessage(null);
  };

  const handleModeSwitch = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrorMessage(null);
  };

  // Login Submit Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Lütfen kullanıcı adı veya e-posta adresinizi giriniz.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Lütfen şifrenizi giriniz.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const res = await loginUser(identifier.trim(), password.trim());
    if (!res.success) {
      setErrorMessage(res.error || 'Kullanıcı adı veya şifre hatalı.');
      setLoading(false);
    } else {
      if (rememberMe) {
        localStorage.setItem('patron_saved_username', identifier.trim());
      } else {
        localStorage.removeItem('patron_saved_username');
      }
      setLoading(false);
    }
  };

  // Register Submit Handler (7-Day Trial)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim()) {
      setErrorMessage('Lütfen restoran veya işletme adınızı giriniz.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMessage('Lütfen yetkili ad ve soyadınızı giriniz.');
      return;
    }
    if (!registerEmail.trim()) {
      setErrorMessage('Lütfen e-posta adresinizi giriniz.');
      return;
    }
    if (!registerPassword.trim() || registerPassword.trim().length < 6) {
      setErrorMessage('Şifreniz güvenliğiniz için en az 6 karakterden oluşmalıdır.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const res = await registerUser({
      restaurantName: restaurantName.trim(),
      ownerName: ownerName.trim(),
      email: registerEmail.trim(),
      password: registerPassword.trim(),
      phone: registerPhone.trim(),
      concept,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Kayıt sırasında bir hata oluştu. Lütfen bilgilerinizi kontrol ediniz.');
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-3 sm:p-4 overflow-y-auto antialiased"
    >
      <div
        id="auth-card"
        className={`w-full ${
          authMode === 'REGISTER' ? 'max-w-xl' : 'max-w-md'
        } bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl relative overflow-hidden my-auto transition-all duration-300`}
      >
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/20 text-slate-950 mb-2.5">
            <Crown className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
            ÖZER POS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-medium">
            Bulut Tabanlı Restoran Otomasyonu & POS Sistemi
          </p>
        </div>

        {/* Mode Toggle Switcher (Giriş Yap vs 7 Gün Ücretsiz Deneme) */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-950/80 border border-slate-800/90 rounded-2xl mb-5">
          <button
            type="button"
            id="tab-login-btn"
            onClick={() => handleModeSwitch('LOGIN')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              authMode === 'LOGIN'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Giriş Yap</span>
          </button>

          <button
            type="button"
            id="tab-register-btn"
            onClick={() => handleModeSwitch('REGISTER')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
              authMode === 'REGISTER'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-amber-300/90 hover:text-amber-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Kayıt Ol (7 Gün Ücretsiz)</span>
          </button>
        </div>

        {/* Dynamic Error Banner */}
        {errorMessage && (
          <div
            id="auth-error-banner"
            className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE A: GİRİŞ YAP (Standard SaaS Login) */}
        {/* ------------------------------------------------------------- */}
        {authMode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form">
            <div>
              <label
                htmlFor="login-identifier"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5"
              >
                Kullanıcı Adı veya E-posta
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    handleClearError();
                  }}
                  placeholder="ornek@ozerpos.com veya kullaniciadi"
                  autoComplete="username"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5"
              >
                Şifre
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    handleClearError();
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-11 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 rounded transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="login-remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span>Beni Hatırla</span>
              </label>
              <span className="text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                256-bit SSL Giriş
              </span>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="animate-spin w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full" />
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to Register callout */}
            <div className="text-center pt-3">
              <button
                type="button"
                onClick={() => handleModeSwitch('REGISTER')}
                className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
              >
                Henüz bir hesabınız yok mu?{' '}
                <span className="font-bold text-amber-400 underline underline-offset-2">
                  7 Gün Ücretsiz Deneyin →
                </span>
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE B: KAYIT OL & 7 GÜNLÜK ÜCRETSİZ DENEME BAŞLAT */}
        {/* ------------------------------------------------------------- */}
        {authMode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4" id="register-form">
            {/* Trial Value Callout Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>7 Günlük Tam Erişimli Ücretsiz Deneme</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Kredi kartı gerekmez. Anında kurulum yapılır; masalarınız, örnek menünüz ve mutfak KDS
                ekranınız 1 dakikada hazır olur.
              </p>
            </div>

            {/* Restaurant Concept Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                İşletme Türü / Konsept
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { id: 'RESTAURANT', label: 'Restoran', icon: Utensils },
                  { id: 'CAFE', label: 'Kafe', icon: Coffee },
                  { id: 'FAST_FOOD', label: 'Fast Food', icon: Flame },
                  { id: 'BAR', label: 'Bar & Pub', icon: Wine },
                  { id: 'BAKERY', label: 'Pastane', icon: Croissant },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = concept === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setConcept(item.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Restaurant Name & Owner Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="register-restaurant-name"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5"
                >
                  Restoran / İşletme Adı *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="register-restaurant-name"
                    type="text"
                    value={restaurantName}
                    onChange={(e) => {
                      setRestaurantName(e.target.value);
                      handleClearError();
                    }}
                    placeholder="Örn: Gusto Restoran & Lounge"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-owner-name"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5"
                >
                  Yetkili Ad Soyad *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="register-owner-name"
                    type="text"
                    value={ownerName}
                    onChange={(e) => {
                      setOwnerName(e.target.value);
                      handleClearError();
                    }}
                    placeholder="Örn: Ahmet Yılmaz"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5"
                >
                  E-posta Adresi *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => {
                      setRegisterEmail(e.target.value);
                      handleClearError();
                    }}
                    placeholder="adiniz@isletmeniz.com"
                    autoComplete="email"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-phone"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5"
                >
                  Telefon (İsteğe Bağlı)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="register-phone"
                    type="tel"
                    value={registerPhone}
                    onChange={(e) => {
                      setRegisterPhone(e.target.value);
                      handleClearError();
                    }}
                    placeholder="05XX XXX XX XX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5"
              >
                Giriş Şifresi * (En az 6 karakter)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="register-password"
                  type={showRegisterPassword ? 'text' : 'password'}
                  value={registerPassword}
                  onChange={(e) => {
                    setRegisterPassword(e.target.value);
                    handleClearError();
                  }}
                  placeholder="Güçlü bir şifre belirleyin"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                />
                <button
                  type="button"
                  id="toggle-register-password-visibility"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  tabIndex={-1}
                  aria-label={showRegisterPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 rounded transition-colors"
                >
                  {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                7 Gün boyunca %100 Ücretsiz
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Taahhüt & Kart Gerekmez
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Masa & Adisyon Otomasyonu
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Mutfak KDS & Raporlama
              </span>
            </div>

            {/* Submit Button */}
            <button
              id="register-submit-button"
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="animate-spin w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>7 Günlük Ücretsiz Denemeyi Başlat</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to Login callout */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleModeSwitch('LOGIN')}
                className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
              >
                Zaten kayıtlı bir hesabınız var mı?{' '}
                <span className="font-bold text-amber-400 underline underline-offset-2">Giriş Yapın →</span>
              </button>
            </div>
          </form>
        )}

        {/* Security & Production Compliance Footer */}
        <div className="mt-5 pt-3.5 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Kurumsal Çok Şubeli SaaS Mimarisi • 256-bit SSL Koruması</span>
          </p>
        </div>
      </div>
    </div>
  );
};
