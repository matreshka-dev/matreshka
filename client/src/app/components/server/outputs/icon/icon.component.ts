import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import type { IconConfig } from '@shared/types/icon-config';
import {
  calculateIconStyles,
  calculateScaleStyles,
} from '../../utils/calculate-styles';
import {
  getVectorCssMask,
  getVectorSourceType,
} from '../../utils/masked-vector-source';
import { ServerOutputComponent } from '../server-output-component';

@Component({
  selector: 'app-icon',
  imports: [],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'icon',
    '[class.icon__url-source]': 'iconSourceType() === "url"',
    '[class.icon__svg-source]': 'iconSourceType() === "svg"',
    '[class.icon__base64-source]': 'iconSourceType() === "base64"',
    '[style.mask]': 'cssMask',
  },
})
export class IconComponent extends ServerOutputComponent<IconConfig, string> {
  override default(): string | undefined {
    return undefined;
  }

  override calculateStyles() {
    const size = this.config.properties.size;
    const scaleStyles = calculateScaleStyles({
      scale: this.config.properties?.scale,
    });
    const fontStyles = this.calculateFontStyles();

    this.componentStyles = {
      ...calculateIconStyles({ size }),
      ...scaleStyles,
      ...fontStyles,
    };
  }

  iconSourceType() {
    return getVectorSourceType(this.value());
  }

  get cssMask(): string | null {
    return getVectorCssMask(this.value());
  }
}
