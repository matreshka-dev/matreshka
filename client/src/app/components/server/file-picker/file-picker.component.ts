import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FilePickerSelectMessage } from '@matreshka/client-bff-protocol/messages/client-to-bff/components/file-picker/file-picker-select-message';
import type { FilePickerConfig } from '@matreshka/client-bff-protocol/types/file-picker-config';
import { PLATFORM } from '../../../platforms/platform';
import { randomString } from '../../../utils/random-string';
import { ServerComponent } from '../server-component';
import { ServerComponentsListComponent } from '../server-components-list/server-components-list.component';

@Component({
  selector: 'app-file-picker',
  imports: [ServerComponentsListComponent],
  templateUrl: './file-picker.component.html',
  styleUrl: './file-picker.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(dragover)': 'fileOver.set(true)',
    '(dragleave)': 'fileOver.set(false)',
  },
})
export class FilePickerComponent extends ServerComponent<FilePickerConfig> {
  uploadInput = viewChild<ElementRef<HTMLInputElement>>('input');
  fileOver = signal(false);
  private readonly platform = inject(PLATFORM);

  fileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const selected = input?.files;

    if (!selected?.length) {
      return;
    }

    const files = Array.from(selected).map((file: File) => {
      const id = randomString(16);
      const url = URL.createObjectURL(file);
      this.platform.localFileHost.register(id, file, url, file.name);
      return {
        id,
        type: file.type,
        size: file.size,
        name: file.name,
        lastModified: file.lastModified,
        url,
      };
    });

    void this.interact(
      'select',
      this.componentInteractionMessage(
        (target) => new FilePickerSelectMessage(target, { files }),
      ),
    );

    this.uploadInput()!.nativeElement.value = '';
  }
}
