export const PREFERS_COLOR_SCHEME_STORAGE_KEY = 'prefersColorScheme';

export type ColorSchemePreference = 'light' | 'dark' | 'system';

export function getStoredPrefersColorScheme(): 'light' | 'dark' | null {
  const raw = localStorage.getItem(PREFERS_COLOR_SCHEME_STORAGE_KEY);
  return raw === 'light' || raw === 'dark' ? raw : null;
}

/**
 * Применяет выбранную схему к документу. При persist — синхронизирует localStorage
 * (режим system удаляет сохранённое значение).
 */
export function applyColorSchemePreference(
  document: Document,
  mode: ColorSchemePreference,
  persist: boolean,
): void {
  const root = document.documentElement;
  if (mode === 'system') {
    root.removeAttribute('data-color-scheme');
    root.style.removeProperty('color-scheme');
    if (persist) {
      localStorage.removeItem(PREFERS_COLOR_SCHEME_STORAGE_KEY);
    }
    return;
  }
  root.setAttribute('data-color-scheme', mode);
  root.style.colorScheme = mode;
  if (persist) {
    localStorage.setItem(PREFERS_COLOR_SCHEME_STORAGE_KEY, mode);
  }
}

/** Восстанавливает тему из localStorage при старте приложения. */
export function applyStoredColorSchemePreference(document: Document): void {
  const stored = getStoredPrefersColorScheme();
  if (stored) {
    applyColorSchemePreference(document, stored, false);
  } else {
    applyColorSchemePreference(document, 'system', false);
  }
}
