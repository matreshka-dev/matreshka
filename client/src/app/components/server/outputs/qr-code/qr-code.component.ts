import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import type { QrCodeConfig } from '@shared/types/qr-code-config';
import { PreparePipe } from '../../../../pipes/prepare.pipe';
import { QrCodePipe } from '../../../../pipes/qr-code.pipe';
import { ServerOutputComponent } from '../server-output-component';

@Component({
  selector: 'app-qr-code',
  imports: [QrCodePipe, AsyncPipe, PreparePipe],
  templateUrl: './qr-code.component.html',
  styleUrl: './qr-code.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'qr-code',
  },
})
export class QrCodeComponent extends ServerOutputComponent<
  QrCodeConfig,
  string
> {
  override default(): string | undefined {
    return undefined;
  }
}
