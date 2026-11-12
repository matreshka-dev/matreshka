import { z } from "zod";

function isZodObject(schema: z.ZodTypeAny): schema is z.ZodObject {
  return schema instanceof z.ZodObject;
}

function isZodArray(schema: z.ZodTypeAny): schema is z.ZodArray<any> {
  return schema instanceof z.ZodArray;
}

/**
 * Узел схемы, по которому можно идти дальше по пути.
 * Снимает optional/nullable и pipe к object/array (object-level transform).
 */
function schemaForPathStep(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current: z.ZodTypeAny = schema;
  for (;;) {
    if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
      current = current.unwrap() as z.ZodTypeAny;
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
function objectShapeForPick(schema: z.ZodTypeAny): z.ZodObject {
  const current = schemaForPathStep(schema);
  if (isZodObject(current)) {
    return current;
  }
  throw Error("Not a zod object");
}

function pickObject(schema: z.ZodTypeAny, path: string): z.ZodTypeAny {
  const objectSchema = objectShapeForPick(schema);
  const shape = objectSchema.shape as Record<string, z.ZodTypeAny>;
  const newSchema = shape[path];
  if (!newSchema)
    throw Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `${path} does not exist on schema with keys: ${Object.keys(shape)}`,
    );

  return newSchema;
}

function pickArray(schema: z.ZodTypeAny): z.ZodTypeAny {
  const current = schemaForPathStep(schema);
  if (!isZodArray(current)) throw Error("Not a Zod Array");

  const newSchema = current.element as z.ZodTypeAny | undefined;
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
  schema: z.ZodTypeAny,
  propertyPath: string,
): z.ZodTypeAny {
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
