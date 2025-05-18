import { z } from 'zod';
import { firebaseConfig, plaidConfig, openaiConfig } from './env';

// Only validate Firebase config for now, make other services optional
const envSchema = z.object({
  // Firebase (required)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1).optional(),

  // Optional services (for later)
  PLAID_CLIENT_ID: z.string().optional(),
  PLAID_SECRET: z.string().optional(),
  PLAID_ENV: z.enum(['sandbox', 'development', 'production']).optional(),
  OPENAI_API_KEY: z.string().optional(),
});

// Debug: Log available environment variables (without values)
console.log(
  'Available env vars:',
  Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
);

// Add detailed Firebase config logging
console.log('Firebase config check:', {
  hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  hasStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  hasMessagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

// Log actual values (without sensitive data)
console.log('Firebase config values:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'present' : 'missing',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'present' : 'missing',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'present' : 'missing',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'present' : 'missing',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'present' : 'missing',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'present' : 'missing',
});

// Get environment variables
const getEnvVar = (key: string): string | undefined => {
  if (typeof window !== 'undefined') {
    // Client-side
    return process.env[key];
  } else {
    // Server-side
    return process.env[key];
  }
};

// Create config object
const firebaseConfig = {
  apiKey: getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID'),
};

// Export validated environment variables
export const config = {
  firebase: firebaseConfig.apiKey ? firebaseConfig : undefined,
  plaid: plaidConfig.clientId ? plaidConfig : undefined,
  openai: openaiConfig.apiKey ? openaiConfig : undefined,
} as const;

// Type for the config object
export type Config = typeof config;

export function getConfig() {
  return config;
}
