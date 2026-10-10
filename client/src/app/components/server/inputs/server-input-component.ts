import {
  ChangeDetectionStrategy,
  Component,
  effect,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { InputConfig } from '@shared/types/input-config';
import {
  animationFrameScheduler,
  filter,
  map,
  Subscription,
  take,
  takeUntil,
  timer,
} from 'rxjs';
import { contextChangeAffectsRef } from '../../../utils/collect-context-ref-dependencies';
import { parseContextPath } from '../../../utils/parse-context-path';
import { ServerComponent } from '../server-component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
})
export abstract class ServerInputComponent<
    T extends InputConfig,
    ValueType = unknown,
  >
  extends ServerComponent<T>
  implements OnInit
{
  abstract default(): ValueType;

  value = signal<ValueType>(this.default());
  protected updatingFromContext = signal(false);
  private autofillValuePoll: Subscription | null = null;
  constructor() {
    super();
    // Отслеживание изменений через сигнал value и запись в контекст
    effect(() => {
      const newValue = this.value();
      // Пропускаем изменения, если они идут из контекста
      if (this.updatingFromContext()) {
        return;
      }
      this.writeValueToContext(newValue);
    });
  }

  override ngOnInit() {
    super.ngOnInit();
    // Инициализация значения
    let defaultValue = this.contextHub.value(this.config.properties.ref);
    if (typeof defaultValue === 'undefined') {
      defaultValue = this.default();
    }
    const initialValue = this.castValueForComponent(defaultValue);
    this.updatingFromContext.set(true);
    this.value.set(initialValue);
    this.updatingFromContext.set(false);

    const entryId = this.componentHub.getEntryId(this.id())!;
    const ref = this.config.properties.ref;
    // Holds на hub не заменяют фильтр: не реагируем на change$ чужих contextId.
    this.contextHub.change$
      .pipe(
        filter((payload) =>
          contextChangeAffectsRef(payload, ref, (path) =>
            this.contextHub.replacePlaceholders(path),
          ),
        ),
        takeUntil(this.componentHub.entryDestroy$(entryId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        // forEach: deferred removal строки списка
        if (this.contextFrozen()) {
          return;
        }
        const currentValue = this.value();
        let newValue: ValueType | undefined = this.contextHub.value(
          this.config.properties.ref,
        ) as ValueType | undefined;
        if (typeof newValue === 'undefined') {
          newValue = this.default();
        }
        newValue = this.castValueForComponent(newValue); // Чтобы совпадали по типу с currentValue
        if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
          this.updatingFromContext.set(true);
          this.value.set(newValue);
          this.updatingFromContext.set(false);
        }
      });
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value as ValueType);
  }

  onAutofillStart(event: AnimationEvent): void {
    if (event.animationName !== 'onAutofillStart') {
      return;
    }

    const input = event.target as HTMLInputElement;
    this.autofillValuePoll?.unsubscribe();
    // Браузер может подставить autofill при загрузке страницы, до того как
    // animationstart увидит input.value. Опрашиваем каждый кадр, пока значение не появится.
    // Баг проявляется в хроме если в настройках паролей разрешить подставлять данные авторизации при загрузке страницы.
    this.autofillValuePoll = timer(0, 0, animationFrameScheduler)
      .pipe(
        map(() => input.value),
        filter((value) => value.length > 0),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.value.set(value as ValueType);
        // rAF в zoneless не запускает CD, поэтому effect сам в контекст не запишет
        this.writeValueToContext(value as ValueType);
      });
  }

  /**
   * Внутренняя запись значения в ContextHub с учётом преобразования типов.
   * Не должна вызываться напрямую из потомков.
   */
  private writeValueToContext(value: ValueType) {
    const pathInfo = parseContextPath(
      this.contextHub.replacePlaceholders(this.config.properties.ref),
    );
    this.contextHub.setValues(pathInfo.contextId, [
      { key: pathInfo.key, value: this.castValueForContext(value) },
    ]);
  }

  castValueForComponent(value: any): ValueType {
    // Иногда нужно изменить значение при получении его из контекста, например в select всегда должен попадать массив
    return value;
  }

  castValueForContext(value: ValueType): any {
    // Обратное действие
    return value;
  }
}
