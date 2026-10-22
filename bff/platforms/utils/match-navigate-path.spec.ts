import { describe, expect, it } from "vitest";
import { clientRouteMatchesNavigatePath } from "./match-navigate-path";

describe("clientRouteMatchesNavigatePath", () => {
  it("совпадает литеральный path", () => {
    expect(
      clientRouteMatchesNavigatePath(
        { path: "/profile", query: {} },
        "/profile",
      ),
    ).toBe(true);
  });

  it("совпадает path с плейсхолдером @{context.key}", () => {
    expect(
      clientRouteMatchesNavigatePath(
        { path: "users/42", query: {} },
        "users/@{user-ctx.userId}",
      ),
    ).toBe(true);
  });

  it("совпадает query string", () => {
    expect(
      clientRouteMatchesNavigatePath(
        { path: "search", query: { q: "hello" } },
        "search?q=hello",
      ),
    ).toBe(true);
  });

  it("не совпадает при редиректе на другой path", () => {
    expect(
      clientRouteMatchesNavigatePath({ path: "login", query: {} }, "dashboard"),
    ).toBe(false);
  });

  it("не совпадает query", () => {
    expect(
      clientRouteMatchesNavigatePath(
        { path: "search", query: { q: "other" } },
        "search?q=hello",
      ),
    ).toBe(false);
  });
});
