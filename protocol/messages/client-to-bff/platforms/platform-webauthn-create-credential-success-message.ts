import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";

export type PlatformWebAuthnCreateCredentialSuccessPayload = {
  credentialJSON: RegistrationResponseJSON;
};

export class PlatformWebAuthnCreateCredentialSuccessMessage extends PingableTargetedClientToBffMessage<PlatformWebAuthnCreateCredentialSuccessPayload> {
  static readonly type = "platform-webauthn-create-credential-success";
  constructor(
    public override readonly target: string,
    public override readonly payload: PlatformWebAuthnCreateCredentialSuccessPayload,
  ) {
    super(target, payload);
  }
}
