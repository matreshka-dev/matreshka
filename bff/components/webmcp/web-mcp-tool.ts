import { WebMcpToolAnnotation } from "@matreshka/shared/enums/web-mcp-tool-annotation";
import type { Condition as SerializedCondition } from "@matreshka/shared/types/condition";
import * as crypto from "node:crypto";
import { z as z3 } from "zod";
import { z } from "zod/v4";
import { Condition } from "../../core/conditions/condition";

export { WebMcpToolAnnotation };

export type WebMcpToolExecute = () => Promise<string>;

export type WebMcpToolConditions = Condition[] | (() => Condition[]);

type WebMcpToolBase = {
  name: string;
  description: string;
  annotations?: readonly WebMcpToolAnnotation[];
  conditions?: WebMcpToolConditions;
};

/** Тулз со схемой аргументов. Тип `execute` выводится из схемы. */
export type WebMcpToolWithInput<TSchema extends z.ZodType> = WebMcpToolBase & {
  inputSchema: TSchema;
  execute: (input: z.output<TSchema>) => Promise<string>;
};

/** Тулз без аргументов. */
export type WebMcpToolWithoutInput = WebMcpToolBase & {
  inputSchema?: undefined;
  execute: WebMcpToolExecute;
};

/** Аргумент `webMcpTool()` и `new WebMcpTool()`. */
export type WebMcpToolInit<TSchema extends z.ZodType | undefined = undefined> =
  TSchema extends z.ZodType
    ? WebMcpToolWithInput<TSchema>
    : WebMcpToolWithoutInput;

const webMcpToolSchema = z3.object({
  name: z3.string().trim().min(1),
  description: z3.string().trim().min(1),
  annotations: z3
    .array(z3.custom<WebMcpToolAnnotation>(() => true))
    .refine((items) => new Set(items).size === items.length, {
      message: "Annotations must be unique",
    })
    .optional()
    .default([]),
});

type StoredExecute = (input?: unknown) => Promise<string>;

/**
 * WebMCP-тулз entry.
 * `webMcpTool({ ... })` и `new WebMcpTool({ ... })` создают один и тот же класс.
 * id назначается при создании, автор его не задаёт.
 * По `inputSchema` TypeScript выводит тип аргумента `execute`.
 *
 * Параметр схемы по умолчанию `any`, чтобы тулз с конкретной схемой
 * можно было положить в `WebMcpTool[]`.
 */
export class WebMcpTool<TSchema extends z.ZodType | undefined = any> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly annotations: readonly WebMcpToolAnnotation[];
  readonly execute: StoredExecute;
  readonly inputSchema?: z.ZodType;
  readonly conditions: SerializedCondition[];

  constructor(init: WebMcpToolInit<TSchema>) {
    const parsed = webMcpToolSchema.parse({
      name: init.name,
      description: init.description,
      annotations: init.annotations,
    });
    this.id = crypto.randomUUID();
    this.name = parsed.name;
    this.description = parsed.description;
    this.annotations = parsed.annotations;
    this.execute = init.execute;
    this.inputSchema = init.inputSchema;
    this.conditions = resolveWebMcpToolConditions(init.conditions);
  }
}

/** Функциональный вызов {@link WebMcpTool}. */
export function webMcpTool<TSchema extends z.ZodType | undefined = undefined>(
  init: WebMcpToolInit<TSchema>,
): WebMcpTool<TSchema> {
  return new WebMcpTool(init);
}

function resolveWebMcpToolConditions(
  conditions: WebMcpToolConditions | undefined,
): SerializedCondition[] {
  const list =
    typeof conditions === "function" ? conditions() : (conditions ?? []);
  return list.map((condition) => condition.toJSON());
}

export function webMcpInputJsonSchema(
  schema: z.ZodType,
): Record<string, unknown> {
  return z.toJSONSchema(schema);
}

export function webMcpToolErrorText(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
