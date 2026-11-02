import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type PlatformSetColorSchemeMode = "light" | "dark" | "system";

export type PlatformSetColorSchemePayload = {
  mode: PlatformSetColorSchemeMode;
};

export class PlatformSetColorSchemeMessage extends PingableTargetedBffToClientMessage<PlatformSetColorSchemePayload> {
  static readonly type = "platform-set-color-scheme";
  constructor(
    public override readonly target: string,
    public override readonly payload: PlatformSetColorSchemePayload,
  ) {
    super(target, payload);
  }
}
