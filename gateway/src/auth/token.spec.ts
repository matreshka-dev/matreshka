import { describe, expect, it } from "vitest";
import { formatBffToken, parseBffToken } from "./token";

describe("parseBffToken", () => {
  it("parses telegram-like token", () => {
    expect(parseBffToken("123:ABCdef")).toEqual({
      id: "123",
      secret: "ABCdef",
    });
  });

  it("rejects invalid tokens", () => {
    expect(parseBffToken("abc:secret")).toBeUndefined();
    expect(parseBffToken("123")).toBeUndefined();
    expect(parseBffToken(":secret")).toBeUndefined();
  });
});

describe("formatBffToken", () => {
  it("formats id and secret", () => {
    expect(formatBffToken("1", "secret")).toBe("1:secret");
  });
});
