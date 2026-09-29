/**
 * Минимальная запись WebAuthn credential для хранения в БД приложения.
 *
 * @see https://simplewebauthn.dev/docs/packages/server#2-post-registration-responsibilities
 */
export type StoredWebAuthnCredential = {
  credentialID: string;
  credentialPublicKey: Uint8Array;
  counter: number;
  credentialDeviceType: "singleDevice" | "multiDevice";
  credentialBackedUp: boolean;
  transports?: string[];
  webauthnUserID: string;
};
