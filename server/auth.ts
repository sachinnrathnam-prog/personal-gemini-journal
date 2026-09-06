import { Request, Response, NextFunction } from 'express';
import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

export const DEFAULT_FIREBASE_PROJECT_ID = 'personal-gemini-journal-82599';

export function getResolvedProjectId(): string {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (parsed.projectId && typeof parsed.projectId === 'string') {
        return parsed.projectId;
      }
    }
  } catch {
    // Ignore and fallback
  }
  return process.env.GOOGLE_CLOUD_PROJECT || DEFAULT_FIREBASE_PROJECT_ID;
}

// Singleton instance for Firebase Admin App and Auth
let adminApp: App | null = null;
let adminAuth: Auth | null = null;

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    const existingApps = getApps();
    if (existingApps.length === 0) {
      adminApp = initializeApp({
        projectId: getResolvedProjectId(),
      });
    } else {
      adminApp = existingApps[0];
    }
    adminAuth = getAuth(adminApp);
  }
  return adminAuth;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

/**
 * Express middleware to authenticate and verify Firebase ID tokens using the official Firebase Admin SDK.
 * - Validates presence and structure of Bearer token from Authorization header.
 * - Guards against malformed, non-JWT, or placeholder token formats prior to cryptographic verification.
 * - Verifies the token using Firebase Admin Auth verifyIdToken() against the target Firebase project.
 * - Derives authenticated identity strictly from the verified token claims.
 * - Returns clean 401 status for unauthenticated or invalid requests.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const authExists = !!authHeader;
  console.log('[Auth Diagnostic] Authorization header exists:', authExists);

  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing or malformed Authorization header.' });
    return;
  }

  let token = authHeader.slice(7).trim();
  // Strip optional surrounding quotes
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1).trim();
  }

  console.log('[Auth Diagnostic] Token length:', token ? token.length : 0);

  if (!token || token === 'undefined' || token === 'null') {
    res.status(401).json({ error: 'Authentication required. Missing or empty token.' });
    return;
  }

  // A valid Firebase ID token is a standard JWT with 3 non-empty dot-separated segments
  const segments = token.split('.');
  if (segments.length !== 3 || !segments[0] || !segments[1] || !segments[2]) {
    res.status(401).json({ error: 'Unauthorized: Authentication token format is malformed.' });
    return;
  }

  // Safe unverified token inspection for audience & issuer diagnosis (never logs token)
  try {
    const payloadJson = Buffer.from(segments[1], 'base64url').toString('utf8');
    const unverifiedPayload = JSON.parse(payloadJson);
    console.log('[Auth Diagnostic] Unverified token audience (aud):', unverifiedPayload?.aud);
    console.log('[Auth Diagnostic] Unverified token issuer (iss):', unverifiedPayload?.iss);
    console.log('[Auth Diagnostic] Expected project ID:', getResolvedProjectId());
  } catch {
    // ignore
  }

  const auth = getAdminAuth();
  try {
    const decodedToken = await auth.verifyIdToken(token);

    console.log('[Auth Diagnostic] Verification SUCCEEDED.');
    console.log('[Auth Diagnostic] Decoded token audience:', decodedToken.aud);
    console.log('[Auth Diagnostic] Decoded token issuer:', decodedToken.iss);

    if (!decodedToken || !decodedToken.uid || typeof decodedToken.uid !== 'string') {
      res.status(401).json({ error: 'Unauthorized: Invalid token identity.' });
      return;
    }

    // Authoritative user identity derived ONLY from verified Firebase Admin token
    req.user = {
      uid: decodedToken.uid,
      email: typeof decodedToken.email === 'string' ? decodedToken.email : undefined,
    };

    next();
  } catch (err: any) {
    console.log('[Auth Diagnostic] Firebase verification error code:', err?.code || err?.name || 'unknown');
    console.log('[Auth Diagnostic] Firebase verification error message:', err?.message);

    const isExpired = err?.code === 'auth/id-token-expired';
    res.status(401).json({
      error: isExpired
        ? 'Unauthorized: Authentication token has expired.'
        : 'Unauthorized: Authentication token is invalid.',
      code: isExpired ? 'auth/id-token-expired' : 'auth/invalid-token',
      diagnosticCode: err?.code,
    });
  }
}


