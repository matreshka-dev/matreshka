import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";

export type PlatformWebAuthnGetCredentialSuccessPayload = {
  credentialJSON: AuthenticationResponseJSON;
};

export class PlatformWebAuthnGetCredentialSuccessMessage extends PingableTargetedClientToBffMessage<PlatformWebAuthnGetCredentialSuccessPayload> {
  static readonly type = "platform-webauthn-get-credential-success";
  constructor(
    public override readonly target: string,
    public override readonly payload: PlatformWebAuthnGetCredentialSuccessPayload,
  ) {
    super(target, payload);
  }
}
