import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import type { PasswordInputConfig } from '@client-bff-protocol/types/password-input-config';
import { PreparePipe } from '../../../../pipes/prepare.pipe';
import { passwordInputAutocomplete } from '../../../../utils/password-input-autocomplete';
import { ServerInputComponent } from '../server-input-component';

@Component({
  selector: 'app-password-input',
  imports: [PreparePipe],
  templateUrl: './password-input.component.html',
  styleUrl: './password-input.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordInputComponent extends ServerInputComponent<
  PasswordInputConfig,
  string
> {
  get autocomplete(): string | undefined {
    return passwordInputAutocomplete(this.config.properties.kind);
  }

  override default(): string {
    return '';
  }
}
