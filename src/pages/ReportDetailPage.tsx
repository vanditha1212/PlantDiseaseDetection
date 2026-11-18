import {
  AlertTriangle,
  ArrowLeft,
  BookmarkCheck,
  Camera,
  CheckCircle2,
  Droplets,
  FileDown,
  FlaskConical,
  HeartPulse,
  Leaf,
  ShieldCheck,
  Sprout,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { SeverityIndicator } from '../components/SeverityIndicator.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { downloadReportPdf } from '../utils/pdfReport.ts';
import type { DiseaseReport } from '../types/index.ts';

interface ReportDetailPageProps {
  report: DiseaseReport;
  onBack: () => void;
  onAnalyzeAnother: () => void;
  onReportUpdated: (updated: DiseaseReport) => void;
}

export function ReportDetailPage({
  report,
  onBack,
  onAnalyzeAnother,
  onReportUpdated,
}: ReportDetailPageProps) {
  const { token, t } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadReportPdf(report);
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!token) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const { report: updated } = await api.saveReportFlag(token, report.id, true);
      onReportUpdated(updated);
      setSaveMessage(t('savedReport'));
    } catch {
      setSaveMessage('Could not update saved status.');
    } finally {
      setSaving(false);
    }
  };

  const severityBarColor = report.isHealthy || report.severity === 'None'
    ? 'bg-[#15803D]'
    : report.severity === 'High'
      ? 'bg-[#C83232]'
      : report.severity === 'Medium'
        ? 'bg-[#C98A1C]'
        : 'bg-[#15803D]';

  return (
    <div className="space-y-6">
      {/* Top Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#31473B] hover:text-[#132A1E] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reports</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveReport}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#DCE7DC] bg-white hover:bg-[#F6FAF6] text-xs sm:text-sm font-semibold text-[#132A1E] transition-colors whitespace-nowrap cursor-pointer"
          >
            <BookmarkCheck className="w-4 h-4 text-[#1B6B3A]" />
            <span>{report.savedByFarmer ? t('savedReport') : t('saveReport')}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1B6B3A] text-[#1B6B3A] bg-white hover:bg-[#EEF5EE] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>{downloading ? 'Preparing PDF...' : t('downloadPdf')}</span>
          </button>

          <button
            type="button"
            onClick={onAnalyzeAnother}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B6B3A] hover:bg-[#15552E] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>{t('analyzeAnother')}</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 rounded-xl bg-[#EEF5EE] border border-[#DCE7DC] text-xs font-semibold text-[#1B6B3A]">
          {saveMessage}
        </div>
      )}

      {/* Unclear Photo Banner */}
      {report.isUnclear && (
        <div className="bg-[#FDF9EF] border border-[#EDE0BE] rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-[#B45309] shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-[#132A1E]">{t('unclearTitle')}</h2>
              <p className="text-sm text-[#5C4B2A] leading-relaxed">
                {report.treatment?.unclearReason ||
                  'The uploaded image does not show plant leaves clearly enough for a reliable diagnosis. Please capture a sharp close-up photograph in natural daylight.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAnalyzeAnother}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B6B3A] hover:bg-[#15552E] text-white text-sm font-semibold cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>{t('unclearCta')}</span>
          </button>
        </div>
      )}

      {/* Main Diagnosis Summary Card */}
      <div className="bg-white border border-[#DCE7DC] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 bg-[#EEF5EE]/50 flex items-center justify-center p-5 border-b lg:border-b-0 lg:border-r border-[#DCE7DC]">
          <img
            src={report.imagePath}
            alt={`${report.cropName} plant photo`}
            referrerPolicy="no-referrer"
            className="w-full max-h-80 object-contain rounded-xl"
          />
        </div>

        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A5D52]">
              <span className="font-mono tabular-nums">
                Report #{report.id} · {new Date(report.createdAt).toLocaleString()}
              </span>
              <SeverityIndicator
                severity={report.severity}
                isHealthy={report.isHealthy}
                isUnclear={report.isUnclear}
              />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#132A1E] tracking-tight">
                {report.detectedDisease}
              </h1>
              {report.scientificName && (
                <p className="text-sm italic text-[#4A5D52]">
                  {t('scientificNameLabel')}: {report.scientificName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-[#EEF5EE]">
              <div>
                <p className="text-xs text-[#4A5D52]">{t('cropIdentifiedLabel')}</p>
                <p className="text-sm font-semibold text-[#132A1E] mt-0.5">
                  {report.cropName}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#4A5D52]">{t('confidenceLabel')}</p>
                <p className="text-sm font-bold font-mono tabular-nums text-[#132A1E] mt-0.5">
                  {report.confidenceEstimate}%
                </p>
              </div>
              <div>
                <p className="text-xs text-[#4A5D52]">Location / Stage</p>
                <p className="text-sm font-medium text-[#132A1E] mt-0.5 truncate">
                  {[report.locationDistrict, report.growthStage].filter(Boolean).join(' · ') || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Visual Confidence & Severity Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2 rounded-full bg-[#EEF5EE] overflow-hidden">
                <div
                  className={`h-full rounded-full ${severityBarColor}`}
                  style={{ width: `${Math.max(6, report.confidenceEstimate)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Preliminary AI Disclaimer */}
          <div className="p-4 rounded-xl bg-[#FDF9EF] border border-[#EDE0BE] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#8C5B0A]">
                {t('expertWarningTitle')}
              </p>
              <p className="text-xs text-[#5C4B2A] leading-relaxed">
                {report.treatment?.expertDisclaimer ||
                  'AI results are preliminary and should be verified by local agricultural extension officers or Krishi Vigyan Kendra (KVK) specialists before purchasing or applying chemical inputs.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic Breakdown (Symptoms, Causes, Spread) */}
      {!report.isUnclear && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-3">
              <h2 className="text-base font-bold text-[#132A1E]">
                {t('symptomsDetected')}
              </h2>
              {report.symptoms.length > 0 ? (
                <ul className="space-y-2 text-sm text-[#31473B] leading-relaxed">
                  {report.symptoms.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#1B6B3A] font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#4A5D52]">No visible disease lesions detected.</p>
              )}
            </div>

            <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-3">
              <h2 className="text-base font-bold text-[#132A1E]">
                {t('possibleCauses')}
              </h2>
              {report.possibleCauses.length > 0 ? (
                <ul className="space-y-2 text-sm text-[#31473B] leading-relaxed">
                  {report.possibleCauses.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#C98A1C] font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#4A5D52]">Healthy crop growth conditions.</p>
              )}
            </div>

            <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-3">
              <h2 className="text-base font-bold text-[#132A1E]">
                {t('howItSpreads')}
              </h2>
              <p className="text-sm text-[#31473B] leading-relaxed">
                {report.diseaseSpread ||
                  'Monitor nearby rows during humid weather and keep pruning tools clean.'}
              </p>
            </div>
          </div>

          {/* 4 Separate Treatment Recommendation Cards (A, B, C, D) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#FEF2F2] text-[#C83232] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-[#132A1E]">
                  A. {t('immediateActions')}
                </h2>
              </div>
              <ul className="space-y-2 text-sm text-[#31473B] leading-relaxed">
                {(report.treatment?.immediateActions || []).map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1B6B3A] shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#EEF5EE] text-[#1B6B3A] flex items-center justify-center shrink-0">
                  <HeartPulse className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-[#132A1E]">
                  B. {t('recommendedTreatment')}
                </h2>
              </div>
              <ul className="space-y-2 text-sm text-[#31473B] leading-relaxed">
                {(report.treatment?.recommendedTreatment || []).map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1B6B3A] shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#FDF9EF] text-[#B45309] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-[#132A1E]">
                  C. {t('preventiveMeasures')}
                </h2>
              </div>
              <ul className="space-y-2 text-sm text-[#31473B] leading-relaxed">
                {(report.treatment?.preventiveMeasures || []).map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C98A1C] shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#EEF5EE] text-[#15803D] flex items-center justify-center shrink-0">
                  <Sprout className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-[#132A1E]">
                  D. {t('recoveryInstructions')}
                </h2>
              </div>
              <ul className="space-y-2 text-sm text-[#31473B] leading-relaxed">
                {(report.treatment?.recoveryInstructions || []).map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Organic, Safe Chemical, Irrigation & Soil Guidance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-[#F6FAF6] border border-[#DCE7DC] rounded-2xl p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-[#1B6B3A] font-bold text-sm">
                <Leaf className="w-4 h-4" />
                <h3>{t('organicOptions')}</h3>
              </div>
              <ul className="space-y-1.5 text-sm text-[#31473B] leading-relaxed">
                {(report.treatment?.organicOptions || []).map((opt, idx) => (
                  <li key={idx}>• {opt}</li>
                ))}
              </ul>
            </div>

            <div className="bg-[#FDF9EF] border border-[#EDE0BE] rounded-2xl p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-[#8C5B0A] font-bold text-sm">
                <FlaskConical className="w-4 h-4" />
                <h3>{t('chemicalGuidance')}</h3>
              </div>
              <p className="text-sm text-[#5C4B2A] leading-relaxed">
                {report.treatment?.chemicalGuidance ||
                  'Consult a licensed local agronomist or KVK office for region-approved treatments and exact label dosages.'}
              </p>
            </div>

            <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-[#132A1E] font-bold text-sm">
                <Droplets className="w-4 h-4 text-[#1B6B3A]" />
                <h3>{t('irrigationAdvice')}</h3>
              </div>
              <p className="text-sm text-[#31473B] leading-relaxed">
                {report.treatment?.irrigationRecommendations ||
                  'Irrigate at the base of the plant during morning hours and ensure proper drainage.'}
              </p>
            </div>

            <div className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-[#132A1E] font-bold text-sm">
                <Sprout className="w-4 h-4 text-[#1B6B3A]" />
                <h3>{t('soilManagement')}</h3>
              </div>
              <p className="text-sm text-[#31473B] leading-relaxed">
                {report.treatment?.soilCropManagement ||
                  'Maintain balanced organic compost, clean field weeds, and rotate crops seasonally.'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
