import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/types";
import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type PlatformWebAuthnGetCredentialPayload = {
  optionsJSON: PublicKeyCredentialRequestOptionsJSON;
};

export class PlatformWebAuthnGetCredentialMessage extends PingableTargetedBffToClientMessage<PlatformWebAuthnGetCredentialPayload> {
  static readonly type = "platform-webauthn-get-credential";
  constructor(
    public override readonly target: string,
    public override readonly payload: PlatformWebAuthnGetCredentialPayload,
  ) {
    super(target, payload);
  }
}
