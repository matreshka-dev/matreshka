import { describe, expect, it } from "vitest";
import { buildGatewayWebSocketUrl } from "./gateway-connection";

describe("buildGatewayWebSocketUrl", () => {
  it("добавляет /bff, token и version к базовому адресу", () => {
    const url = new URL(
      buildGatewayWebSocketUrl("ws://127.0.0.1:3002", "1:dev-secret"),
    );

    expect(url.pathname).toBe("/bff");
    expect(url.searchParams.get("token")).toBe("1:dev-secret");
    expect(url.searchParams.get("version")).toBeTruthy();
  });

  it("сохраняет явный path /bff", () => {
    const url = new URL(
      buildGatewayWebSocketUrl("ws://127.0.0.1:3002/bff", "1:dev-secret"),
    );

    expect(url.pathname).toBe("/bff");
  });
});
