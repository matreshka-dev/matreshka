import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Для Angular‑тестов нужен DOM и инициализация TestBed через setup‑файл
    environment: 'jsdom',
    globals: false,
    // setupFiles: ['src/test-setup.ts'],
  },
  resolve: {
    alias: {
      // Поддержка импортов вида @shared/...
      '@shared': resolve(__dirname, '../shared'),
    },
  },
});
