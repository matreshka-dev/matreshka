import { describe, expect, it } from "vitest";
import { assertNonOverlappingContextPaths } from "./assert-non-overlapping-context-paths";
import { assertSafeDottedPath } from "./assert-safe-dotted-path";

describe("assertSafeDottedPath", () => {
  it("отклоняет опасные сегменты пути", () => {
    expect(() => assertSafeDottedPath("__proto__.x")).toThrow(
      /Invalid context path/,
    );
    expect(() => assertSafeDottedPath("a..b")).toThrow(/Invalid context path/);
  });
});

describe("assertNonOverlappingContextPaths", () => {
  it("отклоняет дубли и вложенные пути", () => {
    expect(() =>
      assertNonOverlappingContextPaths(["user.name", "user.name"]),
    ).toThrow(/Overlapping context paths/);
    expect(() =>
      assertNonOverlappingContextPaths(["user", "user.name"]),
    ).toThrow(/Overlapping context paths/);
    expect(() => assertNonOverlappingContextPaths(["a", "b"])).not.toThrow();
  });
});
