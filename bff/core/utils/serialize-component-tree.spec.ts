import { describe, expect, it } from "vitest";
import {
  assignSerializedOverlays,
  serializeOverlaysProperty,
} from "./serialize-component-tree";

describe("serializeOverlaysProperty", () => {
  it("возвращает undefined, если overlays не заданы", () => {
    expect(serializeOverlaysProperty(undefined)).toBeUndefined();
  });

  it("возвращает undefined для пустого массива", () => {
    expect(serializeOverlaysProperty([])).toBeUndefined();
  });
});

describe("assignSerializedOverlays", () => {
  it("удаляет overlays из overrides при пустом массиве", () => {
    const out: Record<string, unknown> = { overlays: [], gap: 8 };
    assignSerializedOverlays(out, []);
    expect(out).toEqual({ gap: 8 });
    expect("overlays" in out).toBe(false);
  });
});
