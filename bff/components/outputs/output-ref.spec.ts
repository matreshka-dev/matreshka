import { describe, it } from "vitest";
import { Context } from "../../core/context/context";
import { number } from "./number";
import { text } from "./text";

describe("Output ref typing", () => {
  it("разрешает только совместимые ref для числового output", () => {
    const context = new Context<{
      numeric: number;
      numericOrText: number | string;
      text: string;
    }>({
      data: async () => ({
        numeric: 1,
        numericOrText: 1,
        text: "",
      }),
    });

    void number(context.ref("numeric"));

    void number(context.ref("numericOrText"));

    void number(
      // @ts-expect-error string-only ref несовместим с Number output
      context.ref("text"),
    );
  });

  it("сохраняет строковые ref валидными для Text output", () => {
    const context = new Context<{ text: string }>({
      data: async () => ({
        text: "",
      }),
    });

    void text(context.ref("text"));

    void text(context.ref("text").toString());
  });
});
