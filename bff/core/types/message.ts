/**
 * Универсальный тип сообщения, используемого для обмена данными между компонентами или клиентом и сервером.
 *
 * @template TYPE Тип поля type, определяющий тип сообщения.
 * @template PAYLOAD Тип полезной нагрузки сообщения.
 *
 * @property type Тип сообщения, служащий для идентификации действия.
 * @property payload Полезная нагрузка сообщения.
 * @property target Адрес получателя (instance id, context id, correlation key).
 */
export type Message<TYPE = string, PAYLOAD = unknown> = {
  type: TYPE;
  payload?: PAYLOAD;
  target?: string;
};
