import { PlatformWebAuthnCreateCredentialMessage } from "@matreshka/shared/messages/bff-to-client/platforms/platform-webauthn-create-credential-message";
import { ErrorMessage } from "@matreshka/shared/messages/client-to-bff/error-message";
import { PlatformWebAuthnCreateCredentialSuccessMessage } from "@matreshka/shared/messages/client-to-bff/platforms/platform-webauthn-create-credential-success-message";
import { describe, expect, it, vi } from "vitest";
import { Client } from "../core/client";
import { BrowserPlatform } from "./browser-platform";

describe("Platform WebAuthn", () => {
  it("createWebAuthnCredential sends message and handles success", () => {
    const client = new Client();
    const platform = new BrowserPlatform(client);
    const onSuccess = vi.fn();
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

    platform.createWebAuthnCredential({ optionsJSON, onSuccess });

    expect(outgoing).toHaveLength(1);
    const sent = outgoing[0]!;
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

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ id: "id", type: "public-key" }),
    );
  });

  it("createWebAuthnCredential calls onError for ErrorMessage", () => {
    const client = new Client();
    const platform = new BrowserPlatform(client);
    const onError = vi.fn();
    const outgoing: PlatformWebAuthnCreateCredentialMessage[] = [];
    client.outcomingMessage$.subscribe((message) => {
      if (message instanceof PlatformWebAuthnCreateCredentialMessage) {
        outgoing.push(message);
      }
    });

    platform.createWebAuthnCredential({
      optionsJSON: {
        challenge: "c",
        rp: { name: "Test", id: "localhost" },
        user: { id: "u", name: "n", displayName: "d" },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      },
      onSuccess: vi.fn(),
      onError,
    });

    const scope = outgoing[0]!.target;
    client.incomingMessage$.next(
      new ErrorMessage(scope, { message: "User cancelled" }),
    );

    expect(onError).toHaveBeenCalledWith("User cancelled");
  });
});
