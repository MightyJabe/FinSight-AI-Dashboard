import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { firebaseConfig } from './env';

console.log('Firebase initialization:', {
  hasConfig: !!firebaseConfig.apiKey,
  existingApps: getApps().length,
  configKeys: Object.keys(firebaseConfig),
});

// Only initialize Firebase if config is available and all required fields are present
const app = firebaseConfig.apiKey
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

console.log('Firebase app initialized:', !!app);

export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
