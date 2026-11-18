import { Menu, Sprout, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { AppRoute, LanguageCode } from '../types/index.ts';

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute, options?: { scrollTo?: string }) => void;
}

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'हिन्दी' },
];

export function Navbar({ currentRoute, onNavigate }: NavbarProps) {
  const { user, language, setLanguage, t } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { label: string; route: AppRoute; scrollTo?: string }[] = [
    { label: t('navHome'), route: 'home' },
    { label: t('navDetect'), route: user ? 'detect' : 'auth' },
    { label: t('navLibrary'), route: 'library' },
    { label: t('navTips'), route: 'tips' },
    { label: t('navAbout'), route: 'home', scrollTo: 'about-us' },
  ];

  const handleLinkClick = (route: AppRoute, scrollTo?: string) => {
    setMobileOpen(false);
    onNavigate(route, scrollTo ? { scrollTo } : undefined);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#DCE7DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6 lg:gap-8">
        {/* Zone 1: Clean single-line brand wordmark */}
        <button
          type="button"
          onClick={() => handleLinkClick('home')}
          className="flex items-center gap-2.5 text-[#132A1E] font-bold text-lg tracking-tight whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span className="w-8 h-8 rounded-lg bg-[#1B6B3A] text-white flex items-center justify-center shrink-0">
            <Sprout className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="font-[family-name:var(--font-display)]">{t('brand')}</span>
        </button>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav
          aria-label="Main navigation"
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#4A5D52]"
        >
          {navItems.map((item) => {
            const isActive = !item.scrollTo && currentRoute === item.route;
            return (
              <button
                key={`${item.route}-${item.scrollTo || 'main'}`}
                type="button"
                onClick={() => handleLinkClick(item.route, item.scrollTo)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
                  isActive
                    ? 'text-[#1B6B3A] border-[#1B6B3A] font-semibold'
                    : 'border-transparent hover:text-[#132A1E] hover:border-[#1B6B3A]/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Language switcher + single primary action */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <div
            role="group"
            aria-label="Select language"
            className="flex items-center p-0.5 bg-[#EEF5EE] rounded-lg border border-[#DCE7DC]"
          >
            {LANGUAGES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLanguage(item.code)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  language === item.code
                    ? 'bg-white text-[#132A1E] shadow-xs'
                    : 'text-[#4A5D52] hover:text-[#132A1E]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              handleLinkClick(
                user ? (user.role === 'admin' ? 'admin' : 'dashboard') : 'auth'
              )
            }
            className="px-4 py-2 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#15552E] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {user
              ? user.role === 'admin'
                ? t('navAdmin')
                : t('navDashboard')
              : t('navLogin')}
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 rounded-lg text-[#132A1E] hover:bg-[#EEF5EE] cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-[#DCE7DC] px-4 pt-2 pb-5 space-y-3">
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <button
                key={`mob-${item.route}-${item.scrollTo || 'main'}`}
                type="button"
                onClick={() => handleLinkClick(item.route, item.scrollTo)}
                className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#132A1E] hover:bg-[#EEF5EE]"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-[#DCE7DC] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center p-0.5 bg-[#EEF5EE] rounded-lg border border-[#DCE7DC]">
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLanguage(item.code)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                    language === item.code
                      ? 'bg-white text-[#132A1E] shadow-xs'
                      : 'text-[#4A5D52]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                handleLinkClick(
                  user ? (user.role === 'admin' ? 'admin' : 'dashboard') : 'auth'
                )
              }
              className="px-4 py-2 text-sm font-semibold text-white bg-[#1B6B3A] rounded-lg whitespace-nowrap"
            >
              {user ? t('navDashboard') : t('navLogin')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
