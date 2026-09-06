import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Resolve runtime auth domain: determine the actual runtime window.location.origin host
// so that Firebase Authentication targets the AI Studio preview domain with matching continue-uri
export const getRuntimeAuthDomain = (): string => {
  if (typeof window !== 'undefined') {
    try {
      if (window.location?.origin) {
        const originUrl = new URL(window.location.origin);
        if (originUrl.host) {
          return originUrl.host;
        }
      }
      if (window.location?.host) {
        return window.location.host;
      }
    } catch {
      // Fall through to configured domain
    }
  }
  return firebaseConfig.authDomain || 'ais-dev-3t4s64ccncp3hpxoj3kgki-657330580097.asia-southeast1.run.app';
};

export const resolvedFirebaseConfig = {
  ...firebaseConfig,
  authDomain: getRuntimeAuthDomain(),
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(resolvedFirebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with configured database ID
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // Avoid leaking credentials or raw internal stack in UI
    console.error('Authentication attempt failed');
    throw new Error(error?.message || 'Failed to sign in with Google');
  }
};

export const logOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

// Test connection on boot per Firebase guidelines
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'health_check', 'ping'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connectivity is limited.');
    }
  }
}

testConnection();

export const onUserAuthStateChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { onAuthStateChanged };
export type { User };
