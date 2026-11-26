import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
import type { LocalFileIdPayload } from "./local-file-id-payload";

export class LocalFileDestroyMessage extends PingableTargetedBffToClientMessage<LocalFileIdPayload> {
  static readonly type = "local-file-destroy";
  constructor(
    public override readonly target: string,
    public override readonly payload: LocalFileIdPayload,
  ) {
    super(target, payload);
  }
}
