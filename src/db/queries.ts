import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  admins,
  diseaseLibrary,
  diseaseReports,
  farmingTips,
  users,
} from './schema.ts';

export type SafeUser = Omit<typeof users.$inferSelect, 'passwordHash'>;

export function toSafeUser(user: typeof users.$inferSelect): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export async function getOrCreateFirebaseUser(
  uid: string,
  email: string,
  fullName?: string
) {
  try {
    const cleanEmail = email.toLowerCase().trim();
    // Check if an account with this email already exists (e.g., registered via email/password)
    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existingByEmail.length > 0) {
      const existing = existingByEmail[0];
      if (existing.uid !== uid) {
        const [updated] = await db
          .update(users)
          .set({
            uid,
            fullName: existing.fullName || fullName || cleanEmail.split('@')[0],
          })
          .where(eq(users.id, existing.id))
          .returning();
        return updated;
      }
      return existing;
    }

    const [created] = await db
      .insert(users)
      .values({
        uid,
        email: cleanEmail,
        fullName: fullName || cleanEmail.split('@')[0],
        mobileNumber: '',
        state: '',
        district: '',
        preferredLanguage: 'en',
        role: 'farmer',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email: cleanEmail },
      })
      .returning();

    return created;
  } catch (error) {
    console.error('Database query failed (getOrCreateFirebaseUser):', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export async function findUserByEmail(email: string) {
  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (findUserByEmail):', error);
    throw new Error('Failed to look up user account.', { cause: error });
  }
}

export async function findUserById(id: number) {
  try {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (findUserById):', error);
    throw new Error('Failed to fetch user profile.', { cause: error });
  }
}

export async function createFarmerUser(data: {
  uid: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  passwordHash: string;
  state: string;
  district: string;
  preferredLanguage: string;
}) {
  try {
    const [created] = await db
      .insert(users)
      .values({
        uid: data.uid,
        fullName: data.fullName.trim(),
        email: data.email.toLowerCase().trim(),
        mobileNumber: data.mobileNumber.trim(),
        passwordHash: data.passwordHash,
        state: data.state.trim(),
        district: data.district.trim(),
        preferredLanguage: data.preferredLanguage || 'en',
        role: 'farmer',
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database query failed (createFarmerUser):', error);
    throw new Error('Failed to register farmer account.', { cause: error });
  }
}

export async function updateUserProfile(
  userId: number,
  updates: {
    fullName?: string;
    mobileNumber?: string;
    state?: string;
    district?: string;
    preferredLanguage?: string;
  }
) {
  try {
    const [updated] = await db
      .update(users)
      .set({
        ...(updates.fullName !== undefined ? { fullName: updates.fullName.trim() } : {}),
        ...(updates.mobileNumber !== undefined ? { mobileNumber: updates.mobileNumber.trim() } : {}),
        ...(updates.state !== undefined ? { state: updates.state.trim() } : {}),
        ...(updates.district !== undefined ? { district: updates.district.trim() } : {}),
        ...(updates.preferredLanguage !== undefined ? { preferredLanguage: updates.preferredLanguage } : {}),
      })
      .where(eq(users.id, userId))
      .returning();
    return updated ?? null;
  } catch (error) {
    console.error('Database query failed (updateUserProfile):', error);
    throw new Error('Failed to update profile.', { cause: error });
  }
}

export async function findAdminByEmail(email: string) {
  try {
    const rows = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email.toLowerCase().trim()))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (findAdminByEmail):', error);
    throw new Error('Failed to verify admin account.', { cause: error });
  }
}

export async function createDiseaseReport(data: typeof diseaseReports.$inferInsert) {
  try {
    const [created] = await db.insert(diseaseReports).values(data).returning();
    return created;
  } catch (error) {
    console.error('Database query failed (createDiseaseReport):', error);
    throw new Error('Failed to save disease analysis report.', { cause: error });
  }
}

export async function getFarmerReports(farmerId: number) {
  try {
    return await db
      .select()
      .from(diseaseReports)
      .where(eq(diseaseReports.farmerId, farmerId))
      .orderBy(desc(diseaseReports.createdAt));
  } catch (error) {
    console.error('Database query failed (getFarmerReports):', error);
    throw new Error('Failed to load disease reports.', { cause: error });
  }
}

export async function getReportById(reportId: number) {
  try {
    const rows = await db
      .select()
      .from(diseaseReports)
      .where(eq(diseaseReports.id, reportId))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (getReportById):', error);
    throw new Error('Failed to load report details.', { cause: error });
  }
}

export async function updateReportSavedFlag(
  reportId: number,
  farmerId: number,
  savedByFarmer: boolean
) {
  try {
    const [updated] = await db
      .update(diseaseReports)
      .set({ savedByFarmer })
      .where(and(eq(diseaseReports.id, reportId), eq(diseaseReports.farmerId, farmerId)))
      .returning();
    return updated ?? null;
  } catch (error) {
    console.error('Database query failed (updateReportSavedFlag):', error);
    throw new Error('Failed to update report saved state.', { cause: error });
  }
}

export async function deleteReportById(reportId: number) {
  try {
    const [deleted] = await db
      .delete(diseaseReports)
      .where(eq(diseaseReports.id, reportId))
      .returning();
    return deleted ?? null;
  } catch (error) {
    console.error('Database query failed (deleteReportById):', error);
    throw new Error('Failed to delete report.', { cause: error });
  }
}

export async function getDiseaseLibraryItems(search?: string, crop?: string) {
  try {
    const conditions = [];
    if (crop && crop !== 'All') {
      conditions.push(eq(diseaseLibrary.affectedCrop, crop));
    }
    if (search && search.trim()) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(diseaseLibrary.diseaseName, pattern),
          ilike(diseaseLibrary.scientificName, pattern),
          ilike(diseaseLibrary.affectedCrop, pattern),
          ilike(diseaseLibrary.symptoms, pattern)
        )
      );
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(diseaseLibrary)
        .where(and(...conditions))
        .orderBy(diseaseLibrary.affectedCrop, diseaseLibrary.diseaseName);
    }

    return await db
      .select()
      .from(diseaseLibrary)
      .orderBy(diseaseLibrary.affectedCrop, diseaseLibrary.diseaseName);
  } catch (error) {
    console.error('Database query failed (getDiseaseLibraryItems):', error);
    throw new Error('Failed to load disease library.', { cause: error });
  }
}

export async function createDiseaseLibraryItem(data: typeof diseaseLibrary.$inferInsert) {
  try {
    const [created] = await db.insert(diseaseLibrary).values(data).returning();
    return created;
  } catch (error) {
    console.error('Database query failed (createDiseaseLibraryItem):', error);
    throw new Error('Failed to add disease entry.', { cause: error });
  }
}

export async function updateDiseaseLibraryItem(
  id: number,
  data: Partial<typeof diseaseLibrary.$inferInsert>
) {
  try {
    const [updated] = await db
      .update(diseaseLibrary)
      .set(data)
      .where(eq(diseaseLibrary.id, id))
      .returning();
    return updated ?? null;
  } catch (error) {
    console.error('Database query failed (updateDiseaseLibraryItem):', error);
    throw new Error('Failed to update disease entry.', { cause: error });
  }
}

export async function deleteDiseaseLibraryItem(id: number) {
  try {
    const [deleted] = await db
      .delete(diseaseLibrary)
      .where(eq(diseaseLibrary.id, id))
      .returning();
    return deleted ?? null;
  } catch (error) {
    console.error('Database query failed (deleteDiseaseLibraryItem):', error);
    throw new Error('Failed to delete disease entry.', { cause: error });
  }
}

export async function getFarmingTipsItems(category?: string, search?: string) {
  try {
    const conditions = [];
    if (category && category !== 'All') {
      conditions.push(eq(farmingTips.category, category));
    }
    if (search && search.trim()) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(farmingTips.title, pattern),
          ilike(farmingTips.summary, pattern),
          ilike(farmingTips.content, pattern)
        )
      );
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(farmingTips)
        .where(and(...conditions))
        .orderBy(farmingTips.category, farmingTips.id);
    }

    return await db
      .select()
      .from(farmingTips)
      .orderBy(farmingTips.category, farmingTips.id);
  } catch (error) {
    console.error('Database query failed (getFarmingTipsItems):', error);
    throw new Error('Failed to load farming tips.', { cause: error });
  }
}

export async function createFarmingTipItem(data: typeof farmingTips.$inferInsert) {
  try {
    const [created] = await db.insert(farmingTips).values(data).returning();
    return created;
  } catch (error) {
    console.error('Database query failed (createFarmingTipItem):', error);
    throw new Error('Failed to add farming tip.', { cause: error });
  }
}

export async function deleteFarmingTipItem(id: number) {
  try {
    const [deleted] = await db
      .delete(farmingTips)
      .where(eq(farmingTips.id, id))
      .returning();
    return deleted ?? null;
  } catch (error) {
    console.error('Database query failed (deleteFarmingTipItem):', error);
    throw new Error('Failed to delete farming tip.', { cause: error });
  }
}

export async function getAdminDashboardStats() {
  try {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));

    const allReports = await db
      .select({
        id: diseaseReports.id,
        farmerId: diseaseReports.farmerId,
        farmerName: users.fullName,
        farmerEmail: users.email,
        farmerDistrict: users.district,
        cropName: diseaseReports.cropName,
        detectedDisease: diseaseReports.detectedDisease,
        severity: diseaseReports.severity,
        isHealthy: diseaseReports.isHealthy,
        isUnclear: diseaseReports.isUnclear,
        confidenceEstimate: diseaseReports.confidenceEstimate,
        selectedLanguage: diseaseReports.selectedLanguage,
        imagePath: diseaseReports.imagePath,
        createdAt: diseaseReports.createdAt,
      })
      .from(diseaseReports)
      .innerJoin(users, eq(diseaseReports.farmerId, users.id))
      .orderBy(desc(diseaseReports.createdAt));

    const [{ value: libraryCount }] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(diseaseLibrary);

    const farmers = allUsers.filter((u) => u.role === 'farmer');
    const healthyCount = allReports.filter((r) => r.isHealthy).length;
    const diseaseCount = allReports.filter((r) => !r.isHealthy && !r.isUnclear).length;

    // Aggregate top diseases
    const diseaseCountsMap = new Map<string, number>();
    const cropCountsMap = new Map<string, number>();

    for (const report of allReports) {
      if (!report.isUnclear) {
        const diseaseKey = report.detectedDisease || 'Unknown';
        diseaseCountsMap.set(diseaseKey, (diseaseCountsMap.get(diseaseKey) ?? 0) + 1);
      }
      const cropKey = report.cropName || 'Other';
      cropCountsMap.set(cropKey, (cropCountsMap.get(cropKey) ?? 0) + 1);
    }

    const topDiseases = Array.from(diseaseCountsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const cropAnalysis = Array.from(cropCountsMap.entries())
      .map(([crop, count]) => ({ crop, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const recentActivities = [
      ...allReports.slice(0, 8).map((r) => ({
        id: `report-${r.id}`,
        type: 'analysis' as const,
        actor: r.farmerName,
        detail: `${r.cropName} — ${r.detectedDisease}`,
        severity: r.severity,
        timestamp: r.createdAt,
      })),
      ...farmers.slice(0, 5).map((u) => ({
        id: `user-${u.id}`,
        type: 'registration' as const,
        actor: u.fullName,
        detail: u.district ? `Registered from ${u.district}, ${u.state}` : 'Registered farmer account',
        severity: 'None',
        timestamp: u.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 12);

    return {
      totals: {
        registeredFarmers: farmers.length,
        totalUsers: allUsers.length,
        totalAnalyses: allReports.length,
        healthyDetected: healthyCount,
        diseaseCases: diseaseCount,
        libraryEntries: libraryCount,
      },
      topDiseases,
      cropAnalysis,
      recentActivities,
    };
  } catch (error) {
    console.error('Database query failed (getAdminDashboardStats):', error);
    throw new Error('Failed to load admin analytics.', { cause: error });
  }
}

export async function getAllAdminReports() {
  try {
    return await db
      .select({
        id: diseaseReports.id,
        farmerId: diseaseReports.farmerId,
        farmerName: users.fullName,
        farmerEmail: users.email,
        farmerDistrict: users.district,
        cropName: diseaseReports.cropName,
        imagePath: diseaseReports.imagePath,
        detectedDisease: diseaseReports.detectedDisease,
        scientificName: diseaseReports.scientificName,
        isHealthy: diseaseReports.isHealthy,
        isUnclear: diseaseReports.isUnclear,
        confidenceEstimate: diseaseReports.confidenceEstimate,
        severity: diseaseReports.severity,
        selectedLanguage: diseaseReports.selectedLanguage,
        createdAt: diseaseReports.createdAt,
      })
      .from(diseaseReports)
      .innerJoin(users, eq(diseaseReports.farmerId, users.id))
      .orderBy(desc(diseaseReports.createdAt));
  } catch (error) {
    console.error('Database query failed (getAllAdminReports):', error);
    throw new Error('Failed to load submitted reports.', { cause: error });
  }
}

export async function getAllUsersForAdmin() {
  try {
    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    return rows.map(toSafeUser);
  } catch (error) {
    console.error('Database query failed (getAllUsersForAdmin):', error);
    throw new Error('Failed to load registered users.', { cause: error });
  }
}

export async function deleteUserById(userId: number) {
  try {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();
    return deleted ?? null;
  } catch (error) {
    console.error('Database query failed (deleteUserById):', error);
    throw new Error('Failed to delete user.', { cause: error });
  }
}
