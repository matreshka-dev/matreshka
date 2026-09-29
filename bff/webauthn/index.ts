export type { StoredWebAuthnCredential } from "./stored-webauthn-credential";

export {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
