import { describe, expect, it } from "vitest";
import { parseBffToClientMessage } from "./bff-to-client/parse-bff-to-client-message";
import { PlatformWebAuthnCreateCredentialMessage } from "./bff-to-client/platforms/platform-webauthn-create-credential-message";
import { PlatformWebAuthnGetCredentialMessage } from "./bff-to-client/platforms/platform-webauthn-get-credential-message";
import { registerCommonBffToClientMessages } from "./bff-to-client/register-common-messages";
import { parseClientToBffMessage } from "./client-to-bff/parse-client-to-bff-message";
import { PlatformWebAuthnCreateCredentialSuccessMessage } from "./client-to-bff/platforms/platform-webauthn-create-credential-success-message";
import { PlatformWebAuthnGetCredentialSuccessMessage } from "./client-to-bff/platforms/platform-webauthn-get-credential-success-message";
import { registerCommonClientToBffMessages } from "./client-to-bff/register-common-messages";

registerCommonBffToClientMessages();
registerCommonClientToBffMessages();

const sampleCreationOptions = {
  challenge: "challenge",
  rp: { name: "Matreshka", id: "localhost" },
  user: {
    id: "user-id",
    name: "user@example.com",
    displayName: "User",
  },
  pubKeyCredParams: [{ alg: -7, type: "public-key" as const }],
  timeout: 60_000,
  attestation: "none" as const,
  excludeCredentials: [],
  authenticatorSelection: {
    residentKey: "preferred" as const,
    userVerification: "preferred" as const,
  },
};

const sampleRegistrationResponse = {
  id: "credential-id",
  rawId: "credential-id",
  response: {
    clientDataJSON: "clientDataJSON",
    attestationObject: "attestationObject",
    transports: ["internal" as const],
  },
  clientExtensionResults: {},
  type: "public-key" as const,
  authenticatorAttachment: "platform" as const,
};

describe("platform WebAuthn messages", () => {
  it("roundtrips BFF → client WebAuthn messages", () => {
    const cases = [
      new PlatformWebAuthnCreateCredentialMessage("scope-1", {
        optionsJSON: sampleCreationOptions,
      }),
      new PlatformWebAuthnGetCredentialMessage("scope-2", {
        optionsJSON: {
          challenge: "challenge",
          timeout: 60_000,
          rpId: "localhost",
          allowCredentials: [],
          userVerification: "preferred",
        },
      }),
    ];

    for (const message of cases) {
      const parsed = parseBffToClientMessage(
        JSON.parse(JSON.stringify(message.toJSON())),
      );
      expect(parsed.toJSON()).toEqual(message.toJSON());
    }
  });

  it("roundtrips client → BFF WebAuthn success messages", () => {
    const cases = [
      new PlatformWebAuthnCreateCredentialSuccessMessage("scope-1", {
        credentialJSON: sampleRegistrationResponse,
      }),
      new PlatformWebAuthnGetCredentialSuccessMessage("scope-2", {
        credentialJSON: {
          id: "credential-id",
          rawId: "credential-id",
          response: {
            clientDataJSON: "clientDataJSON",
            authenticatorData: "authenticatorData",
            signature: "signature",
          },
          clientExtensionResults: {},
          type: "public-key",
        },
      }),
    ];

    for (const message of cases) {
      const parsed = parseClientToBffMessage(
        JSON.parse(JSON.stringify(message.toJSON())),
      );
      expect(parsed.toJSON()).toEqual(message.toJSON());
    }
  });
});
