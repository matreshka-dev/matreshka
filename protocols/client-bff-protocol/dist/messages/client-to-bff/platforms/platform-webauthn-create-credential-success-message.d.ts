import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";
export type PlatformWebAuthnCreateCredentialSuccessPayload = {
    credentialJSON: RegistrationResponseJSON;
};
export declare class PlatformWebAuthnCreateCredentialSuccessMessage extends PingableTargetedClientToBffMessage<PlatformWebAuthnCreateCredentialSuccessPayload> {
    readonly target: string;
    readonly payload: PlatformWebAuthnCreateCredentialSuccessPayload;
    static readonly type = "platform-webauthn-create-credential-success";
    constructor(target: string, payload: PlatformWebAuthnCreateCredentialSuccessPayload);
}
