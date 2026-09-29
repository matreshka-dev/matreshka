import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import type { DatetimeOutputConfig } from '@shared/types/datetime-output-config';
import { DatetimePipe } from '../../../../pipes/datetime.pipe';
import { ServerOutputComponent } from '../server-output-component';

@Component({
  selector: 'app-datetime-output',
  imports: [DatetimePipe],
  templateUrl: './datetime-output.component.html',
  styleUrl: './datetime-output.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimeOutputComponent extends ServerOutputComponent<
  DatetimeOutputConfig,
  string
> {
  override default(): string | undefined {
    return '';
  }
}
