import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import type { EntryServerComponentConfig } from '@shared/types/entry-server-component-config';
import { ServerComponent } from './server-component';
import { registerWebMcpTools } from './webmcp/register-entry-tools';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class EntryServerComponent<
  T extends EntryServerComponentConfig,
> extends ServerComponent<T> {
  protected readonly platformId = inject(PLATFORM_ID);
  private unregisterWebMcpTools: () => void = () => undefined;

  override ngOnInit() {
    super.ngOnInit();
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.unregisterWebMcpTools = registerWebMcpTools(
      this.document,
      this._configSignal()?.tools,
      this.postman,
      {
        conditionsMet: (conditions) =>
          this.componentHub.conditionsMet(conditions),
        contextChange$: this.contextHub.change$,
        replacePlaceholders: (key) => this.contextHub.replacePlaceholders(key),
      },
    );
  }

  override ngOnDestroy() {
    this.unregisterWebMcpTools();
    super.ngOnDestroy();
  }

  protected override enterInteractionType(): 'enter' {
    return 'enter';
  }

  protected override leaveInteractionType(): 'leave' {
    return 'leave';
  }
}
