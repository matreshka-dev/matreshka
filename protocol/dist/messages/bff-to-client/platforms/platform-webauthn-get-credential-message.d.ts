import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/types";
import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
export type PlatformWebAuthnGetCredentialPayload = {
    optionsJSON: PublicKeyCredentialRequestOptionsJSON;
};
export declare class PlatformWebAuthnGetCredentialMessage extends PingableTargetedBffToClientMessage<PlatformWebAuthnGetCredentialPayload> {
    readonly target: string;
    readonly payload: PlatformWebAuthnGetCredentialPayload;
    static readonly type = "platform-webauthn-get-credential";
    constructor(target: string, payload: PlatformWebAuthnGetCredentialPayload);
}
