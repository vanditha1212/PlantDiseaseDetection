import {
  AlertCircle,
  ArrowRight,
  Bell,
  Camera,
  CheckCircle2,
  ClipboardList,
  ShieldAlert,
  Wheat,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { SeverityIndicator } from '../components/SeverityIndicator.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import type {
  AppRoute,
  DashboardStats,
  DiseaseReport,
  FarmingTip,
} from '../types/index.ts';

interface FarmerDashboardPageProps {
  onNavigate: (route: AppRoute) => void;
  onOpenReport: (report: DiseaseReport) => void;
}

export function FarmerDashboardPage({
  onNavigate,
  onOpenReport,
}: FarmerDashboardPageProps) {
  const { user, token, t } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalAnalyses: 0,
    healthyCount: 0,
    diseaseCount: 0,
  });
  const [recentReports, setRecentReports] = useState<DiseaseReport[]>([]);
  const [tips, setTips] = useState<FarmingTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([api.getProfile(token), api.getTips()])
      .then(([profileRes, tipsRes]) => {
        if (!active) return;
        setStats(profileRes.stats);
        setRecentReports(profileRes.recentReports);
        setTips(tipsRes.tips.slice(0, 3));
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load dashboard data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  // Build contextual notifications from actual farmer reports + seasonal advisories
  const notifications = [
    ...recentReports.slice(0, 2).map((r) => ({
      id: `rep-${r.id}`,
      title: r.isHealthy
        ? `${r.cropName}: Healthy plant confirmed`
        : `${r.cropName}: ${r.detectedDisease} (${r.severity})`,
      detail: new Date(r.createdAt).toLocaleDateString(),
      action: () => onOpenReport(r),
    })),
    {
      id: 'notif-scouting',
      title: 'Weekly Morning Scouting Reminder',
      detail: 'Inspect leaf undersides twice weekly in natural morning light for early blight or whiteflies.',
      action: () => onNavigate('tips'),
    },
    {
      id: 'notif-kvk',
      title: 'Verify High-Severity Findings Locally',
      detail: 'Share your downloaded PDF report with your district Krishi Vigyan Kendra (KVK) for approved spray schedules.',
      action: () => onNavigate('library'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#132A1E] tracking-tight">
            {t('welcomeBack')}, {user?.fullName || 'Farmer'}
          </h1>
          <p className="text-sm text-[#4A5D52] mt-1">
            {user?.district
              ? `${user.district}${user.state ? `, ${user.state}` : ''} · `
              : ''}
            Monitor crop health, run Gemini AI leaf inspections, and review saved field reports.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('detect')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#15552E] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>{t('quickDetectBtn')}</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#DCE7DC] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-[#4A5D52]">
            <span>{t('totalAnalyses')}</span>
            <ClipboardList className="w-4 h-4 text-[#1B6B3A]" />
          </div>
          {loading ? (
            <div className="h-9 w-16 bg-[#EEF5EE] rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-[#132A1E] font-mono tabular-nums">
              {stats.totalAnalyses}
            </p>
          )}
        </div>

        <div className="bg-white border border-[#DCE7DC] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-[#4A5D52]">
            <span>{t('healthyDetected')}</span>
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          </div>
          {loading ? (
            <div className="h-9 w-16 bg-[#EEF5EE] rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-[#15803D] font-mono tabular-nums">
              {stats.healthyCount}
            </p>
          )}
        </div>

        <div className="bg-white border border-[#DCE7DC] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-[#4A5D52]">
            <span>{t('diseaseCases')}</span>
            <ShieldAlert className="w-4 h-4 text-[#C98A1C]" />
          </div>
          {loading ? (
            <div className="h-9 w-16 bg-[#EEF5EE] rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-[#B45309] font-mono tabular-nums">
              {stats.diseaseCount}
            </p>
          )}
        </div>
      </div>

      {/* Quick Disease Detection Banner */}
      <div className="bg-[#132A1E] text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h2 className="text-xl font-bold">{t('quickDetectTitle')}</h2>
          <p className="text-sm text-[#CBE0D1] leading-relaxed">
            {t('quickDetectDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('detect')}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C98A1C] hover:bg-[#B27714] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>{t('quickDetectBtn')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Recent Diagnosis History + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-[#132A1E]">{t('recentHistory')}</h2>
            {recentReports.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="text-xs font-semibold text-[#1B6B3A] hover:underline whitespace-nowrap cursor-pointer"
              >
                View all
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-[#F6FAF6] animate-pulse" />
              ))}
            </div>
          ) : recentReports.length === 0 ? (
            <div className="py-10 text-center space-y-3 border border-dashed border-[#DCE7DC] rounded-xl bg-[#F6FAF6]/60 px-4">
              <p className="text-sm font-semibold text-[#132A1E]">{t('noReportsYet')}</p>
              <p className="text-xs text-[#4A5D52] max-w-sm mx-auto">
                {t('noReportsHint')}
              </p>
              <button
                type="button"
                onClick={() => onNavigate('detect')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1B6B3A] rounded-lg hover:bg-[#15552E] cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{t('quickDetectBtn')}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DCE7DC] text-xs font-semibold text-[#4A5D52]">
                    <th className="py-2.5 pr-4">Crop & Diagnosis</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Confidence</th>
                    <th className="py-2.5 pl-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF5EE] text-sm">
                  {recentReports.map((report) => (
                    <tr
                      key={report.id}
                      onClick={() => onOpenReport(report)}
                      className="hover:bg-[#F6FAF6] transition-colors cursor-pointer"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={report.imagePath}
                            alt={report.cropName}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover border border-[#DCE7DC] shrink-0 bg-[#EEF5EE]"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#132A1E] truncate">
                              {report.detectedDisease}
                            </p>
                            <p className="text-xs text-[#4A5D52] truncate">
                              {report.cropName}
                              {report.locationDistrict ? ` · ${report.locationDistrict}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <SeverityIndicator
                          severity={report.severity}
                          isHealthy={report.isHealthy}
                          isUnclear={report.isUnclear}
                          size="sm"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-medium text-[#31473B]">
                        {report.confidenceEstimate}%
                      </td>
                      <td className="py-3 pl-3 text-right font-mono tabular-nums text-xs text-[#4A5D52] whitespace-nowrap">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="lg:col-span-4 bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#1B6B3A]" />
            <h2 className="text-lg font-bold text-[#132A1E]">
              {t('recentNotifications')}
            </h2>
          </div>

          <div className="divide-y divide-[#EEF5EE]">
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={n.action}
                className="w-full text-left py-3.5 first:pt-1 last:pb-0 hover:text-[#1B6B3A] transition-colors cursor-pointer"
              >
                <p className="text-sm font-semibold text-[#132A1E]">{n.title}</p>
                <p className="text-xs text-[#4A5D52] mt-1 leading-relaxed">{n.detail}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Practical Farming Tips Preview */}
      <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wheat className="w-4 h-4 text-[#1B6B3A]" />
            <h2 className="text-lg font-bold text-[#132A1E]">{t('tipsTitle')}</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('tips')}
            className="text-xs font-semibold text-[#1B6B3A] hover:underline whitespace-nowrap cursor-pointer"
          >
            Explore all tips
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className="p-4 rounded-xl bg-[#F6FAF6] border border-[#DCE7DC] space-y-2"
            >
              <p className="text-xs text-[#4A5D52]">
                {tip.category} · {tip.season}
              </p>
              <h3 className="text-sm font-bold text-[#132A1E]">{tip.title}</h3>
              <p className="text-xs text-[#4A5D52] leading-relaxed">{tip.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
