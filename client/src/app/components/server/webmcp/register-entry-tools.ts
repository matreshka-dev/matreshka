import { WebMcpToolAnnotation } from '@matreshka/client-bff-protocol/enums/web-mcp-tool-annotation';
import { BffToClientMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/bff-to-client-message';
import { WebMcpToolErrorMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/webmcp/web-mcp-tool-error-message';
import { WebMcpToolResultMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/webmcp/web-mcp-tool-result-message';
import { WebMcpToolCallMessage } from '@matreshka/client-bff-protocol/messages/client-to-bff/webmcp/web-mcp-tool-call-message';
import type { Condition } from '@matreshka/client-bff-protocol/types/condition';
import type { WebMcpToolConfig } from '@matreshka/client-bff-protocol/types/web-mcp-tool-config';
import { collectConditionPayloadRefs } from '@matreshka/shared/utils/serialized-operand';
import { filter, firstValueFrom, Observable, Subscription, take } from 'rxjs';
import type { ContextChangeEvent } from '../../../types/context-change-event';
import { contextChangeAffectsRef } from '../../../utils/collect-context-ref-dependencies';

const emptyInputSchema = {
  type: 'object',
  properties: {},
} as const;

/** Имена, занятые сейчас в document.modelContext. */
const registeredToolNames = new Set<string>();

type ToolRegistration = {
  controller: AbortController;
  name: string;
};

type ToolTransport = {
  incomingMessage$: Observable<BffToClientMessage>;
  outcomingMessage$: { next(message: WebMcpToolCallMessage): void };
};

export type WebMcpToolAvailability = {
  conditionsMet: (conditions: Condition[]) => boolean;
  contextChange$: Observable<ContextChangeEvent>;
  replacePlaceholders?: (key: string) => string;
};

export function registerWebMcpTools(
  documentRef: Document,
  tools: readonly WebMcpToolConfig[] | undefined,
  postman: ToolTransport,
  availability?: WebMcpToolAvailability,
): () => void {
  const modelContext = documentRef.modelContext;
  const list = tools ?? [];
  if (!modelContext || list.length === 0) {
    return () => undefined;
  }

  const controllers = new Map<string, ToolRegistration>();
  const sync = () => {
    for (const tool of list) {
      const available = isToolAvailable(tool, availability);
      const current = controllers.get(tool.id);
      if (available && !current) {
        const registration = occupyToolName(tool.name);
        controllers.set(tool.id, registration);
        void modelContext
          .registerTool(
            {
              name: registration.name,
              description: tool.description,
              inputSchema: tool.inputSchema ?? emptyInputSchema,
              annotations: toWebMcpAnnotations(tool.annotations),
              execute: (input) => callWebMcpTool(postman, tool.id, input),
            },
            { signal: registration.controller.signal },
          )
          .catch(() => undefined);
      } else if (!available && current) {
        releaseToolName(current);
        controllers.delete(tool.id);
      }
    }
  };

  sync();

  const refs = list.flatMap((tool) => toolConditionRefs(tool.conditions));
  let changeSubscription: Subscription | undefined;
  if (availability && refs.length > 0) {
    changeSubscription = availability.contextChange$
      .pipe(
        filter((payload) =>
          refs.some((ref) =>
            contextChangeAffectsRef(
              payload,
              ref,
              availability.replacePlaceholders,
            ),
          ),
        ),
      )
      .subscribe(() => sync());
  }

  return () => {
    changeSubscription?.unsubscribe();
    for (const registration of controllers.values()) {
      releaseToolName(registration);
    }
    controllers.clear();
  };
}

function occupyToolName(baseName: string): ToolRegistration {
  let name = baseName;
  let suffix = 2;
  while (registeredToolNames.has(name)) {
    name = `${baseName}_${suffix}`;
    suffix += 1;
  }
  registeredToolNames.add(name);
  return { controller: new AbortController(), name };
}

function releaseToolName(registration: ToolRegistration): void {
  registration.controller.abort();
  registeredToolNames.delete(registration.name);
}

function isToolAvailable(
  tool: WebMcpToolConfig,
  availability: WebMcpToolAvailability | undefined,
): boolean {
  if (!tool.conditions?.length) {
    return true;
  }
  return availability?.conditionsMet(tool.conditions) ?? false;
}

function toolConditionRefs(conditions: Condition[] | undefined): string[] {
  if (!conditions) {
    return [];
  }
  return conditions.flatMap((condition) => {
    if (!('payload' in condition) || !condition.payload) {
      return [];
    }
    return collectConditionPayloadRefs(condition.payload);
  });
}

function toWebMcpAnnotations(annotations: readonly WebMcpToolAnnotation[]) {
  return {
    readOnlyHint: annotations.includes(WebMcpToolAnnotation.ReadOnlyHint),
    untrustedContentHint: annotations.includes(
      WebMcpToolAnnotation.UntrustedContentHint,
    ),
    consequentialHint: annotations.includes(
      WebMcpToolAnnotation.ConsequentialHint,
    ),
    debugging: annotations.includes(WebMcpToolAnnotation.Debugging),
  };
}

function callWebMcpTool(
  postman: ToolTransport,
  toolId: string,
  input: unknown,
): Promise<string> {
  const call = new WebMcpToolCallMessage(toolId, { input });
  const pending = firstValueFrom(
    postman.incomingMessage$.pipe(
      filter(
        (
          message,
        ): message is WebMcpToolResultMessage | WebMcpToolErrorMessage =>
          (message instanceof WebMcpToolResultMessage ||
            message instanceof WebMcpToolErrorMessage) &&
          message.target === toolId &&
          message.payload.callId === call.id,
      ),
      take(1),
    ),
  );
  postman.outcomingMessage$.next(call);
  return pending.then((message) => {
    if (message instanceof WebMcpToolErrorMessage) {
      throw new Error(message.payload.message);
    }
    return message.payload.result;
  });
}
