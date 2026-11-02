"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformWebAuthnGetCredentialMessage = void 0;
const pingable_bff_to_client_message_1 = require("../pingable-bff-to-client-message");
class PlatformWebAuthnGetCredentialMessage extends pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage {
    constructor(target, payload) {
        super(target, payload);
        this.target = target;
        this.payload = payload;
    }
}
exports.PlatformWebAuthnGetCredentialMessage = PlatformWebAuthnGetCredentialMessage;
PlatformWebAuthnGetCredentialMessage.type = "platform-webauthn-get-credential";
