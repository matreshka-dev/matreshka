import type { DialogConfig } from "../../../../types/dialog-config";
import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export class DialogShowMessage extends PingableTargetedBffToClientMessage<DialogConfig> {
  static readonly type = "show-dialog";
  constructor(
    public override readonly target: string,
    public override readonly payload: DialogConfig,
  ) {
    super(target, payload);
  }
}
