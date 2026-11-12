import { z } from "zod";

function isZodObject(schema: unknown): schema is z.ZodObject {
  return schema instanceof z.ZodObject;
}

function isZodArray(schema: unknown): schema is z.ZodArray<any> {
  return schema instanceof z.ZodArray;
}

/**
 * Узел схемы, по которому можно идти дальше по пути.
 * Снимает optional/nullable и pipe к object/array (object-level transform).
 */
function schemaForPathStep(schema: z.ZodType): z.ZodType {
  let current: z.ZodType = schema;
  for (;;) {
    if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
      current = current.unwrap() as z.ZodType;
      continue;
    }
    if (current instanceof z.ZodPipe) {
      const inner = current.in;
      if (isZodObject(inner) || isZodArray(inner)) {
        current = inner;
        continue;
      }
      break;
    }
    break;
  }
  return current;
}

/** Объектная shape для навигации по dotted-пути (без object-level pipe/transform). */
function objectShapeForPick(schema: z.ZodType): z.ZodObject {
  const current = schemaForPathStep(schema);
  if (isZodObject(current)) {
    return current;
  }
  throw Error("Not a zod object");
}

function pickObject(schema: z.ZodType, path: string): z.ZodType {
  const objectSchema = objectShapeForPick(schema);
  const shape = objectSchema.shape as Record<string, z.ZodType>;
  const newSchema = shape[path];
  if (!newSchema)
    throw Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `${path} does not exist on schema with keys: ${Object.keys(shape)}`,
    );

  return newSchema;
}

function pickArray(schema: z.ZodType): z.ZodType {
  const current = schemaForPathStep(schema);
  if (!isZodArray(current)) throw Error("Not a Zod Array");

  const newSchema = current.element as z.ZodType | undefined;
  if (!newSchema) throw Error("No element on Zod Array");

  return newSchema;
}

/**
 * Схема конечного поля по dotted-пути клиентского patch.
 *
 * Элемент массива адресуется числовым сегментом (`meters.0.zones.0.value`).
 * Индексом он считается только если текущий узел — `ZodArray`; у `ZodObject`
 * тот же сегмент остаётся строковым ключом (`{ "0": z.string() }`).
 */
export function zodDeepPick(
  schema: z.ZodType,
  propertyPath: string,
): z.ZodType {
  if (propertyPath === "") return schema;

  const dot = propertyPath.indexOf(".");
  const segment = dot === -1 ? propertyPath : propertyPath.slice(0, dot);
  const rest = dot === -1 ? "" : propertyPath.slice(dot + 1);

  const current = schemaForPathStep(schema);
  if (isZodArray(current) && /^\d+$/.test(segment)) {
    return zodDeepPick(pickArray(current), rest);
  }

  return zodDeepPick(pickObject(schema, segment), rest);
}
