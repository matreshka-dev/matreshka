import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import type { EntryServerComponentConfig } from '@shared/types/entry-server-component-config';
import { ServerComponent } from './server-component';
import { registerEntryWebMcpTools } from './webmcp/register-entry-tools';

export abstract class EntryServerComponent<
  T extends EntryServerComponentConfig,
> extends ServerComponent<T> {
  private readonly platformId = inject(PLATFORM_ID);
  private unregisterWebMcpTools: () => void = () => undefined;

  override ngOnInit() {
    super.ngOnInit();
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.unregisterWebMcpTools = registerEntryWebMcpTools(
      this.document,
      this._configSignal()?.tools,
      this.postman,
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
