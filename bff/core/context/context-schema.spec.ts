import { describe, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { Context, type ContextSchema } from "./context";

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

  it("new Context выводит S из schema", () => {
    const nameSchema = z.object({ name: z.string() });
    const ctx = new Context({
      data: async () => ({ name: "a" as string }),
      schema: nameSchema,
    });

    expectTypeOf(ctx).toMatchTypeOf<{ schema?: typeof nameSchema }>();
  });
});
