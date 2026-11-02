import { describe, expect, it } from "vitest";
import { findContextKeys } from "./find-context-keys";
import { parseContextPath } from "./parse-context-path";
import { replaceContextPlaceholders } from "./replace-context-placeholders";
import { setObjectProperty } from "./set-object-property";

describe("parseContextPath", () => {
  const contextId = "550e8400-e29b-41d4-a716-446655440000";

  it("строка без точки — только id контекста", () => {
    expect(parseContextPath(contextId)).toEqual({
      contextId,
      key: "",
    });
  });

  it("отделяет ключ по первой точке после UUID", () => {
    expect(parseContextPath(`${contextId}.cart.items.0`)).toEqual({
      contextId,
      key: "cart.items.0",
    });
  });
});

describe("setObjectProperty", () => {
  it("создаёт вложенный объект и записывает значение", () => {
    const target: Record<string, unknown> = {};
    setObjectProperty(target, "cart.total", 10);
    expect(target).toEqual({ cart: { total: 10 } });
  });

  it("создаёт массив, если следующий сегмент — число", () => {
    const target: Record<string, unknown> = {};
    setObjectProperty(target, "items.0.name", "a");
    expect(target).toEqual({ items: [{ name: "a" }] });
  });

  it("удаляет элемент массива, если значение undefined", () => {
    const target = { items: ["a", "b", "c"] };
    setObjectProperty(target, "items.1", undefined);
    expect(target.items).toEqual(["a", "c"]);
  });
});

describe("findContextKeys", () => {
  it("находит вложенные плейсхолдеры и игнорирует обычные скобки", () => {
    expect(
      findContextKeys("Hi {name} @{user.name} @{shop.@{user.id}}"),
    ).toEqual(["user.name", "user.id", "shop.@{user.id}"]);
  });
});

describe("replaceContextPlaceholders", () => {
  const values: Record<string, unknown> = {
    "ctx.name": "Ann",
    "ctx.missing": undefined,
    "ctx.count": 0,
    "ctx.price": "10$&",
    "ctx.second": "resolved",
    "ctx.first": "@{ctx.second}",
  };

  const resolveValue = (path: string) => values[path];

  it("подставляет значение и дефолт после первого =", () => {
    expect(
      replaceContextPlaceholders(
        "Hi @{ctx.name}, @{ctx.missing=fallback=literal}",
        resolveValue,
      ),
    ).toBe("Hi Ann, fallback=literal");
  });

  it("сохраняет 0 и литеральный $ в значении", () => {
    expect(
      replaceContextPlaceholders("@{ctx.count} @{ctx.price}", resolveValue),
    ).toBe("0 10$&");
  });

  it("повторяет проход, если подстановка снова содержит плейсхолдер", () => {
    expect(
      replaceContextPlaceholders("Start @{ctx.first} end", resolveValue),
    ).toBe("Start resolved end");
  });
});
