import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { SidebarLayout } from './components/SidebarLayout.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { DetectDiseasePage } from './pages/DetectDiseasePage.tsx';
import { DiseaseLibraryPage } from './pages/DiseaseLibraryPage.tsx';
import { FarmerDashboardPage } from './pages/FarmerDashboardPage.tsx';
import { FarmingTipsPage } from './pages/FarmingTipsPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { MyReportsPage } from './pages/MyReportsPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { ReportDetailPage } from './pages/ReportDetailPage.tsx';
import type { AppRoute, DiseaseReport } from './types/index.ts';

function AppShell() {
  const { user, authLoading, t } = useAuth();
  const [route, setRoute] = useState<AppRoute>('home');
  const [libraryCropFilter, setLibraryCropFilter] = useState<string>('All');
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register' | 'admin'>(
    'login'
  );
  const [activeReport, setActiveReport] = useState<DiseaseReport | null>(null);

  const navigate = (
    nextRoute: AppRoute,
    options?: {
      scrollTo?: string;
      cropFilter?: string;
      authTab?: 'login' | 'register' | 'admin';
    }
  ) => {
    if (options?.cropFilter) {
      setLibraryCropFilter(options.cropFilter);
    } else if (nextRoute === 'library' && !options?.cropFilter) {
      setLibraryCropFilter('All');
    }

    if (options?.authTab) {
      setAuthInitialTab(options.authTab);
    }

    const protectedRoutes: AppRoute[] = [
      'dashboard',
      'detect',
      'reports',
      'report-detail',
      'profile',
      'admin',
    ];

    if (protectedRoutes.includes(nextRoute) && !user) {
      setRoute('auth');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setRoute(nextRoute);
    if (options?.scrollTo) {
      setTimeout(() => {
        document
          .getElementById(options.scrollTo!)
          ?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openReport = (report: DiseaseReport) => {
    setActiveReport(report);
    setRoute('report-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6FAF6]">
        <Loader2 className="w-7 h-7 text-[#1B6B3A] animate-spin" />
      </div>
    );
  }

  // Authenticated Workspace Layout for Farmer/Admin interior pages
  const isWorkspaceRoute =
    Boolean(user) &&
    route !== 'home' &&
    route !== 'auth';

  if (isWorkspaceRoute) {
    const breadcrumbMap: Record<AppRoute, string> = {
      home: t('navHome'),
      auth: t('navLogin'),
      dashboard: t('sidebarDashboard'),
      detect: t('sidebarDetect'),
      reports: t('sidebarReports'),
      'report-detail': activeReport
        ? `Report #${activeReport.id}`
        : t('sidebarReports'),
      library: t('sidebarLibrary'),
      tips: t('sidebarTips'),
      profile: t('sidebarProfile'),
      admin: t('navAdmin'),
    };

    return (
      <SidebarLayout
        currentRoute={route}
        breadcrumb={breadcrumbMap[route]}
        onNavigate={(r) => navigate(r)}
      >
        {route === 'dashboard' && (
          <FarmerDashboardPage
            onNavigate={(r) => navigate(r)}
            onOpenReport={openReport}
          />
        )}
        {route === 'detect' && <DetectDiseasePage onReportReady={openReport} />}
        {route === 'reports' && (
          <MyReportsPage
            onOpenReport={openReport}
            onStartDetect={() => navigate('detect')}
          />
        )}
        {route === 'report-detail' && activeReport && (
          <ReportDetailPage
            report={activeReport}
            onBack={() => navigate(user?.role === 'admin' ? 'admin' : 'reports')}
            onAnalyzeAnother={() => navigate('detect')}
            onReportUpdated={(updated) => setActiveReport(updated)}
          />
        )}
        {route === 'library' && (
          <DiseaseLibraryPage initialCrop={libraryCropFilter} />
        )}
        {route === 'tips' && <FarmingTipsPage />}
        {route === 'profile' && <ProfilePage />}
        {route === 'admin' && <AdminDashboardPage onOpenReport={openReport} />}
      </SidebarLayout>
    );
  }

  // Public Pages Layout (Home, Auth, Public Disease Library, Public Farming Tips)
  return (
    <div className="min-h-screen flex flex-col bg-[#F6FAF6]">
      <Navbar currentRoute={route} onNavigate={navigate} />
      <main className="flex-1">
        {route === 'home' && <HomePage onNavigate={navigate} />}
        {route === 'auth' && (
          <AuthPage
            initialTab={authInitialTab}
            onSuccess={(dest) => navigate(dest)}
          />
        )}
        {route === 'library' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <DiseaseLibraryPage initialCrop={libraryCropFilter} />
          </div>
        )}
        {route === 'tips' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <FarmingTipsPage />
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
