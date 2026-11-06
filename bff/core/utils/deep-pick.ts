import { z } from "zod";

function isZodObject(schema: z.ZodTypeAny): schema is z.ZodObject {
  return schema instanceof z.ZodObject;
}

function isZodArray(schema: z.ZodTypeAny): schema is z.ZodArray<any> {
  return schema instanceof z.ZodArray;
}

/** Объектная shape для навигации по dotted-пути (без object-level pipe/transform). */
function objectShapeForPick(schema: z.ZodTypeAny): z.ZodObject {
  let current: z.ZodTypeAny = schema;
  for (;;) {
    if (isZodObject(current)) {
      return current;
    }
    if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
      current = current.unwrap() as z.ZodTypeAny;
      continue;
    }
    if (current instanceof z.ZodPipe) {
      const inner = current._def.in as z.ZodTypeAny;
      if (isZodObject(inner)) {
        return inner;
      }
      break;
    }
    break;
  }
  throw Error("Not a zod object");
}

function pickObject(schema: z.ZodTypeAny, path: string): z.ZodTypeAny {
  const objectSchema = objectShapeForPick(schema);
  const newSchema = objectSchema.shape?.[path];
  if (!newSchema)
    throw Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `${path} does not exist on schema with keys: ${Object.keys(objectSchema.shape)}`,
    );

  return newSchema;
}

function pickArray(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (!isZodArray(schema)) throw Error("Not a Zod Array");

  const newSchema = schema?.element;
  if (!newSchema) throw Error("No element on Zod Array");

  return newSchema;
}

export function zodDeepPick(
  schema: z.ZodTypeAny,
  propertyPath: string,
): z.ZodTypeAny {
  if (propertyPath === "") return schema;

  const numberRegex = new RegExp("[[0-9]+]");

  const arrayIndex = propertyPath.search(numberRegex);
  const objectIndex = propertyPath.indexOf(".");

  const matchedArray = arrayIndex !== -1;
  const matchedObject = objectIndex !== -1;

  if (
    (matchedArray && matchedObject && arrayIndex < objectIndex) ||
    (matchedArray && !matchedObject)
  ) {
    const arraySplit = propertyPath.split(numberRegex);
    const restArray = arraySplit.slice(1, arraySplit.length).join("[0]");

    if (arrayIndex !== 0) {
      return zodDeepPick(pickObject(schema, arraySplit[0]), `[0]${restArray}`);
    }

    return zodDeepPick(
      pickArray(schema),
      restArray.charAt(0) === "."
        ? restArray.slice(1, restArray.length)
        : restArray,
    );
  }

  if (matchedObject) {
    const objectSplit = propertyPath.split(".");
    const restObject = objectSplit.slice(1, objectSplit.length).join(".");

    return zodDeepPick(pickObject(schema, objectSplit[0]), restObject);
  }

  return pickObject(schema, propertyPath);
}
