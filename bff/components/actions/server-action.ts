import { Action, ActionConfig } from "../../core/actions/action";
import { currentClient } from "../../core/client-context";
import type { ComponentInstance } from "../../core/types/component-instance";
import type { Componentable } from "../../core/types/componentable";

/**
 * Свойства действия на сервере.
 * @template ComponentType Тип компонента, над которым совершается действие.
 * @template PayloadType Тип дополнительных данных действия (по умолчанию — undefined).
 * @property instance Инстанс компонента на клиенте, инициировавший взаимодействие.
 * @property payload Дополнительные данные, зависящие от конкретного действия.
 */
export type ServerActionProperties<
  ComponentType extends Componentable,
  PayloadType = undefined,
> = {
  instance: ComponentInstance<ComponentType>;
  payload: PayloadType;
};

/**
 * Обработчик действия клиента на сервере.
 * Используется для выполнения произвольного кода на сервере, например, при клике по кнопке.
 * @param properties Свойства действия.
 */
// Две отдельные сигнатуры нужны не только для типов: no-misused-promises
// распознаёт такой union как callback, которому разрешено возвращать Promise.
type SyncServerActionHandler<
  ComponentType extends Componentable,
  PayloadType = undefined,
> = (properties: ServerActionProperties<ComponentType, PayloadType>) => void;

type AsyncServerActionHandler<
  ComponentType extends Componentable,
  PayloadType = undefined,
> = (
  properties: ServerActionProperties<ComponentType, PayloadType>,
) => Promise<void>;

export type ServerActionHandler<
  ComponentType extends Componentable,
  PayloadType = undefined,
> =
  | SyncServerActionHandler<ComponentType, PayloadType>
  | AsyncServerActionHandler<ComponentType, PayloadType>;

/**
 * Серверное действие, выполняемое BFF при взаимодействии клиента с компонентом.
 */
export class ServerAction<
  ComponentType extends Componentable,
  PayloadType = undefined,
> extends Action {
  constructor(
    private readonly handler: ServerActionHandler<ComponentType, PayloadType>,
    config: ActionConfig = {},
  ) {
    super(config.conditions);
  }

  class(): string {
    return "server-interaction";
  }

  payload(): object {
    return {};
  }

  execute(
    properties: ServerActionProperties<ComponentType, PayloadType>,
  ): void {
    let result: void | Promise<void>;
    try {
      result = this.handler(properties);
    } catch (error) {
      reportServerActionError(error, properties.instance);
      return;
    }

    if (isPromise(result)) {
      void result.catch((error) =>
        reportServerActionError(error, properties.instance),
      );
    }
  }
}

function isPromise(value: unknown): value is Promise<void> {
  return (
    value !== null &&
    typeof value === "object" &&
    "then" in value &&
    typeof (value as Promise<void>).then === "function"
  );
}

function reportServerActionError(
  error: unknown,
  instance: ComponentInstance<Componentable>,
): void {
  const client = instance.client ?? currentClient();
  client?.error$.next(error);
}
