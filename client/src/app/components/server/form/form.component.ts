import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormSubmitMessage } from '@shared/messages/client-to-bff/components/form/form-submit-message';
import type { FormConfig } from '@shared/types/form-config';
import { ServerComponent } from '../server-component';
import { ServerComponentsListComponent } from '../server-components-list/server-components-list.component';
import { renderRootFromFirstNestedInstance } from '../utils/render-root-from-nested-content';

@Component({
  selector: 'app-form',
  imports: [forwardRef(() => ServerComponentsListComponent), FormsModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormComponent extends ServerComponent<FormConfig> {
  onSubmit() {
    this.interact(
      'submit',
      this.componentInteractionMessage(
        (target) => new FormSubmitMessage(target),
      ),
    );
  }

  override renderRoot(): HTMLElement {
    return renderRootFromFirstNestedInstance(
      this.componentHub,
      this.config.properties.content,
      this.elementRef.nativeElement as HTMLElement,
    );
  }
}
