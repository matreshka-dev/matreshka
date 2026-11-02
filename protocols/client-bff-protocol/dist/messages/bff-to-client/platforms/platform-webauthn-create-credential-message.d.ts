import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/types";
import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
export type PlatformWebAuthnCreateCredentialPayload = {
    optionsJSON: PublicKeyCredentialCreationOptionsJSON;
};
export declare class PlatformWebAuthnCreateCredentialMessage extends PingableTargetedBffToClientMessage<PlatformWebAuthnCreateCredentialPayload> {
    readonly target: string;
    readonly payload: PlatformWebAuthnCreateCredentialPayload;
    static readonly type = "platform-webauthn-create-credential";
    constructor(target: string, payload: PlatformWebAuthnCreateCredentialPayload);
}
