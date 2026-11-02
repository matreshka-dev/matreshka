import { randomUuid } from "../../utils/random-uuid";
import { MessageData } from "../message";
import {
  ReliableMessageData,
  ReliableTargetedMessageData,
} from "../reliable-message";
import {
  ClientToBffMessage,
  TargetedClientToBffMessage,
} from "./client-to-bff-message";

export abstract class ReliableClientToBffMessage<
  PAYLOAD = unknown,
> extends ClientToBffMessage<PAYLOAD> {
  private _id?: string;
  private _attempt?: number;

  get id(): string {
    this._id ??= randomUuid();
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

export abstract class ReliableTargetedClientToBffMessage<
  PAYLOAD = unknown,
> extends TargetedClientToBffMessage<PAYLOAD> {
  private _id?: string;
  private _attempt?: number;

  get id(): string {
    this._id ??= randomUuid();
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

export function isReliableClientToBffMessage(
  message: unknown,
): message is ReliableClientToBffMessage | ReliableTargetedClientToBffMessage {
  return (
    message instanceof ReliableClientToBffMessage ||
    message instanceof ReliableTargetedClientToBffMessage
  );
}
