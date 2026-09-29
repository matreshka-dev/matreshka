import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import type { CurrencyOutputConfig } from '@shared/types/currency-output-config';
import { CurrencyPipe } from '../../../../pipes/currency.pipe';
import { PreparePipe } from '../../../../pipes/prepare.pipe';
import { ServerOutputComponent } from '../server-output-component';

@Component({
  selector: 'app-currency-output',
  templateUrl: './currency-output.component.html',
  styleUrl: './currency-output.component.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [CurrencyPipe, PreparePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrencyOutputComponent
  extends ServerOutputComponent<CurrencyOutputConfig, number>
  implements OnInit
{
  override default() {
    return undefined;
  }
}
