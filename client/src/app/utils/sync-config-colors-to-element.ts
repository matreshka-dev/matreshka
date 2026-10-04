import { ColorRole } from '@shared/enums/color-role';
import { registerColorRole } from './register-colors';

export function syncConfigColorsToElement(
  document: Document,
  element: HTMLElement,
  colors: Partial<Record<ColorRole, string>> | undefined,
  appliedColorClasses: Set<string>,
): void {
  appliedColorClasses.forEach((className) => {
    element.classList.remove(className);
  });
  appliedColorClasses.clear();
  if (!colors) {
    return;
  }
  Object.entries(colors).forEach(([role, paletteId]) => {
    const className = 'color-token-' + paletteId + '-' + role;
    registerColorRole(document, paletteId, role as ColorRole);
    element.classList.add(className);
    appliedColorClasses.add(className);
  });
}
