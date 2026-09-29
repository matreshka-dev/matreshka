import { describe, expect, it } from "vitest";
import { Gateway } from "./gateway";
import {
  serializeBffHandshake,
  serializeClientHandshake,
} from "./test-helpers/handshake-messages";

const BFF_ONE = { id: "1", secret: "secret-one" };
const BFF_TWO = { id: "2", secret: "secret-two" };

describe("Gateway", () => {
  it("authenticates BFF by token and version", () => {
    const gateway = new Gateway({ bffServers: [BFF_ONE] });
    const failed = gateway.connectBff({ token: "1:wrong", version: "0.9.0" });
    expect(failed.ok).toBe(false);

    const success = gateway.connectBff({
      token: "1:secret-one",
      version: "0.9.0",
    });
    expect(success.ok).toBe(true);
  });

  it("routes new client session by client handshake applicationId", () => {
    const gateway = new Gateway({ bffServers: [BFF_ONE, BFF_TWO] });
    const bffResult = gateway.connectBff({
      token: "1:secret-one",
      version: "0.9.0",
    });
    expect(bffResult.ok).toBe(true);
    if (!bffResult.ok) {
      return;
    }

    const incoming: string[] = [];
    bffResult.bff.incomingFromClients$.subscribe(({ message }) => {
      incoming.push(message);
    });

    const client = gateway.connectClient();
    client.handleMessage(serializeClientHandshake("localhost:4200"));

    expect(client.bff).toBe(bffResult.bff);
    expect(bffResult.bff.linkedClients).toContain(client);
    expect(incoming).toHaveLength(1);
  });

  it("registers client token from BFF handshake for reconnect routing", () => {
    const gateway = new Gateway({ bffServers: [BFF_ONE] });
    const bffResult = gateway.connectBff({
      token: "1:secret-one",
      version: "0.9.0",
    });
    expect(bffResult.ok).toBe(true);
    if (!bffResult.ok) {
      return;
    }

    const client = gateway.connectClient();
    client.handleMessage(serializeClientHandshake("localhost:4200"));
    bffResult.bff.sendToClient(
      client,
      serializeBffHandshake("client-token-123"),
    );

    const reconnectOpened: Array<{
      clientId: string;
      reconnectToken?: string;
    }> = [];
    bffResult.bff.clientOpened$.subscribe(
      ({ client: openedClient, reconnectToken }) => {
        reconnectOpened.push({ clientId: openedClient.id, reconnectToken });
      },
    );

    const reconnectClient = gateway.connectClient({
      reconnectToken: "client-token-123",
    });

    expect(reconnectClient.bff).toBe(bffResult.bff);
    expect(reconnectOpened).toEqual([
      {
        clientId: reconnectClient.id,
        reconnectToken: "client-token-123",
      },
    ]);
  });

  it("supports add, update and remove BFF servers", () => {
    const gateway = new Gateway({ bffServers: [BFF_ONE] });
    gateway.addBffServerConfig(BFF_TWO);
    gateway.updateBffServerConfig("2", { secret: "updated-secret" });

    const failed = gateway.connectBff({
      token: "2:secret-two",
      version: "0.1.0",
    });
    expect(failed.ok).toBe(false);

    const success = gateway.connectBff({
      token: "2:updated-secret",
      version: "0.1.0",
    });
    expect(success.ok).toBe(true);

    gateway.removeBffServerConfig("2");
    const afterRemove = gateway.connectBff({
      token: "2:updated-secret",
      version: "0.1.0",
    });
    expect(afterRemove.ok).toBe(false);
  });
});
