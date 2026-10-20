import '@testing-library/jest-dom';
import { vi } from 'vitest';

// The App Router context does not exist under jsdom; components only need these hooks to render.
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/vi',
  useParams: () => ({ locale: 'vi' }),
  useSearchParams: () => new URLSearchParams(),
}));
