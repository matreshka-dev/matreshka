import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  inject,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ComponentOutline, OutlineType } from '@shared/enums/outline-type';
import { Overflow } from '@shared/enums/overflow';
import { SafeAreaSide } from '@shared/enums/safe-area-side';
import { StackDirection } from '@shared/enums/stack-direction';
import { ComponentScrollToMessage } from '@shared/messages/bff-to-client/components/component-scroll-to-message';
import { ComponentClickMessage } from '@shared/messages/client-to-bff/components/component-click-message';
import { ComponentKeyDownMessage } from '@shared/messages/client-to-bff/components/component-keydown-message';
import type { StackConfig } from '@shared/types/stack-config';
import { resolveScrollToOffset } from '@shared/utils/resolve-scroll-to-offset';
import { WINDOW } from '../../../tokens/window';
import { normalizePaddingPx } from '../../../utils/normalize-padding-px';
import { normalizeRadiusPx } from '../../../utils/normalize-radius-px';
import { rem } from '../../../utils/rem';
import { ServerComponent } from '../server-component';
import { ServerComponentsListComponent } from '../server-components-list/server-components-list.component';
import {
  readHorizontalScrollPayload,
  readVerticalScrollPayload,
} from '../utils/subscribe-throttled-scroll-report';

@Component({
  selector: 'app-stack',
  imports: [forwardRef(() => ServerComponentsListComponent)],
  templateUrl: './stack.component.html',
  styleUrl: './stack.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.stack]': 'stackLayoutVertical',
    '[class.row]': 'stackLayoutHorizontal',
    '[class.safe-area-top]': 'hasSafeArea(SafeAreaSide.Top)',
    '[class.safe-area-bottom]': 'hasSafeArea(SafeAreaSide.Bottom)',
    '[class.safe-area-start]': 'hasSafeArea(SafeAreaSide.Start)',
    '[class.safe-area-end]': 'hasSafeArea(SafeAreaSide.End)',
    '[style.--padding-top]': 'rem(paddingPx.top)',
    '[style.--padding-bottom]': 'rem(paddingPx.bottom)',
    '[style.--padding-start]': 'rem(paddingPx.start)',
    '[style.--padding-end]': 'rem(paddingPx.end)',
    '[style.align-items]': 'config.properties.align?.main',
    '[style.justify-content]': 'config.properties.align?.cross',
    '[style.gap]': 'rem(config.properties.gap)',
    '[style.overflow]': 'config.properties.overflow',
    '[style.flex-wrap]': 'config.properties.wrap',
    '[style.border-start-start-radius]': 'rem(radiusPx.topStart)',
    '[style.border-start-end-radius]': 'rem(radiusPx.topEnd)',
    '[style.border-end-start-radius]': 'rem(radiusPx.bottomStart)',
    '[style.border-end-end-radius]': 'rem(radiusPx.bottomEnd)',
    '[class.surface]': 'config.properties.surface',
    '[class.focused-container]': 'config.properties.focusWithinStyle',
    '[class.shadow-outline]': 'hasShadowOutline',
    '[class.border-outline]': 'hasBorderOutline',
    '[class.pointer-transparent]': '!config.properties.surface', // Сделано чтобы клики по таким контейнерам внутри оверлея проходили сквозь них, вне оверлея это будет незаметно.
    '[style.--border-width.px]': 'borderOutlineWidth',
    '[class.interactive]': 'isStackInteractive',
    '[class.stack--native-action]': 'useNativeClickButton',
    '[class.stack--disabled]': 'isStackDisabled',
    '[attr.tabindex]': 'hostClickFallbackTabIndex',
    '[attr.aria-disabled]': 'hostAriaDisabled',
    '(click)': 'onHostClickFallback($event)',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class StackComponent extends ServerComponent<StackConfig> {
  pixelElementRef = viewChild<ElementRef<HTMLDivElement>>('pixel', {});
  window = inject(WINDOW);
  protected readonly rem = rem;
  protected readonly SafeAreaSide = SafeAreaSide;

  override ngOnInit() {
    super.ngOnInit();
    this.subscribeThrottledScrollReporting(() => {
      if (!this.stackScrollableVertical && !this.stackScrollableHorizontal) {
        return null;
      }
      if (!this.hasServerInteraction('scroll')) {
        return null;
      }
      const el = this.elementRef.nativeElement as HTMLElement;
      return this.stackLayoutHorizontal
        ? readHorizontalScrollPayload(el)
        : readVerticalScrollPayload(el);
    });

    this.componentCommandMessages$.subscribe((message) => {
      if (message instanceof ComponentScrollToMessage) {
        const behavior = message.payload.smooth ? 'smooth' : 'instant';
        const el = this.elementRef.nativeElement as HTMLElement;
        // timer(100).subscribe(() => {
        //   // TODO 100 мс как магическая константа, не помню что за число, кажется как-то связано с foreach

        // });
        if (this.stackLayoutHorizontal) {
          const left = resolveScrollToOffset(
            { scrollSize: el.scrollWidth, viewportSize: el.clientWidth },
            message.payload.value,
          );
          el.scrollTo({ left, behavior });
        } else {
          const top = resolveScrollToOffset(
            { scrollSize: el.scrollHeight, viewportSize: el.clientHeight },
            message.payload.value,
          );
          el.scrollTo({ top, behavior });
        }
      }
    });
  }

  get stackLayoutVertical(): boolean {
    return this.config.properties.direction !== StackDirection.Horizontal;
  }

  get stackLayoutHorizontal(): boolean {
    return this.config.properties.direction === StackDirection.Horizontal;
  }

  get stackScrollableVertical(): boolean {
    return this.stackLayoutVertical && this.allowsOverflowScroll;
  }

  get stackScrollableHorizontal(): boolean {
    return this.stackLayoutHorizontal && this.allowsOverflowScroll;
  }

  /** Без `overflow` и при `auto`/`scroll` контейнер сжимается и может прокручиваться. */
  private get allowsOverflowScroll(): boolean {
    const overflow = this.config.properties.overflow;
    return (
      overflow === undefined ||
      overflow === Overflow.Auto ||
      overflow === Overflow.Scroll
    );
  }

  get paddingPx() {
    return normalizePaddingPx(this.config.properties.padding);
  }

  protected hasSafeArea(side: SafeAreaSide): boolean {
    return this.config.properties.safeArea?.includes(side) ?? false;
  }

  get radiusPx() {
    return normalizeRadiusPx(this.config.properties.radius);
  }

  get outlines(): ComponentOutline[] | undefined {
    return this.config.properties.outline;
  }

  get hasBorderOutline(): boolean {
    return (
      this.outlines?.some((outline) => outline.type === OutlineType.Border) ??
      false
    );
  }

  get hasShadowOutline(): boolean {
    return (
      this.outlines?.some((outline) => outline.type === OutlineType.Shadow) ??
      false
    );
  }

  get borderOutlineWidth(): number | undefined {
    const borderOutline = this.outlines?.find(
      (outline) => outline.type === OutlineType.Border,
    );

    return borderOutline?.properties?.width;
  }

  /** Клик уходит на BFF (есть server/local interactions). */
  get hasServerClickInteraction(): boolean {
    return !!this.config.interactions?.['click']?.length;
  }

  /** Нажатие клавиши уходит на BFF только когда фокус на host app-stack. */
  get hasServerKeyDownInteraction(): boolean {
    return !!this.config.interactions?.['keydown']?.length;
  }

  /** Не задано или false с BFF — считаем активным; отключение только при явном `true`. */
  get isStackDisabled(): boolean {
    return this.config.properties.disabled === true;
  }

  /** Как у кнопки: hover/focus-стили .interactive только если не disabled. */
  get isStackInteractive(): boolean {
    return (
      (this.hasServerClickInteraction || !!this.config.properties.link) &&
      !this.isStackDisabled
    );
  }

  /**
   * Нативная кнопка только без link: иначе компонент оборачивается в <a>,
   * и <button> внутри ссылки недопустим по HTML.
   */
  get useNativeClickButton(): boolean {
    return (
      this.hasServerClickInteraction &&
      !this.hasServerKeyDownInteraction &&
      !this.config.properties.link
    );
  }

  /**
   * Клавиатурные interaction требуют фокуса на host; link остаётся в fallback-режиме.
   */
  get hostClickFallbackTabIndex(): number | null {
    if (this.isStackDisabled) {
      return null;
    }
    if (this.hasServerKeyDownInteraction) {
      return 0;
    }
    if (!this.hasServerClickInteraction || this.useNativeClickButton) {
      return null;
    }
    return 0;
  }

  /**
   * Для не-кнопочного режима (обёртка link): явное состояние для вспомогательных технологий.
   */
  get hostAriaDisabled(): string | null {
    if (
      !this.isStackDisabled ||
      this.useNativeClickButton ||
      !this.config.properties.link
    ) {
      return null;
    }
    return 'true';
  }

  onHostClickFallback($event: MouseEvent) {
    if (this.useNativeClickButton) {
      // У <button class="stack__action"> раньше был display:contents — без собственной
      // области попадания; клики по padding хоста и «пустым» зонам flex попадают сюда,
      // а не на кнопку. Обрабатываем только такие случаи, без дубля при клике по контенту.
      if (
        !this.isStackDisabled &&
        this.hasServerClickInteraction &&
        $event.target === this.elementRef.nativeElement
      ) {
        this.onClick($event);
      }
      return;
    }
    if (this.isStackDisabled) {
      $event.preventDefault();
      $event.stopPropagation();
      return;
    }
    this.onClick($event);
  }

  onClick($event: MouseEvent) {
    if (this.isStackDisabled || !this.hasServerClickInteraction) {
      return;
    }
    if (!this.config.properties.link) {
      $event.stopPropagation();
    }
    this.interact(
      'click',
      this.componentInteractionMessage(
        (target) => new ComponentClickMessage(target),
      ),
    );
  }

  onKeyDown(event: KeyboardEvent): void {
    if (
      event.target !== this.elementRef.nativeElement ||
      !this.hasServerKeyDownInteraction
    ) {
      return;
    }

    event.stopPropagation();
    this.interact(
      'keydown',
      this.componentInteractionMessage(
        (target) => new ComponentKeyDownMessage(target, { key: event.key }),
      ),
    );
  }
}
