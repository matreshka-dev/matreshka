import type { PopoverConfig } from "../../../../types/popover-config";
import { PingableBffToClientMessage } from "../../pingable-bff-to-client-message";

export type PopoverShowPayload = {
  /** Instance id якорного компонента на клиенте (`uuid-0`, …). */
  component_id: string;
  popover: PopoverConfig;
};

export class PopoverShowMessage extends PingableBffToClientMessage<PopoverShowPayload> {
  static readonly type = "show-popover";
  constructor(public override readonly payload: PopoverShowPayload) {
    super(payload);
  }
}
