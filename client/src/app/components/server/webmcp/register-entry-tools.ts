import { WebMcpToolAnnotation } from '@shared/enums/web-mcp-tool-annotation';
import { BffToClientMessage } from '@shared/messages/bff-to-client/bff-to-client-message';
import { WebMcpToolErrorMessage } from '@shared/messages/bff-to-client/webmcp/web-mcp-tool-error-message';
import { WebMcpToolResultMessage } from '@shared/messages/bff-to-client/webmcp/web-mcp-tool-result-message';
import { WebMcpToolCallMessage } from '@shared/messages/client-to-bff/webmcp/web-mcp-tool-call-message';
import type { WebMcpToolConfig } from '@shared/types/web-mcp-tool-config';
import { filter, firstValueFrom, Observable, take } from 'rxjs';

const emptyInputSchema = {
  type: 'object',
  properties: {},
} as const;

type ToolTransport = {
  incomingMessage$: Observable<BffToClientMessage>;
  outcomingMessage$: { next(message: WebMcpToolCallMessage): void };
};

export function registerEntryWebMcpTools(
  documentRef: Document,
  tools: readonly WebMcpToolConfig[] | undefined,
  postman: ToolTransport,
): () => void {
  const modelContext = documentRef.modelContext;
  if (!modelContext || !tools || tools.length === 0) {
    return () => undefined;
  }

  const registration = new AbortController();
  for (const tool of tools) {
    void modelContext
      .registerTool(
        {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema ?? emptyInputSchema,
          annotations: toWebMcpAnnotations(tool.annotations),
          execute: (input) => callWebMcpTool(postman, tool.id, input),
        },
        { signal: registration.signal },
      )
      .catch(() => undefined);
  }
  return () => registration.abort();
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
