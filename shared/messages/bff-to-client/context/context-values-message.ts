import { ReliableTargetedBffToClientMessage } from "../reliable-bff-to-client-message";

export type ContextValueRecord = { key: string; value: unknown };

export class ContextValuesMessage extends ReliableTargetedBffToClientMessage<
  ContextValueRecord[]
> {
  static readonly type = "context-values";
  constructor(
    target: string,
    public override readonly payload: ContextValueRecord[],
  ) {
    super(target, payload);
  }
}
