import { registerClientToBffMessages } from "@matreshka/client-bff-protocol/messages/client-to-bff/register-messages";
import { Matreshka } from "./matreshka";

export const bootCore = (_matreshka: Matreshka) => {
  registerClientToBffMessages(); // Чтобы парсить сообщения от клиента
};
