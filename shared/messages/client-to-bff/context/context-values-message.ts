import { ReliableTargetedClientToBffMessage } from "../reliable-client-to-bff-message";

export type ClientContextValueRecord = { key: string; value: unknown };

export class ContextValuesMessage extends ReliableTargetedClientToBffMessage<
  ClientContextValueRecord[]
> {
  static readonly type = "context-values";
  constructor(
    target: string,
    override readonly payload: ClientContextValueRecord[],
  ) {
    super(target, payload);
  }
}
