import { ConditionGroupOperator } from "@matreshka/client-bff-protocol/enums/condition-group-operator";
import { ConditionType } from "@matreshka/client-bff-protocol/enums/condition-type";
import { describe, expect, it } from "vitest";
import { conditionAll, conditionAny } from "./condition-group";

const ROLE_REF = "ctx.role";
const SESSION_REF = "ctx.session";

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
