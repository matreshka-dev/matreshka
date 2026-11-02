import { MessageData } from "./message";
import { TargetedMessageData } from "./targeted-message";

export type ReliableMessageData = MessageData & {
  id: string;
  attempt: number;
};

export type ReliableTargetedMessageData = TargetedMessageData & {
  id: string;
  attempt: number;
};

export type MessageReceivedPayload = {
  id: string;
  attempt: number;
};
