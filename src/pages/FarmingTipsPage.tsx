import { AlertCircle, Search, Wheat } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { TIP_CATEGORIES } from '../i18n/translations.ts';
import { api } from '../services/api.ts';
import type { FarmingTip } from '../types/index.ts';

export function FarmingTipsPage() {
  const { t } = useAuth();
  const [tips, setTips] = useState<FarmingTip[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      api
        .getTips(selectedCategory, search)
        .then((res) => {
          if (active) setTips(res.tips);
        })
        .catch((err: unknown) => {
          if (active) {
            setError(err instanceof Error ? err.message : 'Unable to load farming tips.');
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
  }, [selectedCategory, search]);

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#132A1E] tracking-tight">
          {t('tipsTitle')}
        </h1>
        <p className="text-sm text-[#4A5D52]">{t('tipsSubtitle')}</p>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3">
        <div className="relative max-w-lg">
          <Search className="w-4 h-4 text-[#4A5D52] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search irrigation, mulching, soil testing, neem..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE7DC] bg-white text-sm text-[#132A1E] focus:border-[#1B6B3A] outline-none"
          />
        </div>

        <div
          role="group"
          aria-label="Filter farming tips by category"
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-[#1B6B3A] text-white border-[#1B6B3A]'
                : 'bg-white text-[#31473B] border-[#DCE7DC] hover:bg-[#EEF5EE]'
            }`}
          >
            {t('allCategories')}
          </button>
          {TIP_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === category
                  ? 'bg-[#1B6B3A] text-white border-[#1B6B3A]'
                  : 'bg-white text-[#31473B] border-[#DCE7DC] hover:bg-[#EEF5EE]'
              }`}
            >
              {category}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 bg-white border border-[#DCE7DC] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : tips.length === 0 ? (
        <div className="bg-white border border-[#DCE7DC] rounded-2xl p-12 text-center space-y-2">
          <Wheat className="w-8 h-8 text-[#4A5D52] mx-auto" />
          <p className="text-base font-semibold text-[#132A1E]">
            No farming tips match your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tips.map((tip) => (
            <article
              key={tip.id}
              className="bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-[#4A5D52]">
                  <span className="font-semibold text-[#1B6B3A]">{tip.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{tip.season}</span>
                </div>
                <h2 className="text-lg font-bold text-[#132A1E]">{tip.title}</h2>
                <p className="text-sm font-medium text-[#31473B]">{tip.summary}</p>
                <p className="text-sm text-[#4A5D52] leading-relaxed pt-1 border-t border-[#EEF5EE]">
                  {tip.content}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
