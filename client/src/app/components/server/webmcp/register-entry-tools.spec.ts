import { WebMcpToolAnnotation } from '@shared/enums/web-mcp-tool-annotation';
import { WebMcpToolErrorMessage } from '@shared/messages/bff-to-client/webmcp/web-mcp-tool-error-message';
import { WebMcpToolResultMessage } from '@shared/messages/bff-to-client/webmcp/web-mcp-tool-result-message';
import { WebMcpToolCallMessage } from '@shared/messages/client-to-bff/webmcp/web-mcp-tool-call-message';
import type { WebMcpToolConfig } from '@shared/types/web-mcp-tool-config';
import { describe, expect, it, vi } from 'vitest';
import { TestPostmanService } from '../../../services/tests/test-postman.service';
import { registerEntryWebMcpTools } from './register-entry-tools';

const tool: WebMcpToolConfig = {
  id: 'tool-1',
  name: 'get_order_status',
  description: 'Статус заказа',
  annotations: [WebMcpToolAnnotation.ReadOnlyHint],
};

type RegisteredClientTool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
    consequentialHint: boolean;
    debugging: boolean;
  };
  execute: (input?: unknown) => Promise<string>;
};

type RegisterTool = (
  tool: RegisteredClientTool,
  options?: { signal?: AbortSignal },
) => Promise<void>;

function documentWith(registerTool: RegisterTool): Document {
  return { modelContext: { registerTool } } as unknown as Document;
}

describe('registerEntryWebMcpTools', () => {
  it('регистрирует тулз и снимает его через abort', async () => {
    const registerTool = vi.fn<RegisterTool>().mockResolvedValue(undefined);
    const postman = new TestPostmanService();
    const unregister = registerEntryWebMcpTools(
      documentWith(registerTool),
      [tool],
      postman,
    );

    expect(registerTool).toHaveBeenCalledTimes(1);
    const registration = registerTool.mock.calls[0];
    expect(registration?.[1]?.signal?.aborted).toBe(false);
    const registered = registration?.[0];
    if (!registered) {
      throw new Error('tool was not registered');
    }
    expect(registered.name).toBe('get_order_status');
    expect(registered.description).toBe('Статус заказа');
    expect(registered.inputSchema).toEqual({ type: 'object', properties: {} });
    expect(registered.annotations).toEqual({
      readOnlyHint: true,
      untrustedContentHint: false,
      consequentialHint: false,
      debugging: false,
    });

    const outgoing: WebMcpToolCallMessage[] = [];
    postman.outcomingMessage$.subscribe((message) => {
      if (message instanceof WebMcpToolCallMessage) {
        outgoing.push(message);
      }
    });
    const pending = registered.execute();
    const call = outgoing[0];
    if (!call) {
      throw new Error('web-mcp-tool-call was not sent');
    }
    expect(call.target).toBe('tool-1');
    postman.incomingMessage$.next(
      new WebMcpToolResultMessage(call.target, {
        result: 'pending',
        callId: call.id,
      }),
    );
    await expect(pending).resolves.toBe('pending');

    unregister();
    expect(registration?.[1]?.signal?.aborted).toBe(true);
  });

  it('отклоняет execute текстом ошибки', async () => {
    const registerTool = vi.fn<RegisterTool>().mockResolvedValue(undefined);
    const postman = new TestPostmanService();
    registerEntryWebMcpTools(documentWith(registerTool), [tool], postman);
    const registered = registerTool.mock.calls[0][0];
    const outgoing: WebMcpToolCallMessage[] = [];
    postman.outcomingMessage$.subscribe((message) => {
      if (message instanceof WebMcpToolCallMessage) {
        outgoing.push(message);
      }
    });

    const pending = registered.execute();
    const call = outgoing[0];
    if (!call) {
      throw new Error('web-mcp-tool-call was not sent');
    }
    postman.incomingMessage$.next(
      new WebMcpToolErrorMessage(call.target, {
        message: 'boom',
        callId: call.id,
      }),
    );
    await expect(pending).rejects.toThrow('boom');
  });

  it('передаёт JSON Schema и аргументы вызова', async () => {
    const inputSchema = {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    };
    const registerTool = vi.fn<RegisterTool>().mockResolvedValue(undefined);
    const postman = new TestPostmanService();
    registerEntryWebMcpTools(
      documentWith(registerTool),
      [{ ...tool, inputSchema }],
      postman,
    );

    const registered = registerTool.mock.calls[0]?.[0];
    expect(registered?.inputSchema).toEqual(inputSchema);
    const outgoing: WebMcpToolCallMessage[] = [];
    postman.outcomingMessage$.subscribe((message) => {
      if (message instanceof WebMcpToolCallMessage) {
        outgoing.push(message);
      }
    });
    const pending = registered?.execute({ text: 'Купить молоко' });
    expect(outgoing[0]?.payload).toEqual({ input: { text: 'Купить молоко' } });
    postman.incomingMessage$.next(
      new WebMcpToolResultMessage('tool-1', {
        result: 'Купить молоко',
        callId: outgoing[0].id,
      }),
    );
    await expect(pending).resolves.toBe('Купить молоко');
  });

  it('не регистрирует тулзы без modelContext и глотает отказ registerTool', async () => {
    const postman = new TestPostmanService();
    expect(() =>
      registerEntryWebMcpTools(document, [tool], postman),
    ).not.toThrow();

    const registerTool = vi
      .fn<RegisterTool>()
      .mockRejectedValue(new Error('duplicate'));
    expect(() =>
      registerEntryWebMcpTools(documentWith(registerTool), [tool], postman),
    ).not.toThrow();
    await Promise.resolve();
  });
});
