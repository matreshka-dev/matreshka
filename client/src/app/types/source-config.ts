export type SourceConfig =
  | {
      type: 'ws';
      params: { url: string };
    }
  | {
      type: 'sse';
      params: { eventsUrl: string; sendingMessagesUrl: string };
    };
