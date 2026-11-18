import {
  AlertCircle,
  BookOpen,
  ClipboardList,
  Eye,
  Plus,
  ShieldAlert,
  Trash2,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SeverityIndicator } from '../components/SeverityIndicator.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { SUPPORTED_CROPS, TIP_CATEGORIES } from '../i18n/translations.ts';
import { api } from '../services/api.ts';
import type {
  AdminDashboardData,
  AdminReportRow,
  DiseaseLibraryItem,
  DiseaseReport,
  FarmingTip,
  UserProfile,
} from '../types/index.ts';

interface AdminDashboardPageProps {
  onOpenReport: (report: DiseaseReport) => void;
}

type AdminTab = 'overview' | 'reports' | 'library' | 'tips' | 'users';

export function AdminDashboardPage({ onOpenReport }: AdminDashboardPageProps) {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [libraryItems, setLibraryItems] = useState<DiseaseLibraryItem[]>([]);
  const [tips, setTips] = useState<FarmingTip[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Add library form state
  const [newDisease, setNewDisease] = useState({
    diseaseName: '',
    scientificName: '',
    affectedCrop: 'Tomato',
    severityDefault: 'Medium',
    symptoms: '',
    causes: '',
    preventionMethods: '',
    treatmentApproaches: '',
  });

  // Add tip form state
  const [newTip, setNewTip] = useState({
    title: '',
    category: 'Crop protection',
    season: 'All Seasons',
    summary: '',
    content: '',
  });

  const loadAllAdminData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [dashRes, reportsRes, libRes, tipsRes, usersRes] = await Promise.all([
        api.getAdminDashboard(token),
        api.getAdminReports(token),
        api.getLibrary(),
        api.getTips(),
        api.getAdminUsers(token),
      ]);
      setDashboard(dashRes);
      setReports(reportsRes.reports);
      setLibraryItems(libRes.items);
      setTips(tipsRes.tips);
      setUsersList(usersRes.users);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Unable to load admin dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, [token]);

  const handleInspectReport = async (id: number) => {
    if (!token) return;
    try {
      const { report } = await api.getReportById(token, id);
      onOpenReport(report);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to open report.');
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!token) return;
    try {
      await api.deleteReport(token, id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      setNotice('Report deleted.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete report.');
    }
  };

  const handleAddLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      const { item } = await api.addLibraryEntry(token, newDisease);
      setLibraryItems((prev) => [item, ...prev]);
      setNewDisease({
        diseaseName: '',
        scientificName: '',
        affectedCrop: 'Tomato',
        severityDefault: 'Medium',
        symptoms: '',
        causes: '',
        preventionMethods: '',
        treatmentApproaches: '',
      });
      setNotice('New disease entry added to library.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add disease entry.');
    }
  };

  const handleDeleteLibrary = async (id: number) => {
    if (!token) return;
    try {
      await api.deleteLibraryEntry(token, id);
      setLibraryItems((prev) => prev.filter((item) => item.id !== id));
      setNotice('Disease library entry removed.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry.');
    }
  };

  const handleAddTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    try {
      const { tip } = await api.addFarmingTip(token, newTip);
      setTips((prev) => [tip, ...prev]);
      setNewTip({
        title: '',
        category: 'Crop protection',
        season: 'All Seasons',
        summary: '',
        content: '',
      });
      setNotice('Farming tip published.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add farming tip.');
    }
  };

  const handleDeleteTip = async (id: number) => {
    if (!token) return;
    try {
      await api.deleteFarmingTip(token, id);
      setTips((prev) => prev.filter((tip) => tip.id !== id));
      setNotice('Farming tip deleted.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete tip.');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!token) return;
    try {
      await api.deleteAdminUser(token, id);
      setUsersList((prev) => prev.filter((u) => u.id !== id));
      setNotice('User account removed.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete user.');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="bg-white border border-[#DCE7DC] rounded-2xl p-10 text-center space-y-2">
        <ShieldAlert className="w-8 h-8 text-[#C83232] mx-auto" />
        <h2 className="text-lg font-bold text-[#132A1E]">Administrator Access Required</h2>
        <p className="text-sm text-[#4A5D52]">
          Sign in with an administrator account to view platform analytics and manage content.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#132A1E] tracking-tight">
            Admin Analytics &amp; Operations
          </h1>
          <p className="text-sm text-[#4A5D52] mt-1">
            Monitor farmer registrations, crop disease trends, submitted AI reports, and verified agricultural content.
          </p>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#EEF5EE] rounded-xl border border-[#DCE7DC] overflow-x-auto">
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'reports', label: `Reports (${reports.length})` },
              { id: 'library', label: `Library (${libraryItems.length})` },
              { id: 'tips', label: `Tips (${tips.length})` },
              { id: 'users', label: `Users (${usersList.length})` },
            ] as { id: AdminTab; label: string }[]
          ).map((tabItem) => (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => {
                setActiveTab(tabItem.id);
                setNotice(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === tabItem.id
                  ? 'bg-white text-[#132A1E] shadow-xs'
                  : 'text-[#4A5D52] hover:text-[#132A1E]'
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="p-3.5 rounded-xl bg-[#EEF5EE] border border-[#DCE7DC] text-xs font-semibold text-[#1B6B3A]">
          {notice}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DCE7DC] rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-[#4A5D52]">
            <span>Registered Farmers</span>
            <Users className="w-4 h-4 text-[#1B6B3A]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#132A1E]">
            {loading ? '—' : dashboard?.totals.registeredFarmers ?? 0}
          </p>
        </div>

        <div className="bg-white border border-[#DCE7DC] rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-[#4A5D52]">
            <span>Total AI Analyses</span>
            <ClipboardList className="w-4 h-4 text-[#1B6B3A]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#132A1E]">
            {loading ? '—' : dashboard?.totals.totalAnalyses ?? 0}
          </p>
        </div>

        <div className="bg-white border border-[#DCE7DC] rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-[#4A5D52]">
            <span>Disease Cases</span>
            <ShieldAlert className="w-4 h-4 text-[#C98A1C]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#B45309]">
            {loading ? '—' : dashboard?.totals.diseaseCases ?? 0}
          </p>
        </div>

        <div className="bg-white border border-[#DCE7DC] rounded-2xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-[#4A5D52]">
            <span>Library Entries</span>
            <BookOpen className="w-4 h-4 text-[#15803D]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#15803D]">
            {loading ? '—' : dashboard?.totals.libraryEntries ?? 0}
          </p>
        </div>
      </div>

      {/* TAB 1: OVERVIEW CHARTS & RECENT ACTIVITY */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Disease Statistics Chart */}
            <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#132A1E]">
                  Most Commonly Detected Diseases
                </h2>
                <p className="text-xs text-[#4A5D52]">
                  Aggregated from real Gemini AI plant analyses submitted by farmers.
                </p>
              </div>
              {!dashboard || dashboard.topDiseases.length === 0 ? (
                <div className="h-60 flex items-center justify-center border border-dashed border-[#DCE7DC] rounded-xl bg-[#F6FAF6]/60 text-xs text-[#4A5D52] px-6 text-center">
                  No plant disease analyses have been submitted yet. Run an AI scan to populate live disease statistics.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboard.topDiseases}
                      margin={{ top: 8, right: 12, left: -12, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5EFE5" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#4A5D52' }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#4A5D52' }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#1B6B3A" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Crop-Wise Analysis Chart */}
            <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#132A1E]">
                  Crop-Wise Analysis Distribution
                </h2>
                <p className="text-xs text-[#4A5D52]">
                  Number of AI diagnostic inspections recorded per crop.
                </p>
              </div>
              {!dashboard || dashboard.cropAnalysis.length === 0 ? (
                <div className="h-60 flex items-center justify-center border border-dashed border-[#DCE7DC] rounded-xl bg-[#F6FAF6]/60 text-xs text-[#4A5D52] px-6 text-center">
                  No crop inspections yet. Crop distribution will update automatically as farmers upload photographs.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboard.cropAnalysis}
                      margin={{ top: 8, right: 12, left: -12, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5EFE5" />
                      <XAxis
                        dataKey="crop"
                        tick={{ fontSize: 11, fill: '#4A5D52' }}
                        interval={0}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#4A5D52' }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#C98A1C" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Recent User Activities */}
          <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#132A1E]">
              Recent User Activities
            </h2>
            {!dashboard || dashboard.recentActivities.length === 0 ? (
              <p className="text-sm text-[#4A5D52]">No recent farmer activity yet.</p>
            ) : (
              <div className="divide-y divide-[#EEF5EE]">
                {dashboard.recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm"
                  >
                    <div>
                      <span className="font-semibold text-[#132A1E]">{act.actor}</span>
                      <span className="text-[#4A5D52]"> · {act.detail}</span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-[#4A5D52]">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUBMITTED REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-[#132A1E]">
            All Submitted Disease Reports
          </h2>
          {reports.length === 0 ? (
            <p className="text-sm text-[#4A5D52]">No reports submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#DCE7DC] text-xs font-semibold text-[#4A5D52]">
                    <th className="py-2.5 pr-4">ID</th>
                    <th className="py-2.5 pr-4">Farmer</th>
                    <th className="py-2.5 pr-4">Crop &amp; Disease</th>
                    <th className="py-2.5 pr-4">Severity</th>
                    <th className="py-2.5 pr-4 text-right">Confidence</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF5EE]">
                  {reports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-[#F6FAF6]">
                      <td className="py-3 pr-4 font-mono tabular-nums text-xs text-[#4A5D52]">
                        #{rep.id}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-[#132A1E]">{rep.farmerName}</p>
                        <p className="text-xs text-[#4A5D52]">{rep.farmerEmail}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-[#132A1E]">
                          {rep.detectedDisease}
                        </p>
                        <p className="text-xs text-[#4A5D52]">{rep.cropName}</p>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <SeverityIndicator
                          severity={rep.severity}
                          isHealthy={rep.isHealthy}
                          isUnclear={rep.isUnclear}
                          size="sm"
                        />
                      </td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums text-xs">
                        {rep.confidenceEstimate}%
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleInspectReport(rep.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#EEF5EE] hover:bg-[#DCE7DC] text-xs font-semibold text-[#132A1E] mr-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(rep.id)}
                          className="p-1.5 rounded-lg text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer"
                          aria-label="Delete report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANAGE DISEASE LIBRARY */}
      {activeTab === 'library' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddLibrary}
            className="lg:col-span-5 bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-3.5 h-fit"
          >
            <h2 className="text-base font-bold text-[#132A1E]">
              Add Disease Library Entry
            </h2>
            <input
              type="text"
              required
              placeholder="Disease Name"
              value={newDisease.diseaseName}
              onChange={(e) =>
                setNewDisease((p) => ({ ...p, diseaseName: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-[#DCE7DC] text-sm"
            />
            <input
              type="text"
              placeholder="Scientific Name (optional)"
              value={newDisease.scientificName}
              onChange={(e) =>
                setNewDisease((p) => ({ ...p, scientificName: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-[#DCE7DC] text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newDisease.affectedCrop}
                onChange={(e) =>
                  setNewDisease((p) => ({ ...p, affectedCrop: e.target.value }))
                }
                className="px-3 py-2 rounded-xl border border-[#DCE7DC] text-sm"
              >
                {SUPPORTED_CROPS.map((crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                ))}
              </select>
              <select
                value={newDisease.severityDefault}
                onChange={(e) =>
                  setNewDisease((p) => ({ ...p, severityDefault: e.target.value }))
                }
                className="px-3 py-2 rounded-xl border border-[#DCE7DC] text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <textarea
              rows={2}
              required
              placeholder="Symptoms..."
              value={newDisease.symptoms}
              onChange={(e) =>
                setNewDisease((p) => ({ ...p, symptoms: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-[#DCE7DC] text-sm"
            />
            <textarea
              rows={2}
              required
              placeholder="Causes..."
              value={newDisease.causes}
              onChange={(e) =>
                setNewDisease((p) => ({ ...p, causes: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-[#DCE7DC] text-sm"
            />
            <textarea
              rows={2}
              required
              placeholder="Prevention methods..."
              value={newDisease.preventionMethods}
              onChange={(e) =>
                setNewDisease((p) => ({ ...p, preventionMethods: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-[#DCE7DC] text-sm"
            />
            <textarea
              rows={2}
              required
              placeholder="Treatment approaches..."
              value={newDisease.treatmentApproaches}
              onChange={(e) =>
                setNewDisease((p) => ({ ...p, treatmentApproaches: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-[#DCE7DC] text-sm"
            />
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1B6B3A] hover:bg-[#15552E] text-white text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Entry</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-[#132A1E]">
              Existing Entries ({libraryItems.length})
            </h2>
            <div className="divide-y divide-[#EEF5EE] max-h-[600px] overflow-y-auto pr-1">
              {libraryItems.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-[#1B6B3A] font-semibold">
                      {item.affectedCrop} · {item.severityDefault}
                    </p>
                    <p className="text-sm font-bold text-[#132A1E]">
                      {item.diseaseName}
                    </p>
                    <p className="text-xs text-[#4A5D52] line-clamp-2 mt-0.5">
                      {item.symptoms}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteLibrary(item.id)}
                    className="p-1.5 rounded-lg text-[#991B1B] hover:bg-[#FEF2F2] shrink-0 cursor-pointer"
                    aria-label="Delete disease entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MANAGE FARMING TIPS */}
      {activeTab === 'tips' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddTip}
            className="lg:col-span-5 bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-3.5 h-fit"
          >
            <h2 className="text-base font-bold text-[#132A1E]">
              Publish Farming Tip
            </h2>
            <input
              type="text"
              required
              placeholder="Tip Title"
              value={newTip.title}
              onChange={(e) => setNewTip((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-[#DCE7DC] text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newTip.category}
                onChange={(e) =>
                  setNewTip((p) => ({ ...p, category: e.target.value }))
                }
                className="px-3 py-2 rounded-xl border border-[#DCE7DC] text-sm"
              >
                {TIP_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Season"
                value={newTip.season}
                onChange={(e) =>
                  setNewTip((p) => ({ ...p, season: e.target.value }))
                }
                className="px-3 py-2 rounded-xl border border-[#DCE7DC] text-sm"
              />
            </div>
            <textarea
              rows={2}
              required
              placeholder="Short summary..."
              value={newTip.summary}
              onChange={(e) =>
                setNewTip((p) => ({ ...p, summary: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-[#DCE7DC] text-sm"
            />
            <textarea
              rows={4}
              required
              placeholder="Detailed practical advice for farmers..."
              value={newTip.content}
              onChange={(e) =>
                setNewTip((p) => ({ ...p, content: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-[#DCE7DC] text-sm"
            />
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1B6B3A] hover:bg-[#15552E] text-white text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Tip</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-[#132A1E]">
              Published Farming Tips ({tips.length})
            </h2>
            <div className="divide-y divide-[#EEF5EE] max-h-[560px] overflow-y-auto pr-1">
              {tips.map((tip) => (
                <div
                  key={tip.id}
                  className="py-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-[#1B6B3A] font-semibold">
                      {tip.category} · {tip.season}
                    </p>
                    <p className="text-sm font-bold text-[#132A1E]">{tip.title}</p>
                    <p className="text-xs text-[#4A5D52] mt-0.5">{tip.summary}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteTip(tip.id)}
                    className="p-1.5 rounded-lg text-[#991B1B] hover:bg-[#FEF2F2] shrink-0 cursor-pointer"
                    aria-label="Delete tip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MANAGE USERS */}
      {activeTab === 'users' && (
        <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-[#132A1E]">
            Registered Accounts ({usersList.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#DCE7DC] text-xs font-semibold text-[#4A5D52]">
                  <th className="py-2.5 pr-4">Name</th>
                  <th className="py-2.5 pr-4">Email &amp; Mobile</th>
                  <th className="py-2.5 pr-4">Location</th>
                  <th className="py-2.5 pr-4">Role / Lang</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF5EE]">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F6FAF6]">
                    <td className="py-3 pr-4 font-semibold text-[#132A1E]">
                      {u.fullName}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-xs text-[#132A1E]">{u.email}</p>
                      <p className="text-xs text-[#4A5D52]">
                        {u.mobileNumber || '—'}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-xs text-[#4A5D52]">
                      {[u.district, u.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="py-3 pr-4 text-xs font-medium text-[#31473B]">
                      {u.role} · {u.preferredLanguage.toUpperCase()}
                    </td>
                    <td className="py-3 text-right">
                      {u.id !== user.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-lg text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer"
                          aria-label="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
