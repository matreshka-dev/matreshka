import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/types";
import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type PlatformWebAuthnCreateCredentialPayload = {
  optionsJSON: PublicKeyCredentialCreationOptionsJSON;
};

export class PlatformWebAuthnCreateCredentialMessage extends PingableTargetedBffToClientMessage<PlatformWebAuthnCreateCredentialPayload> {
  static readonly type = "platform-webauthn-create-credential";
  constructor(
    public override readonly target: string,
    public override readonly payload: PlatformWebAuthnCreateCredentialPayload,
  ) {
    super(target, payload);
  }
}
