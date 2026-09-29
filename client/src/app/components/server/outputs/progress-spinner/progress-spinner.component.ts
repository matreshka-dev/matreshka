import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import type { ProgressSpinnerConfig } from '@shared/types/progress-spinner-config';
import { LocalProgressSpinnerComponent } from '../../../local/progress-spinner/local-progress-spinner.component';
import { ServerOutputComponent } from '../server-output-component';

@Component({
  selector: 'app-progress-spinner',
  imports: [LocalProgressSpinnerComponent],
  templateUrl: './progress-spinner.component.html',
  styleUrl: './progress-spinner.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'progress-spinner',
  },
})
export class ProgressSpinnerComponent extends ServerOutputComponent<
  ProgressSpinnerConfig,
  number | undefined
> {
  override default(): number | undefined {
    return undefined;
  }
}
