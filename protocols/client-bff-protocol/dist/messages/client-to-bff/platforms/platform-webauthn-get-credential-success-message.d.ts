import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";
export type PlatformWebAuthnGetCredentialSuccessPayload = {
    credentialJSON: AuthenticationResponseJSON;
};
export declare class PlatformWebAuthnGetCredentialSuccessMessage extends PingableTargetedClientToBffMessage<PlatformWebAuthnGetCredentialSuccessPayload> {
    readonly target: string;
    readonly payload: PlatformWebAuthnGetCredentialSuccessPayload;
    static readonly type = "platform-webauthn-get-credential-success";
    constructor(target: string, payload: PlatformWebAuthnGetCredentialSuccessPayload);
}
