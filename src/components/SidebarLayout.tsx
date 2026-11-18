import {
  BookOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanSearch,
  ShieldCheck,
  Sprout,
  User,
  Wheat,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { AppRoute, LanguageCode } from '../types/index.ts';

interface SidebarLayoutProps {
  currentRoute: AppRoute;
  breadcrumb: string;
  onNavigate: (route: AppRoute) => void;
  children: React.ReactNode;
}

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'हिन्दी' },
];

export function SidebarLayout({
  currentRoute,
  breadcrumb,
  onNavigate,
  children,
}: SidebarLayoutProps) {
  const { user, language, setLanguage, logout, t } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navLinks: { route: AppRoute; label: string; icon: React.ReactNode }[] = [
    {
      route: 'dashboard',
      label: t('sidebarDashboard'),
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      route: 'detect',
      label: t('sidebarDetect'),
      icon: <ScanSearch className="w-4 h-4 shrink-0" />,
    },
    {
      route: 'reports',
      label: t('sidebarReports'),
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    {
      route: 'library',
      label: t('sidebarLibrary'),
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
    },
    {
      route: 'tips',
      label: t('sidebarTips'),
      icon: <Wheat className="w-4 h-4 shrink-0" />,
    },
    {
      route: 'profile',
      label: t('sidebarProfile'),
      icon: <User className="w-4 h-4 shrink-0" />,
    },
  ];

  const handleNav = (route: AppRoute) => {
    setDrawerOpen(false);
    onNavigate(route);
  };

  const handleLogout = async () => {
    setDrawerOpen(false);
    await logout();
    onNavigate('home');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#DCE7DC]">
      <div className="h-16 px-5 flex items-center justify-between border-b border-[#DCE7DC]">
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 text-[#132A1E] font-bold text-base tracking-tight cursor-pointer whitespace-nowrap"
        >
          <span className="w-8 h-8 rounded-lg bg-[#1B6B3A] text-white flex items-center justify-center shrink-0">
            <Sprout className="w-4 h-4" />
          </span>
          <span className="font-[family-name:var(--font-display)]">{t('brand')}</span>
        </button>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-[#4A5D52] hover:bg-[#EEF5EE]"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Workspace navigation">
        {navLinks.map((item) => {
          const active =
            currentRoute === item.route ||
            (currentRoute === 'report-detail' && item.route === 'reports');
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => handleNav(item.route)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-[#1B6B3A] text-white'
                  : 'text-[#31473B] hover:bg-[#EEF5EE] hover:text-[#132A1E]'
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        {user?.role === 'admin' && (
          <div className="pt-3 mt-3 border-t border-[#DCE7DC]">
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                currentRoute === 'admin'
                  ? 'bg-[#C98A1C] text-white'
                  : 'text-[#8C5B0A] bg-[#FDF7EB] hover:bg-[#F7EBCF]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('navAdmin')}</span>
            </button>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-[#DCE7DC] space-y-3">
        {user && (
          <div className="px-2">
            <p className="text-sm font-semibold text-[#132A1E] truncate">{user.fullName}</p>
            <p className="text-xs text-[#4A5D52] truncate">
              {user.district ? `${user.district}${user.state ? `, ${user.state}` : ''}` : user.email}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#991B1B] hover:bg-[#FEF2F2] transition-colors cursor-pointer whitespace-nowrap"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{t('sidebarLogout')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F6FAF6] text-[#132A1E]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#132A1E]/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[82vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-[#DCE7DC] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#132A1E] hover:bg-[#EEF5EE]"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm text-[#4A5D52] flex items-center gap-2 truncate">
              <span className="hidden sm:inline">{t('brand')}</span>
              <span className="hidden sm:inline" aria-hidden="true">/</span>
              <span className="font-semibold text-[#132A1E] truncate">{breadcrumb}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
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

            {currentRoute !== 'detect' && (
              <button
                type="button"
                onClick={() => handleNav('detect')}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#1B6B3A] hover:bg-[#15552E] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ScanSearch className="w-3.5 h-3.5" />
                <span>{t('sidebarDetect')}</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
