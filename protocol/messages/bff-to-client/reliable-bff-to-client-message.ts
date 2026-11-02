import { MessageData } from "../message";
import {
  ReliableMessageData,
  ReliableTargetedMessageData,
} from "../reliable-message";
import {
  BffToClientMessage,
  TargetedBffToClientMessage,
} from "./bff-to-client-message";

type CryptoApi = {
  randomUUID: () => string;
};

export abstract class ReliableBffToClientMessage<
  PAYLOAD = unknown,
> extends BffToClientMessage<PAYLOAD> {
  private _id?: string;
  private _attempt?: number;

  get id(): string {
    this._id ??= (
      globalThis as typeof globalThis & { crypto: CryptoApi }
    ).crypto.randomUUID();
    return this._id;
  }

  get attempt(): number {
    this._attempt ??= 1;
    return this._attempt;
  }

  nextAttempt(): number {
    this._attempt = this.attempt + 1;
    return this._attempt;
  }

  restoreDelivery(data: MessageData): void {
    this._id = data.id;
    this._attempt = data.attempt;
  }

  override toJSON(): ReliableMessageData {
    return {
      ...super.toJSON(),
      id: this.id,
      attempt: this.attempt,
    };
  }
}

export abstract class ReliableTargetedBffToClientMessage<
  PAYLOAD = unknown,
> extends TargetedBffToClientMessage<PAYLOAD> {
  private _id?: string;
  private _attempt?: number;

  get id(): string {
    this._id ??= (
      globalThis as typeof globalThis & { crypto: CryptoApi }
    ).crypto.randomUUID();
    return this._id;
  }

  get attempt(): number {
    this._attempt ??= 1;
    return this._attempt;
  }

  nextAttempt(): number {
    this._attempt = this.attempt + 1;
    return this._attempt;
  }

  restoreDelivery(data: MessageData): void {
    this._id = data.id;
    this._attempt = data.attempt;
  }

  override toJSON(): ReliableTargetedMessageData {
    return {
      ...super.toJSON(),
      id: this.id,
      attempt: this.attempt,
    };
  }
}

export function isReliableBffToClientMessage(
  message: unknown,
): message is ReliableBffToClientMessage | ReliableTargetedBffToClientMessage {
  return (
    message instanceof ReliableBffToClientMessage ||
    message instanceof ReliableTargetedBffToClientMessage
  );
}
