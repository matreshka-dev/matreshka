import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodDeepPick } from "./deep-pick";

describe("zodDeepPick", () => {
  it("сохраняет transform на вложенном dotted-пути", () => {
    const schema = z.object({
      profile: z.object({
        age: z.string().transform((value) => Number(value)),
      }),
    });

    const ageSchema = zodDeepPick(schema, "profile.age");
    expect(ageSchema.parse("25")).toBe(25);
  });

  it("обходит object-level transform при навигации к leaf", () => {
    const schema = z.object({
      user: z
        .object({
          firstName: z.string(),
          lastName: z.string(),
        })
        .transform((user) => ({
          fullName: `${user.firstName} ${user.lastName}`,
        })),
    });

    const firstNameSchema = zodDeepPick(schema, "user.firstName");
    expect(firstNameSchema.parse("John")).toBe("John");
  });

  it("сохраняет trim на leaf-поле внутри user", async () => {
    const schema = z.object({
      user: z.object({
        name: z.string().transform((value) => value.trim()),
      }),
    });

    const nameSchema = zodDeepPick(schema, "user.name");
    await expect(nameSchema.parseAsync("  x  ")).resolves.toBe("x");
  });
});
