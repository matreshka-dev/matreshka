import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  ViewEncapsulation,
} from '@angular/core';
import type { ContainerConfig } from '@shared/types/container-config';
import { ServerComponent } from '../server-component';
import { ServerComponentsListComponent } from '../server-components-list/server-components-list.component';
import { renderRootFromFirstNestedInstance } from '../utils/render-root-from-nested-content';

@Component({
  selector: 'app-container',
  imports: [forwardRef(() => ServerComponentsListComponent)],
  templateUrl: './container.component.html',
  styleUrl: './container.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerComponent extends ServerComponent<ContainerConfig> {
  override renderRoot(): HTMLElement {
    return renderRootFromFirstNestedInstance(
      this.componentHub,
      this.config.properties.content,
      this.elementRef.nativeElement as HTMLElement,
    );
  }
}
