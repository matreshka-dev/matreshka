import { PlatformId } from "@matreshka/shared/enums/platform-id";
import { AppStorageValueMessage } from "@matreshka/shared/messages/bff-to-client/app/app-storage-value-message";
import { describe, expect, it } from "vitest";
import { Client } from "./client";

function setClientState(client: Client, storage: Record<string, string> = {}) {
  client.state$.next({
    route: {
      visitedAt: Date.now(),
      path: "/",
      query: {},
    },
    storage,
    language: "ru",
    userAgent: "test",
    prefersColorScheme: "light",
    platform: {
      id: PlatformId.TestPlatform,
      payload: {},
    },
  });
}

describe("ClientStorage", () => {
  it("читает значение по ключу", () => {
    const client = new Client();
    setClientState(client, { jwt: "token-value" });

    expect(client.storage.get("jwt")).toBe("token-value");
  });

  it("записывает значение, обновляет state$ и отправляет storage-value", () => {
    const client = new Client();
    setClientState(client);
    const messages: AppStorageValueMessage[] = [];
    client.outcomingMessage$.subscribe((message) => {
      if (message instanceof AppStorageValueMessage) {
        messages.push(message);
      }
    });

    client.storage.set("jwt", "new-token");

    expect(client.state$.getValue().storage.jwt).toBe("new-token");
    expect(messages).toHaveLength(1);
    expect(messages[0].payload).toEqual({ key: "jwt", value: "new-token" });
  });

  it("clear удаляет значение через set с undefined", () => {
    const client = new Client();
    setClientState(client, { jwt: "token-value" });
    const messages: AppStorageValueMessage[] = [];
    client.outcomingMessage$.subscribe((message) => {
      if (message instanceof AppStorageValueMessage) {
        messages.push(message);
      }
    });

    client.storage.clear("jwt");

    expect(client.storage.get("jwt")).toBeUndefined();
    expect(messages).toHaveLength(1);
    expect(messages[0].payload).toEqual({ key: "jwt", value: undefined });
  });
});

describe("Client storage deprecated API", () => {
  it("getStorageValue делегирует в client.storage.get", () => {
    const client = new Client();
    setClientState(client, { jwt: "legacy" });

    expect(client.getStorageValue("jwt")).toBe("legacy");
  });

  it("setStorageValue делегирует и возвращает Client", () => {
    const client = new Client();
    setClientState(client);

    const returned = client.setStorageValue("jwt", "via-deprecated");

    expect(returned).toBe(client);
    expect(client.storage.get("jwt")).toBe("via-deprecated");
  });

  it("clearStorageValue делегирует и возвращает Client", () => {
    const client = new Client();
    setClientState(client, { jwt: "token" });

    const returned = client.clearStorageValue("jwt");

    expect(returned).toBe(client);
    expect(client.storage.get("jwt")).toBeUndefined();
  });
});
