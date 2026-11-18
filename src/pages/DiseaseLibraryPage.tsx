import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { SeverityIndicator } from '../components/SeverityIndicator.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { SUPPORTED_CROPS } from '../i18n/translations.ts';
import { api } from '../services/api.ts';
import type { DiseaseLibraryItem } from '../types/index.ts';

interface DiseaseLibraryPageProps {
  initialCrop?: string;
}

export function DiseaseLibraryPage({ initialCrop = 'All' }: DiseaseLibraryPageProps) {
  const { t } = useAuth();
  const [items, setItems] = useState<DiseaseLibraryItem[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>(initialCrop);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCrop(initialCrop);
  }, [initialCrop]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      api
        .getLibrary(search, selectedCrop)
        .then((res) => {
          if (!active) return;
          setItems(res.items);
          if (res.items.length > 0 && expandedId === null) {
            setExpandedId(res.items[0].id);
          }
        })
        .catch((err: unknown) => {
          if (active) {
            setError(
              err instanceof Error ? err.message : 'Unable to load disease library.'
            );
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, selectedCrop]);

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#132A1E] tracking-tight">
          {t('libraryTitle')}
        </h1>
        <p className="text-sm text-[#4A5D52]">{t('librarySubtitle')}</p>
      </div>

      {/* Search + 10-Crop Filter Bar */}
      <div className="space-y-3">
        <div className="relative max-w-lg">
          <Search className="w-4 h-4 text-[#4A5D52] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE7DC] bg-white text-sm text-[#132A1E] focus:border-[#1B6B3A] outline-none"
          />
        </div>

        <div
          role="group"
          aria-label="Filter diseases by crop"
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            onClick={() => setSelectedCrop('All')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
              selectedCrop === 'All'
                ? 'bg-[#1B6B3A] text-white border-[#1B6B3A]'
                : 'bg-white text-[#31473B] border-[#DCE7DC] hover:bg-[#EEF5EE]'
            }`}
          >
            {t('allCrops')}
          </button>
          {SUPPORTED_CROPS.map((crop) => (
            <button
              key={crop}
              type="button"
              onClick={() => setSelectedCrop(crop)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                selectedCrop === crop
                  ? 'bg-[#1B6B3A] text-white border-[#1B6B3A]'
                  : 'bg-white text-[#31473B] border-[#DCE7DC] hover:bg-[#EEF5EE]'
              }`}
            >
              {crop}
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
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-white border border-[#DCE7DC] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#DCE7DC] rounded-2xl p-12 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-[#4A5D52] mx-auto" />
          <p className="text-base font-semibold text-[#132A1E]">
            No matching crop diseases found.
          </p>
          <p className="text-sm text-[#4A5D52]">
            Try selecting All Crops or searching by a symptom like &ldquo;blight&rdquo;, &ldquo;rust&rdquo;, or &ldquo;curl&rdquo;.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isOpen = expandedId === item.id;
            return (
              <article
                key={item.id}
                className="bg-white border border-[#DCE7DC] rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : item.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 hover:bg-[#F6FAF6]/70 transition-colors cursor-pointer"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A5D52]">
                      <span className="font-semibold text-[#1B6B3A]">
                        {item.affectedCrop}
                      </span>
                      {item.scientificName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="italic">{item.scientificName}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <SeverityIndicator severity={item.severityDefault} size="sm" />
                    </div>
                    <h2 className="text-lg font-bold text-[#132A1E]">
                      {item.diseaseName}
                    </h2>
                    {!isOpen && (
                      <p className="text-sm text-[#4A5D52] line-clamp-2">
                        {item.symptoms}
                      </p>
                    )}
                  </div>
                  <span className="p-1.5 rounded-lg text-[#4A5D52] shrink-0 mt-1">
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-[#EEF5EE] grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold text-[#1B6B3A] tracking-wide">
                        Symptoms
                      </h3>
                      <p className="text-sm text-[#31473B] leading-relaxed">
                        {item.symptoms}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold text-[#1B6B3A] tracking-wide">
                        Causes &amp; Conditions
                      </h3>
                      <p className="text-sm text-[#31473B] leading-relaxed">
                        {item.causes}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold text-[#1B6B3A] tracking-wide">
                        Prevention Methods
                      </h3>
                      <p className="text-sm text-[#31473B] leading-relaxed">
                        {item.preventionMethods}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold text-[#1B6B3A] tracking-wide">
                        Treatment Approaches
                      </h3>
                      <p className="text-sm text-[#31473B] leading-relaxed">
                        {item.treatmentApproaches}
                      </p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
