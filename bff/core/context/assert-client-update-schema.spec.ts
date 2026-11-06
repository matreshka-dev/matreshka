import { describe, expect, it } from "vitest";
import { z } from "zod";
import { assertClientUpdateSchemaSupported } from "./assert-client-update-schema";

describe("assertClientUpdateSchemaSupported", () => {
  it("разрешает leaf transform", () => {
    expect(() =>
      assertClientUpdateSchemaSupported(
        z.object({
          name: z.string().transform((value) => value.trim()),
        }),
      ),
    ).not.toThrow();
  });

  it("отклоняет object-level transform", () => {
    expect(() =>
      assertClientUpdateSchemaSupported(
        z.object({
          user: z
            .object({ name: z.string() })
            .transform((user) => ({ fullName: user.name })),
        }),
      ),
    ).toThrow(/object-level transform.*user/);
  });

  it("отклоняет object-level refine", () => {
    expect(() =>
      assertClientUpdateSchemaSupported(
        z.object({
          user: z
            .object({ name: z.string() })
            .refine((user) => user.name.length > 0),
        }),
      ),
    ).toThrow(/object-level refine.*user/);
  });
});
