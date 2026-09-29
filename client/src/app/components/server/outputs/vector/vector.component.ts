import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { VectorMode } from '@shared/enums/vector-mode';
import type { VectorConfig } from '@shared/types/vector-config';
import {
  getVectorCssMask,
  getVectorNativeSrc,
  getVectorSourceType,
} from '../../utils/masked-vector-source';
import { ServerOutputComponent } from '../server-output-component';

@Component({
  selector: 'app-vector',
  imports: [],
  templateUrl: './vector.component.html',
  styleUrl: './vector.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'vector-output',
  },
})
export class VectorComponent extends ServerOutputComponent<
  VectorConfig,
  string
> {
  protected readonly VectorMode = VectorMode;

  override default(): string {
    return '';
  }

  override calculateStyles() {
    super.calculateStyles();

    const ratio = this.config.properties.ratio?.value;
    if (ratio == null) {
      return;
    }

    this.componentStyles = {
      ...this.componentStyles,
      'aspect-ratio': ratio,
    };
  }

  isMask(): boolean {
    return this.config.properties.mode === VectorMode.Mask;
  }

  sourceType() {
    return getVectorSourceType(this.value());
  }

  ratioClass(): string {
    const mode = this.config.properties.ratio?.mode;
    return mode ? `vector__${mode}` : '';
  }

  get cssMask(): string | null {
    return getVectorCssMask(this.value(), this.config.properties.ratio?.mode);
  }

  get nativeSrc(): string {
    return getVectorNativeSrc(this.value());
  }
}
