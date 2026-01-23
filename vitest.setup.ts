/**
 * Vitest Setup File
 *
 * This file runs before each test file to set up the testing environment.
 */

import { vi, beforeAll, afterEach } from 'vitest';

// Set up environment variables for Supabase (prevents import errors)
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock next/headers module
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(),
    has: vi.fn(),
    entries: vi.fn(() => []),
  })),
}));

// Mock next/navigation module
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Global test utilities
beforeAll(() => {
  // Suppress console errors during tests (optional)
  // vi.spyOn(console, 'error').mockImplementation(() => {});
});
