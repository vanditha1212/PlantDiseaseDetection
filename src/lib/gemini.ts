import { GoogleGenAI, Type } from '@google/genai';

export interface PlantAnalysisInput {
  imageBase64: string;
  mimeType: string;
  cropName?: string;
  locationDistrict?: string;
  growthStage?: string;
  additionalSymptoms?: string;
  language: 'en' | 'kn' | 'hi';
}

export interface PlantAnalysisResult {
  isUnclear: boolean;
  unclearReason: string;
  isHealthy: boolean;
  cropName: string;
  detectedDisease: string;
  scientificName: string;
  confidenceEstimate: number;
  severity: 'Low' | 'Medium' | 'High' | 'None';
  symptoms: string[];
  possibleCauses: string[];
  diseaseSpread: string;
  immediateActions: string[];
  recommendedTreatment: string[];
  preventiveMeasures: string[];
  recoveryInstructions: string[];
  organicOptions: string[];
  chemicalGuidance: string;
  irrigationRecommendations: string;
  soilCropManagement: string;
  expertDisclaimer: string;
}

const LANGUAGE_LABELS: Record<'en' | 'kn' | 'hi', string> = {
  en: 'English (simple, clear farmer-friendly English)',
  kn: 'Kannada (ಕನ್ನಡ — simple, clear, practical agricultural Kannada script)',
  hi: 'Hindi (हिन्दी — simple, clear, practical agricultural Hindi Devanagari script)',
};

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function analyzePlantImage(
  input: PlantAnalysisInput
): Promise<PlantAnalysisResult> {
  const ai = getGeminiClient();
  const targetLang = LANGUAGE_LABELS[input.language] || LANGUAGE_LABELS.en;

  const systemInstruction = `You are AgriCare AI, an expert agricultural plant pathologist and farmer advisory specialist.
Your role is to visually inspect uploaded plant photographs and provide accurate, practical, responsible plant health analysis.

CRITICAL RELIABILITY & SAFETY RULES:
1. IMAGE CLARITY CHECK: If the uploaded image is NOT a plant/leaf/crop, OR is too blurry, dark, distant, or unclear to make a reliable visual observation, you MUST set "isUnclear": true, set "confidenceEstimate" between 0 and 30, set "severity": "None", and provide a helpful explanation in "unclearReason" requesting a clearer, well-lit close-up photo of the affected leaf/plant. Never fabricate a confident diagnosis on an unclear or non-plant image.
2. HEALTHY PLANT CHECK: If the plant clearly appears healthy with no visible disease lesions, spots, wilting, or pest injury, set "isHealthy": true, "severity": "None", and provide routine preventive care advice.
3. NEVER FABRICATE CHEMICAL DOSAGES OR FAKE PESTICIDES: Never invent pesticide brand names, specific chemical mixing ratios/dosages, or unverified safety instructions. In "chemicalGuidance", only discuss general safe agricultural fungicide/bactericide categories when agronomically appropriate, and explicitly advise the farmer to confirm exact approved products and label dosages with a local agricultural extension officer or Krishi Vigyan Kendra (KVK).
4. SCIENTIFIC ACCURACY: Only provide a "scientificName" if it is a verified pathogen name (e.g., Alternaria solani, Phytophthora infestans, Magnaporthe oryzae). Leave empty string "" if healthy, unclear, or uncertain.
5. MULTILINGUAL OUTPUT: Write ALL human-readable fields strictly in ${targetLang}. Keep ONLY the "severity" field as one of the exact English enum strings: "Low", "Medium", "High", or "None". Keep "scientificName" in standard Latin binomial nomenclature.
6. PRACTICALITY: Use plain, respectful, easy-to-follow steps that a smallholder farmer can apply immediately in the field.`;

  const contextLines = [
    `Selected response language: ${targetLang}`,
    input.cropName ? `Farmer-indicated crop: ${input.cropName}` : 'Farmer-indicated crop: Not specified (identify from photo)',
    input.locationDistrict ? `Location/District: ${input.locationDistrict}` : null,
    input.growthStage ? `Plant growth stage: ${input.growthStage}` : null,
    input.additionalSymptoms ? `Additional farmer notes/symptoms: ${input.additionalSymptoms}` : null,
    'Inspect the photograph carefully and return the structured JSON assessment.',
  ]
    .filter(Boolean)
    .join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: input.mimeType,
            data: input.imageBase64,
          },
        },
        {
          text: contextLines,
        },
      ],
    },
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isUnclear: {
            type: Type.BOOLEAN,
            description: 'True if the photo is blurry, dark, not a plant, or lacks visual detail for reliable assessment.',
          },
          unclearReason: {
            type: Type.STRING,
            description: 'If isUnclear is true, clear instructions in target language asking for a clearer photo. Otherwise empty string.',
          },
          isHealthy: {
            type: Type.BOOLEAN,
            description: 'True if the plant shows no visible signs of disease.',
          },
          cropName: {
            type: Type.STRING,
            description: 'Identified crop name in the target language.',
          },
          detectedDisease: {
            type: Type.STRING,
            description: 'Detected disease name (or Healthy Plant / Unclear Image) in the target language.',
          },
          scientificName: {
            type: Type.STRING,
            description: 'Verified Latin scientific name of the pathogen if applicable, else empty string.',
          },
          confidenceEstimate: {
            type: Type.INTEGER,
            description: 'Estimated visual confidence score from 0 to 100.',
          },
          severity: {
            type: Type.STRING,
            description: 'Must be exactly one of: Low, Medium, High, None.',
          },
          symptoms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of visible symptoms observed on the plant in target language.',
          },
          possibleCauses: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Likely biological or environmental causes in target language.',
          },
          diseaseSpread: {
            type: Type.STRING,
            description: 'How this disease spreads between plants in target language.',
          },
          immediateActions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Step-by-step immediate field actions to contain the problem.',
          },
          recommendedTreatment: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Recommended evidence-based treatment steps.',
          },
          preventiveMeasures: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Long-term preventive measures for current and next season.',
          },
          recoveryInstructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Plant recovery and monitoring steps over the next 2 to 3 weeks.',
          },
          organicOptions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Verified organic or biological management approaches where applicable.',
          },
          chemicalGuidance: {
            type: Type.STRING,
            description: 'Safe general chemical management guidance without fabricating specific dosages; advise consulting a local agronomist.',
          },
          irrigationRecommendations: {
            type: Type.STRING,
            description: 'Practical watering and moisture management guidance.',
          },
          soilCropManagement: {
            type: Type.STRING,
            description: 'Soil health, spacing, sanitation, and crop rotation guidance.',
          },
          expertDisclaimer: {
            type: Type.STRING,
            description: 'Clear warning in the target language that AI results are preliminary and should be verified by local agricultural experts.',
          },
        },
        required: [
          'isUnclear',
          'unclearReason',
          'isHealthy',
          'cropName',
          'detectedDisease',
          'scientificName',
          'confidenceEstimate',
          'severity',
          'symptoms',
          'possibleCauses',
          'diseaseSpread',
          'immediateActions',
          'recommendedTreatment',
          'preventiveMeasures',
          'recoveryInstructions',
          'organicOptions',
          'chemicalGuidance',
          'irrigationRecommendations',
          'soilCropManagement',
          'expertDisclaimer',
        ],
      },
    },
  });

  const rawText = (response.text ?? '').trim();
  if (!rawText) {
    throw new Error('Gemini returned an empty response. Please try again.');
  }

  const parsed = JSON.parse(rawText) as PlantAnalysisResult;

  // Normalize severity to allowed values
  const allowedSeverities = ['Low', 'Medium', 'High', 'None'] as const;
  const normalizedSeverity = allowedSeverities.includes(parsed.severity)
    ? parsed.severity
    : parsed.isHealthy || parsed.isUnclear
      ? 'None'
      : 'Medium';

  return {
    ...parsed,
    severity: normalizedSeverity,
    confidenceEstimate: Math.max(0, Math.min(100, Math.round(Number(parsed.confidenceEstimate) || 0))),
  };
}
