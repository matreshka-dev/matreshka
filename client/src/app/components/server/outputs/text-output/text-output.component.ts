import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { TextOutputConfig } from '@shared/types/text-output-config';
import { takeUntil } from 'rxjs';
import { findContextKeys } from '../../../../utils/find-context-keys';
import { prepareText } from '../../../../utils/prepare-text';
import { ServerOutputComponent } from '../server-output-component';
import {
  applyTextOutputProcessors,
  type TextOutputSegment,
} from './text-output-processors';

@Component({
  selector: 'app-text-output',
  templateUrl: './text-output.component.html',
  styleUrl: './text-output.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextOutputComponent extends ServerOutputComponent<
  TextOutputConfig,
  string
> {
  private readonly contextVersion = signal(0);

  readonly hasProcessors = computed(
    () => (this.config.properties.processors?.length ?? 0) > 0,
  );

  readonly preparedText = computed(() => {
    this.contextVersion();
    return prepareText(this.value(), this.contextHub);
  });

  readonly segments = computed<TextOutputSegment[]>(() => {
    if (!this.hasProcessors()) {
      return [];
    }
    return applyTextOutputProcessors(
      this.preparedText(),
      this.config.properties.processors ?? [],
    );
  });

  override ngOnInit() {
    super.ngOnInit();
    const entryId = this.componentHub.getEntryId(this.id())!;
    this.contextHub.change$
      .pipe(
        takeUntil(this.componentHub.entryDestroy$(entryId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const value = this.value();
        if (typeof value !== 'string' || findContextKeys(value).length === 0) {
          return;
        }
        this.contextVersion.update((value) => value + 1);
      });
  }

  override default(): string {
    return '';
  }
}
