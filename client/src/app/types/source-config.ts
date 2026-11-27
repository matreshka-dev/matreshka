export type SourceConfig =
  | {
      type: 'ws';
      params: { url: string };
    }
  | {
      type: 'sse';
      params: { url: string };
    };
