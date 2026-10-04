import { describe, expectTypeOf, it } from "vitest";
import { Context } from "../context/context";
import { ContextRefValue } from "../context/context-ref";
import { ContextValueRef } from "./context-value-ref";

describe("ContextValueRef", () => {
  it("принимает ref страницы с числовым полем", () => {
    const context = new Context<{ amount?: number }>({
      data: async () => ({ amount: 1 }),
    });

    const amountRef = context.ref("amount");

    const bindAmount = (ref: ContextValueRef<number | undefined>) => {
      void ref;
    };

    bindAmount(amountRef);
    expectTypeOf(amountRef).toExtend<ContextValueRef<number | undefined>>();
  });

  it("отклоняет ref с несовместимым типом значения", () => {
    const context = new Context<{ title: string }>({
      data: async () => ({ title: "" }),
    });

    const bindAmount = (ref: ContextValueRef<number | undefined>) => {
      void ref;
    };

    bindAmount(
      // @ts-expect-error строковый ref несовместим с числовым ContextValueRef
      context.ref("title"),
    );
  });

  it("выводит тип значения через ContextRefValue для брендированного ref", () => {
    type AmountRef = ContextValueRef<number | undefined>;

    expectTypeOf<ContextRefValue<AmountRef>>().toEqualTypeOf<number>();
  });
});
