import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { OutputConfig } from '@shared/types/output-config';
import { takeUntil } from 'rxjs';
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
      let defaultValue = this.contextHub.value(key);
      if (typeof defaultValue === 'undefined') {
        defaultValue = this.default();
      }
      this.value.set(defaultValue as ValueType);
      const entryId = this.componentHub.getEntryId(this.id())!;
      // Подписка на изменения значений в контексте
      this.contextHub.change$
        .pipe(
          takeUntil(this.componentHub.entryDestroy$(entryId)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          // forEach: deferred removal строки списка
          if (this.contextFrozen()) {
            return;
          }
          // TODO Наверное можно отслеживать конкретные ключи, а в хабе рекурсивно оповещать об изменении ключа и всех мест где он
          const currentValue: any = this.value();
          let newValue: ValueType | undefined = this.contextHub.value(key) as
            | ValueType
            | undefined;
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
        });
    }
  }
}
