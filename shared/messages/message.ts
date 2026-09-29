import type { MessageClass } from "./message-registry";

export type MessageData = {
  type: string;
  payload?: unknown;
  id?: string;
  attempt?: number;
};

/** JSON до парсинга (target только у targeted-сообщений). */
export type IncomingMessageData = MessageData & {
  target?: string;
};

export abstract class Message<PAYLOAD = unknown> {
  get type(): string {
    return (this.constructor as MessageClass<unknown>).type;
  }

  constructor(readonly payload?: PAYLOAD) {}

  toJSON(): MessageData {
    return {
      type: this.type,
      payload: this.payload,
    };
  }
}
