import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Для Angular‑тестов нужен DOM и инициализация TestBed через setup‑файл
    environment: 'jsdom',
    globals: false,
    // setupFiles: ['src/test-setup.ts'],
  },
});
