import { vi } from 'vitest';
import type { SsrServiceApi } from '../ssr.service';

export class TestSsrService implements SsrServiceApi {
  addTask = vi.fn(() => vi.fn());
  cleanupTask = vi.fn();
}
