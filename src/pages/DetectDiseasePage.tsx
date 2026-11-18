import {
  AlertCircle,
  Camera,
  Loader2,
  RefreshCw,
  ScanSearch,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { SUPPORTED_CROPS } from '../i18n/translations.ts';
import { api } from '../services/api.ts';
import type { DiseaseReport, LanguageCode } from '../types/index.ts';

interface DetectDiseasePageProps {
  onReportReady: (report: DiseaseReport) => void;
}

const GROWTH_STAGES = [
  'Seedling / Nursery',
  'Vegetative Growth',
  'Flowering',
  'Fruiting / Pod Filling',
  'Maturity / Pre-Harvest',
];

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export function DetectDiseasePage({ onReportReady }: DetectDiseasePageProps) {
  const { user, token, language, t } = useAuth();

  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Form fields
  const [cropName, setCropName] = useState('');
  const [customCrop, setCustomCrop] = useState('');
  const [locationDistrict, setLocationDistrict] = useState(user?.district || '');
  const [growthStage, setGrowthStage] = useState('Vegetative Growth');
  const [additionalSymptoms, setAdditionalSymptoms] = useState('');
  const [reportLanguage, setReportLanguage] = useState<LanguageCode>(language);

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReportLanguage(language);
  }, [language]);

  // Cleanup camera stream & preview URL on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera access is not supported in this browser. Please switch to Upload Image.'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 60);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to access device camera. Please allow camera permission or upload an image.';
      setCameraError(msg);
    }
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('Could not capture photo from camera stream.');
          return;
        }
        const capturedFile = new File([blob], `captured_plant_${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        applySelectedFile(capturedFile);
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  };

  const applySelectedFile = (file: File) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError('Please select a valid JPG, JPEG, or PNG plant image.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Image file size must be 8 MB or smaller.');
      return;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applySelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) applySelectedFile(file);
  };

  const handleRemoveImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please upload or capture a plant photograph before analyzing.');
      return;
    }
    if (!token) {
      setError('Please sign in to analyze plant photographs.');
      return;
    }

    setError(null);
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const effectiveCrop = cropName === '__other__' ? customCrop.trim() : cropName;
      if (effectiveCrop) formData.append('cropName', effectiveCrop);
      if (locationDistrict.trim())
        formData.append('locationDistrict', locationDistrict.trim());
      if (growthStage) formData.append('growthStage', growthStage);
      if (additionalSymptoms.trim())
        formData.append('additionalSymptoms', additionalSymptoms.trim());
      formData.append('language', reportLanguage);

      const { report } = await api.analyzePlant(token, formData);
      onReportReady(report);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'AI plant analysis could not be completed. Please try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#132A1E] tracking-tight">
          {t('detectTitle')}
        </h1>
        <p className="text-sm text-[#4A5D52] mt-1">{t('detectSubtitle')}</p>
      </div>

      {analyzing ? (
        <div className="bg-white border border-[#DCE7DC] rounded-2xl p-10 sm:p-14 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF5EE] text-[#1B6B3A] mx-auto flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Plant being analyzed"
              className="w-44 h-36 object-cover rounded-xl mx-auto border border-[#DCE7DC]"
            />
          )}
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-[#132A1E]">
              {t('analyzingMessage')}
            </h2>
            <p className="text-sm text-[#4A5D52]">{t('analyzingSubtext')}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleAnalyze} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image Upload & Camera Capture */}
          <div className="lg:col-span-6 bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-5">
            {/* Method Switcher */}
            <div className="flex items-center gap-1 p-1 bg-[#EEF5EE] rounded-xl border border-[#DCE7DC]">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setMode('upload');
                  setCameraError(null);
                }}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  mode === 'upload'
                    ? 'bg-white text-[#132A1E] shadow-xs'
                    : 'text-[#4A5D52] hover:text-[#132A1E]'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>{t('tabUpload')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('camera');
                  setCameraError(null);
                }}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  mode === 'camera'
                    ? 'bg-white text-[#132A1E] shadow-xs'
                    : 'text-[#4A5D52] hover:text-[#132A1E]'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{t('tabCamera')}</span>
              </button>
            </div>

            {/* Image Preview (shared for uploaded or captured photo) */}
            {previewUrl ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-[#DCE7DC] bg-[#F6FAF6]">
                  <img
                    src={previewUrl}
                    alt="Selected plant leaf preview"
                    className="w-full max-h-80 object-contain bg-[#132A1E]/5"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A5D52]">
                  <span className="truncate font-medium text-[#132A1E]">
                    {selectedFile?.name} (
                    {selectedFile ? (selectedFile.size / 1024).toFixed(0) : 0} KB)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (mode === 'upload') {
                          fileInputRef.current?.click();
                        } else {
                          handleRemoveImage();
                          startCamera();
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF5EE] hover:bg-[#DCE7DC] text-[#132A1E] font-semibold cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t('replaceImage')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('removeImage')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : mode === 'upload' ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                }}
                className="border-2 border-dashed border-[#BBD0BE] hover:border-[#1B6B3A] rounded-xl p-10 text-center bg-[#F6FAF6]/70 hover:bg-[#EEF5EE]/60 transition-colors cursor-pointer space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-[#DCE7DC] text-[#1B6B3A] mx-auto flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#132A1E]">
                    {t('dropzoneHint')}
                  </p>
                  <p className="text-xs text-[#4A5D52]">{t('dropzoneFormats')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {cameraError && (
                  <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {cameraActive ? (
                  <div className="space-y-3">
                    <div className="rounded-xl overflow-hidden bg-black border border-[#DCE7DC]">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-h-80 object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={captureFromCamera}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1B6B3A] hover:bg-[#15552E] text-white text-sm font-semibold cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{t('capturePhoto')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#DCE7DC] text-sm font-semibold text-[#31473B] hover:bg-[#F6FAF6] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>{t('stopCamera')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#BBD0BE] rounded-xl p-10 text-center bg-[#F6FAF6]/70 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#DCE7DC] text-[#1B6B3A] mx-auto flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-[#4A5D52] max-w-xs mx-auto">
                      Hold the affected leaf steadily in clear natural daylight before capturing.
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B6B3A] hover:bg-[#15552E] text-white text-sm font-semibold cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{t('openCamera')}</span>
                    </button>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="p-3.5 rounded-xl bg-[#F6FAF6] border border-[#DCE7DC] text-xs text-[#4A5D52] leading-relaxed">
              <strong className="text-[#132A1E]">Photo Tip:</strong> Focus closely on 1–2 affected leaves in bright daylight. If the image is blurry or too dark, AgriCare AI will request a clearer photo instead of guessing.
            </div>
          </div>

          {/* Right Column: Crop Context & Submit */}
          <div className="lg:col-span-6 bg-white border border-[#DCE7DC] rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                    {t('cropLabel')}
                  </label>
                  <select
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                  >
                    <option value="">Auto-detect from image</option>
                    {SUPPORTED_CROPS.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                    <option value="__other__">Other crop...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                    {t('languageLabel')}
                  </label>
                  <select
                    value={reportLanguage}
                    onChange={(e) => setReportLanguage(e.target.value as LanguageCode)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                  >
                    <option value="en">English</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </div>
              </div>

              {cropName === '__other__' && (
                <div>
                  <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                    Specify Crop Name
                  </label>
                  <input
                    type="text"
                    value={customCrop}
                    onChange={(e) => setCustomCrop(e.target.value)}
                    placeholder="e.g., Brinjal, Onion, Papaya, Ginger"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                    {t('districtLabel')}
                  </label>
                  <input
                    type="text"
                    value={locationDistrict}
                    onChange={(e) => setLocationDistrict(e.target.value)}
                    placeholder={t('districtPlaceholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                    {t('stageLabel')}
                  </label>
                  <select
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none"
                  >
                    {GROWTH_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#31473B] mb-1.5">
                  {t('symptomsLabel')}
                </label>
                <textarea
                  rows={4}
                  value={additionalSymptoms}
                  onChange={(e) => setAdditionalSymptoms(e.target.value)}
                  placeholder={t('symptomsPlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DC] bg-[#F6FAF6]/60 text-sm text-[#132A1E] focus:bg-white focus:border-[#1B6B3A] outline-none resize-none"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={!selectedFile || analyzing}
                className="w-full py-3.5 px-6 rounded-xl bg-[#1B6B3A] hover:bg-[#15552E] disabled:bg-[#9BB4A3] text-white text-base font-semibold transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <ScanSearch className="w-5 h-5" />
                <span>{t('analyzeBtn')}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
