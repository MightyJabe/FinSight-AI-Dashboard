// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
// Add Web Fetch API shim for OpenAI
import 'openai/shims/node';

// Mock fetch globally
global.fetch = jest.fn();

// Add Request polyfill for Next.js API tests
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    /**
     *
     */
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers);
      this.body = init.body;
    }
  };
}

// Add Response polyfill for Next.js API tests
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    /**
     *
     */
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Headers(init.headers);
      this.ok = this.status >= 200 && this.status < 300;
    }

    /**
     *
     */
    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'));
    }

    /**
     *
     */
    text() {
      return Promise.resolve(this.body || '');
    }
  };
}

// Add Headers polyfill if needed
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    /**
     *
     */
    constructor(init = {}) {
      this._headers = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.set(key, value);
        });
      }
    }

    /**
     *
     */
    set(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }

    /**
     *
     */
    get(name) {
      return this._headers.get(name.toLowerCase()) || null;
    }

    /**
     *
     */
    has(name) {
      return this._headers.has(name.toLowerCase());
    }
  };
}

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-firebase-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth
jest.mock('next-auth/react', () => {
  const originalModule = jest.requireActual('next-auth/react');
  return {
    __esModule: true,
    ...originalModule,
    useSession: () => ({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
        expires: new Date(Date.now() + 2 * 86400).toISOString(),
      },
      status: 'authenticated',
    }),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  };
});

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  credential: {
    applicationDefault: jest.fn(),
  },
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    createCustomToken: jest.fn(),
  })),
}));

// Mock firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
