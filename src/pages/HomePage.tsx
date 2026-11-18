import {
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  FileDown,
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { SUPPORTED_CROPS } from '../i18n/translations.ts';
import type { AppRoute } from '../types/index.ts';

interface HomePageProps {
  onNavigate: (route: AppRoute, options?: { cropFilter?: string; authTab?: 'login' | 'register' | 'admin' }) => void;
}

const IMAGES = {
  hero: '/src/assets/images/hero_farmland_sunrise_1795014715488.jpg',
  leafScan: '/src/assets/images/ai_leaf_scan_visual_1795014714990.jpg',
  farmer: '/src/assets/images/farmer_field_portrait_1795014714590.jpg',
  crops: '/src/assets/images/crop_library_showcase_1795014713812.jpg',
};

function ResilientImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-[#1B6B3A]/20 via-[#EEF5EE] to-[#C98A1C]/20 flex flex-col items-center justify-center p-6 text-center`}
      >
        <Sprout className="w-10 h-10 text-[#1B6B3A] mb-2" />
        <span className="text-sm font-medium text-[#132A1E]">{alt}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { user, t } = useAuth();

  const handleStartDetect = () => {
    onNavigate(user ? 'detect' : 'auth');
  };

  return (
    <div className="bg-[#F6FAF6]">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-[#132A1E]">
        <div className="absolute inset-0">
          <ResilientImage
            src={IMAGES.hero}
            alt="Sunrise over lush green Indian farmland"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C2115]/90 via-[#0C2115]/70 to-[#0C2115]/30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl space-y-6">
            <p className="text-sm font-medium text-[#F4D38B] tracking-wide">
              AI Plant Pathology · English · ಕನ್ನಡ · हिन्दी
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-white leading-[1.1] tracking-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-base sm:text-lg text-[#E6F1E8] leading-relaxed max-w-xl">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleStartDetect}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-[#1B6B3A] hover:bg-[#15552E] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
              >
                <Camera className="w-4 h-4" aria-hidden="true" />
                <span>{t('heroCtaPrimary')}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-white/12 hover:bg-white/20 border border-white/25 rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                <span>{t('heroCtaSecondary')}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works (Split-column balanced section with Leaf Inspection photo) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#132A1E] tracking-tight">
                {t('howItWorksTitle')}
              </h2>
              <p className="text-base text-[#4A5D52] leading-relaxed">
                {t('howItWorksSubtitle')}
              </p>
            </div>

            <div className="divide-y divide-[#DCE7DC] border-t border-b border-[#DCE7DC]">
              <div className="py-5 space-y-1.5">
                <h3 className="text-lg font-semibold text-[#132A1E]">
                  {t('step1Title')}
                </h3>
                <p className="text-sm text-[#4A5D52] leading-relaxed">
                  {t('step1Desc')}
                </p>
              </div>
              <div className="py-5 space-y-1.5">
                <h3 className="text-lg font-semibold text-[#132A1E]">
                  {t('step2Title')}
                </h3>
                <p className="text-sm text-[#4A5D52] leading-relaxed">
                  {t('step2Desc')}
                </p>
              </div>
              <div className="py-5 space-y-1.5">
                <h3 className="text-lg font-semibold text-[#132A1E]">
                  {t('step3Title')}
                </h3>
                <p className="text-sm text-[#4A5D52] leading-relaxed">
                  {t('step3Desc')}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[320px] rounded-2xl overflow-hidden border border-[#DCE7DC] bg-white">
              <ResilientImage
                src={IMAGES.leafScan}
                alt="Farmer examining a fresh crop leaf in natural daylight"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Features Asymmetric Bento Grid */}
      <section id="features" className="bg-white border-y border-[#DCE7DC] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#132A1E] tracking-tight">
              {t('featuresTitle')}
            </h2>
            <p className="text-base text-[#4A5D52] leading-relaxed">
              {t('featuresSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 bg-[#F6FAF6] border border-[#DCE7DC] rounded-2xl p-7 flex flex-col justify-between gap-6">
              <div className="w-11 h-11 rounded-xl bg-[#1B6B3A] text-white flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#132A1E]">
                  {t('feature1Title')}
                </h3>
                <p className="text-sm sm:text-base text-[#4A5D52] leading-relaxed">
                  {t('feature1Desc')}
                </p>
              </div>
            </div>

            <div className="md:col-span-5 bg-[#FDF9EF] border border-[#EDE0BE] rounded-2xl p-7 flex flex-col justify-between gap-6">
              <div className="w-11 h-11 rounded-xl bg-[#C98A1C] text-white flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#132A1E]">
                  {t('feature2Title')}
                </h3>
                <p className="text-sm sm:text-base text-[#5C4B2A] leading-relaxed">
                  {t('feature2Desc')}
                </p>
              </div>
            </div>

            <div className="md:col-span-5 bg-white border border-[#DCE7DC] rounded-2xl p-7 flex flex-col justify-between gap-6">
              <div className="w-11 h-11 rounded-xl bg-[#EEF5EE] text-[#1B6B3A] flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#132A1E]">
                  {t('feature3Title')}
                </h3>
                <p className="text-sm sm:text-base text-[#4A5D52] leading-relaxed">
                  {t('feature3Desc')}
                </p>
              </div>
            </div>

            <div className="md:col-span-7 bg-[#132A1E] text-white rounded-2xl p-7 flex flex-col justify-between gap-6">
              <div className="w-11 h-11 rounded-xl bg-white/15 text-[#F4D38B] flex items-center justify-center">
                <FileDown className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  {t('feature4Title')}
                </h3>
                <p className="text-sm sm:text-base text-[#D7E6DB] leading-relaxed">
                  {t('feature4Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Supported Crops Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#132A1E] tracking-tight">
              {t('supportedCropsTitle')}
            </h2>
            <p className="text-base text-[#4A5D52]">
              {t('supportedCropsSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('library')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B6B3A] hover:text-[#15552E] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{t('navLibrary')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden border border-[#DCE7DC] bg-white">
          <div className="aspect-[21/8] w-full overflow-hidden">
            <ResilientImage
              src={IMAGES.crops}
              alt="Fresh Indian agricultural crops including tomato, rice, potato, chilli, wheat, cotton, maize and groundnut"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {SUPPORTED_CROPS.map((crop) => (
              <button
                key={crop}
                type="button"
                onClick={() => onNavigate('library', { cropFilter: crop })}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#F6FAF6] hover:bg-[#EEF5EE] border border-[#DCE7DC] text-sm font-semibold text-[#132A1E] transition-colors cursor-pointer"
              >
                <span>{crop}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#1B6B3A]" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Benefits for Farmers & About Us */}
      <section id="about-us" className="bg-white border-t border-[#DCE7DC] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-5">
            <div className="h-full min-h-[320px] rounded-2xl overflow-hidden border border-[#DCE7DC]">
              <ResilientImage
                src={IMAGES.farmer}
                alt="Farmer inspecting healthy tomato and chilli plants in morning sunlight"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#132A1E] tracking-tight">
                {t('benefitsTitle')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                <div className="space-y-1.5">
                  <CheckCircle2 className="w-5 h-5 text-[#1B6B3A]" />
                  <h3 className="text-base font-semibold text-[#132A1E]">
                    {t('benefit1Title')}
                  </h3>
                  <p className="text-sm text-[#4A5D52] leading-relaxed">
                    {t('benefit1Desc')}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <CheckCircle2 className="w-5 h-5 text-[#1B6B3A]" />
                  <h3 className="text-base font-semibold text-[#132A1E]">
                    {t('benefit2Title')}
                  </h3>
                  <p className="text-sm text-[#4A5D52] leading-relaxed">
                    {t('benefit2Desc')}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <CheckCircle2 className="w-5 h-5 text-[#1B6B3A]" />
                  <h3 className="text-base font-semibold text-[#132A1E]">
                    {t('benefit3Title')}
                  </h3>
                  <p className="text-sm text-[#4A5D52] leading-relaxed">
                    {t('benefit3Desc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#DCE7DC] space-y-3">
              <h3 className="text-xl font-bold text-[#132A1E]">{t('aboutTitle')}</h3>
              <p className="text-sm sm:text-base text-[#4A5D52] leading-relaxed">
                {t('aboutText')}
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleStartDetect}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#15552E] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t('heroCtaPrimary')}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('tips')}
                  className="px-5 py-2.5 text-sm font-semibold text-[#132A1E] bg-[#EEF5EE] hover:bg-[#E1EDE1] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t('navTips')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Quiet Footer */}
      <footer className="bg-[#132A1E] text-[#D7E6DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-lg">
              <span className="w-8 h-8 rounded-lg bg-[#1B6B3A] flex items-center justify-center">
                <Sprout className="w-4 h-4" />
              </span>
              <span>{t('brand')}</span>
            </div>
            <p className="text-sm text-[#B7CDBE] leading-relaxed max-w-md">
              {t('footerRights')}
            </p>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-sm font-semibold text-white">Navigation</h4>
            <div className="flex flex-col space-y-2 text-sm">
              <button
                type="button"
                onClick={handleStartDetect}
                className="text-left hover:text-white transition-colors cursor-pointer"
              >
                {t('navDetect')}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="text-left hover:text-white transition-colors cursor-pointer"
              >
                {t('navLibrary')}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('tips')}
                className="text-left hover:text-white transition-colors cursor-pointer"
              >
                {t('navTips')}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('auth', { authTab: 'admin' })}
                className="text-left inline-flex items-center gap-1.5 text-[#F4D38B] hover:text-white transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('navAdmin')}</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <h4 className="text-sm font-semibold text-white">{t('footerContactTitle')}</h4>
            <div className="space-y-2 text-sm text-[#B7CDBE]">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F4D38B] shrink-0" />
                <span>Kisan Call Centre (India Toll-Free): 1800-180-1551</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F4D38B] shrink-0" />
                <span>support@agricare-ai.org</span>
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs text-[#9BB4A3] flex flex-wrap items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} AgriCare AI</span>
            <span>English · ಕನ್ನಡ · हिन्दी</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
