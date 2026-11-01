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

/** Тулз в списке entry. `execute` бивариантен, чтобы схема не терялась при возврате из `tools()`. */
type ListedWebMcpToolExecute = {
  bivarianceHack(input?: any): Promise<string>;
}["bivarianceHack"];

export type WebMcpTool = WebMcpToolBase & {
  inputSchema?: z.ZodType;
  execute: ListedWebMcpToolExecute;
};

export type WebMcpToolWithInput<TSchema extends z.ZodType> = WebMcpToolBase & {
  inputSchema: TSchema;
  execute: (input: z.output<TSchema>) => Promise<string>;
};

/** Объявление после сохранения на entry: id выдаёт сервер. */
export type RegisteredWebMcpTool = {
  id: string;
  name: string;
  description: string;
  execute: (input?: unknown) => Promise<string>;
  annotations: readonly WebMcpToolAnnotation[];
  inputSchema?: z.ZodType;
  conditions: SerializedCondition[];
};

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

/** Сохраняет схему и выводит тип аргумента execute из неё. */
export function webMcpTool<TSchema extends z.ZodType>(
  tool: WebMcpToolWithInput<TSchema>,
): WebMcpToolWithInput<TSchema> {
  return tool;
}

export function acceptWebMcpTool(tool: WebMcpTool): RegisteredWebMcpTool {
  const parsed = webMcpToolSchema.parse({
    name: tool.name,
    description: tool.description,
    annotations: tool.annotations,
  });
  return {
    id: crypto.randomUUID(),
    name: parsed.name,
    description: parsed.description,
    execute: tool.execute as RegisteredWebMcpTool["execute"],
    annotations: parsed.annotations,
    inputSchema: tool.inputSchema,
    conditions: resolveWebMcpToolConditions(tool.conditions),
  };
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
