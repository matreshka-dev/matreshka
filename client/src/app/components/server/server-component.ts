import {
  afterNextRender,
  AfterViewInit,
  AnimationCallbackEvent,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  HostBinding,
  inject,
  Injector,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ComponentCommandMessage,
  isComponentCommandMessage,
} from '@shared/messages/bff-to-client/component-command-message';
import { ClientToBffMessage } from '@shared/messages/client-to-bff/client-to-bff-message';
import { ComponentEnterMessage } from '@shared/messages/client-to-bff/components/component-enter-message';
import { ComponentHideMessage } from '@shared/messages/client-to-bff/components/component-hide-message';
import { ComponentLeaveMessage } from '@shared/messages/client-to-bff/components/component-leave-message';
import { ComponentMouseEnterMessage } from '@shared/messages/client-to-bff/components/component-mouseenter-message';
import { ComponentMouseLeaveMessage } from '@shared/messages/client-to-bff/components/component-mouseleave-message';
import {
  ComponentScrollMessage,
  type ComponentScrollPayload,
} from '@shared/messages/client-to-bff/components/component-scroll-message';
import { ComponentShowMessage } from '@shared/messages/client-to-bff/components/component-show-message';
import type { ServerComponentInteraction } from '@shared/types/server-component-interaction';
import { componentIdMatchesInstance } from '@shared/utils/component-id';
import { filter, Observable, Subject } from 'rxjs';
import { ComponentHubService } from '../../services/component-hub.service';
import { ContextHubService } from '../../services/context-hub.service';
import { FontRegistryService } from '../../services/font-registry.service';
import { PostmanService } from '../../services/postman.service';
import type { Overlay } from './server-component-config';
import { ServerComponentConfig } from './server-component-config';
import { getOverlaysFromConfig } from './server-component-overlays';
import { applyContextValueUpdates } from './utils/apply-context-value-updates';
import {
  calculateGridItemStyles,
  calculateScaleStyles,
  calculateSizeStyles,
} from './utils/calculate-styles';
import {
  runComponentAnimations,
  type ComponentAnimationPayload,
} from './utils/run-component-animations';
import { subscribeThrottledScrollReport } from './utils/subscribe-throttled-scroll-report';

@Component({
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(animate.leave)': 'onAnimateLeave($event)',
    '(mouseenter)': 'onMouseEnter($event)',
    '(mouseleave)': 'onMouseLeave($event)',
  },
})
export abstract class ServerComponent<T extends ServerComponentConfig>
  implements OnInit, OnDestroy, AfterViewInit
{
  destroy$ = new Subject<void>();
  contextHub = inject(ContextHubService);
  postman = inject(PostmanService);
  componentHub = inject(ComponentHubService);
  fontRegistry = inject(FontRegistryService);
  destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  cdr = inject(ChangeDetectorRef);
  elementRef = inject(ElementRef);
  document = inject(DOCUMENT);
  componentStyles: object = {};
  id = input.required<string>();
  _configSignal = signal<T | undefined>(undefined);
  /** forEach: deferred removal строки — не применять ref до ListSync/unfreeze. */
  protected readonly contextFrozen = signal(false);

  get config(): T {
    return this._configSignal()!;
  }

  /** Оверлеи из `properties.overlays` текущего конфига. */
  protected overlays(): Overlay[] {
    return getOverlaysFromConfig(this._configSignal());
  }

  protected hasOverlays(): boolean {
    return this.overlays().length > 0;
  }

  /**
   * Узел для {@link runComponentAnimations}, когда в payload не задан `componentId`.
   * Переопределяется там, где хост Angular не совпадает с видимым корнем (например `<dialog>`).
   */
  animationElement(): HTMLElement {
    return this.elementRef.nativeElement as HTMLElement;
  }

  @HostBinding('style') get hostStyle() {
    return this.componentStyles;
  }

  ngAfterViewInit() {
    afterNextRender(
      () => {
        this.triggerLifecycle(this.enterInteractionType());
      },
      { injector: this.injector },
    );
  }

  constructor() {
    effect(() => {
      if (!this._configSignal()) {
        return;
      }
      this.calculateStyles();
      this.cdr.markForCheck();
    });
  }

  hasServerInteraction(event: string) {
    return this.config.interactions?.[event]?.some(
      (x) =>
        x.class === 'server-interaction' && this.interactionConditionsMet(x),
    );
  }

  /**
   * Поток команд BFF→клиент для этого использования: id в сообщении — instance id
   * или базовый id (broadcast всем использованиям одного server-компонента).
   * Завершается при уничтожении компонента.
   */
  protected get componentCommandMessages$(): Observable<ComponentCommandMessage> {
    return this.postman.incomingMessage$.pipe(
      filter(
        (message): message is ComponentCommandMessage =>
          isComponentCommandMessage(message) &&
          componentIdMatchesInstance(message.target, this.id()),
      ),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  /**
   * Троттлинг отчётов скролла + отправка {@link ComponentScrollMessage}, если
   * `getPayloadOrSkip` вернул не `null`.
   *
   * Кроме события `scroll`, клиент шлёт snapshot после изменения размеров и DOM
   * `measureElement` — чтобы BFF мог догрузить данные, если контент короче viewport.
   *
   * @param scrollTarget По умолчанию хост компонента; для страницы с прокруткой
   *   документа передай {@link Window} (см. `window.scrollTo` в PageComponent).
   * @param measureElement Элемент для ResizeObserver / MutationObserver; по умолчанию
   *   совпадает с `scrollTarget`, если это {@link Element}.
   */
  protected subscribeThrottledScrollReporting(
    getPayloadOrSkip: () => ComponentScrollPayload | null,
    scrollTarget: EventTarget = this.elementRef.nativeElement as HTMLElement,
    measureElement: Element = scrollTarget instanceof Element
      ? scrollTarget
      : (this.elementRef.nativeElement as HTMLElement),
  ): void {
    const reportScroll = () => {
      if (!this._configSignal()) {
        return;
      }
      const payload = getPayloadOrSkip();
      if (payload === null) {
        return;
      }
      this.interact(
        'scroll',
        () => new ComponentScrollMessage(this.id(), payload),
      );
    };

    subscribeThrottledScrollReport(
      scrollTarget,
      measureElement,
      this.destroyRef,
      reportScroll,
    );
  }

  calculateStyles() {
    const sizeStyles = calculateSizeStyles({
      flexItem: this.config.properties?.flexItem,
    });
    const scaleStyles = calculateScaleStyles({
      scale: this.config.properties?.scale,
    });

    const gridItemStyles = calculateGridItemStyles({
      gridItem: this.config.properties?.gridItem,
    });
    const fontStyles = this.calculateFontStyles();
    const textDecoration = this.config.properties?.textDecoration;
    this.componentStyles = {
      ...sizeStyles,
      ...scaleStyles,
      ...fontStyles,
      ...gridItemStyles,
      'text-align': this.config.properties?.textAlign,
      // text-decoration на хосте + CSS-переменная: у text-output host с display:contents
      ...(textDecoration
        ? {
            'text-decoration': textDecoration,
            '--text-decoration': textDecoration,
          }
        : {}),
    };
  }

  protected calculateFontStyles(): Record<string, string> {
    const fontStyles = this.fontRegistry.fontStyles(
      this.config.properties?.font,
    );
    const styles: Record<string, string> = {};

    if (fontStyles.fontFamily) {
      styles['--font-family'] = fontStyles.fontFamily;
    }
    if (fontStyles.fontWeight) {
      styles['font-weight'] = fontStyles.fontWeight;
    }
    if (fontStyles.fontSize) {
      styles['font-size'] = fontStyles.fontSize;
    }
    if (fontStyles.lineHeight) {
      styles['--line-height'] = fontStyles.lineHeight;
    }

    return styles;
  }

  ngOnInit() {
    this.subscribeContextFreezeState();
    this.componentHub
      .config$(this.id())
      ?.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((config) => {
        this._configSignal.set(config as T);
      });
    this.componentHub.addInstance(this.id(), this).subscribe(() => {
      // Добавление инстанса возвращает Subject, который вызывается когда компонент нужно ререндерить
      this.cdr.markForCheck();
    });
  }

  private subscribeContextFreezeState(): void {
    const configId = this.id();
    this.contextFrozen.set(this.componentHub.isConfigFrozen(configId));

    this.componentHub.freezeConfig$
      .pipe(
        filter((id) => id === configId),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.contextFrozen.set(true);
      });

    this.componentHub.unfreezeConfig$
      .pipe(
        filter((id) => id === configId),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.contextFrozen.set(false);
      });
  }

  ngOnDestroy() {
    this.componentHub.deleteInstance(this.id(), this);
    if (!this.componentHub.isEntryDestroyActive()) {
      this.triggerLifecycle(this.leaveInteractionType());
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Leave-хук Angular: держит узел в DOM, пока не завершится hide-анимация.
   * Вешается на хост ServerComponent (не на wrapper с display:contents).
   */
  onAnimateLeave(event: AnimationCallbackEvent): void {
    this.animateInteraction('hide').finally(() => event.animationComplete());
  }

  protected enterInteractionType(): 'show' | 'enter' {
    return 'show';
  }

  protected leaveInteractionType(): 'hide' | 'leave' {
    return 'hide';
  }

  triggerLifecycle(
    type: 'show' | 'hide' | 'enter' | 'leave',
  ): Promise<Animation[]> {
    return this.interact(type, () => this.createLifecycleMessage(type));
  }

  onMouseEnter(_event: MouseEvent): void {
    if (!this.config.interactions?.['mouseenter']?.length) {
      return;
    }
    this.interact(
      'mouseenter',
      () => new ComponentMouseEnterMessage(this.id()),
    );
  }

  onMouseLeave(_event: MouseEvent): void {
    if (!this.config.interactions?.['mouseleave']?.length) {
      return;
    }
    this.interact(
      'mouseleave',
      () => new ComponentMouseLeaveMessage(this.id()),
    );
  }

  animateInteraction(type: string): Promise<Animation[]> {
    const animateByTarget = new Map<string, ComponentAnimationPayload[]>();
    this.config.interactions?.[type]?.forEach((interaction) => {
      if (
        interaction.class !== 'animate-component' ||
        !this.interactionConditionsMet(interaction)
      ) {
        return;
      }
      const payload = interaction.payload as ComponentAnimationPayload;
      const rawId = payload.componentId;
      const targetId =
        rawId !== undefined && rawId !== ''
          ? this.contextHub.replacePlaceholders(rawId)
          : this.id();
      const batch = animateByTarget.get(targetId);
      if (batch) {
        batch.push(payload);
      } else {
        animateByTarget.set(targetId, [payload]);
      }
    });
    if (animateByTarget.size === 0) {
      return Promise.resolve([]);
    }

    const runs: Promise<Animation[]>[] = [];
    for (const [targetId, payloads] of animateByTarget) {
      let targets = this.componentHub.getInstancesByComponentId(targetId);
      // При leave config уже мог быть удалён из hub (forEach), но инстанс ещё в DOM.
      if (
        targets.length === 0 &&
        (targetId === this.id() ||
          componentIdMatchesInstance(targetId, this.id()))
      ) {
        targets = [this];
      }
      for (const target of targets) {
        const el = target.animationElement();
        runs.push(
          runComponentAnimations(
            el,
            payloads,
            type === 'show' || type === 'hide' ? type : undefined,
          ),
        );
      }
    }
    return Promise.all(runs).then((batches) => batches.flat());
  }

  interact(
    type: string,
    createMessage: () => ClientToBffMessage,
  ): Promise<Animation[]> {
    // Накопление animate-component по целевому id до явного сброса (не применяем по одному в цикле).
    const animateByTarget = new Map<string, ComponentAnimationPayload[]>();
    let hasActiveServerInteraction = false;

    // Conditions снимаем до выполнения: иначе первый set-context-value меняет
    // Context, и взаимоисключающие действия в том же массиве начинают срабатывать подряд.
    const interactions = (this.config.interactions?.[type] || []).filter(
      (interaction) => this.interactionConditionsMet(interaction),
    );

    interactions.forEach((interaction) => {
      if (interaction.class === 'server-interaction') {
        hasActiveServerInteraction = true;
        return;
      }

      switch (interaction.class) {
        case 'write-text-to-clipboard':
          navigator.clipboard.writeText(
            this.contextHub.replacePlaceholders(
              (interaction.payload as { text: string }).text,
            ),
          );
          break;
        case 'set-context-value': {
          const payload = interaction.payload as {
            ref: string;
            value: unknown;
          };
          applyContextValueUpdates(this.contextHub, [payload]);
          break;
        }
        case 'set-context-values': {
          const payload = interaction.payload as {
            values: { ref: string; value: unknown }[];
          };
          applyContextValueUpdates(this.contextHub, payload.values);
          break;
        }
        case 'toggle-context-value': {
          const payload = interaction.payload as { ref: string };
          applyContextValueUpdates(this.contextHub, [
            {
              ref: payload.ref,
              value: !this.contextHub.value(payload.ref),
            },
          ]);
          break;
        }
        case 'animate-component':
          // skip - выполняется ниже
          break;
        default:
          console.error('Unknown component interaction = ' + interaction.class);
      }
    });

    let animations = Promise.resolve([] as Animation[]);
    if (type !== 'hide') {
      // Для удаления компонента используются специфические способы запуска чтобы дождаться окончания анимации
      animations = this.animateInteraction(type);
    }

    if (hasActiveServerInteraction) {
      this.postman.outcomingMessage$.next(createMessage());
    }

    return animations;
  }

  protected createLifecycleMessage(
    type: 'show' | 'hide' | 'enter' | 'leave',
  ): ClientToBffMessage {
    switch (type) {
      case 'show':
        return new ComponentShowMessage(this.id());
      case 'hide':
        return new ComponentHideMessage(this.id());
      case 'enter':
        return new ComponentEnterMessage(this.id());
      case 'leave':
        return new ComponentLeaveMessage(this.id());
    }
  }

  private interactionConditionsMet(
    interaction: ServerComponentInteraction,
  ): boolean {
    if (!interaction.conditions || interaction.conditions.length === 0) {
      return true;
    }

    return this.componentHub.conditionsMet(interaction.conditions);
  }
}
