import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { evaluateConditions } from "@matreshka/shared/utils/evaluate-conditions";
import { describe, expect, it } from "vitest";

const CART_REF = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.cart";
const OFFER_ID_REF = "11111111-2222-3333-4444-555555555555.offers.0.id";

describe("ContextArrayIncludes via evaluateConditions", () => {
  it("true для литерала в SerializedOperand", () => {
    const values: Record<string, unknown> = {
      [CART_REF]: [
        { offerId: 1, quantity: 2 },
        { offerId: 3, quantity: 1 },
      ],
    };

    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.ContextArrayIncludes,
            payload: {
              ref: CART_REF,
              itemPath: "offerId",
              value: { kind: "literal", value: 3 },
            },
          },
        ],
        { getContextValue: (ref) => values[ref as string] },
      ),
    ).toBe(true);
  });

  it("true для ref в SerializedOperand", () => {
    const values: Record<string, unknown> = {
      [CART_REF]: [{ offerId: 7, quantity: 1 }],
      [OFFER_ID_REF]: 7,
    };

    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.ContextArrayIncludes,
            payload: {
              ref: CART_REF,
              itemPath: "offerId",
              value: { kind: "ref", ref: OFFER_ID_REF },
            },
          },
        ],
        { getContextValue: (ref) => values[ref as string] },
      ),
    ).toBe(true);
  });

  it("false, если элемента нет", () => {
    const values: Record<string, unknown> = {
      [CART_REF]: [{ offerId: 1, quantity: 2 }],
    };

    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.ContextArrayIncludes,
            payload: {
              ref: CART_REF,
              itemPath: "offerId",
              value: { kind: "literal", value: 99 },
            },
          },
        ],
        { getContextValue: (ref) => values[ref as string] },
      ),
    ).toBe(false);
  });

  it("с пустым itemPath сравнивает сам элемент массива", () => {
    const values: Record<string, unknown> = {
      [CART_REF]: [1, 2, 3],
    };

    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.ContextArrayIncludes,
            payload: {
              ref: CART_REF,
              itemPath: "",
              value: { kind: "literal", value: 2 },
            },
          },
        ],
        { getContextValue: (ref) => values[ref as string] },
      ),
    ).toBe(true);
  });
});

describe("ContextArrayNotIncludes via evaluateConditions", () => {
  it("true, если элемента нет", () => {
    const values: Record<string, unknown> = {
      [CART_REF]: [{ offerId: 1, quantity: 2 }],
    };

    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.ContextArrayNotIncludes,
            payload: {
              ref: CART_REF,
              itemPath: "offerId",
              value: { kind: "literal", value: 99 },
            },
          },
        ],
        { getContextValue: (ref) => values[ref as string] },
      ),
    ).toBe(true);
  });

  it("false, если элемент есть", () => {
    const values: Record<string, unknown> = {
      [CART_REF]: [
        { offerId: 1, quantity: 2 },
        { offerId: 3, quantity: 1 },
      ],
    };

    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.ContextArrayNotIncludes,
            payload: {
              ref: CART_REF,
              itemPath: "offerId",
              value: { kind: "literal", value: 3 },
            },
          },
        ],
        { getContextValue: (ref) => values[ref as string] },
      ),
    ).toBe(false);
  });
});

describe("ContextValueEqual via evaluateConditions", () => {
  const MODE_REF = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.mode";
  const OTHER_REF = "11111111-2222-3333-4444-555555555555.expected";

  it("сравнивает с литералом", () => {
    const values: Record<string, unknown> = {
      [MODE_REF]: "alt",
    };

    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.ContextValueEqual,
            payload: {
              ref: MODE_REF,
              value: { kind: "literal", value: "alt" },
            },
          },
        ],
        { getContextValue: (ref) => values[ref as string] },
      ),
    ).toBe(true);
  });

  it("сравнивает с другой ContextRef", () => {
    const values: Record<string, unknown> = {
      [MODE_REF]: "alt",
      [OTHER_REF]: "alt",
    };

    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.ContextValueEqual,
            payload: {
              ref: MODE_REF,
              value: { kind: "ref", ref: OTHER_REF },
            },
          },
        ],
        { getContextValue: (ref) => values[ref as string] },
      ),
    ).toBe(true);
  });
});
