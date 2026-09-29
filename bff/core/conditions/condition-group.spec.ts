import { ArrayLengthCompare } from "@matreshka/shared/enums/array-length-compare";
import { ConditionGroupOperator } from "@matreshka/shared/enums/condition-group-operator";
import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { DeviceType } from "@matreshka/shared/enums/device-type";
import {
  evaluateConditions,
  type EvaluatableCondition,
} from "@matreshka/shared/utils/evaluate-conditions";
import { describe, expect, it } from "vitest";
import { conditionAll, conditionAny } from "./condition-group";
import { desktopDevice } from "./desktop-device";
import { mobileDevice } from "./mobile-device";

const ROLE_REF = "ctx.role";
const SESSION_REF = "ctx.session";
const FORMAT_REF = "ctx.format";
const ROWS_REF = "ctx.rows";
const TEMPLATE_ID_REF = "ctx.templateId";

describe("ConditionGroup serialization", () => {
  it("сериализует any как condition-group с operator or", () => {
    const group = conditionAny([
      {
        toJSON: () => ({
          type: ConditionType.ContextValueEqual,
          payload: { ref: ROLE_REF, value: "admin" },
        }),
      } as any,
      {
        toJSON: () => ({
          type: ConditionType.ContextValueEqual,
          payload: { ref: ROLE_REF, value: "moderator" },
        }),
      } as any,
    ]);

    expect(group.toJSON()).toEqual({
      type: ConditionType.Group,
      payload: {
        operator: ConditionGroupOperator.Or,
        conditions: [
          {
            type: ConditionType.ContextValueEqual,
            payload: { ref: ROLE_REF, value: "admin" },
          },
          {
            type: ConditionType.ContextValueEqual,
            payload: { ref: ROLE_REF, value: "moderator" },
          },
        ],
      },
    });
  });

  it("сериализует all как condition-group с operator and", () => {
    const group = conditionAll([
      {
        toJSON: () => ({
          type: ConditionType.ContextValueDefined,
          payload: { ref: SESSION_REF },
        }),
      } as any,
    ]);

    expect(group.toJSON()).toEqual({
      type: ConditionType.Group,
      payload: {
        operator: ConditionGroupOperator.And,
        conditions: [
          {
            type: ConditionType.ContextValueDefined,
            payload: { ref: SESSION_REF },
          },
        ],
      },
    });
  });
});

const literal = (value: string | number | boolean | null) =>
  ({ kind: "literal", value }) as const;

describe("evaluateConditions with groups", () => {
  const options = {
    getContextValue: (ref: string) => {
      const values: Record<string, unknown> = {
        [ROLE_REF]: "admin",
        [SESSION_REF]: "ok",
        [FORMAT_REF]: "csv",
        [ROWS_REF]: [1, 2],
        [TEMPLATE_ID_REF]: undefined,
      };
      return values[ref];
    },
    getDeviceType: () => DeviceType.Desktop,
  };

  it("when.any — истинно, если выполнено хотя бы одно условие", () => {
    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.Group,
            payload: {
              operator: ConditionGroupOperator.Or,
              conditions: [
                {
                  type: ConditionType.ContextValueEqual,
                  payload: { ref: ROLE_REF, value: literal("moderator") },
                },
                {
                  type: ConditionType.ContextValueEqual,
                  payload: { ref: ROLE_REF, value: literal("admin") },
                },
              ],
            },
          },
        ],
        options,
      ),
    ).toBe(true);
  });

  it("when.any — ложно, если ни одно условие не выполнено", () => {
    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.Group,
            payload: {
              operator: ConditionGroupOperator.Or,
              conditions: [
                {
                  type: ConditionType.ContextValueEqual,
                  payload: { ref: ROLE_REF, value: literal("guest") },
                },
                {
                  type: ConditionType.ContextValueEqual,
                  payload: { ref: ROLE_REF, value: literal("moderator") },
                },
              ],
            },
          },
        ],
        options,
      ),
    ).toBe(false);
  });

  it("when.all внутри when.any — одна из двух групп", () => {
    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.Group,
            payload: {
              operator: ConditionGroupOperator.Or,
              conditions: [
                {
                  type: ConditionType.Group,
                  payload: {
                    operator: ConditionGroupOperator.And,
                    conditions: [
                      {
                        type: ConditionType.ContextValueEqual,
                        payload: { ref: FORMAT_REF, value: literal("csv") },
                      },
                      {
                        type: ConditionType.ContextArrayLength,
                        payload: {
                          ref: ROWS_REF,
                          length: literal(0),
                          operator: ArrayLengthCompare.GreaterThan,
                        },
                      },
                    ],
                  },
                },
                {
                  type: ConditionType.Group,
                  payload: {
                    operator: ConditionGroupOperator.And,
                    conditions: [
                      {
                        type: ConditionType.ContextValueEqual,
                        payload: { ref: FORMAT_REF, value: literal("pdf") },
                      },
                      {
                        type: ConditionType.ContextValueDefined,
                        payload: { ref: TEMPLATE_ID_REF },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
        options,
      ),
    ).toBe(true);
  });

  it("верхний уровень остаётся AND: группа OR и отдельное условие", () => {
    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.Group,
            payload: {
              operator: ConditionGroupOperator.Or,
              conditions: [
                { type: ConditionType.DesktopDevice },
                { type: ConditionType.MobileDevice },
              ],
            },
          },
          {
            type: ConditionType.ContextValueEqual,
            payload: { ref: ROLE_REF, value: literal("guest") },
          },
        ] as EvaluatableCondition[],
        options,
      ),
    ).toBe(false);
  });

  it("пустая группа any — ложь, пустая группа all — истина", () => {
    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.Group,
            payload: {
              operator: ConditionGroupOperator.Or,
              conditions: [],
            },
          },
        ],
        options,
      ),
    ).toBe(false);

    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.Group,
            payload: {
              operator: ConditionGroupOperator.And,
              conditions: [],
            },
          },
        ],
        options,
      ),
    ).toBe(true);
  });

  it("интеграция BFF-хелперов any/all с device-условиями", () => {
    const conditions = [
      conditionAny([desktopDevice(), mobileDevice()]).toJSON(),
      conditionAll([
        {
          toJSON: () => ({
            type: ConditionType.ContextValueEqual,
            payload: { ref: ROLE_REF, value: literal("admin") },
          }),
        } as any,
        {
          toJSON: () => ({
            type: ConditionType.ContextValueEqual,
            payload: { ref: SESSION_REF, value: literal("ok") },
          }),
        } as any,
      ]).toJSON(),
    ];

    expect(evaluateConditions(conditions, options)).toBe(true);
  });
});
