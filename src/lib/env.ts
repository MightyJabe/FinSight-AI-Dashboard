// Environment variables with type safety
export const env = {
  // Firebase Client
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },

  // Firebase Admin
  firebaseAdmin: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },

  // Plaid
  plaid: {
    clientId: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
    environment: process.env.PLAID_ENV || 'sandbox',
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
} as const;

// Debug logging for environment variables
console.log('Environment variables available:', {
  firebase: {
    apiKey: !!env.firebase.apiKey,
    authDomain: !!env.firebase.authDomain,
    projectId: !!env.firebase.projectId,
    storageBucket: !!env.firebase.storageBucket,
    messagingSenderId: !!env.firebase.messagingSenderId,
    appId: !!env.firebase.appId,
  },
  firebaseAdmin: {
    projectId: !!env.firebaseAdmin.projectId,
    clientEmail: !!env.firebaseAdmin.clientEmail,
    privateKey: !!env.firebaseAdmin.privateKey,
  },
  plaid: {
    clientId: !!env.plaid.clientId,
    secret: !!env.plaid.secret,
    environment: env.plaid.environment,
  },
  openai: {
    apiKey: !!env.openai.apiKey,
  },
});
