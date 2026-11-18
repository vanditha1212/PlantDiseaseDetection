export type LanguageCode = 'en' | 'kn' | 'hi';

export type AppRoute =
  | 'home'
  | 'auth'
  | 'dashboard'
  | 'detect'
  | 'report-detail'
  | 'reports'
  | 'library'
  | 'tips'
  | 'profile'
  | 'admin';

export interface UserProfile {
  id: number;
  uid: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  state: string;
  district: string;
  preferredLanguage: LanguageCode;
  role: 'farmer' | 'admin';
  createdAt: string;
}

export interface TreatmentDetails {
  unclearReason?: string;
  immediateActions?: string[];
  recommendedTreatment?: string[];
  preventiveMeasures?: string[];
  recoveryInstructions?: string[];
  organicOptions?: string[];
  chemicalGuidance?: string;
  irrigationRecommendations?: string;
  soilCropManagement?: string;
  expertDisclaimer?: string;
}

export interface DiseaseReport {
  id: number;
  farmerId: number;
  cropName: string;
  imagePath: string;
  detectedDisease: string;
  scientificName: string;
  isHealthy: boolean;
  isUnclear: boolean;
  confidenceEstimate: number;
  severity: 'Low' | 'Medium' | 'High' | 'None';
  symptoms: string[];
  possibleCauses: string[];
  diseaseSpread: string;
  treatment: TreatmentDetails;
  locationDistrict: string;
  growthStage: string;
  additionalSymptoms: string;
  selectedLanguage: LanguageCode;
  savedByFarmer: boolean;
  createdAt: string;
}

export interface DiseaseLibraryItem {
  id: number;
  diseaseName: string;
  scientificName: string;
  affectedCrop: string;
  severityDefault: string;
  symptoms: string;
  causes: string;
  preventionMethods: string;
  treatmentApproaches: string;
  createdAt: string;
}

export interface FarmingTip {
  id: number;
  title: string;
  category: string;
  summary: string;
  content: string;
  season: string;
  createdAt: string;
}

export interface DashboardStats {
  totalAnalyses: number;
  healthyCount: number;
  diseaseCount: number;
}

export interface AdminReportRow {
  id: number;
  farmerId: number;
  farmerName: string;
  farmerEmail: string;
  farmerDistrict: string;
  cropName: string;
  imagePath: string;
  detectedDisease: string;
  scientificName: string;
  isHealthy: boolean;
  isUnclear: boolean;
  confidenceEstimate: number;
  severity: string;
  selectedLanguage: string;
  createdAt: string;
}

export interface AdminDashboardData {
  totals: {
    registeredFarmers: number;
    totalUsers: number;
    totalAnalyses: number;
    healthyDetected: number;
    diseaseCases: number;
    libraryEntries: number;
  };
  topDiseases: { name: string; count: number }[];
  cropAnalysis: { crop: string; count: number }[];
  recentActivities: {
    id: string;
    type: 'analysis' | 'registration';
    actor: string;
    detail: string;
    severity: string;
    timestamp: string;
  }[];
}
