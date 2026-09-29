import type { DialogConfig } from "../../../../types/dialog-config";
import { PingableBffToClientMessage } from "../../pingable-bff-to-client-message";

export class DialogShowMessage extends PingableBffToClientMessage<DialogConfig> {
  static readonly type = "show-dialog";
  constructor(public override readonly payload: DialogConfig) {
    super(payload);
  }
}
