import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';

// Глобальная инициализация Angular TestBed для всех Vitest‑тестов
getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
);
