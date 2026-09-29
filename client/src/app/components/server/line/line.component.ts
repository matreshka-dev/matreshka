import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { ServerComponent } from '../server-component';
import { ServerComponentConfig } from '../server-component-config';
import {
  calculateLineStyles,
  calculateScaleStyles,
} from '../utils/calculate-styles';

@Component({
  selector: 'app-line',
  imports: [],
  templateUrl: './line.component.html',
  styleUrl: './line.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineComponent extends ServerComponent<ServerComponentConfig> {
  override calculateStyles() {
    const lineStyles = calculateLineStyles({
      size: this.config.properties?.size,
      radius: this.config.properties?.radius,
    });
    const scaleStyles = calculateScaleStyles({
      scale: this.config.properties?.scale,
    });
    const fontStyles = this.calculateFontStyles();
    this.componentStyles = {
      ...lineStyles,
      ...scaleStyles,
      ...fontStyles,
    };
  }
}
