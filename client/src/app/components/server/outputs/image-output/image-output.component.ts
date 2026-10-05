import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { ComponentClickMessage } from '@shared/messages/client-to-bff/components/component-click-message';
import type { ImageOutputConfig } from '@shared/types/image-output-config';
import { normalizeRadiusPx } from '../../../../utils/normalize-radius-px';
import { rem } from '../../../../utils/rem';
import { ServerOutputComponent } from '../server-output-component';

@Component({
  selector: 'app-image-output',
  imports: [],
  templateUrl: './image-output.component.html',
  styleUrl: './image-output.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'image-output stack', // stack чтобы не было пустых пикселей
    '[class.interactive]': "config.interactions?.['click']?.length",
    '(click)': 'onClick($event)',
  },
})
export class ImageOutputComponent extends ServerOutputComponent<
  ImageOutputConfig,
  string
> {
  loaded = signal(false);
  protected readonly rem = rem;

  get radiusPx() {
    return normalizeRadiusPx(this.config.properties.radius);
  }

  override default(): string {
    return '';
  }

  override ngOnInit() {
    super.ngOnInit();
    // Изображения, полученные с помощью base64 или blob уже загружены
    this.loaded.set(
      !(
        (this.value()?.startsWith('http') ||
          this.value()?.startsWith('https')) ??
        false
      ),
    );
  }

  onClick($event: MouseEvent) {
    this.interact(
      'click',
      this.componentInteractionMessage(
        (target) => new ComponentClickMessage(target),
      ),
    );
  }
}
