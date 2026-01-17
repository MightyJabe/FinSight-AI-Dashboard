import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { SWRConfig } from 'swr';

// Custom render with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock Next.js router
export function mockRouter(overrides = {}) {
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    ...overrides,
  };

  jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(router);
  jest
    .spyOn(require('next/navigation'), 'usePathname')
    .mockReturnValue(router.pathname);

  return router;
}

// Wait for async updates
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

// Create mock Request for API route testing
export function createMockRequest(options: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  url?: string;
}): Request {
  const {
    method = 'POST',
    body,
    headers = {},
    url = 'http://localhost:3000/api/test',
  } = options;

  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Assert decimal precision for financial tests
export function expectDecimalEqual(
  actual: number,
  expected: number,
  precision = 2
) {
  const multiplier = Math.pow(10, precision);
  expect(Math.round(actual * multiplier) / multiplier).toBe(
    Math.round(expected * multiplier) / multiplier
  );
}
