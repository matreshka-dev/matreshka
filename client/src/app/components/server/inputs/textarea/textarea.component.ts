import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import type { TextareaConfig } from '@shared/types/textarea-config';
import { PreparePipe } from '../../../../pipes/prepare.pipe';
import { ServerInputComponent } from '../server-input-component';

@Component({
  selector: 'app-textarea',
  imports: [PreparePipe],
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'textarea',
    '(click)': 'focusTextarea()',
  },
})
export class TextareaComponent extends ServerInputComponent<
  TextareaConfig,
  string
> {
  protected inputElement = viewChild<ElementRef<HTMLTextAreaElement>>('input');

  override default(): string {
    return '';
  }

  focusTextarea(): void {
    this.inputElement()?.nativeElement.focus();
  }
}
