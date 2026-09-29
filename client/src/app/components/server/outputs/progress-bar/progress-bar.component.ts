import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import type { ProgressBarConfig } from '@shared/types/progress-bar-config';
import { ServerOutputComponent } from '../server-output-component';

@Component({
  selector: 'app-progress-bar',
  imports: [],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'progress-bar',
  },
})
export class ProgressBarComponent extends ServerOutputComponent<
  ProgressBarConfig,
  number | undefined
> {
  override default(): number | undefined {
    return undefined;
  }

  constructor() {
    super();
  }
}
