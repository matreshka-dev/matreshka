import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import type { NumberInputConfig } from '@shared/types/number-input-config';
import { PreparePipe } from '../../../../pipes/prepare.pipe';
import { ServerInputComponent } from '../server-input-component';

@Component({
  selector: 'app-number-input',
  imports: [PreparePipe],
  templateUrl: './number-input.component.html',
  styleUrl: './number-input.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberInputComponent extends ServerInputComponent<
  NumberInputConfig,
  number | undefined
> {
  override default() {
    return undefined;
  }
}
