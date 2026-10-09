import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  PLATFORM_ID,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PopoverCloseMessage } from '@shared/messages/bff-to-client/components/popover/popover-close-message';
import { AppDestroyEntryInstanceMessage } from '@shared/messages/client-to-bff/app';
import type { PopoverConfig } from '@shared/types/popover-config';
import { filter } from 'rxjs';
import { PopupService } from '../../../services/popup.service';
import { OverlaysComponent } from '../../local/overlays/overlays.component';
import { EntryServerComponent } from '../entry-server-component';
import { ServerComponentsListComponent } from '../server-components-list/server-components-list.component';
import {
  calculatePopoverWidth,
  calculateScaleStyles,
} from '../utils/calculate-styles';
import {
  applyPopoverViewportClampStyles,
  computePopoverViewportMaxAvailable,
  getVisualViewportBounds,
  popoverViewportClampKey,
} from './popover-viewport-clamp';

@Component({
  selector: 'app-popover',
  imports: [ServerComponentsListComponent, OverlaysComponent],
  templateUrl: './popover.component.html',
  styleUrl: './popover.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.display]': '"contents"',
  },
})
export class PopoverComponent
  extends EntryServerComponent<PopoverConfig>
  implements OnInit, AfterViewInit
{
  private readonly popupService = inject(PopupService);
  private readonly platformId = inject(PLATFORM_ID);
  private popoverWidth?: string;
  private isViewInitialized = false;
  /** Динамический clamp (--popover-max-*) только при positionArea. */
  private viewportClampEnabled = false;
  private viewportClampRaf = 0;
  private lastViewportClampKey: string | null = null;

  private readonly popoverRef =
    viewChild.required<ElementRef<HTMLElement>>('popoverRoot');

  override ngOnInit() {
    super.ngOnInit();
    this.componentCommandMessages$
      .pipe(
        filter(
          (message): message is PopoverCloseMessage =>
            message instanceof PopoverCloseMessage,
        ),
      )
      .subscribe(() => {
        this.popupService.close$.next(this.id());
      });
  }

  override ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      super.ngAfterViewInit();
      return;
    }
    this.isViewInitialized = true;
    const el = this.popoverRef().nativeElement;
    this.applyPopoverWidth();
    const popoverId = this.id();
    const anchor = this.popupService.getPopoverAnchor(this.id());
    const positionArea = this.config.properties.positionArea;
    if (anchor) {
      anchor.setAttribute('popovertarget', popoverId);
      anchor.setAttribute('popovertargetaction', 'show');
      if (positionArea) {
        const anchorCssName = `--popover-${this.id()}`;
        anchor.style.setProperty('anchor-name', anchorCssName);
        el.style.setProperty('position', 'fixed');
        el.style.setProperty('position-anchor', anchorCssName);
        el.style.setProperty('position-area', positionArea);
        el.classList.add('native-popover--anchor-positioned');
        this.viewportClampEnabled = true;
        this.bindViewportClamp(el);
      } else {
        el.classList.add('native-popover--not-positioned');
      }
    }
    el.showPopover();
    if (this.viewportClampEnabled) {
      this.scheduleInitialViewportClamps(el);
    }
    this.bindLightDismiss(el);

    this.popupService.close$
      .pipe(
        filter((id) => id === this.id()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (!isPlatformBrowser(this.platformId)) {
          return;
        }
        this.componentHub.destroyEntry(this.id());
        Promise.all([
          this.triggerLifecycle('leave'),
          this.componentHub.animateSubtree(this.id(), 'hide', {
            skipRoot: true,
          }),
        ]).then(() => {
          this.popupService.readyForDestroy$.next(this.id());
        });
      });

    // Хост с display:contents не подходит для animate-component; после showPopover — в top layer.
    super.ngAfterViewInit();
  }

  override animationElement(): HTMLElement {
    return this.popoverRef().nativeElement;
  }

  override calculateStyles() {
    this.componentStyles = {
      ...this.calculateFontStyles(),
      ...calculateScaleStyles({
        scale: this.config.properties?.scale,
      }),
    };
    this.popoverWidth = calculatePopoverWidth({
      size: this.config.properties?.size, // По умолчанию ширина совпадает с якорем
    });
    if (this.isViewInitialized) {
      this.applyPopoverWidth();
    }
  }

  /** Закрытие по клику снаружи и Escape — при `popover="manual"` UA light dismiss отключён. */
  private bindLightDismiss(el: HTMLElement): void {
    const onPointerDown = (event: PointerEvent) => {
      if (!this.popupService.isTopPopover(this.id())) {
        return;
      }
      const path = event.composedPath();
      if (path.includes(el)) {
        return;
      }
      const anchorEl = this.popupService.getPopoverAnchor(this.id());
      if (anchorEl && path.includes(anchorEl)) {
        return;
      }
      this.popupService.close$.next(this.id());
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        !this.popupService.isTopPopover(this.id())
      ) {
        return;
      }
      event.preventDefault();
      this.popupService.close$.next(this.id());
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    });
  }

  private applyPopoverWidth(): void {
    const el = this.popoverRef().nativeElement;
    if (this.popoverWidth) {
      el.style.setProperty('width', this.popoverWidth);
    } else {
      el.style.removeProperty('width');
    }
  }

  /**
   * Пересчёт --popover-max-* при scroll/resize viewport и якоря (без ResizeObserver на popover:
   * иначе max-* ↔ layout ↔ RO зацикливаются, особенно с overflow: auto у потомков).
   */
  private bindViewportClamp(el: HTMLElement): void {
    const update = () => {
      this.scheduleViewportClampOnFrame(el);
    };
    const vv = window.visualViewport;
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    this.destroyRef.onDestroy(() => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      if (this.viewportClampRaf) {
        cancelAnimationFrame(this.viewportClampRaf);
      }
      this.lastViewportClampKey = null;
      applyPopoverViewportClampStyles(el, null);
    });
  }

  /** Несколько кадров после showPopover — anchor layout и async server-components-list. */
  private scheduleInitialViewportClamps(el: HTMLElement): void {
    this.scheduleViewportClampOnFrame(el);
    requestAnimationFrame(() => {
      this.scheduleViewportClampOnFrame(el);
      requestAnimationFrame(() => {
        this.scheduleViewportClampOnFrame(el);
      });
    });
  }

  /** Не чаще одного пересчёта на кадр; пропуск, если clamp не изменился. */
  private scheduleViewportClampOnFrame(el: HTMLElement): void {
    if (this.viewportClampRaf) {
      return;
    }
    this.viewportClampRaf = requestAnimationFrame(() => {
      this.viewportClampRaf = 0;
      this.updateViewportClamp(el);
    });
  }

  private updateViewportClamp(el: HTMLElement): void {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return;
    }
    const clamp = computePopoverViewportMaxAvailable(
      el,
      getVisualViewportBounds(),
      this.popupService.getPopoverAnchor(this.id()),
    );
    const key = popoverViewportClampKey(clamp);
    if (key === this.lastViewportClampKey) {
      return;
    }
    this.lastViewportClampKey = key;
    applyPopoverViewportClampStyles(el, clamp);
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.componentHub.deleteConfig(this.config);
    this.postman.outcomingMessage$.next(
      new AppDestroyEntryInstanceMessage({ id: this.id() }),
    );
  }
}
