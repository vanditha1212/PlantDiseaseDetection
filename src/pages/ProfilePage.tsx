import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { LanguageCode } from '../types/index.ts';

export function ProfilePage() {
  const { user, updateUserProfile, t } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '');
  const [stateName, setStateName] = useState(user?.state || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(
    user?.preferredLanguage || 'en'
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateUserProfile({
        fullName,
        mobileNumber,
        state: stateName,
        district,
        preferredLanguage,
      });
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#132A1E] tracking-tight">
          {t('sidebarProfile')}
        </h1>
        <p className="text-sm text-[#4A5D52] mt-1">
          Keep your location and preferred language updated for faster crop inspections.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#DCE7DC] rounded-2xl p-6 sm:p-8 space-y-5"
      >
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#EEF5EE] border border-[#DCE7DC] text-sm font-medium text-[#1B6B3A]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{t('profileSaved')}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
              {t('fullName')}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
              {t('email')}
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#EEF5EE]/70 text-sm text-[#4A5D52] cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
              {t('mobileNumber')}
            </label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
              {t('preferredLanguage')}
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
            >
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
              {t('state')}
            </label>
            <input
              type="text"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              placeholder="Karnataka"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
              {t('district')}
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Mandya"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1B6B3A] hover:bg-[#15552E] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{t('saveProfile')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
