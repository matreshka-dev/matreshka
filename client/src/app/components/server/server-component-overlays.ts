import { ServerComponentClass } from '@shared/enums/server-component-class';
import type { Overlay, ServerComponentConfig } from './server-component-config';

/** Entry-компоненты рендерят overlays внутри своего корня (dialog, popover). */
export const SERVER_COMPONENTS_WITH_INTERNAL_OVERLAYS = new Set([
  ServerComponentClass.Dialog,
  ServerComponentClass.Popover,
]);

export function getOverlaysFromConfig(
  config: ServerComponentConfig | undefined,
): Overlay[] {
  return config?.properties?.overlays ?? [];
}

export function shouldRenderOverlaysInWrapper(
  config: ServerComponentConfig,
): boolean {
  return (
    getOverlaysFromConfig(config).length > 0 &&
    !SERVER_COMPONENTS_WITH_INTERNAL_OVERLAYS.has(config.class)
  );
}
