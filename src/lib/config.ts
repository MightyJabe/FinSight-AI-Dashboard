import { z } from 'zod';

// Environment variables validation schema
const envSchema = z.object({
  // Firebase Client
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().trim().min(1, 'Missing or invalid Firebase API Key'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
    .string()
    .trim()
    .min(1, 'Missing or invalid Firebase Auth Domain'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z
    .string()
    .trim()
    .min(1, 'Missing or invalid Firebase Project ID'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z
    .string()
    .trim()
    .min(1, 'Missing or invalid Firebase Storage Bucket'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .trim()
    .min(1, 'Missing or invalid Firebase Messaging Sender ID'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().trim().min(1, 'Missing or invalid Firebase App ID'),

  // Firebase Admin (server-side only)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // Plaid (server-side, made optional for client-side parsing)
  PLAID_CLIENT_ID: z.string().trim().min(1).optional(),
  PLAID_SECRET: z.string().trim().min(1).optional(),
  PLAID_ENV: z.enum(['sandbox', 'development', 'production']).default('sandbox').optional(),

  // OpenAI (server-side, made optional for client-side parsing)
  OPENAI_API_KEY: z.string().trim().min(1).optional(),
});

let parsedEnv: Partial<z.infer<typeof envSchema>> = {};

if (typeof process !== 'undefined' && process.env) {
  // Construct an object with only the keys defined in the schema
  // This is a more targeted approach for client-side where process.env is handled differently by Next.js
  const envVarsToValidate = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    // Server-side vars will be undefined on client, which is fine due to .optional()
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    PLAID_CLIENT_ID: process.env.PLAID_CLIENT_ID,
    PLAID_SECRET: process.env.PLAID_SECRET,
    PLAID_ENV: process.env.PLAID_ENV,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };

  const result = envSchema.safeParse(envVarsToValidate);

  if (result.success) {
    parsedEnv = result.data;
  } else {
    console.error(
      'Failed to parse environment variables. Zod validation errors:',
      result.error.format()
    );
  }
}

// Assembling the config object based on parsed and validated environment variables
export const config = {
  firebase: {
    apiKey: parsedEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: parsedEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: parsedEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: parsedEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: parsedEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: parsedEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  firebaseAdmin: {
    projectId: parsedEnv.FIREBASE_PROJECT_ID,
    clientEmail: parsedEnv.FIREBASE_CLIENT_EMAIL,
    privateKey: parsedEnv.FIREBASE_PRIVATE_KEY,
  },
  plaid: {
    clientId: parsedEnv.PLAID_CLIENT_ID,
    secret: parsedEnv.PLAID_SECRET,
    environment: parsedEnv.PLAID_ENV,
  },
  openai: {
    apiKey: parsedEnv.OPENAI_API_KEY,
  },
} as const;

// Type for the config object
export type Config = typeof config;

/**
 * Getter function for the config object.
 * This ensures that consumers always get the most up-to-date config.
 */
export function getConfig(): Config {
  // Perform runtime checks to ensure essential client-side Firebase config is present
  if (typeof window !== 'undefined') {
    // Running on the client
    if (
      !config.firebase.apiKey ||
      !config.firebase.authDomain ||
      !config.firebase.projectId ||
      !config.firebase.appId
    ) {
      console.error(
        'Firebase client configuration is incomplete. Check .env.local and ensure values are not empty and correctly set.'
      );
      // Optionally, throw an error or display a message to the user
      // throw new Error('Firebase client configuration is incomplete.');
    }
  }
  return config;
}
