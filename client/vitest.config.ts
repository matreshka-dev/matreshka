import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@matreshka/client-bff-protocol': path.resolve(
        __dirname,
        '../protocols/client-bff-protocol',
      ),
      '@matreshka/shared': path.resolve(__dirname, '../shared'),
    },
  },
  test: {
    // Для Angular‑тестов нужен DOM и инициализация TestBed через setup‑файл
    environment: 'jsdom',
    globals: false,
    // setupFiles: ['src/test-setup.ts'],
  },
});
