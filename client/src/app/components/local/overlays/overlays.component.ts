import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { OverlayAnchor } from '@shared/types/container-overlay';
import { SERVER_COMPONENTS_LIST_COMPONENT } from '../../../tokens/server-components-list-component';
import {
  ServerComponentConfig,
  type Overlay,
} from '../../server/server-component-config';
import { calculateSizeStyles } from '../../server/utils/calculate-styles';

@Component({
  selector: 'app-overlays',
  imports: [NgComponentOutlet],
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

  listComponent = inject(SERVER_COMPONENTS_LIST_COMPONENT);

  overlayAnchorFlags(overlay: Overlay): {
    top: boolean;
    bottom: boolean;
    middle: boolean;
    start: boolean;
    end: boolean;
    center: boolean;
  } {
    const anchors = overlay.anchors ?? [];
    const has = (a: OverlayAnchor) => anchors.includes(a);

    const top = has(OverlayAnchor.Top);
    const bottom = has(OverlayAnchor.Bottom);
    const start = has(OverlayAnchor.Start);
    const end = has(OverlayAnchor.End);

    const middle = !(top && bottom) && has(OverlayAnchor.Middle);
    const center = !(start && end) && has(OverlayAnchor.Center);

    return { top, bottom, middle, start, end, center };
  }
}
