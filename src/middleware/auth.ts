import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { adminAuth } from '../lib/firebase-admin.ts';
import { findUserById, getOrCreateFirebaseUser, type SafeUser, toSafeUser } from '../db/queries.ts';

const JWT_SECRET =
  process.env.JWT_SECRET || 'agricare-ai-dev-jwt-secret-change-in-production';

export interface JwtUserPayload {
  userId: number;
  email: string;
  role: 'farmer' | 'admin';
}

export interface AuthRequest extends Request {
  authUser?: SafeUser;
}

export function signAuthToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token.' });
  }

  // 1. Try verifying server-issued JWT first
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtUserPayload;
    if (decoded && typeof decoded.userId === 'number') {
      const userRecord = await findUserById(decoded.userId);
      if (!userRecord) {
        return res.status(401).json({ error: 'Account no longer exists.' });
      }
      req.authUser = toSafeUser(userRecord);
      return next();
    }
  } catch {
    // Fall through to Firebase ID Token verification
  }

  // 2. Verify Firebase ID Token (Google Sign-In via Cloud SQL Auth)
  try {
    const decodedFirebase = await adminAuth.verifyIdToken(token);
    const email = decodedFirebase.email || `${decodedFirebase.uid}@firebase.local`;
    const fullName = decodedFirebase.name || email.split('@')[0];
    const userRecord = await getOrCreateFirebaseUser(
      decodedFirebase.uid,
      email,
      fullName
    );
    req.authUser = toSafeUser(userRecord);
    return next();
  } catch (error) {
    console.error('Authentication verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired authentication session.' });
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.authUser || req.authUser.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required.' });
  }
  return next();
}
