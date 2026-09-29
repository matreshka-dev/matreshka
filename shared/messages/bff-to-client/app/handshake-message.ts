import { ColorToken } from "../../../types/color-token";
import { AppFontsConfig } from "../../../types/fonts";
import { ReliableBffToClientMessage } from "../reliable-bff-to-client-message";

export type HandshakePayload = {
  serverInstanceId: string;
  token: string;
  clientDestroyTimeoutMs: number;
  settings: {
    appName: string;
    appShortName?: string;
    analytics?: { yandex?: { id: string } };
    faviconUrl?: { svg?: string; png: string };
    pwaIconUrl?: { png: string; svg?: string };
    fonts: AppFontsConfig;
    colors: Record<string, ColorToken>;
  };
};

export class HandshakeMessage extends ReliableBffToClientMessage<HandshakePayload> {
  static readonly type = "handshake";
  constructor(override readonly payload: HandshakePayload) {
    super(payload);
  }
}
