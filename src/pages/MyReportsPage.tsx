import {
  AlertCircle,
  Camera,
  Eye,
  FileDown,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { SeverityIndicator } from '../components/SeverityIndicator.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { downloadReportPdf } from '../utils/pdfReport.ts';
import type { DiseaseReport } from '../types/index.ts';

interface MyReportsPageProps {
  onOpenReport: (report: DiseaseReport) => void;
  onStartDetect: () => void;
}

export function MyReportsPage({
  onOpenReport,
  onStartDetect,
}: MyReportsPageProps) {
  const { token, t } = useAuth();
  const [reports, setReports] = useState<DiseaseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    api
      .getReports(token)
      .then((res) => {
        if (active) setReports(res.reports);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load reports.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    setDeletingId(id);
    try {
      await api.deleteReport(token, id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      setConfirmDeleteId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not delete report.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = reports.filter((r) => {
    const matchSeverity =
      severityFilter === 'All' ||
      (severityFilter === 'Healthy' && r.isHealthy) ||
      r.severity === severityFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      r.cropName.toLowerCase().includes(q) ||
      r.detectedDisease.toLowerCase().includes(q) ||
      r.locationDistrict.toLowerCase().includes(q);
    return matchSeverity && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#132A1E] tracking-tight">
            {t('sidebarReports')}
          </h1>
          <p className="text-sm text-[#4A5D52] mt-1">
            Private history of your AI plant inspections. Download PDF reports or review treatments anytime.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartDetect}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B6B3A] hover:bg-[#15552E] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>{t('sidebarDetect')}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#4A5D52] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE7DC] bg-white text-sm text-[#132A1E] focus:border-[#1B6B3A] outline-none"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#EEF5EE] rounded-xl border border-[#DCE7DC] overflow-x-auto">
          {['All', 'High', 'Medium', 'Low', 'Healthy'].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSeverityFilter(level)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                severityFilter === level
                  ? 'bg-white text-[#132A1E] shadow-xs'
                  : 'text-[#4A5D52] hover:text-[#132A1E]'
              }`}
            >
              {level}
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

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white border border-[#DCE7DC] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#DCE7DC] rounded-2xl p-12 text-center space-y-3">
          <p className="text-base font-semibold text-[#132A1E]">
            {reports.length === 0 ? t('noReportsYet') : 'No reports match your filter.'}
          </p>
          <p className="text-sm text-[#4A5D52]">
            {reports.length === 0
              ? t('noReportsHint')
              : 'Try clearing the search query or selecting All severities.'}
          </p>
          {reports.length === 0 && (
            <button
              type="button"
              onClick={onStartDetect}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B6B3A] text-white text-sm font-semibold cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>{t('quickDetectBtn')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="bg-white border border-[#DCE7DC] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={report.imagePath}
                  alt={report.cropName}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl object-cover border border-[#DCE7DC] shrink-0 bg-[#EEF5EE]"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A5D52]">
                    <span className="font-mono tabular-nums">#{report.id}</span>
                    <span>·</span>
                    <span>{report.cropName}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#132A1E] truncate">
                    {report.detectedDisease}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <SeverityIndicator
                      severity={report.severity}
                      isHealthy={report.isHealthy}
                      isUnclear={report.isUnclear}
                      size="sm"
                    />
                    <span className="text-xs font-mono tabular-nums text-[#4A5D52]">
                      {report.confidenceEstimate}% confidence
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenReport(report)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1B6B3A] hover:bg-[#15552E] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('viewReport')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadReportPdf(report)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#DCE7DC] hover:bg-[#F6FAF6] text-[#132A1E] text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>

                {confirmDeleteId === report.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={deletingId === report.id}
                      onClick={() => handleDelete(report.id)}
                      className="px-3 py-2 rounded-lg bg-[#C83232] text-white text-xs font-semibold cursor-pointer"
                    >
                      {deletingId === report.id ? '...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-2 rounded-lg border border-[#DCE7DC] text-xs text-[#4A5D52] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(report.id)}
                    aria-label="Delete report"
                    className="p-2 rounded-lg text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
