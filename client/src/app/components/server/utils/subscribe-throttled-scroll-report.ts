import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ComponentScrollPayload } from '@matreshka/client-bff-protocol/messages/client-to-bff/components/component-scroll-message';
import { asyncScheduler, fromEvent, Observable } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

/** Троттлинг отчётов скролла на BFF: первый и последний кадр в серии событий. */
export const SERVER_COMPONENT_SCROLL_REPORT_THROTTLE_MS = 120;

export function readVerticalScrollPayload(
  el: HTMLElement,
): ComponentScrollPayload {
  return {
    offset: el.scrollTop,
    viewportSize: el.clientHeight,
    contentSize: el.scrollHeight,
  };
}

/** Вертикальный скролл страницы, когда прокручивается viewport (как при `window.scrollTo`). */
export function readWindowVerticalScrollPayload(
  win: Window,
  docEl: HTMLElement,
): ComponentScrollPayload {
  return {
    offset: win.scrollY,
    viewportSize: win.innerHeight,
    contentSize: docEl.scrollHeight,
  };
}

export function readHorizontalScrollPayload(
  el: HTMLElement,
): ComponentScrollPayload {
  return {
    offset: el.scrollLeft,
    viewportSize: el.clientWidth,
    contentSize: el.scrollWidth,
  };
}

function observeElementResize(element: Element): Observable<void> {
  return new Observable<void>((subscriber) => {
    if (typeof ResizeObserver === 'undefined') {
      subscriber.complete();
      return;
    }
    const observer = new ResizeObserver(() => subscriber.next());
    observer.observe(element);
    return () => observer.disconnect();
  });
}

/**
 * Пассивный listener + throttle: общий контур для {@link ServerComponent}
 * (хост, `window`, и т.д.).
 */
export function subscribeThrottledScroll(
  target: EventTarget,
  destroyRef: DestroyRef,
  onScroll: () => void,
  throttleMs: number = SERVER_COMPONENT_SCROLL_REPORT_THROTTLE_MS,
): void {
  fromEvent(target, 'scroll', { passive: true })
    .pipe(
      throttleTime(throttleMs, asyncScheduler, {
        leading: true,
        trailing: true,
      }),
      takeUntilDestroyed(destroyRef),
    )
    .subscribe(() => onScroll());
}

/** Отчёты изменения размера на BFF: только `ResizeObserver` на измеряемом элементе. */
export function subscribeThrottledResizeReport(
  measureElement: Element,
  destroyRef: DestroyRef,
  onReport: () => void,
  throttleMs: number = SERVER_COMPONENT_SCROLL_REPORT_THROTTLE_MS,
): void {
  observeElementResize(measureElement)
    .pipe(
      throttleTime(throttleMs, asyncScheduler, {
        leading: true,
        trailing: true,
      }),
      takeUntilDestroyed(destroyRef),
    )
    .subscribe(() => onReport());
}
