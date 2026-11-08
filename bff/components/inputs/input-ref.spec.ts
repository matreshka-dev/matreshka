import { TextInputKind } from "@matreshka/client-bff-protocol/enums/text-input-kind";
import { describe, it } from "vitest";
import { z } from "zod";
import { createContext } from "../../core/context/context";
import { numberInput } from "./number-input";
import { passwordInput } from "./password-input";
import { textInput } from "./text-input";
import { textarea } from "./textarea";

describe("Input ref typing", () => {
  it("разрешает только совместимые ref для NumberInput", () => {
    const context = createContext({
      schema: z.object({
        numeric: z.number(),
        numericOrText: z.union([z.number(), z.string()]),
        text: z.string(),
      }),
      data: async () => ({
        numeric: 1 as number,
        numericOrText: 1 as number | string,
        text: "" as string,
      }),
    });

    void numberInput(context.ref("numeric"));

    void numberInput(
      // @ts-expect-error string-only ref несовместим с NumberInput
      context.ref("text"),
    );
  });

  it("разрешает только строковые ref для TextInput", () => {
    const context = createContext({
      schema: z.object({ text: z.string(), numeric: z.number() }),
      data: async () => ({
        text: "" as string,
        numeric: 1 as number,
      }),
    });

    void textInput(context.ref("text"));
    void textInput({ kind: TextInputKind.Email }, context.ref("text"));

    void textInput(
      // @ts-expect-error числовой ref несовместим с TextInput
      context.ref("numeric"),
    );
  });

  it("разрешает только строковые ref для Textarea", () => {
    const context = createContext({
      schema: z.object({ description: z.string(), tags: z.array(z.string()) }),
      data: async () => ({
        description: "" as string,
        tags: [] as string[],
      }),
    });

    void textarea(context.ref("description"));

    void textarea(
      // @ts-expect-error ref на массив несовместим с Textarea
      context.ref("tags"),
    );
  });

  it("разрешает только строковые ref для PasswordInput", () => {
    const context = createContext({
      schema: z.object({ password: z.string(), numeric: z.number() }),
      data: async () => ({
        password: "" as string,
        numeric: 1 as number,
      }),
    });

    void passwordInput(context.ref("password"));

    void passwordInput(
      // @ts-expect-error числовой ref несовместим с PasswordInput
      context.ref("numeric"),
    );
  });
});
