import type { PopoverConfig } from "../../../../types/popover-config";
import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type PopoverShowPayload = {
  /** Id инстанса source (инициатор открытия) на клиенте (`uuid-0`, …). */
  source: string;
  /** Id визуального якоря; если не задан на wire, source одновременно якорь. */
  anchor?: string;
  popover: PopoverConfig;
};

export class PopoverShowMessage extends PingableTargetedBffToClientMessage<PopoverShowPayload> {
  static readonly type = "show-popover";
  constructor(
    public override readonly target: string,
    public override readonly payload: PopoverShowPayload,
  ) {
    super(target, payload);
  }
}
