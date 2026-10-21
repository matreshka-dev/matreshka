import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { SERVER_COMPONENTS_LIST_COMPONENT } from '../../../tokens/server-components-list-component';
import {
  ServerComponentConfig,
  type Overlay,
} from '../../server/server-component-config';
import { calculateSizeStyles } from '../../server/utils/calculate-styles';
import { overlayAnchorFlags, sortOverlaysForDom } from './overlay-dom-order';

@Component({
  selector: 'app-overlays',
  imports: [NgComponentOutlet, NgTemplateOutlet],
  templateUrl: './overlays.component.html',
  styleUrl: './overlays.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlaysComponent {
  /** Элементы слоя с якорями (страница, компонент или платформа). */
  overlays = input<ReadonlyArray<Overlay>>([]);

  /** Задан — основной контент в ng-content; префикс класса оверлея для якорных записей. */
  parent = input<ServerComponentConfig | undefined>(undefined);

  /** Flex узла `overlay-host`: тот же расчёт, что у хоста из {@link ServerComponent.calculateStyles}. */
  overlayHostFlexStyles = computed(() =>
    calculateSizeStyles({ flexItem: this.parent()?.properties?.flexItem }),
  );

  overlaysBeforeContent = computed(() =>
    sortOverlaysForDom(this.overlays(), 'before'),
  );

  overlaysAfterContent = computed(() =>
    sortOverlaysForDom(this.overlays(), 'after'),
  );

  listComponent = inject(SERVER_COMPONENTS_LIST_COMPONENT);

  overlayAnchorFlags = overlayAnchorFlags;
}
