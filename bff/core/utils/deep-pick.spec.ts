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

  const readingsSchema = z.object({
    meters: z.array(
      z.object({
        zones: z.array(
          z.object({
            value: z.string(),
          }),
        ),
      }),
    ),
  });

  it("принимает числовой сегмент как индекс массива", () => {
    const valueSchema = zodDeepPick(readingsSchema, "meters.0.zones.0.value");
    expect(valueSchema.parse("2")).toBe("2");
  });

  it("скобочный индекс массива не разбирается как путь", () => {
    expect(() =>
      zodDeepPick(readingsSchema, "meters[0].zones[0].value"),
    ).toThrow(/meters\[0\] does not exist/);
  });

  it("возвращает схему элемента массива целиком", () => {
    const meterSchema = zodDeepPick(readingsSchema, "meters.0");
    expect(meterSchema.parse({ zones: [{ value: "2" }] })).toEqual({
      zones: [{ value: "2" }],
    });
  });

  it("числовой сегмент объекта остаётся ключом объекта", () => {
    const schema = z.object({
      "0": z.string(),
    });

    const keySchema = zodDeepPick(schema, "0");
    expect(keySchema.parse("row")).toBe("row");
  });

  it("обходит optional и nullable вокруг массива", () => {
    const schema = z.object({
      meters: z
        .array(
          z.object({
            value: z.string(),
          }),
        )
        .nullable()
        .optional(),
    });

    const valueSchema = zodDeepPick(schema, "meters.0.value");
    expect(valueSchema.parse("2")).toBe("2");
  });
});
