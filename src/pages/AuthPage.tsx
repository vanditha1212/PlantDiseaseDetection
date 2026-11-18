import { AlertCircle, Loader2, ShieldCheck, Sprout } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { AppRoute, LanguageCode } from '../types/index.ts';

interface AuthPageProps {
  initialTab?: 'login' | 'register' | 'admin';
  onSuccess: (destination: AppRoute) => void;
}

const INDIAN_STATES = [
  'Karnataka',
  'Maharashtra',
  'Tamil Nadu',
  'Andhra Pradesh',
  'Telangana',
  'Punjab',
  'Madhya Pradesh',
  'Uttar Pradesh',
  'Gujarat',
  'Rajasthan',
  'Kerala',
  'West Bengal',
  'Bihar',
  'Haryana',
  'Odisha',
];

export function AuthPage({ initialTab = 'login', onSuccess }: AuthPageProps) {
  const { loginWithEmail, registerFarmer, loginWithGoogle, loginAsAdmin, language, t } =
    useAuth();

  const [tab, setTab] = useState<'login' | 'register' | 'admin'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [stateName, setStateName] = useState('Karnataka');
  const [district, setDistrict] = useState('');
  const [prefLang, setPrefLang] = useState<LanguageCode>(language);

  // Admin state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleFarmerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithEmail(loginEmail, loginPassword);
      onSuccess(user.role === 'admin' ? 'admin' : 'dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerFarmer({
        fullName,
        email: regEmail,
        mobileNumber,
        password: regPassword,
        state: stateName,
        district,
        preferredLanguage: prefLang,
      });
      onSuccess('dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to register account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      onSuccess(user.role === 'admin' ? 'admin' : 'dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginAsAdmin(adminEmail, adminPassword);
      onSuccess('admin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F6FAF6] py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-[#DCE7DC] overflow-hidden">
        {/* Left Agricultural Visual Panel */}
        <div className="lg:col-span-5 bg-[#132A1E] text-white p-8 flex flex-col justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5 text-white font-bold text-lg">
              <span className="w-8 h-8 rounded-lg bg-[#1B6B3A] flex items-center justify-center">
                <Sprout className="w-4 h-4" />
              </span>
              <span>AgriCare AI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-sm text-[#CBE0D1] leading-relaxed">
              {t('heroSubtitle')}
            </p>
          </div>

          <div className="space-y-3 border-t border-white/15 pt-6 text-xs text-[#CBE0D1]">
            <p className="font-semibold text-[#F4D38B]">Included with your Farmer Account</p>
            <ul className="space-y-2">
              <li>• Real-time Gemini Vision plant disease analysis</li>
              <li>• Reports generated in English, Kannada, or Hindi</li>
              <li>• Private saved diagnosis history & PDF downloads</li>
              <li>• Verified 10-crop disease library & seasonal tips</li>
            </ul>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 space-y-6">
          {/* Segmented Auth Mode Switch */}
          <div className="flex items-center gap-1 p-1 bg-[#EEF5EE] rounded-xl border border-[#DCE7DC]">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-[#132A1E] shadow-xs'
                  : 'text-[#4A5D52] hover:text-[#132A1E]'
              }`}
            >
              Farmer Login
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-[#132A1E] shadow-xs'
                  : 'text-[#4A5D52] hover:text-[#132A1E]'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('admin');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                tab === 'admin'
                  ? 'bg-white text-[#132A1E] shadow-xs'
                  : 'text-[#4A5D52] hover:text-[#132A1E]'
              }`}
            >
              Admin
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: FARMER LOGIN */}
          {tab === 'login' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#132A1E]">{t('loginTitle')}</h2>
                <p className="text-sm text-[#4A5D52] mt-1">
                  Sign in with your farmer email or Google account.
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#DCE7DC] bg-white hover:bg-[#F6FAF6] text-sm font-semibold text-[#132A1E] transition-colors cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                <span>{t('googleSignIn')}</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#DCE7DC] w-full" />
                <span className="bg-white px-3 text-xs text-[#4A5D52] whitespace-nowrap">
                  or with email
                </span>
                <div className="border-t border-[#DCE7DC] w-full" />
              </div>

              <form onSubmit={handleFarmerLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="farmer@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                    {t('password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#1B6B3A] hover:bg-[#15552E] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Sign In</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: FARMER REGISTRATION */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-[#132A1E]">{t('registerTitle')}</h2>
                <p className="text-sm text-[#4A5D52] mt-1">
                  Enter your farm details to personalize disease reports and language.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                    {t('fullName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ramesh Gowda"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                    {t('mobileNumber')} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                    {t('email')} *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ramesh@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                    {t('password')} (min 6 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                    {t('state')}
                  </label>
                  <select
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                    {t('district')}
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Mandya"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                    {t('preferredLanguage')}
                  </label>
                  <select
                    value={prefLang}
                    onChange={(e) => setPrefLang(e.target.value as LanguageCode)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                  >
                    <option value="en">English</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#1B6B3A] hover:bg-[#15552E] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{t('registerTitle')}</span>
              </button>
            </form>
          )}

          {/* TAB 3: ADMIN LOGIN */}
          {tab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FDF7EB] border border-[#EDE0BE] text-[#C98A1C] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#132A1E]">{t('adminLoginTitle')}</h2>
                  <p className="text-sm text-[#4A5D52] mt-0.5">
                    Manage disease library entries, inspect reports, and view crop analytics.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F6FAF6] border border-[#DCE7DC] text-xs text-[#31473B] flex flex-wrap items-center justify-between gap-2">
                <span>
                  Demo Admin: <strong className="font-mono">admin@agricare.ai</strong> /{' '}
                  <strong className="font-mono">Admin@123</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail('admin@agricare.ai');
                    setAdminPassword('Admin@123');
                  }}
                  className="text-[#1B6B3A] font-semibold hover:underline cursor-pointer"
                >
                  Fill demo credentials
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@agricare.ai"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#132A1E] hover:bg-[#1E3D2D] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Sign In to Admin Dashboard</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
