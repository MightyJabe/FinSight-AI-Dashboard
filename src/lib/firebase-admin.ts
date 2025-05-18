import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from './env';

// Initialize Firebase Admin
if (!getApps().length) {
  if (!env.firebaseAdmin.projectId || !env.firebaseAdmin.clientEmail || !env.firebaseAdmin.privateKey) {
    throw new Error('Missing Firebase Admin credentials');
  }

  initializeApp({
    credential: cert({
      projectId: env.firebaseAdmin.projectId,
      clientEmail: env.firebaseAdmin.clientEmail,
      privateKey: env.firebaseAdmin.privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

export const auth = getAuth();
export const db = getFirestore(); 