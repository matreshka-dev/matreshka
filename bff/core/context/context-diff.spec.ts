import type { Json } from "@matreshka/client-bff-protocol/types/json";
import { applyContextDiff } from "@matreshka/shared/utils/objects-diff";
import { describe, expect, it } from "vitest";
import { createContextDiff } from "./context-diff";

function roundTrip(previous: Json, next: Json): Json {
  const diff = createContextDiff(previous, next);
  const serialized = JSON.parse(JSON.stringify(diff ?? null)) as ReturnType<
    typeof createContextDiff
  >;
  expect(JSON.stringify(serialized)).not.toContain('"$op"');
  expect(JSON.stringify(serialized)).not.toContain('"replace"');
  const applied = applyContextDiff(previous, diff);
  expect(applied).toEqual(next);
  expect(applyContextDiff(previous, serialized ?? undefined)).toEqual(next);
  return applied;
}

describe("createContextDiff", () => {
  it("не создаёт diff для структурно одинакового дерева", () => {
    const value = {
      user: { name: "John", tags: ["a", "b"] },
      items: [{ id: 1 }, { id: 1 }],
    };
    expect(createContextDiff(value, structuredClone(value))).toBeUndefined();
    expect(createContextDiff(value, value)).toBeUndefined();
  });

  it("не мутирует входные значения", () => {
    const previous = { items: ["A", "B"], user: { name: "John" } };
    const next = { items: ["B", "A", "C"], user: { name: "Mike" } };
    const previousSnapshot = structuredClone(previous);
    const nextSnapshot = structuredClone(next);
    roundTrip(previous, next);
    expect(previous).toEqual(previousSnapshot);
    expect(next).toEqual(nextSnapshot);
  });

  it("меняет одно свойство частичным деревом", () => {
    const previous = { user: { name: "John", age: 25 } };
    const next = { user: { name: "John", age: 26 } };
    expect(createContextDiff(previous, next)).toEqual({
      user: { age: 26 },
    });
    roundTrip(previous, next);
  });

  it("оставляет частичное обновление, даже если изменились все свойства", () => {
    const previous = { a: 1, b: 2, c: 3 };
    const next = { a: 4, b: 5, c: 6 };
    expect(createContextDiff(previous, next)).toEqual({
      a: 4,
      b: 5,
      c: 6,
    });
    roundTrip(previous, next);
  });

  it("добавляет новое свойство значением", () => {
    const previous = { name: "John" };
    const next = { name: "John", age: 25 };
    expect(createContextDiff(previous, next)).toEqual({ age: 25 });
    roundTrip(previous, next);
  });

  it("добавляет новый объект частичным деревом свойств", () => {
    const previous = { "id0@1": { index: "0" } };
    const next = {
      "id0@1": { index: "0" },
      "id31@1": { index: "30" },
    };
    expect(createContextDiff(previous, next)).toEqual({
      "id31@1": { index: "30" },
    });
    roundTrip(previous, next);
  });

  it("добавляет вложенный объект без $set", () => {
    expect(createContextDiff({}, { user: { name: "Petr" } })).toEqual({
      user: { name: "Petr" },
    });
    roundTrip({}, { user: { name: "Petr" } });
  });

  it("добавляет пустой объект и массив через $set", () => {
    expect(createContextDiff({}, { settings: {} })).toEqual({
      settings: { $set: {} },
    });
    expect(createContextDiff({}, { items: ["A"] })).toEqual({
      items: { $set: ["A"] },
    });
    roundTrip({}, { settings: {}, items: ["A"] });
  });

  it("удаляет свойство, значение которого стало undefined", () => {
    const extra = "x".repeat(40);
    const next = { flag: undefined, label: "keep", extra } as Json;

    expect(
      createContextDiff({ flag: true, label: "keep", extra }, next),
    ).toEqual({
      $remove: ["flag"],
    });
  });

  it("не кладёт undefined-свойство нового элемента в diff", () => {
    const next = [
      { id: 1, name: "a" },
      { id: 2, name: "b", owner: undefined },
    ] as Json;

    expect(createContextDiff([{ id: 1, name: "a" }], next)).toEqual({
      "1": { id: 2, name: "b" },
    });
    expect(
      applyContextDiff(
        [{ id: 1, name: "a" }],
        createContextDiff([{ id: 1, name: "a" }], next),
      ),
    ).toEqual([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ]);
  });

  it("удаляет одно свойство через $remove, если это короче $set", () => {
    const previous = { name: "Ivan", age: 25, email: "ivan@example.com" };
    const next = { name: "Ivan", age: 25 };
    expect(createContextDiff(previous, next)).toEqual({
      $remove: ["email"],
    });
    roundTrip(previous, next);
  });

  it("заменяет объект через $set, если удалений больше, чем оставшихся данных", () => {
    const previous = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    const next = { a: 1 };
    expect(createContextDiff(previous, next)).toEqual({
      $set: { a: 1 },
    });
    roundTrip(previous, next);
  });

  it("совмещает удаление и изменение, когда частичное дерево короче", () => {
    const name = "n".repeat(40);
    const previous = { name, age: 1, email: "a" };
    const next = { name, age: 2 };
    expect(createContextDiff(previous, next)).toEqual({
      $remove: ["email"],
      age: 2,
    });
    roundTrip(previous, next);
  });

  it("совмещает удаление и изменение свойств", () => {
    const previous = {
      name: "Ivan",
      age: 25,
      email: "ivan@example.com",
      phone: "123",
    };
    const next = { name: "Petr", age: 26 };
    expect(createContextDiff(previous, next)).toEqual({
      $set: { name: "Petr", age: 26 },
    });
    roundTrip(previous, next);
  });

  it("заменяет опустевший объект через $set", () => {
    const previous = { settings: { theme: "dark" } };
    const next = { settings: {} };
    expect(createContextDiff(previous, next)).toEqual({
      settings: { $set: {} },
    });
    roundTrip(previous, next);
  });

  it("оптимизирует вложенный объект отдельно от родителя", () => {
    const previous = {
      user: {
        name: "Ivan",
        settings: { theme: "light", language: "en", notifications: true },
      },
    };
    const next = {
      user: {
        name: "Petr",
        settings: { theme: "dark" },
      },
    };
    const diff = createContextDiff(previous, next);
    expect(diff).toEqual({
      user: {
        name: "Petr",
        settings: { $set: { theme: "dark" } },
      },
    });
    roundTrip(previous, next);
  });

  it("заменяет объект массивом через $set", () => {
    const previous = { value: { a: 1 } };
    const next = { value: ["A", "B"] };
    expect(createContextDiff(previous, next)).toEqual({
      value: { $set: ["A", "B"] },
    });
    roundTrip(previous, next);
  });

  it("записывает null как значение, а не как удаление", () => {
    const previous = { user: { name: "Ivan" } };
    const next = { user: { name: null } };
    expect(createContextDiff(previous, next)).toEqual({
      user: { name: null },
    });
    roundTrip(previous, next);
  });

  it("заменяет родителя, если изменился зарезервированный ключ", () => {
    const previous = { $set: 1, name: "John" };
    const next = { $set: 2, name: "John" };
    expect(createContextDiff(previous, next)).toEqual({
      $set: { $set: 2, name: "John" },
    });
    roundTrip(previous, next);
  });

  it("удаляет зарезервированный ключ через $remove", () => {
    const previous = { $set: 1, name: "John" };
    const next = { name: "John" };
    expect(createContextDiff(previous, next)).toEqual({
      $remove: ["$set"],
    });
    roundTrip(previous, next);
  });

  it("обновляет один элемент массива плотным деревом, если оно короче", () => {
    const previous = ["A", "B", "C"];
    const next = ["A", "X", "C"];
    expect(createContextDiff(previous, next)).toEqual([{}, "X"]);
    roundTrip(previous, next);
  });

  it("обновляет несколько элементов массива", () => {
    const previous = ["A", "B", "C"];
    const next = ["X", "Y", "C"];
    expect(createContextDiff(previous, next)).toEqual(["X", "Y"]);
    roundTrip(previous, next);
  });

  it("оставляет объектную форму, если изменение в конце массива", () => {
    const previous = ["A", "B", "C"];
    const next = ["A", "B", "Z"];
    expect(createContextDiff(previous, next)).toEqual({ "2": "Z" });
    roundTrip(previous, next);
  });

  it("вставляет последовательность в середину без замены массива", () => {
    const previous = ["alpha", "gamma", "delta", "epsilon"];
    const next = ["alpha", "beta-one", "beta-two", "gamma", "delta", "epsilon"];
    expect(createContextDiff(previous, next)).toEqual({
      $insert: [[1, ["beta-one", "beta-two"]]],
    });
    roundTrip(previous, next);
  });

  it("вставляет последовательность в начало", () => {
    const previous = ["gamma", "delta", "epsilon"];
    const next = ["alpha", "beta", ...previous];
    expect(createContextDiff(previous, next)).toEqual({
      $insert: [[0, ["alpha", "beta"]]],
    });
    roundTrip(previous, next);
  });

  it("вставляет элемент и обновляет существующий", () => {
    const previous = [
      { id: 1, name: "A" },
      { id: 2, name: "C" },
    ];
    const next = [
      { id: 1, name: "A" },
      { id: 3, name: "B" },
      { id: 2, name: "C2" },
    ];
    expect(createContextDiff(previous, next)).toEqual({
      $insert: [[1, [{ id: 3, name: "B" }]]],
      "2": { name: "C2" },
    });
    roundTrip(previous, next);
  });

  it("добавляет элементы в конец без замены массива", () => {
    const previous = ["alpha", "beta", "gamma", "delta"];
    const next = [...previous, "epsilon", "zeta"];
    expect(createContextDiff(previous, next)).toEqual({
      "4": "epsilon",
      "5": "zeta",
    });
    roundTrip(previous, next);
  });

  it("добавляет объект в конец частичным деревом этого элемента", () => {
    const previous = [{ id: 1, name: "A" }];
    const next = [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ];
    expect(createContextDiff(previous, next)).toEqual({
      "1": { id: 2, name: "B" },
    });
    roundTrip(previous, next);
  });

  it("добавляет элемент после перемещения", () => {
    const previous = ["A", "B", "C"];
    const next = ["C", "A", "B", "D"];
    expect(createContextDiff(previous, next)).toEqual({
      $move: [[2, 0]],
      "3": "D",
    });
    roundTrip(previous, next);
  });

  it("удаляет один элемент без перемещения соседей", () => {
    const previous = ["A", "B", "C"];
    const next = ["A", "C"];
    expect(createContextDiff(previous, next)).toEqual({ $remove: [1] });
    roundTrip(previous, next);
  });

  it("удаляет несколько элементов по исходным индексам", () => {
    const previous = ["A", "B", "C", "D"];
    const next = ["A", "C"];
    expect(createContextDiff(previous, next)).toEqual({ $remove: [1, 3] });
    roundTrip(previous, next);
  });

  it("перемещает один элемент", () => {
    const previous = ["A", "B", "C", "D"];
    const next = ["D", "A", "B", "C"];
    expect(createContextDiff(previous, next)).toEqual({ $move: [[3, 0]] });
    roundTrip(previous, next);
  });

  it("перемещает несколько элементов", () => {
    const previous = ["A", "B", "C", "D"];
    const next = ["D", "C", "A", "B"];
    const diff = createContextDiff(previous, next);
    expect(diff).toEqual({
      $move: [
        [3, 0],
        [3, 1],
      ],
    });
    roundTrip(previous, next);
  });

  it("совмещает перемещение и изменение элемента", () => {
    const previous = [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
      { id: 3, name: "C" },
    ];
    const next = [
      { id: 3, name: "C" },
      { id: 1, name: "A" },
      { id: 2, name: "B2" },
    ];
    expect(createContextDiff(previous, next)).toEqual({
      $move: [[2, 0]],
      "2": { name: "B2" },
    });
    roundTrip(previous, next);
  });

  it("совмещает удаление, перемещение и изменение", () => {
    const previous = [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
      { id: 3, name: "C" },
      { id: 4, name: "D" },
    ];
    const next = [
      { id: 4, name: "D" },
      { id: 1, name: "A" },
      { id: 3, name: "C2" },
    ];
    expect(createContextDiff(previous, next)).toEqual({
      $remove: [1],
      $move: [[2, 0]],
      "2": { name: "C2" },
    });
    roundTrip(previous, next);
  });

  it("заменяет массив пустым через $set", () => {
    const previous = { items: ["A", "B"] };
    const next = { items: [] };
    expect(createContextDiff(previous, next)).toEqual({
      items: { $set: [] },
    });
    roundTrip(previous, next);
  });

  it("полностью заменяет массив, если частичное дерево длиннее", () => {
    const previous = ["A", "B", "C"];
    const next = ["X", "Y"];
    expect(createContextDiff(previous, next)).toEqual({
      $set: ["X", "Y"],
    });
    roundTrip(previous, next);
  });

  it("сохраняет повторяющиеся элементы без ложного перемещения", () => {
    const previous = ["A", "A", "B"];
    const next = ["A", "B"];
    expect(createContextDiff(previous, next)).toEqual({ $remove: [1] });
    roundTrip(previous, next);
  });

  it("не использует повторяющийся id как идентичность", () => {
    const previous = [
      { id: 1, name: "A" },
      { id: 1, name: "B" },
    ];
    const next = [
      { id: 1, name: "B" },
      { id: 1, name: "A" },
    ];
    expect(createContextDiff(previous, next)).toEqual({
      $move: [[0, 1]],
    });
    roundTrip(previous, next);
  });

  it("принимает критерий идентичности приложения", () => {
    const previous = [
      { key: "a", value: 1 },
      { key: "b", value: 2 },
    ];
    const next = [
      { key: "b", value: 2 },
      { key: "a", value: 1 },
    ];
    const diff = createContextDiff(previous, next, (left, right) => {
      return (
        typeof left === "object" &&
        left !== null &&
        typeof right === "object" &&
        right !== null &&
        !Array.isArray(left) &&
        !Array.isArray(right) &&
        left.key === right.key
      );
    });
    expect(diff).toEqual({ $move: [[0, 1]] });
    roundTrip(previous, next);
  });

  it("обновляет вложенные массивы", () => {
    const previous = { rows: [["A", "B"], ["C"]] };
    const next = { rows: [["A", "Z"], ["C"]] };
    roundTrip(previous, next);
    expect(createContextDiff(previous, next)).toEqual({
      rows: [[{}, "Z"]],
    });
  });

  it("собирает основной пример контекста", () => {
    const previous = {
      user: { name: "Иван", age: 25, email: "ivan@example.com" },
      items: [
        { id: 1, name: "A" },
        { id: 2, name: "B" },
        { id: 3, name: "C" },
      ],
      settings: { theme: "light" },
    };
    const next = {
      user: { name: "Пётр", age: 25 },
      items: [
        { id: 3, name: "C" },
        { id: 1, name: "A" },
        { id: 2, name: "B2" },
      ],
      settings: {},
    };
    expect(createContextDiff(previous, next)).toEqual({
      user: { $set: { name: "Пётр", age: 25 } },
      items: { $move: [[2, 0]], "2": { name: "B2" } },
      settings: { $set: {} },
    });
    roundTrip(previous, next);
  });

  it("выбирает $set для длинного списка удалений в большом массиве", () => {
    const previous = Array.from({ length: 30 }, (_, index) => index);
    const next = [0];
    expect(createContextDiff(previous, next)).toEqual({ $set: [0] });
    roundTrip(previous, next);
  });
});
