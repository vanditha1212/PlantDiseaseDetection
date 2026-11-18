import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  createDiseaseLibraryItem,
  createDiseaseReport,
  createFarmerUser,
  createFarmingTipItem,
  deleteDiseaseLibraryItem,
  deleteFarmingTipItem,
  deleteReportById,
  deleteUserById,
  findAdminByEmail,
  findUserByEmail,
  getAdminDashboardStats,
  getAllAdminReports,
  getAllUsersForAdmin,
  getDiseaseLibraryItems,
  getFarmerReports,
  getFarmingTipsItems,
  getReportById,
  toSafeUser,
  updateDiseaseLibraryItem,
  updateReportSavedFlag,
  updateUserProfile,
} from './src/db/queries.ts';
import { ensureReferenceDataSeeded } from './src/db/seedData.ts';
import { analyzePlantImage } from './src/lib/gemini.ts';
import {
  type AuthRequest,
  requireAdmin,
  requireAuth,
  signAuthToken,
} from './src/middleware/auth.ts';

const PORT = Number(process.env.PORT) || 3000;
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure Multer for validated plant image uploads (JPG, JPEG, PNG up to 8MB)
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
    const uniqueName = `plant_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      cb(new Error('Only JPG, JPEG, and PNG plant photographs are supported.'));
      return;
    }
    cb(null, true);
  },
});

function serializeReport(row: {
  id: number;
  farmerId: number;
  cropName: string;
  imagePath: string;
  detectedDisease: string;
  scientificName: string;
  isHealthy: boolean;
  isUnclear: boolean;
  confidenceEstimate: number;
  severity: string;
  symptoms: string;
  possibleCauses: string;
  diseaseSpread: string;
  treatmentRecommendations: string;
  locationDistrict: string;
  growthStage: string;
  additionalSymptoms: string;
  selectedLanguage: string;
  savedByFarmer: boolean;
  createdAt: Date;
}) {
  const safeParseArray = (raw: string): string[] => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return raw ? [raw] : [];
    }
  };
  const safeParseTreatment = (raw: string) => {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  };

  return {
    id: row.id,
    farmerId: row.farmerId,
    cropName: row.cropName,
    imagePath: row.imagePath,
    detectedDisease: row.detectedDisease,
    scientificName: row.scientificName,
    isHealthy: row.isHealthy,
    isUnclear: row.isUnclear,
    confidenceEstimate: row.confidenceEstimate,
    severity: row.severity,
    symptoms: safeParseArray(row.symptoms),
    possibleCauses: safeParseArray(row.possibleCauses),
    diseaseSpread: row.diseaseSpread,
    treatment: safeParseTreatment(row.treatmentRecommendations),
    locationDistrict: row.locationDistrict,
    growthStage: row.growthStage,
    additionalSymptoms: row.additionalSymptoms,
    selectedLanguage: row.selectedLanguage,
    savedByFarmer: row.savedByFarmer,
    createdAt: row.createdAt,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // ==================== AUTH ROUTES ====================
  app.post('/api/auth/register', async (req, res) => {
    try {
      const {
        fullName,
        email,
        mobileNumber,
        password,
        state,
        district,
        preferredLanguage,
      } = req.body ?? {};

      if (!fullName || !email || !password) {
        return res
          .status(400)
          .json({ error: 'Full name, email, and password are required.' });
      }
      if (String(password).length < 6) {
        return res
          .status(400)
          .json({ error: 'Password must be at least 6 characters long.' });
      }

      const existing = await findUserByEmail(String(email));
      if (existing) {
        return res
          .status(409)
          .json({ error: 'An account with this email already exists. Please log in.' });
      }

      const passwordHash = await bcrypt.hash(String(password), 10);
      const validLang = ['en', 'kn', 'hi'].includes(preferredLanguage)
        ? preferredLanguage
        : 'en';

      const created = await createFarmerUser({
        uid: `local_${crypto.randomUUID()}`,
        fullName: String(fullName),
        email: String(email),
        mobileNumber: String(mobileNumber || ''),
        passwordHash,
        state: String(state || ''),
        district: String(district || ''),
        preferredLanguage: validLang,
      });

      const token = signAuthToken({
        userId: created.id,
        email: created.email,
        role: 'farmer',
      });

      return res.status(201).json({ token, user: toSafeUser(created) });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Registration failed.';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body ?? {};
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: 'Email and password are required.' });
      }

      const user = await findUserByEmail(String(email));
      if (!user || !user.passwordHash) {
        return res
          .status(401)
          .json({ error: 'Invalid email or password. If you signed up with Google, use Google Sign-In.' });
      }

      const isValid = await bcrypt.compare(String(password), user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = signAuthToken({
        userId: user.id,
        email: user.email,
        role: user.role === 'admin' ? 'admin' : 'farmer',
      });

      return res.json({ token, user: toSafeUser(user) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/auth/google-sync', requireAuth, async (req: AuthRequest, res) => {
    return res.json({ user: req.authUser });
  });

  app.get('/api/auth/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = req.authUser!;
      const reports = await getFarmerReports(user.id);
      const totalAnalyses = reports.length;
      const healthyCount = reports.filter((r) => r.isHealthy).length;
      const diseaseCount = reports.filter((r) => !r.isHealthy && !r.isUnclear).length;

      return res.json({
        user,
        stats: {
          totalAnalyses,
          healthyCount,
          diseaseCount,
        },
        recentReports: reports.slice(0, 5).map(serializeReport),
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to load profile.';
      return res.status(500).json({ error: message });
    }
  });

  app.put('/api/auth/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { fullName, mobileNumber, state, district, preferredLanguage } =
        req.body ?? {};
      const updated = await updateUserProfile(req.authUser!.id, {
        fullName,
        mobileNumber,
        state,
        district,
        preferredLanguage,
      });
      if (!updated) {
        return res.status(404).json({ error: 'User profile not found.' });
      }
      return res.json({ user: toSafeUser(updated) });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update profile.';
      return res.status(500).json({ error: message });
    }
  });

  // ==================== DISEASE DETECTION ROUTES ====================
  app.post(
    '/api/disease/analyze',
    requireAuth,
    (req, res, next) => {
      upload.single('image')(req, res, (err) => {
        if (err) {
          return res.status(400).json({
            error:
              err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
                ? 'Image file size must be under 8 MB.'
                : err.message || 'Invalid image upload.',
          });
        }
        next();
      });
    },
    async (req: AuthRequest, res) => {
      const uploadedFile = req.file;
      if (!uploadedFile) {
        return res
          .status(400)
          .json({ error: 'Please upload or capture a plant photograph.' });
      }

      try {
        const cropName = String(req.body?.cropName || '').trim();
        const locationDistrict = String(
          req.body?.locationDistrict || req.authUser?.district || ''
        ).trim();
        const growthStage = String(req.body?.growthStage || '').trim();
        const additionalSymptoms = String(req.body?.additionalSymptoms || '').trim();
        const rawLang = String(
          req.body?.language || req.authUser?.preferredLanguage || 'en'
        );
        const language: 'en' | 'kn' | 'hi' =
          rawLang === 'kn' || rawLang === 'hi' ? rawLang : 'en';

        const imageBuffer = fs.readFileSync(uploadedFile.path);
        const imageBase64 = imageBuffer.toString('base64');

        // Call real Google Gemini Vision API on server
        const aiResult = await analyzePlantImage({
          imageBase64,
          mimeType: uploadedFile.mimetype,
          cropName: cropName || undefined,
          locationDistrict: locationDistrict || undefined,
          growthStage: growthStage || undefined,
          additionalSymptoms: additionalSymptoms || undefined,
          language,
        });

        const imagePath = `/uploads/${uploadedFile.filename}`;

        const savedReport = await createDiseaseReport({
          farmerId: req.authUser!.id,
          cropName: aiResult.cropName || cropName || 'Unknown Crop',
          imagePath,
          detectedDisease: aiResult.detectedDisease,
          scientificName: aiResult.scientificName || '',
          isHealthy: aiResult.isHealthy,
          isUnclear: aiResult.isUnclear,
          confidenceEstimate: aiResult.confidenceEstimate,
          severity: aiResult.severity,
          symptoms: JSON.stringify(aiResult.symptoms || []),
          possibleCauses: JSON.stringify(aiResult.possibleCauses || []),
          diseaseSpread: aiResult.diseaseSpread || '',
          treatmentRecommendations: JSON.stringify({
            unclearReason: aiResult.unclearReason || '',
            immediateActions: aiResult.immediateActions || [],
            recommendedTreatment: aiResult.recommendedTreatment || [],
            preventiveMeasures: aiResult.preventiveMeasures || [],
            recoveryInstructions: aiResult.recoveryInstructions || [],
            organicOptions: aiResult.organicOptions || [],
            chemicalGuidance: aiResult.chemicalGuidance || '',
            irrigationRecommendations: aiResult.irrigationRecommendations || '',
            soilCropManagement: aiResult.soilCropManagement || '',
            expertDisclaimer: aiResult.expertDisclaimer || '',
          }),
          locationDistrict,
          growthStage,
          additionalSymptoms,
          selectedLanguage: language,
          savedByFarmer: true,
        });

        return res.status(201).json({ report: serializeReport(savedReport) });
      } catch (error: unknown) {
        // Remove orphaned file on failure
        if (uploadedFile && fs.existsSync(uploadedFile.path)) {
          fs.unlink(uploadedFile.path, () => {});
        }
        console.error('Plant analysis failed:', error);
        const msg =
          error instanceof Error
            ? error.message
            : 'Unable to analyze the plant image right now. Please try again.';
        return res.status(502).json({ error: msg });
      }
    }
  );

  app.get('/api/disease/reports', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rows = await getFarmerReports(req.authUser!.id);
      return res.json({ reports: rows.map(serializeReport) });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch reports.';
      return res.status(500).json({ error: message });
    }
  });

  app.get('/api/disease/reports/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid report ID.' });
      }
      const report = await getReportById(id);
      if (!report) {
        return res.status(404).json({ error: 'Report not found.' });
      }
      if (report.farmerId !== req.authUser!.id && req.authUser!.role !== 'admin') {
        return res.status(403).json({ error: 'You are not authorized to view this report.' });
      }
      return res.json({ report: serializeReport(report) });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to load report.';
      return res.status(500).json({ error: message });
    }
  });

  app.patch('/api/disease/reports/:id/save', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid report ID.' });
      }
      const saved = req.body?.savedByFarmer !== false;
      const updated = await updateReportSavedFlag(id, req.authUser!.id, saved);
      if (!updated) {
        return res.status(404).json({ error: 'Report not found.' });
      }
      return res.json({ report: serializeReport(updated) });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update report.';
      return res.status(500).json({ error: message });
    }
  });

  app.delete('/api/disease/reports/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid report ID.' });
      }
      const existing = await getReportById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Report not found.' });
      }
      if (existing.farmerId !== req.authUser!.id && req.authUser!.role !== 'admin') {
        return res.status(403).json({ error: 'You are not authorized to delete this report.' });
      }

      await deleteReportById(id);
      if (existing.imagePath.startsWith('/uploads/')) {
        const diskPath = path.join(UPLOADS_DIR, path.basename(existing.imagePath));
        if (fs.existsSync(diskPath)) {
          fs.unlink(diskPath, () => {});
        }
      }

      return res.json({ success: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete report.';
      return res.status(500).json({ error: message });
    }
  });

  // ==================== DISEASE LIBRARY & FARMING TIPS ====================
  app.get('/api/disease/library', async (req, res) => {
    try {
      await ensureReferenceDataSeeded();
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const crop = typeof req.query.crop === 'string' ? req.query.crop : undefined;
      const items = await getDiseaseLibraryItems(search, crop);
      return res.json({ items });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to load disease library.';
      return res.status(500).json({ error: message });
    }
  });

  app.get('/api/farming/tips', async (req, res) => {
    try {
      await ensureReferenceDataSeeded();
      const category =
        typeof req.query.category === 'string' ? req.query.category : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const tips = await getFarmingTipsItems(category, search);
      return res.json({ tips });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to load farming tips.';
      return res.status(500).json({ error: message });
    }
  });

  // ==================== ADMIN ROUTES ====================
  app.post('/api/admin/login', async (req, res) => {
    try {
      await ensureReferenceDataSeeded();
      const { email, password } = req.body ?? {};
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: 'Admin email and password are required.' });
      }

      const adminRecord = await findAdminByEmail(String(email));
      if (!adminRecord) {
        return res.status(401).json({ error: 'Invalid admin credentials.' });
      }

      const valid = await bcrypt.compare(String(password), adminRecord.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid admin credentials.' });
      }

      const userRecord = await findUserByEmail(adminRecord.email);
      if (!userRecord) {
        return res.status(401).json({ error: 'Admin profile not linked.' });
      }

      const token = signAuthToken({
        userId: userRecord.id,
        email: userRecord.email,
        role: 'admin',
      });

      return res.json({ token, user: toSafeUser(userRecord) });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Admin login failed.';
      return res.status(500).json({ error: message });
    }
  });

  app.get(
    '/api/admin/dashboard',
    requireAuth,
    requireAdmin,
    async (_req: AuthRequest, res) => {
      try {
        await ensureReferenceDataSeeded();
        const stats = await getAdminDashboardStats();
        return res.json(stats);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to load admin analytics.';
        return res.status(500).json({ error: message });
      }
    }
  );

  app.get(
    '/api/admin/reports',
    requireAuth,
    requireAdmin,
    async (_req: AuthRequest, res) => {
      try {
        const reports = await getAllAdminReports();
        return res.json({ reports });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to load submitted reports.';
        return res.status(500).json({ error: message });
      }
    }
  );

  app.get(
    '/api/admin/users',
    requireAuth,
    requireAdmin,
    async (_req: AuthRequest, res) => {
      try {
        const usersList = await getAllUsersForAdmin();
        return res.json({ users: usersList });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to load users.';
        return res.status(500).json({ error: message });
      }
    }
  );

  app.delete(
    '/api/admin/users/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const targetId = Number(req.params.id);
        if (!Number.isInteger(targetId) || targetId <= 0) {
          return res.status(400).json({ error: 'Invalid user ID.' });
        }
        if (targetId === req.authUser!.id) {
          return res.status(400).json({ error: 'You cannot delete your own admin account.' });
        }
        const deleted = await deleteUserById(targetId);
        if (!deleted) {
          return res.status(404).json({ error: 'User not found.' });
        }
        return res.json({ success: true });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to delete user.';
        return res.status(500).json({ error: message });
      }
    }
  );

  app.post(
    '/api/admin/library',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const {
          diseaseName,
          scientificName,
          affectedCrop,
          severityDefault,
          symptoms,
          causes,
          preventionMethods,
          treatmentApproaches,
        } = req.body ?? {};
        if (!diseaseName || !affectedCrop || !symptoms || !causes || !preventionMethods || !treatmentApproaches) {
          return res.status(400).json({ error: 'All disease library fields are required.' });
        }
        const created = await createDiseaseLibraryItem({
          diseaseName: String(diseaseName).trim(),
          scientificName: String(scientificName || '').trim(),
          affectedCrop: String(affectedCrop).trim(),
          severityDefault: String(severityDefault || 'Medium'),
          symptoms: String(symptoms).trim(),
          causes: String(causes).trim(),
          preventionMethods: String(preventionMethods).trim(),
          treatmentApproaches: String(treatmentApproaches).trim(),
        });
        return res.status(201).json({ item: created });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to create disease entry.';
        return res.status(500).json({ error: message });
      }
    }
  );

  app.put(
    '/api/admin/library/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          return res.status(400).json({ error: 'Invalid library entry ID.' });
        }
        const updated = await updateDiseaseLibraryItem(id, req.body ?? {});
        if (!updated) {
          return res.status(404).json({ error: 'Disease entry not found.' });
        }
        return res.json({ item: updated });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to update disease entry.';
        return res.status(500).json({ error: message });
      }
    }
  );

  app.delete(
    '/api/admin/library/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          return res.status(400).json({ error: 'Invalid library entry ID.' });
        }
        const deleted = await deleteDiseaseLibraryItem(id);
        if (!deleted) {
          return res.status(404).json({ error: 'Disease entry not found.' });
        }
        return res.json({ success: true });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to delete disease entry.';
        return res.status(500).json({ error: message });
      }
    }
  );

  app.post(
    '/api/admin/tips',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const { title, category, summary, content, season } = req.body ?? {};
        if (!title || !category || !summary || !content) {
          return res.status(400).json({ error: 'Title, category, summary, and content are required.' });
        }
        const created = await createFarmingTipItem({
          title: String(title).trim(),
          category: String(category).trim(),
          summary: String(summary).trim(),
          content: String(content).trim(),
          season: String(season || 'All Seasons').trim(),
        });
        return res.status(201).json({ tip: created });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to add farming tip.';
        return res.status(500).json({ error: message });
      }
    }
  );

  app.delete(
    '/api/admin/tips/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
          return res.status(400).json({ error: 'Invalid tip ID.' });
        }
        const deleted = await deleteFarmingTipItem(id);
        if (!deleted) {
          return res.status(404).json({ error: 'Farming tip not found.' });
        }
        return res.json({ success: true });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to delete farming tip.';
        return res.status(500).json({ error: message });
      }
    }
  );

  // ==================== FRONTEND SERVING ====================
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgriCare AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start AgriCare AI server:', err);
  process.exit(1);
});
