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

export const resolvedFirebaseConfig = {
  ...firebaseConfig,
  authDomain: 'personal-gemini-journal-82599.firebaseapp.com',
};

// Initialize Firebase App
const app =
  getApps().length === 0
    ? initializeApp(resolvedFirebaseConfig)
    : getApp();

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

// Google Sign-In
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Authentication attempt failed');
    throw new Error(
      error?.message || 'Failed to sign in with Google'
    );
  }
};

// Sign out
export const logOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

// Test Firestore connectivity on boot
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'health_check', 'ping'));
  } catch (error: any) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.warn(
        'Firebase client is offline or connectivity is limited.'
      );
    }
  }
}

testConnection();

// Auth state listener
export const onUserAuthStateChanged = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

export { onAuthStateChanged };
export type { User };