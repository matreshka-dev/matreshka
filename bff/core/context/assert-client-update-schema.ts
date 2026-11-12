import { z } from "zod";

function unwrapOptionalNullable(schema: z.ZodType): z.ZodType {
  let current = schema;
  while (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
    current = current.unwrap() as z.ZodType;
  }
  return current;
}

function formatPath(path: string): string {
  return path || "(root)";
}

/**
 * Клиентские dotted-patch проходят {@link zodDeepPick} только до leaf-поля.
 * Object-level pipe (transform) и checks (refine) на вложенных объектах не поддерживаются.
 */
export function assertClientUpdateSchemaSupported(
  schema: z.ZodObject,
  path = "",
): void {
  for (const [key, fieldSchema] of Object.entries(schema.shape)) {
    const fieldPath = path ? `${path}.${key}` : key;
    assertClientUpdateFieldSupported(fieldSchema, fieldPath);
  }
}

function assertClientUpdateFieldSupported(
  schema: z.ZodType,
  path: string,
): void {
  const unwrapped = unwrapOptionalNullable(schema);

  if (unwrapped instanceof z.ZodPipe) {
    const inner = unwrapped._def.in as z.ZodType;
    if (inner instanceof z.ZodObject) {
      throw new Error(
        `Context validation schema: object-level transform at "${formatPath(path)}" is not supported for dotted-path client updates. Use leaf-level transforms only.`,
      );
    }
    return;
  }

  if (unwrapped instanceof z.ZodObject) {
    const checks = unwrapped._def.checks;
    if (checks && checks.length > 0) {
      throw new Error(
        `Context validation schema: object-level refine at "${formatPath(path)}" is not supported for dotted-path client updates. Use leaf-level refinements only.`,
      );
    }
    assertClientUpdateSchemaSupported(unwrapped, path);
    return;
  }

  if (unwrapped instanceof z.ZodArray) {
    assertClientUpdateFieldSupported(
      unwrapped.element as z.ZodType,
      `${path}[]`,
    );
  }
}
