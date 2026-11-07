import { TextInputKind } from "@matreshka/client-bff-protocol/enums/text-input-kind";
import { describe, it } from "vitest";
import { createContext } from "../../core/context/context";
import { numberInput } from "./number-input";
import { passwordInput } from "./password-input";
import { textInput } from "./text-input";
import { textarea } from "./textarea";

describe("Input ref typing", () => {
  it("разрешает только совместимые ref для NumberInput", () => {
    const context = createContext<{
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

    void numberInput(context.ref("numeric"));

    void numberInput(context.ref("numericOrText"));

    void numberInput(
      // @ts-expect-error string-only ref несовместим с NumberInput
      context.ref("text"),
    );
  });

  it("разрешает только строковые ref для TextInput", () => {
    const context = createContext<{
      text: string;
      numeric: number;
    }>({
      data: async () => ({
        text: "",
        numeric: 1,
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
    const context = createContext<{
      description: string;
      tags: string[];
    }>({
      data: async () => ({
        description: "",
        tags: [],
      }),
    });

    void textarea(context.ref("description"));

    void textarea(
      // @ts-expect-error ref на массив несовместим с Textarea
      context.ref("tags"),
    );
  });

  it("разрешает только строковые ref для PasswordInput", () => {
    const context = createContext<{
      password: string;
      numeric: number;
    }>({
      data: async () => ({
        password: "",
        numeric: 1,
      }),
    });

    void passwordInput(context.ref("password"));

    void passwordInput(
      // @ts-expect-error числовой ref несовместим с PasswordInput
      context.ref("numeric"),
    );
  });
});
