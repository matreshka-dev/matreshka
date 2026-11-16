import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { OutputConfig } from '@matreshka/client-bff-protocol/types/output-config';
import { filter, takeUntil } from 'rxjs';
import { ContextNotLoadedError } from '../../../services/context-hub.service';
import { contextChangeAffectsRef } from '../../../utils/collect-context-ref-dependencies';
import { ServerComponent } from '../server-component';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
})
export abstract class ServerOutputComponent<
    T extends OutputConfig<ValueType>,
    ValueType = unknown,
  >
  extends ServerComponent<T>
  implements OnInit
{
  value = signal(this.default());

  abstract default(): ValueType | undefined;

  override ngOnInit() {
    super.ngOnInit();
    if ('value' in this.config.properties) {
      this.value.set(this.config.properties.value);
    }
    if ('ref' in this.config.properties && this.config.properties.ref) {
      const key = this.config.properties.ref;
      const initial = this.readContextRef(key);
      this.value.set(
        !initial.loaded || typeof initial.value === 'undefined'
          ? this.default()
          : initial.value,
      );
      const entryId = this.componentHub.getEntryId(this.id())!;
      // Holds на hub не заменяют фильтр: не реагируем на change$ чужих contextId.
      this.contextHub.change$
        .pipe(
          filter((payload) =>
            contextChangeAffectsRef(payload, key, (path) =>
              this.contextHub.replacePlaceholders(path),
            ),
          ),
          takeUntil(this.componentHub.entryDestroy$(entryId)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          this.applyContextRef(key);
        });
      this.componentHub.unfreezeConfig$
        .pipe(
          filter((id) => id === this.id()),
          takeUntil(this.componentHub.entryDestroy$(entryId)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          this.applyContextRef(key);
        });
    }
  }

  /** loaded: false — индексный контекст плейсхолдера ещё не загружен. */
  private readContextRef(key: string): {
    loaded: boolean;
    value?: ValueType;
  } {
    try {
      return {
        loaded: true,
        value: this.contextHub.value(key) as ValueType | undefined,
      };
    } catch (error) {
      if (error instanceof ContextNotLoadedError) {
        return { loaded: false };
      }
      throw error;
    }
  }

  private applyContextRef(key: string): void {
    // forEach: deferred removal строки списка
    if (this.contextFrozen()) {
      return;
    }
    const resolved = this.readContextRef(key);
    if (!resolved.loaded) {
      return;
    }
    const currentValue: any = this.value();
    let newValue: ValueType | undefined = resolved.value;
    if (typeof newValue === 'undefined') {
      newValue = this.default();
    }
    if (
      currentValue !== newValue ||
      JSON.stringify(currentValue) !== JSON.stringify(newValue)
    ) {
      // Первая проверка при примитивов, вторая для объектов
      this.value.set(newValue);
    }
  }
}
