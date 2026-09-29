import { describe, expect, it } from "vitest";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "./index";

describe("@matreshka/bff/webauthn", () => {
  it("generateRegistrationOptions returns JSON options with challenge", async () => {
    const optionsJSON = await generateRegistrationOptions({
      rpName: "Matreshka Test",
      rpID: "localhost",
      userName: "user@example.com",
      userID: new Uint8Array([1, 2, 3, 4]),
    });

    expect(typeof optionsJSON.challenge).toBe("string");
    expect(optionsJSON.rp.name).toBe("Matreshka Test");
    expect(optionsJSON.rp.id).toBe("localhost");
  });

  it("generateAuthenticationOptions returns JSON options with challenge", async () => {
    const optionsJSON = await generateAuthenticationOptions({
      rpID: "localhost",
    });

    expect(typeof optionsJSON.challenge).toBe("string");
    expect(optionsJSON.rpId).toBe("localhost");
  });

  it("verifyRegistrationResponse throws on malformed client data", async () => {
    await expect(
      verifyRegistrationResponse({
        response: {
          id: "invalid",
          rawId: "invalid",
          response: {
            clientDataJSON: "not-valid-base64url",
            attestationObject: "not-valid-base64url",
          },
          clientExtensionResults: {},
          type: "public-key",
        },
        expectedChallenge: "challenge",
        expectedOrigin: "https://localhost",
        expectedRPID: "localhost",
      }),
    ).rejects.toThrow();
  });

  it("verifyAuthenticationResponse throws on malformed client data", async () => {
    await expect(
      verifyAuthenticationResponse({
        response: {
          id: "invalid",
          rawId: "invalid",
          response: {
            clientDataJSON: "not-valid-base64url",
            authenticatorData: "not-valid-base64url",
            signature: "not-valid-base64url",
          },
          clientExtensionResults: {},
          type: "public-key",
        },
        expectedChallenge: "challenge",
        expectedOrigin: "https://localhost",
        expectedRPID: "localhost",
        credential: {
          id: "invalid",
          publicKey: new Uint8Array([1]),
          counter: 0,
          transports: [],
        },
      }),
    ).rejects.toThrow();
  });
});
