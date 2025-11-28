import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { getConfig } from './config';

const { firebase: firebaseEnv } = getConfig();

// Validate Firebase configuration
if (
  !firebaseEnv.apiKey ||
  !firebaseEnv.authDomain ||
  !firebaseEnv.projectId ||
  !firebaseEnv.appId ||
  !firebaseEnv.storageBucket ||
  !firebaseEnv.messagingSenderId
) {
  throw new Error('Firebase configuration is incomplete. Please check your environment variables.');
}

// Firebase configuration
const firebaseConfig = {
  apiKey: firebaseEnv.apiKey,
  authDomain: firebaseEnv.authDomain,
  projectId: firebaseEnv.projectId,
  storageBucket: firebaseEnv.storageBucket,
  messagingSenderId: firebaseEnv.messagingSenderId,
  appId: firebaseEnv.appId,
};

// Initialize Firebase
const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
