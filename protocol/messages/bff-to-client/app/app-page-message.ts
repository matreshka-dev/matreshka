import type { PageConfig } from "../../../types/page-config";
import { ReliableBffToClientMessage } from "../reliable-bff-to-client-message";

export class AppPageMessage extends ReliableBffToClientMessage<PageConfig> {
  static readonly type = "page";
  constructor(public override readonly payload: PageConfig) {
    super(payload);
  }
}
