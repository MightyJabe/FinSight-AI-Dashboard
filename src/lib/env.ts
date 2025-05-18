// Environment variables for Firebase
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Environment variables for Plaid
export const plaidConfig = {
  clientId: process.env.PLAID_CLIENT_ID,
  secret: process.env.PLAID_SECRET,
  env: process.env.PLAID_ENV as 'sandbox' | 'development' | 'production',
};

// Environment variables for OpenAI
export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
};

// Debug logging
console.log('Environment variables loaded:', {
  firebase: {
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    hasStorageBucket: !!firebaseConfig.storageBucket,
    hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
    hasAppId: !!firebaseConfig.appId,
  },
  plaid: {
    hasClientId: !!plaidConfig.clientId,
    hasSecret: !!plaidConfig.secret,
    hasEnv: !!plaidConfig.env,
  },
  openai: {
    hasApiKey: !!openaiConfig.apiKey,
  },
}); 