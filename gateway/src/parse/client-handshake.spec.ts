import { registerCommonClientToBffMessages } from "@matreshka/shared/messages/client-to-bff/register-common-messages";
import { describe, expect, it } from "vitest";
import {
  serializeBffHandshake,
  serializeClientHandshake,
} from "../test-helpers/handshake-messages";
import { extractBffHandshakeToken } from "./bff-handshake-token";
import { parseClientHandshake } from "./client-handshake";

describe("parseClientHandshake", () => {
  it("parses after host app pre-registers client-to-bff messages (comin bootCore)", () => {
    registerCommonClientToBffMessages();

    expect(
      parseClientHandshake(serializeClientHandshake("localhost:4200")),
    ).toEqual({ applicationId: "localhost:4200" });
  });

  it("parses client handshake from shared message class", () => {
    expect(
      parseClientHandshake(serializeClientHandshake("localhost:4200")),
    ).toEqual({ applicationId: "localhost:4200" });
  });

  it("returns undefined for non-handshake message", () => {
    expect(
      parseClientHandshake(
        '{"type":"client-state","target":"app","payload":{}}',
      ),
    ).toBeUndefined();
  });
});

describe("extractBffHandshakeToken", () => {
  it("extracts token from BFF handshake", () => {
    expect(extractBffHandshakeToken(serializeBffHandshake("token-abc"))).toBe(
      "token-abc",
    );
  });

  it("returns undefined for non-handshake message", () => {
    expect(
      extractBffHandshakeToken('{"type":"page","target":"app","payload":{}}'),
    ).toBeUndefined();
  });
});
