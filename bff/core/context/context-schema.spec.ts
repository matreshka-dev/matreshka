import { describe, expectTypeOf, it } from "vitest";
import { z } from "zod";
import {
  createContext,
  type ContextDataFromInit,
  type ContextSchema,
} from "./context-create";

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

  it("отклоняет лишний ключ верхнего уровня", () => {
    type UserContext = { name: string };
    const schema = z.object({
      name: z.string(),
      role: z.string(),
    });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().toBeNever();
  });

  it("отклоняет лишний вложенный ключ в schema", () => {
    type UserContext = {
      profile: { name: string };
    };

    const nestedExtraSchema = z.object({
      profile: z.object({
        name: z.string(),
        isAdmin: z.boolean(),
      }),
    });

    expectTypeOf<
      ContextSchema<UserContext, typeof nestedExtraSchema>
    >().toBeNever();
  });

  it("отклоняет лишний ключ в optional-объекте", () => {
    type UserContext = {
      profile?: { name: string };
    };

    const schema = z.object({
      profile: z
        .object({
          name: z.string(),
          isAdmin: z.boolean(),
        })
        .optional(),
    });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().toBeNever();
  });

  it("отклоняет лишний ключ в nullable-объекте", () => {
    type UserContext = {
      profile: { name: string } | null;
    };

    const schema = z.object({
      profile: z
        .object({
          name: z.string(),
          isAdmin: z.boolean(),
        })
        .nullable(),
    });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().toBeNever();
  });

  it("отклоняет лишний ключ в элементе массива объектов", () => {
    type UserContext = {
      users: Array<{ name: string }>;
    };

    const schema = z.object({
      users: z.array(
        z.object({
          name: z.string(),
          isAdmin: z.boolean(),
        }),
      ),
    });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().toBeNever();
  });

  it("отклоняет лишний ключ в optional-массиве объектов", () => {
    type UserContext = {
      users?: Array<{ name: string }>;
    };

    const schema = z.object({
      users: z
        .array(
          z.object({
            name: z.string(),
            isAdmin: z.boolean(),
          }),
        )
        .optional(),
    });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().toBeNever();
  });

  it("отклоняет несовместимый output-тип поля", () => {
    type UserContext = { age: number };
    const schema = z.object({ age: z.string() });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().toBeNever();
  });

  it("отклоняет nullable output при обязательном number в T", () => {
    type UserContext = { age: number };
    const schema = z.object({ age: z.number().nullable() });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().toBeNever();
  });

  it("отклоняет optional-значение output при обязательном number в T", () => {
    type UserContext = { age: number };
    const schema = z.object({ age: z.number().optional() });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().toBeNever();
  });

  it("допускает nullable output, если T допускает null", () => {
    type UserContext = { age: number | null };
    const schema = z.object({ age: z.number().nullable() });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().not.toBeNever();
  });

  it("допускает transform string → number при T.number", () => {
    type UserContext = { age: number };
    const schema = z.object({
      age: z.string().transform((value) => Number(value)),
    });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().not.toBeNever();
  });

  it("допускает transform с совместимым output", () => {
    type UserContext = { name: string };
    const schema = z.object({
      name: z.string().transform((value) => value.toUpperCase()),
    });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().not.toBeNever();
  });

  it("отклоняет transform с несовместимым output", () => {
    type UserContext = { name: string };
    const schema = z.object({
      name: z.string().transform((value) => Number(value)),
    });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().toBeNever();
  });

  it("допускает вложенный transform с совместимым output", () => {
    type UserContext = {
      profile: { name: string; age: number };
    };
    const schema = z.object({
      profile: z.object({
        name: z.string().transform((value) => value.toUpperCase()),
      }),
    });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().not.toBeNever();
  });

  it("отклоняет вложенный transform с несовместимым output", () => {
    type UserContext = {
      profile: { name: string; age: number };
    };
    const schema = z.object({
      profile: z.object({
        name: z.string().transform((value) => Number(value)),
      }),
    });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().toBeNever();
  });

  it("допускает вложенное подмножество полей", () => {
    type UserContext = {
      profile: { name: string; age: number };
      settings: { theme: string };
    };

    const schema = z.object({
      profile: z.object({
        name: z.string(),
      }),
    });

    expectTypeOf<ContextSchema<UserContext, typeof schema>>().not.toBeNever();
  });

  it("createContext() принимает вложенную partial schema", () => {
    const schema = z.object({
      profile: z.object({
        name: z.string(),
      }),
    });

    createContext({
      data: async () => ({
        profile: { name: "", age: 0 },
        settings: { theme: "dark" },
      }),
      schema,
    });
  });

  it("допускает discriminated union с корректными ветками", () => {
    type Data = {
      payload:
        | { type: "user"; user: { name: string } }
        | { type: "product"; product: { title: string } };
    };

    const schema = z.object({
      payload: z.union([
        z.object({
          type: z.literal("user"),
          user: z.object({ name: z.string() }),
        }),
        z.object({
          type: z.literal("product"),
          product: z.object({ title: z.string() }),
        }),
      ]),
    });

    expectTypeOf<ContextSchema<Data, typeof schema>>().not.toBeNever();
  });

  it("отклоняет лишний ключ во вложенном union объектов", () => {
    type Data = {
      value: { type: "a"; a: string } | { type: "b"; b: number };
    };

    const schema = z.object({
      value: z.union([
        z.object({
          type: z.literal("a"),
          a: z.string(),
          extra: z.string(),
        }),
        z.object({
          type: z.literal("b"),
          b: z.number(),
        }),
      ]),
    });

    expectTypeOf<ContextSchema<Data, typeof schema>>().toBeNever();
  });

  it("отклоняет лишний ключ в ветке z.union", () => {
    type Data = {
      value: { a: string } | { b: string };
    };

    const schema = z.object({
      value: z.union([
        z.object({
          a: z.string(),
          isAdmin: z.boolean(),
        }),
        z.object({
          b: z.string(),
        }),
      ]),
    });

    expectTypeOf<ContextSchema<Data, typeof schema>>().toBeNever();
  });

  it("createContext() отклоняет schema с лишним ключом", () => {
    const badSchema = z.object({
      name: z.string(),
      extra: z.string(),
    });

    // @ts-expect-error лишний ключ extra относительно data
    createContext<{ name: string }, typeof badSchema>({
      data: async () => ({ name: "" }),
      schema: badSchema,
    });
  });

  it("createContext() отклоняет schema с несовместимым типом поля data", () => {
    const badSchema = z.object({
      searchQuery: z.number(),
    });
    // @ts-expect-error z.number() must not accept string output
    const outputCheck: z.output<typeof badSchema> = { searchQuery: "" };

    // @ts-expect-error schema output должен быть совместим с типом data
    createContext<{ searchQuery: string }, typeof badSchema>({
      data: async (): Promise<{ searchQuery: string }> => ({
        searchQuery: "",
      }),
      schema: badSchema,
    });
  });

  it("createContext() принимает schema с совместимым типом поля data", () => {
    createContext({
      data: async () => ({ searchQuery: "" }),
      schema: z.object({
        searchQuery: z.string(),
      }),
    });
  });

  it("createContext() выводит S из schema", () => {
    const nameSchema = z.object({ name: z.string() });
    const ctx = createContext({
      data: async () => ({ name: "a" }),
      schema: nameSchema,
    });

    expectTypeOf(ctx).toMatchTypeOf<{ schema?: typeof nameSchema }>();
  });

  it("createContext() принимает Promise<T> на data для полного T", () => {
    type UserContext = { name: string; bio?: string };
    type Init = {
      data: () => Promise<UserContext>;
      schema: z.ZodObject<{ name: z.ZodString }>;
    };

    expectTypeOf<ContextDataFromInit<Init>>().toEqualTypeOf<UserContext>();
  });
});
