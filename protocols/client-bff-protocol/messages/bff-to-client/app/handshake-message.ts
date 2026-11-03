import { ColorRole } from "../../../enums/color-role";
import pkg from "../../../package.json";
import { ColorToken } from "../../../types/color-token";
import { AppFontsConfig } from "../../../types/fonts";
import { ReliableBffToClientMessage } from "../reliable-bff-to-client-message";

export type HandshakePayload = {
  serverInstanceId: string;
  token: string;
  clientDestroyTimeoutMs: number;
  protocolVersion: string;
  settings: {
    appName: string;
    appShortName?: string;
    analytics?: { yandex?: { id: string } };
    faviconUrl?: { svg?: string; png: string };
    pwaIconUrl?: { png: string; svg?: string };
    fonts: AppFontsConfig;
    colors: {
      registry: Record<string, ColorToken>;
      default: Partial<Record<ColorRole, string>>;
    };
  };
};

export type HandshakeInput = Omit<HandshakePayload, "protocolVersion">;

export class HandshakeMessage extends ReliableBffToClientMessage<HandshakePayload> {
  static readonly type = "handshake";
  declare readonly payload: HandshakePayload;
  constructor(input: HandshakeInput) {
    super({ ...input, protocolVersion: pkg.version });
  }
}
