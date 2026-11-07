import { describe, expectTypeOf, it } from "vitest";
import { createContext } from "../context/context";
import { ContextRefValueType } from "../context/context-ref";
import { ContextRefOfValue } from "./context-value-ref";

describe("ContextRefOfValue", () => {
  it("принимает ref страницы с числовым полем", () => {
    const context = createContext<{ amount?: number }>({
      data: async () => ({ amount: 1 }),
    });

    const amountRef = context.ref("amount");

    const bindAmount = (ref: ContextRefOfValue<number | undefined>) => {
      void ref;
    };

    bindAmount(amountRef);
    expectTypeOf(amountRef).toExtend<ContextRefOfValue<number | undefined>>();
  });

  it("отклоняет ref с несовместимым типом значения", () => {
    const context = createContext({
      data: async () => ({ title: "" }),
    });

    const bindAmount = (ref: ContextRefOfValue<number | undefined>) => {
      void ref;
    };

    bindAmount(
      // @ts-expect-error строковый ref несовместим с числовым ContextRefOfValue
      context.ref("title"),
    );
  });

  it("выводит тип значения через ContextRefValueType для брендированного ref", () => {
    type AmountRef = ContextRefOfValue<number | undefined>;

    expectTypeOf<ContextRefValueType<AmountRef>>().toEqualTypeOf<number>();
  });
});
