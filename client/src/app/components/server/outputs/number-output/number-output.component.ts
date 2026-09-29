import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import type { NumberOutputConfig } from '@shared/types/number-output-config';
import { ServerOutputComponent } from '../server-output-component';

@Component({
  selector: 'app-number-output',
  imports: [],
  templateUrl: './number-output.component.html',
  styleUrl: './number-output.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberOutputComponent extends ServerOutputComponent<
  NumberOutputConfig,
  number
> {
  override default() {
    return undefined;
  }
}
