import { isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  PLATFORM_ID,
  viewChild,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core';
import type { PanzoomObject } from '@panzoom/panzoom';
import { BoardSetCenterMessage } from '@shared/messages/bff-to-client/components/board/board-set-center-message';
import { BoardSetZoomMessage } from '@shared/messages/bff-to-client/components/board/board-set-zoom-message';
import { BoardZoomInMessage } from '@shared/messages/bff-to-client/components/board/board-zoom-in-message';
import { BoardZoomOutMessage } from '@shared/messages/bff-to-client/components/board/board-zoom-out-message';
import { BoardCenterChangeMessage } from '@shared/messages/client-to-bff/components/board/board-center-change-message';
import { BoardZoomChangeMessage } from '@shared/messages/client-to-bff/components/board/board-zoom-change-message';
import type {
  BoardConfig,
  BoardPoint,
  SerializedBoardItem,
} from '@shared/types/board-config';
import type { NestedItemsDiff } from '@shared/utils/diff-nested-items';
import { rem } from '../../../utils/rem';
import { NestedItemsHostComponent } from '../nested-items-host/nested-items-host.component';
import { ServerComponentsListComponent } from '../server-components-list/server-components-list.component';

let panzoomModulePromise:
  | Promise<typeof import('@panzoom/panzoom')>
  | undefined;

/** Ленивая загрузка `@panzoom/panzoom` (только в браузере). */
function loadPanzoom() {
  panzoomModulePromise ??= import('@panzoom/panzoom');
  return panzoomModulePromise;
}

@Component({
  selector: 'app-board',
  imports: [ServerComponentsListComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'board stack',
  },
})
export class BoardComponent extends NestedItemsHostComponent<
  BoardConfig,
  SerializedBoardItem
> {
  private readonly platformId = inject(PLATFORM_ID);
  viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  plane = viewChild<ElementRef<HTMLElement>>('plane');
  itemEls = viewChildren<ElementRef<HTMLElement>>('boardItem');

  private panzoom?: PanzoomObject;
  private currentCenter?: BoardPoint;
  private currentZoom?: number;
  /** Подавляет `emitViewChange` во время программного pan/zoom. */
  private isApplyingView = false;
  private resizeObserver?: ResizeObserver;

  /** Отправляет center/zoom на BFF после жеста пользователя. */
  private readonly onPanzoomEnd = () => this.emitViewChange();

  /** Колёсико мыши: zoom через panzoom и синхронизация с BFF. */
  private readonly onWheel = (event: WheelEvent) => {
    this.panzoom?.zoomWithWheel(event);
    this.emitViewChange();
  };

  /** Flat-список карточек board для шаблона. */
  get items(): SerializedBoardItem[] {
    return this.nestedItems();
  }

  /** Имя nested-slot'а в конфиге и `NestedItemsSyncMessage`. */
  protected nestedItemsSlot(): string {
    return 'items';
  }

  /** После incremental sync пересчитывает размер plane и ResizeObserver. */
  protected applyNestedItemsDiff(
    _diff: NestedItemsDiff<SerializedBoardItem>,
  ): void {
    this.refreshItemResizeObserver();
    this.updatePlaneSize();
  }

  /** CSS `left` карточки из логических координат BFF. */
  itemLeft(item: SerializedBoardItem): string | undefined {
    return rem(item.position.x);
  }

  /** CSS `top` карточки из логических координат BFF. */
  itemTop(item: SerializedBoardItem): string | undefined {
    return rem(item.position.y);
  }

  /** Подписка на команды BFF: set center/zoom и zoom in/out. */
  override ngOnInit(): void {
    super.ngOnInit();
    this.currentCenter = this.config.properties.center;
    this.currentZoom = this.config.properties.zoom;
    this.componentCommandMessages$.subscribe((message) => {
      if (message instanceof BoardSetCenterMessage) {
        this.currentCenter = message.payload;
        this.applyView();
      } else if (message instanceof BoardSetZoomMessage) {
        this.zoomToScaleAtViewportCenter(message.payload);
      } else if (message instanceof BoardZoomInMessage) {
        this.zoomBy(1);
      } else if (message instanceof BoardZoomOutMessage) {
        this.zoomBy(-1);
      }
    });
  }

  /** Инициализирует panzoom после появления viewport/plane в DOM. */
  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    if (isPlatformServer(this.platformId)) {
      return;
    }
    void this.initPanzoom();
  }

  /** Снимает panzoom, observer и слушатели. */
  override ngOnDestroy(): void {
    this.teardownPanzoom();
    super.ngOnDestroy();
  }

  /** Создаёт panzoom, слушатели wheel/panzoomend и первичный `applyView`. */
  private async initPanzoom(): Promise<void> {
    const viewport = this.viewport()?.nativeElement;
    const plane = this.plane()?.nativeElement;
    if (!viewport || !plane || this.panzoom) {
      return;
    }

    this.updatePlaneSize();

    const { default: Panzoom } = await loadPanzoom();
    if (this.panzoom) {
      return;
    }

    const minScale = this.config.properties.minZoom;
    const maxScale = this.config.properties.maxZoom;
    this.panzoom = Panzoom(plane, {
      canvas: true,
      minScale,
      maxScale,
      startScale: this.clampZoom(
        this.currentZoom ?? this.config.properties.zoom,
      ),
      cursor: 'grab',
      animate: false,
      step: this.zoomStep(),
    });

    viewport.addEventListener('wheel', this.onWheel, { passive: false });
    plane.addEventListener('panzoomend', this.onPanzoomEnd);

    this.refreshItemResizeObserver();
    this.resizeObserver?.observe(viewport);
    this.resizeObserver?.observe(plane);

    this.applyView();
  }

  /**
   * Наблюдает за viewport, plane и карточками:
   * resize viewport → `applyView`, resize item/plane → `updatePlaneSize`.
   */
  private refreshItemResizeObserver(): void {
    if (isPlatformServer(this.platformId)) {
      return;
    }
    this.resizeObserver?.disconnect();
    const viewport = this.viewport()?.nativeElement;
    const plane = this.plane()?.nativeElement;
    if (!viewport || !plane) {
      return;
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === viewport) {
          this.applyView();
        } else {
          this.updatePlaneSize();
        }
      }
    });
    this.resizeObserver.observe(viewport);
    this.resizeObserver.observe(plane);
    for (const item of this.itemEls()) {
      this.resizeObserver.observe(item.nativeElement);
    }
  }

  /** Уничтожает panzoom и отписывается от DOM-событий. */
  private teardownPanzoom(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    const viewport = this.viewport()?.nativeElement;
    const plane = this.plane()?.nativeElement;
    viewport?.removeEventListener('wheel', this.onWheel);
    plane?.removeEventListener('panzoomend', this.onPanzoomEnd);
    this.panzoom?.destroy();
    this.panzoom = undefined;
  }

  /** Шаговый zoom in/out относительно текущего масштаба. */
  private zoomBy(direction: 1 | -1): void {
    const current =
      this.currentZoom ??
      this.panzoom?.getScale() ??
      this.config.properties.zoom;
    this.zoomToScaleAtViewportCenter(
      this.clampZoom(current * Math.exp(direction * this.zoomStep())),
    );
  }

  private zoomStep(): number {
    return this.config.properties.zoomStep;
  }

  /**
   * Масштабирует plane вокруг центра viewport (как колёсико мыши),
   * а не вокруг статической точки `center` из BFF.
   */
  private zoomToScaleAtViewportCenter(nextScale: number): void {
    const panzoom = this.panzoom;
    const viewport = this.viewport()?.nativeElement;
    if (!panzoom || !viewport) {
      return;
    }

    const scale = this.clampZoom(nextScale);
    const viewportRect = viewport.getBoundingClientRect();
    const focalPoint = {
      clientX: viewportRect.left + viewportRect.width / 2,
      clientY: viewportRect.top + viewportRect.height / 2,
    };

    this.isApplyingView = true;
    panzoom.zoomToPoint(scale, focalPoint, { animate: false, force: true });
    this.isApplyingView = false;

    const center = this.readCenter();
    if (center) {
      this.currentCenter = center;
    }
    this.currentZoom = panzoom.getScale();
    this.emitViewChange();
  }

  /** Ограничивает zoom диапазоном `minZoom` / `maxZoom` из конфига. */
  private clampZoom(zoom: number): number {
    const min = this.config.properties.minZoom;
    const max = this.config.properties.maxZoom;
    return Math.min(max, Math.max(min, zoom));
  }

  /**
   * Применяет `currentCenter` и `currentZoom` к panzoom:
   * центрирует заданную точку plane в середине viewport.
   */
  private applyView(): void {
    const panzoom = this.panzoom;
    const viewport = this.viewport()?.nativeElement;
    const plane = this.plane()?.nativeElement;
    if (!panzoom || !viewport || !plane || viewport.clientWidth === 0) {
      return;
    }

    const scale = this.clampZoom(
      this.currentZoom ?? this.config.properties.zoom,
    );
    const center = this.currentCenter ?? this.config.properties.center;
    this.currentZoom = scale;
    this.currentCenter = center;

    this.isApplyingView = true;
    panzoom.zoom(scale, { animate: false, force: true, silent: true });

    const centerCss = {
      x: this.toCssPx(center.x),
      y: this.toCssPx(center.y),
    };
    const planeRect = plane.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const currentX = planeRect.left + centerCss.x * scale;
    const currentY = planeRect.top + centerCss.y * scale;
    const desiredX = viewportRect.left + viewportRect.width / 2;
    const desiredY = viewportRect.top + viewportRect.height / 2;
    panzoom.pan((desiredX - currentX) / scale, (desiredY - currentY) / scale, {
      relative: true,
      animate: false,
      force: true,
      silent: true,
    });
    this.isApplyingView = false;
  }

  /** Читает center/zoom из panzoom и отправляет на BFF (если не программное изменение). */
  private emitViewChange(): void {
    if (this.isApplyingView || !this.panzoom) {
      return;
    }
    const center = this.readCenter();
    const zoom = this.panzoom.getScale();
    if (!center) {
      return;
    }
    this.currentCenter = center;
    this.currentZoom = zoom;
    this.interact(
      'center-change',
      this.componentInteractionMessage(
        (target) => new BoardCenterChangeMessage(target, center),
      ),
    );
    this.interact(
      'zoom-change',
      this.componentInteractionMessage(
        (target) => new BoardZoomChangeMessage(target, zoom),
      ),
    );
  }

  /** Вычисляет логическую точку plane под центром viewport. */
  private readCenter(): BoardPoint | undefined {
    const panzoom = this.panzoom;
    const viewport = this.viewport()?.nativeElement;
    const plane = this.plane()?.nativeElement;
    if (!panzoom || !viewport || !plane) {
      return undefined;
    }
    const scale = panzoom.getScale();
    if (scale === 0) {
      return undefined;
    }
    const planeRect = plane.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const localX =
      (viewportRect.left + viewportRect.width / 2 - planeRect.left) / scale;
    const localY =
      (viewportRect.top + viewportRect.height / 2 - planeRect.top) / scale;
    return {
      x: this.toLogicalPx(localX),
      y: this.toLogicalPx(localY),
    };
  }

  /** Подгоняет размер plane под bounding box всех карточек. */
  private updatePlaneSize(): void {
    const plane = this.plane()?.nativeElement;
    if (!plane) {
      return;
    }
    const scale = this.panzoom?.getScale() ?? 1;
    const itemEls = this.itemEls();
    let maxX = 1;
    let maxY = 1;
    itemEls.forEach((itemRef) => {
      const el = itemRef.nativeElement;
      let width = el.offsetWidth;
      let height = el.offsetHeight;
      if ((!width || !height) && scale !== 0) {
        const rect = el.getBoundingClientRect();
        width = rect.width / scale;
        height = rect.height / scale;
      }
      maxX = Math.max(maxX, el.offsetLeft + width);
      maxY = Math.max(maxY, el.offsetTop + height);
    });
    const width = `${maxX}px`;
    const height = `${maxY}px`;
    if (plane.style.width !== width) {
      plane.style.width = width;
    }
    if (plane.style.height !== height) {
      plane.style.height = height;
    }
  }

  /** Логические px BFF → CSS px с учётом root `font-size`. */
  private toCssPx(logicalPx: number): number {
    return (logicalPx / 16) * this.rootFontSize();
  }

  /** CSS px → логические px BFF (обратно к `rem()` на сервере). */
  private toLogicalPx(cssPx: number): number {
    const root = this.rootFontSize();
    if (root === 0) {
      return cssPx;
    }
    return (cssPx * 16) / root;
  }

  /** Текущий root `font-size` документа в px (fallback 16). */
  private rootFontSize(): number {
    return (
      parseFloat(
        this.document.defaultView?.getComputedStyle(
          this.document.documentElement,
        ).fontSize ?? '',
      ) || 16
    );
  }
}
