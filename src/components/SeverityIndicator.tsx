import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface SeverityIndicatorProps {
  severity: string;
  isHealthy?: boolean;
  isUnclear?: boolean;
  size?: 'sm' | 'md';
}

export function SeverityIndicator({
  severity,
  isHealthy,
  isUnclear,
  size = 'md',
}: SeverityIndicatorProps) {
  const { t } = useAuth();

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  if (isUnclear) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold text-[#8C5B0A] ${textSize}`}>
        <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{t('unclearTitle')}</span>
      </span>
    );
  }

  if (isHealthy || severity === 'None') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold text-[#15803D] ${textSize}`}>
        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{t('severityNone')}</span>
      </span>
    );
  }

  if (severity === 'High') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold text-[#C83232] ${textSize}`}>
        <AlertOctagon className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{t('severityHigh')}</span>
      </span>
    );
  }

  if (severity === 'Medium') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold text-[#B45309] ${textSize}`}>
        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{t('severityMedium')}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold text-[#15803D] ${textSize}`}>
      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{t('severityLow')}</span>
    </span>
  );
}
