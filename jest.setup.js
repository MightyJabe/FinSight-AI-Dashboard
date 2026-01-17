// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
// Add Web Fetch API shim for OpenAI
import 'openai/shims/node';

import { TextDecoder, TextEncoder } from 'util';

// Mock fetch globally
global.fetch = jest.fn();

// Add Request polyfill for Next.js API tests
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    /**
     *
     */
    constructor(input, init = {}) {
      this._url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers);
      this.body = init.body;
    }

    get url() {
      return this._url;
    }

    /**
     * Mock json() method for API route testing
     */
    async json() {
      try {
        return this.body ? JSON.parse(this.body) : {};
      } catch {
        return {};
      }
    }

    /**
     * Mock text() method for API route testing
     */
    async text() {
      return this.body || '';
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
      try {
        return Promise.resolve(JSON.parse(this.body || '{}'));
      } catch {
        // If JSON parsing fails, return empty object
        return Promise.resolve({});
      }
    }

    /**
     *
     */
    text() {
      return Promise.resolve(this.body || '');
    }

    static json(data, init = {}) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
      });
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

// Mock SessionProvider - will be overridden in specific tests
const defaultSessionMock = {
  user: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    getIdToken: jest.fn().mockResolvedValue('test-token'),
  },
  firebaseUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    getIdToken: jest.fn().mockResolvedValue('test-token'),
  },
  loading: false,
};

jest.mock('@/components/providers/SessionProvider', () => ({
  useSession: jest.fn(() => defaultSessionMock),
  SessionProvider: ({ children }) => children,
}));

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
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add Node.js timer polyfills for Winston
global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));

// Setup JSDOM environment properly for component tests
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { JSDOM } = require('jsdom');

// Create a proper JSDOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
});

// Set up global environment
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLIFrameElement = dom.window.HTMLIFrameElement;
global.Event = dom.window.Event;

// Setup server-side tests - override window as undefined when needed
const originalWindow = global.window;
global.isServerSide = () => {
  Object.defineProperty(global, 'window', {
    value: undefined,
    writable: true,
  });
};
global.restoreWindow = () => {
  Object.defineProperty(global, 'window', {
    value: originalWindow,
    writable: true,
  });
};

// Mock OpenAI module
jest.mock('@/lib/openai', () => ({
  generateChatCompletion: jest.fn().mockResolvedValue({
    content: '{"category": "Uncategorized", "confidence": 50, "reasoning": "Test response"}',
    role: 'assistant',
  }),
}));

// Import Plaid mock
import '@/__mocks__/plaid';

// MSW Setup - disabled in global setup due to module resolution issues with Jest
// Import MSW server directly in tests that need it instead:
// import { server } from '@/mocks/server';
// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());
