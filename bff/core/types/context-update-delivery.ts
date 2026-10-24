import type { Client } from "../client";

/** Прогресс transport-level доставки diff контекста (накопительный список клиентов с receipt). */
export type ContextUpdateDelivery = {
  delivered: Client[];
};
