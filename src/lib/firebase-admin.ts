import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let auth: any;
let db: any;

// Initialize Firebase Admin
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Skip initialization in CI build environment
  if (process.env.CI === 'true' && process.env.NODE_ENV === 'production') {
    console.log('Skipping Firebase Admin initialization in CI build environment');
    // Provide dummy instances for CI build
    auth = {} as any;
    db = {} as any;
  } else if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin credentials:', {
      projectId: projectId ? '✓' : '✗',
      clientEmail: clientEmail ? '✓' : '✗',
      privateKey: privateKey ? '✓' : '✗',
    });
    throw new Error('Missing Firebase Admin credentials');
  } else {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: `${projectId}.appspot.com`,
    });
    auth = getAuth();
    db = getFirestore();
  }
} else {
  auth = getAuth();
  db = getFirestore();
}

export { auth as adminAuth, db as adminDb };
