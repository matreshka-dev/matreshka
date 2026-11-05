import { describe, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  context,
  type ContextDataFromInit,
  type ContextSchema,
} from "./context";

describe("ContextSchema", () => {
  it("связывает generic T и Zod-схему", () => {
    type UserContext = {
      id: string;
      name: string;
      age: number;
    };

    const fullUserSchema = z.object({
      id: z.string(),
      name: z.string(),
      age: z.number(),
    });
    const partialUserSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    expectTypeOf<
      ContextSchema<UserContext, typeof fullUserSchema>
    >().not.toBeNever();
    expectTypeOf<
      ContextSchema<UserContext, typeof partialUserSchema>
    >().not.toBeNever();
  });

  it("context() выводит S из schema", () => {
    const nameSchema = z.object({ name: z.string() });
    const ctx = context({
      data: async () => ({ name: "a" as string }),
      schema: nameSchema,
    });

    expectTypeOf(ctx).toMatchTypeOf<{ schema?: typeof nameSchema }>();
  });

  it("context() принимает Promise<T> на data для полного T", () => {
    type UserContext = { name: string; bio?: string };
    type Init = {
      data: () => Promise<UserContext>;
      schema: z.ZodObject<{ name: z.ZodString }>;
    };

    expectTypeOf<ContextDataFromInit<Init>>().toEqualTypeOf<UserContext>();
  });
});
