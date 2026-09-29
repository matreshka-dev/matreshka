import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import type { PasswordInputConfig } from '@shared/types/password-input-config';
import { passwordInputAutocomplete } from '@shared/utils/password-input-autocomplete';
import { PreparePipe } from '../../../../pipes/prepare.pipe';
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
