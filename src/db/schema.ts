import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. users table (farmers and admin accounts)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  mobileNumber: text('mobile_number').notNull().default(''),
  passwordHash: text('password_hash'),
  state: text('state').notNull().default(''),
  district: text('district').notNull().default(''),
  preferredLanguage: text('preferred_language').notNull().default('en'),
  role: text('role').notNull().default('farmer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. disease_reports table (AI-generated crop disease analysis records)
export const diseaseReports = pgTable('disease_reports', {
  id: serial('id').primaryKey(),
  farmerId: integer('farmer_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  cropName: text('crop_name').notNull(),
  imagePath: text('image_path').notNull(),
  detectedDisease: text('detected_disease').notNull(),
  scientificName: text('scientific_name').notNull().default(''),
  isHealthy: boolean('is_healthy').notNull().default(false),
  isUnclear: boolean('is_unclear').notNull().default(false),
  confidenceEstimate: integer('confidence_estimate').notNull().default(0),
  severity: text('severity').notNull().default('Low'),
  symptoms: text('symptoms').notNull().default('[]'),
  possibleCauses: text('possible_causes').notNull().default('[]'),
  diseaseSpread: text('disease_spread').notNull().default(''),
  treatmentRecommendations: text('treatment_recommendations').notNull().default('{}'),
  locationDistrict: text('location_district').notNull().default(''),
  growthStage: text('growth_stage').notNull().default(''),
  additionalSymptoms: text('additional_symptoms').notNull().default(''),
  selectedLanguage: text('selected_language').notNull().default('en'),
  savedByFarmer: boolean('saved_by_farmer').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. disease_library table (verified agricultural disease encyclopedia)
export const diseaseLibrary = pgTable('disease_library', {
  id: serial('id').primaryKey(),
  diseaseName: text('disease_name').notNull(),
  scientificName: text('scientific_name').notNull().default(''),
  affectedCrop: text('affected_crop').notNull(),
  severityDefault: text('severity_default').notNull().default('Medium'),
  symptoms: text('symptoms').notNull(),
  causes: text('causes').notNull(),
  preventionMethods: text('prevention_methods').notNull(),
  treatmentApproaches: text('treatment_approaches').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. farming_tips table (practical agricultural guidance articles)
export const farmingTips = pgTable('farming_tips', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  season: text('season').notNull().default('All Seasons'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. admin table (admin credentials and permissions linked to users)
export const admins = pgTable('admin', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  permissions: text('permissions').notNull().default('full'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Drizzle Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  reports: many(diseaseReports),
  adminProfile: one(admins, {
    fields: [users.id],
    references: [admins.userId],
  }),
}));

export const diseaseReportsRelations = relations(diseaseReports, ({ one }) => ({
  farmer: one(users, {
    fields: [diseaseReports.farmerId],
    references: [users.id],
  }),
}));

export const adminsRelations = relations(admins, ({ one }) => ({
  user: one(users, {
    fields: [admins.userId],
    references: [users.id],
  }),
}));
