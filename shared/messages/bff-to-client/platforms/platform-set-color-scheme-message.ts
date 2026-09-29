import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";

export type PlatformSetColorSchemeMode = "light" | "dark" | "system";

export type PlatformSetColorSchemePayload = {
  mode: PlatformSetColorSchemeMode;
};

export class PlatformSetColorSchemeMessage extends PingableBffToClientMessage<PlatformSetColorSchemePayload> {
  static readonly type = "platform-set-color-scheme";
  constructor(override readonly payload: PlatformSetColorSchemePayload) {
    super(payload);
  }
}
