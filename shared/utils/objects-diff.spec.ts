import { describe, expect, it } from "vitest";
import { applyContextDiff, ContextDiffError } from "./objects-diff";

describe("applyContextDiff", () => {
  it("возвращает прежнее значение для пустого diff", () => {
    const previous = { a: 1 };
    expect(applyContextDiff(previous, undefined)).toBe(previous);
    expect(applyContextDiff(previous, {})).toBe(previous);
    expect(applyContextDiff([1, 2], [])).toEqual([1, 2]);
  });

  it("заменяет узел примитивом, включая null", () => {
    expect(applyContextDiff({ name: "Ivan" }, { name: "Petr" })).toEqual({
      name: "Petr",
    });
    expect(applyContextDiff({ name: "Ivan" }, { name: null })).toEqual({
      name: null,
    });
  });

  it("частично обновляет объект и удаляет свойства", () => {
    expect(
      applyContextDiff(
        { name: "Ivan", age: 25, email: "ivan@example.com" },
        { $remove: ["email"], age: 26 },
      ),
    ).toEqual({ name: "Ivan", age: 26 });
  });

  it("полностью заменяет объект и массив через $set", () => {
    expect(
      applyContextDiff({ name: "Ivan", age: 25 }, { $set: { name: "Petr" } }),
    ).toEqual({
      name: "Petr",
    });
    expect(applyContextDiff(["A", "B"], { $set: [] })).toEqual([]);
    expect(applyContextDiff({ theme: "dark" }, { $set: {} })).toEqual({});
  });

  it("не разбирает зарезервированные ключи внутри $set", () => {
    expect(
      applyContextDiff({ name: "Ivan" }, { $set: { $set: 1, $remove: 2 } }),
    ).toEqual({
      $set: 1,
      $remove: 2,
    });
  });

  it("удаляет элементы массива по исходным индексам", () => {
    expect(applyContextDiff(["A", "B", "C", "D"], { $remove: [1, 3] })).toEqual(
      ["A", "C"],
    );
  });

  it("выполняет перемещения последовательно", () => {
    expect(applyContextDiff(["A", "B", "C", "D"], { $move: [[3, 0]] })).toEqual(
      ["D", "A", "B", "C"],
    );
    expect(
      applyContextDiff(["A", "B", "C", "D"], {
        $move: [
          [3, 0],
          [2, 1],
        ],
      }),
    ).toEqual(["D", "B", "A", "C"]);
  });

  it("обновляет элементы после remove и move", () => {
    expect(
      applyContextDiff(["A", "B", "C", "D"], {
        $remove: [1],
        $move: [[2, 0]],
        "2": "Z",
      }),
    ).toEqual(["D", "A", "Z"]);
  });

  it("позиционно обновляет массив и не трогает хвост", () => {
    expect(applyContextDiff(["A", "B", "C"], [{}, "X"])).toEqual([
      "A",
      "X",
      "C",
    ]);
    expect(
      applyContextDiff([{ name: "A" }, { name: "B" }], [{}, { name: "C" }]),
    ).toEqual([{ name: "A" }, { name: "C" }]);
  });

  it("добавляет элементы в конец массива по итоговым индексам", () => {
    expect(applyContextDiff(["A", "B"], { "2": "C" })).toEqual(["A", "B", "C"]);
    expect(applyContextDiff(["A"], { "0": "Z", "1": "B", "2": "C" })).toEqual([
      "Z",
      "B",
      "C",
    ]);
    expect(applyContextDiff(["A"], { "1": { $set: { name: "B" } } })).toEqual([
      "A",
      { name: "B" },
    ]);
  });

  it("вставляет последовательность по индексу", () => {
    expect(applyContextDiff(["A", "C"], { $insert: [[1, ["B"]]] })).toEqual([
      "A",
      "B",
      "C",
    ]);
    expect(applyContextDiff(["A", "C"], { $insert: [[0, ["X"]]] })).toEqual([
      "X",
      "A",
      "C",
    ]);
    expect(
      applyContextDiff(["A", "C"], { $insert: [[1, ["B1", "B2"]]] }),
    ).toEqual(["A", "B1", "B2", "C"]);
    expect(
      applyContextDiff(["A", "C"], {
        $insert: [
          [0, ["X"]],
          [2, ["Y", "Z"]],
        ],
      }),
    ).toEqual(["X", "A", "Y", "Z", "C"]);
  });

  it("сочетает вставку с remove, move и обновлением", () => {
    expect(
      applyContextDiff(["A", "B", "C", "D"], {
        $remove: [1],
        $move: [[2, 0]],
        $insert: [[1, ["X"]]],
        "2": "Z",
      }),
    ).toEqual(["D", "X", "Z", "C"]);
  });

  it("не разбирает операции внутри вставленных значений", () => {
    expect(
      applyContextDiff(["A"], { $insert: [[1, [{ $set: 1, $remove: 2 }]]] }),
    ).toEqual(["A", { $set: 1, $remove: 2 }]);
  });

  it("отклоняет некорректную вставку", () => {
    expect(() => applyContextDiff({ a: 1 }, { $insert: [[0, ["A"]]] })).toThrow(
      ContextDiffError,
    );
    expect(() => applyContextDiff(["A"], { $insert: [] })).toThrow(
      ContextDiffError,
    );
    expect(() => applyContextDiff(["A"], { $insert: [[0, []]] })).toThrow(
      ContextDiffError,
    );
    expect(() => applyContextDiff(["A"], { $insert: [[3, ["B"]]] })).toThrow(
      ContextDiffError,
    );
    const previous = ["A", "C"];
    expect(() => applyContextDiff(previous, { $insert: [[3, ["B"]]] })).toThrow(
      ContextDiffError,
    );
    expect(previous).toEqual(["A", "C"]);
  });

  it("отклоняет дыру в массиве", () => {
    expect(() => applyContextDiff(["A"], { "2": "C" })).toThrow(
      ContextDiffError,
    );
  });

  it("создаёт отсутствующий объект частичным деревом свойств", () => {
    expect(applyContextDiff({}, { "id31@1": { index: "30" } })).toEqual({
      "id31@1": { index: "30" },
    });
    expect(applyContextDiff(["A"], { "1": { name: "B" } })).toEqual([
      "A",
      { name: "B" },
    ]);
    expect(applyContextDiff({}, { user: { name: "Petr" } })).toEqual({
      user: { name: "Petr" },
    });
  });

  it("не создаёт пустой объект из пустого diff", () => {
    expect(() => applyContextDiff({}, { settings: {} })).toThrow(
      ContextDiffError,
    );
    expect(() =>
      applyContextDiff({}, { user: { $remove: ["email"] } }),
    ).toThrow(ContextDiffError);
  });

  it("добавляет новое свойство примитивом и через $set", () => {
    expect(applyContextDiff({ name: "Ivan" }, { age: 25 })).toEqual({
      name: "Ivan",
      age: 25,
    });
    expect(applyContextDiff({}, { settings: { $set: {} } })).toEqual({
      settings: {},
    });
    expect(applyContextDiff({}, { items: { $set: ["A"] } })).toEqual({
      items: ["A"],
    });
  });

  it("не мутирует исходное значение", () => {
    const previous = { items: ["A", "B"], user: { name: "John" } };
    const snapshot = structuredClone(previous);
    applyContextDiff(previous, {
      user: { name: "Mike" },
      items: { $remove: [0] },
    });
    expect(previous).toEqual(snapshot);
  });

  it("отклоняет некорректный diff целиком", () => {
    const previous = { items: [1, 2], name: "John" };
    expect(() =>
      applyContextDiff(previous, { items: { $remove: [9] } }),
    ).toThrow(ContextDiffError);
    expect(() =>
      applyContextDiff(previous, { name: { $set: "Mike", age: 1 } }),
    ).toThrow(ContextDiffError);
    expect(() => applyContextDiff(previous, { $move: [[0, 1]] })).toThrow(
      ContextDiffError,
    );
    expect(() => applyContextDiff(previous, { $foo: 1 })).toThrow(
      ContextDiffError,
    );
    expect(() => applyContextDiff(["A"], ["B", "C"])).toThrow(ContextDiffError);
    expect(() => applyContextDiff({ a: 1 }, { a: {} })).not.toThrow();
    expect(previous).toEqual({ items: [1, 2], name: "John" });
  });
});
