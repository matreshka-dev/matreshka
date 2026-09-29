import { ServerComponent } from './server-component';
import type { ServerComponentConfig } from './server-component-config';

export abstract class EntryServerComponent<
  T extends ServerComponentConfig,
> extends ServerComponent<T> {
  protected override enterInteractionType(): 'enter' {
    return 'enter';
  }

  protected override leaveInteractionType(): 'leave' {
    return 'leave';
  }
}
