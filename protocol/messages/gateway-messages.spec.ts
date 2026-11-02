import { describe, expect, it } from "vitest";
import { BffMessage } from "./bff-to-gateway/bff-message";
import { parseBffToGatewayMessage } from "./bff-to-gateway/parse-bff-to-gateway-message";
import { ClientMessage } from "./gateway-to-bff/client-message";
import { ConnectedMessage } from "./gateway-to-bff/connected-message";
import { parseGatewayToBffMessage } from "./gateway-to-bff/parse-gateway-to-bff-message";
import { SessionOpenMessage } from "./gateway-to-bff/session-open-message";
import { registerGatewayMessages } from "./register-gateway-messages";

registerGatewayMessages();

describe("gateway messages", () => {
  it("roundtrips gateway → BFF messages", () => {
    const cases = [
      new ConnectedMessage({ bffId: "1", applicationIds: ["localhost:4200"] }),
      new SessionOpenMessage({ sessionId: "session-1" }),
      new SessionOpenMessage({
        sessionId: "session-2",
        reconnectToken: "token-123",
      }),
      new ClientMessage({
        sessionId: "session-1",
        message: '{"type":"handshake"}',
      }),
    ];

    for (const message of cases) {
      const parsed = parseGatewayToBffMessage(
        JSON.parse(JSON.stringify(message.toJSON())),
      );
      expect(parsed.toJSON()).toEqual(message.toJSON());
    }
  });

  it("roundtrips BFF → gateway messages", () => {
    const message = new BffMessage({
      sessionId: "session-1",
      message: '{"type":"page"}',
    });
    const parsed = parseBffToGatewayMessage(
      JSON.parse(JSON.stringify(message.toJSON())),
    );
    expect(parsed.toJSON()).toEqual(message.toJSON());
  });

  it("throws for unregistered message type", () => {
    expect(() =>
      parseGatewayToBffMessage({
        type: "unknown",
        payload: {},
      }),
    ).toThrow("Message type unknown not registered");
  });
});
