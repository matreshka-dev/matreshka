import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";

export type PlatformNativePickerInputType =
  | "color"
  | "date"
  | "time"
  | "datetime-local";

export type PlatformShowNativePickerPayload = {
  /** Instance id якорного компонента на клиенте (`uuid-0`, …). */
  component_id: string;
  inputType: PlatformNativePickerInputType;
  ref: string;
};

export class PlatformShowNativePickerMessage extends PingableBffToClientMessage<PlatformShowNativePickerPayload> {
  static readonly type = "platform-show-native-picker";

  constructor(
    public override readonly payload: PlatformShowNativePickerPayload,
  ) {
    super(payload);
  }
}
