import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

let auth: Auth;
let db: Firestore;

// Initialize Firebase Admin
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // In CI/build environment, we need proper credentials or should fail gracefully at runtime
  // Never create dummy instances - this is a security risk
  if (!projectId || !clientEmail || !privateKey) {
    // During build time (CI), log warning but don't crash the build
    // The actual runtime will fail if these are truly missing
    if (process.env.CI === 'true' || process.env.VERCEL === '1') {
      console.warn(
        'Firebase Admin credentials not available during build. Runtime calls will fail if not configured.'
      );
      // Create a proxy that throws helpful errors at runtime instead of silently failing
      const createRuntimeErrorProxy = (serviceName: string) =>
        new Proxy(
          {},
          {
            get: () => {
              throw new Error(
                `Firebase Admin ${serviceName} not initialized. ` +
                  'Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.'
              );
            },
          }
        );
      auth = createRuntimeErrorProxy('Auth') as Auth;
      db = createRuntimeErrorProxy('Firestore') as Firestore;
    } else {
      console.error('Missing Firebase Admin credentials:', {
        projectId: projectId ? '✓' : '✗',
        clientEmail: clientEmail ? '✓' : '✗',
        privateKey: privateKey ? '✓' : '✗',
      });
      throw new Error('Missing Firebase Admin credentials');
    }
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
