import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { RemPipe } from '../../../pipes/rem.pipe';
import { rem } from '../../../utils/rem';

@Component({
  selector: 'app-local-progress-spinner',
  imports: [RemPipe],
  templateUrl: './local-progress-spinner.component.html',
  styleUrl: './local-progress-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'local-progress-spinner',
    '[style.width]': 'rem(config().diameter)',
  },
})
export class LocalProgressSpinnerComponent {
  config = input.required<
    { diameter: number; background?: boolean } & (
      | { mode: 'indeterminate' }
      | { mode: 'determinate'; value: number }
    )
  >();
  protected readonly rem = rem;

  getCircleRadius() {
    return this.config().diameter / 2 - this.strokeWidth / 2;
  }

  get strokeWidth() {
    return this.config().diameter * (10 / 100);
  }

  getViewBox() {
    return `0 0 ${this.config().diameter} ${this.config().diameter}`;
  }

  getStrokeCircumference(): number {
    return 2 * Math.PI * this.getCircleRadius();
  }

  /** The dash offset of the svg circle. */
  getStrokeDashOffset() {
    const config = this.config();
    return (
      (this.getStrokeCircumference() *
        (100 - (config.mode === 'determinate' ? config.value : 70))) /
      100
    );
  }
}
