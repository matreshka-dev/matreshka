import { PlatformWebAuthnCreateCredentialMessage } from "@matreshka/shared/messages/bff-to-client/platforms/platform-webauthn-create-credential-message";
import { ErrorMessage } from "@matreshka/shared/messages/client-to-bff/error-message";
import { PlatformWebAuthnCreateCredentialSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/platform-webauthn-create-credential-success-message";
import { firstValueFrom } from "rxjs";
import { describe, expect, it } from "vitest";
import { Client } from "../core/client";
import { BrowserPlatform } from "./browser-platform";

describe("Platform WebAuthn", () => {
  it("createWebAuthnCredential sends message and handles success", async () => {
    const client = new Client();
    const platform = new BrowserPlatform(client);
    const outgoing: PlatformWebAuthnCreateCredentialMessage[] = [];
    client.outcomingMessage$.subscribe((message) => {
      if (message instanceof PlatformWebAuthnCreateCredentialMessage) {
        outgoing.push(message);
      }
    });
    const optionsJSON = {
      challenge: "challenge",
      rp: { name: "Test", id: "localhost" },
      user: {
        id: "uid",
        name: "user@example.com",
        displayName: "User",
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" as const }],
    };

    const credentialPromise = firstValueFrom(
      platform.createWebAuthnCredential(optionsJSON),
    );

    expect(outgoing).toHaveLength(1);
    const sent = outgoing[0];
    expect(sent).toBeDefined();
    if (!sent) {
      return;
    }
    expect(sent).toBeInstanceOf(PlatformWebAuthnCreateCredentialMessage);
    expect(sent.target).toMatch(/^platform-action-/);
    expect(sent.payload.optionsJSON).toEqual(optionsJSON);

    client.incomingMessage$.next(
      new PlatformWebAuthnCreateCredentialSuccessMessage(sent.target, {
        credentialJSON: {
          id: "id",
          rawId: "rawId",
          response: {
            clientDataJSON: "a",
            attestationObject: "b",
          },
          clientExtensionResults: {},
          type: "public-key",
        },
      }),
    );

    await expect(credentialPromise).resolves.toEqual(
      expect.objectContaining({ id: "id", type: "public-key" }),
    );
  });

  it("createWebAuthnCredential rejects on ErrorMessage", async () => {
    const client = new Client();
    const platform = new BrowserPlatform(client);
    const outgoing: PlatformWebAuthnCreateCredentialMessage[] = [];
    client.outcomingMessage$.subscribe((message) => {
      if (message instanceof PlatformWebAuthnCreateCredentialMessage) {
        outgoing.push(message);
      }
    });

    const credentialPromise = firstValueFrom(
      platform.createWebAuthnCredential({
        challenge: "c",
        rp: { name: "Test", id: "localhost" },
        user: { id: "u", name: "n", displayName: "d" },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      }),
    );

    expect(outgoing[0]).toBeDefined();
    const scope = outgoing[0]?.target;
    expect(scope).toBeDefined();
    if (!scope) {
      return;
    }
    client.incomingMessage$.next(
      new ErrorMessage(scope, { message: "User cancelled" }),
    );

    await expect(credentialPromise).rejects.toThrow("User cancelled");
  });
});
