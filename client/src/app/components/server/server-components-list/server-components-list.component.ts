import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { collectConditionPayloadRefs } from '@shared/utils/serialized-operand';
import {
  concat,
  distinctUntilChanged,
  filter,
  from,
  map,
  Observable,
  of,
  startWith,
  switchMap,
  takeUntil,
} from 'rxjs';
import { ComponentHubService } from '../../../services/component-hub.service';
import { ContextHubService } from '../../../services/context-hub.service';
import { PostmanService } from '../../../services/postman.service';
import { contextChangeAffectsRef } from '../../../utils/collect-context-ref-dependencies';
import { ServerComponent } from '../server-component';
import { ServerComponentConfig } from '../server-component-config';
import { ServerComponentWrapperComponent } from '../server-component-wrapper/server-component-wrapper.component';
import {
  getActiveAnimationsTowardHidden,
  getActiveAnimationsTowardShown,
  reverseComponentAnimations,
  selectAnimationsToReverse,
  waitForAnimations,
} from '../utils/run-component-animations';

@Component({
  selector: 'app-server-components-list',
  imports: [AsyncPipe, ServerComponentWrapperComponent],
  templateUrl: './server-components-list.component.html',
  styleUrl: './server-components-list.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerComponentsListComponent implements OnChanges {
  components = input.required<ServerComponentConfig[]>();
  contextHub = inject(ContextHubService);
  destroyRef = inject(DestroyRef);
  cdr = inject(ChangeDetectorRef);
  componentHub = inject(ComponentHubService);
  elementRef = inject(ElementRef);
  postman = inject(PostmanService);
  conditions$ = new WeakMap<ServerComponentConfig, Observable<boolean>>();
  /** Учитывает leave-анимацию при переходе conditions true → false. */
  display$ = new WeakMap<ServerComponentConfig, Observable<boolean>>();
  ngOnChanges(changes: SimpleChanges): void {
    // Установка зависимостей для компонентов в виде Observable
    if ('components' in changes) {
      this.conditions$ = new WeakMap();
      this.display$ = new WeakMap();
      this.components().forEach((component) => {
        const conditions$ = this.prepareConditions(component);
        this.conditions$.set(component, conditions$);
        this.display$.set(
          component,
          this.prepareDisplay(component, conditions$),
        );
      });
    }
  }

  private prepareConditions(
    config: ServerComponentConfig,
  ): Observable<boolean> {
    if (!config.conditions || !config.conditions.length) {
      return of(true);
    }

    const entryId = this.componentHub.getEntryId(config.id)!;
    const contextValues$ = this.contextHub.change$.pipe(
      takeUntil(this.componentHub.entryDestroy$(entryId)),
      filter((payload) =>
        (config.conditions || []).some((condition) => {
          if (!('payload' in condition) || !condition.payload) {
            return false;
          }
          const refs = collectConditionPayloadRefs(condition.payload);
          return refs.some((ref) =>
            contextChangeAffectsRef(payload, ref, (key) =>
              this.contextHub.replacePlaceholders(key),
            ),
          );
        }),
      ),
      startWith(null as any),
    );
    return contextValues$.pipe(
      map(() => this.componentHub.conditionsMet(config.conditions || [])),
    );
  }

  private prepareDisplay(
    config: ServerComponentConfig,
    conditions$: Observable<boolean>,
  ): Observable<boolean> {
    return conditions$.pipe(
      distinctUntilChanged(),
      switchMap((visible) => {
        const instances = this.componentHub.getInstances(config.id);
        if (instances.length === 0) {
          return of(visible);
        }
        return this.displayTransition(
          visible,
          instances[0] as ServerComponent<ServerComponentConfig>,
          config,
        );
      }),
    );
  }

  /**
   * Переход display$: при смене conditions во время WAAPI разворачивает
   * незавершённые show/hide, если целевое состояние противоречит направлению.
   */
  private displayTransition(
    wantVisible: boolean,
    instance: ServerComponent<ServerComponentConfig>,
    config: ServerComponentConfig,
  ): Observable<boolean> {
    const element = instance.animationElement();
    const toReverse = selectAnimationsToReverse(element, wantVisible);
    if (toReverse.length > 0) {
      return concat(
        of(true),
        from(reverseComponentAnimations(toReverse)).pipe(
          switchMap(() =>
            this.finishAfterReversal(wantVisible, element, instance, config),
          ),
        ),
      );
    }

    return this.startDisplayTransition(wantVisible, element, instance, config);
  }

  /** После reverse in-flight анимация уже ведёт к цели — новый hide/show не нужен. */
  private finishAfterReversal(
    wantVisible: boolean,
    element: HTMLElement,
    instance: ServerComponent<ServerComponentConfig>,
    config: ServerComponentConfig,
  ): Observable<boolean> {
    if (wantVisible) {
      const towardShown = getActiveAnimationsTowardShown(element);
      if (towardShown.length > 0) {
        return concat(
          of(true),
          from(waitForAnimations(towardShown)).pipe(map(() => true)),
        );
      }
      return of(true);
    }

    const towardHidden = getActiveAnimationsTowardHidden(element);
    if (towardHidden.length > 0) {
      return concat(
        of(true),
        from(waitForAnimations(towardHidden)).pipe(map(() => false)),
      );
    }

    return of(false);
  }

  private startDisplayTransition(
    wantVisible: boolean,
    element: HTMLElement,
    instance: ServerComponent<ServerComponentConfig>,
    config: ServerComponentConfig,
  ): Observable<boolean> {
    if (wantVisible) {
      return of(true);
    }
    if (!this.hasHideAnimation(config)) {
      return of(false);
    }

    const hideTowardHidden = getActiveAnimationsTowardHidden(element);
    if (hideTowardHidden.length > 0) {
      return concat(
        of(true),
        from(waitForAnimations(hideTowardHidden)).pipe(map(() => false)),
      );
    }

    return concat(
      of(true),
      from(instance.animateInteraction('hide')).pipe(map(() => false)),
    );
  }

  private hasHideAnimation(config: ServerComponentConfig): boolean {
    return (
      config.interactions?.['hide']?.some(
        (interaction) => interaction.class === 'animate-component',
      ) ?? false
    );
  }
}
