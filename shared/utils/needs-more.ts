import type { ComponentScrollPayload } from "../messages/client-to-bff/components/component-scroll-message";

/** Расстояние до конца контента по оси скролла (логика как в {@link ComponentScrollPayload}). */
export function scrollDistanceToEnd(payload: ComponentScrollPayload): number {
  return payload.contentSize - payload.offset - payload.viewportSize;
}

/**
 * Нужна ли ещё порция данных для infinite scroll:
 * пользователь почти у конца или контент короче viewport (скролла нет).
 */
export function needsMore(
  payload: ComponentScrollPayload,
  nearEndPx: number,
): boolean {
  if (scrollDistanceToEnd(payload) <= nearEndPx) {
    return true;
  }
  return payload.contentSize <= payload.viewportSize;
}
