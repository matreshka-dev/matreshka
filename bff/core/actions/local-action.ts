import { Action } from "./action";

/**
 * Абстрактный класс локального действия, выполняемого на клиенте.
 *
 * Наследники должны реализовать методы `class` и `payload` для сериализации.
 */
export abstract class LocalAction extends Action {}

class TargetedLocalAction extends LocalAction {
  constructor(
    private readonly source: LocalAction,
    private readonly target: string,
  ) {
    super();
  }

  class(): string {
    return this.source.class();
  }

  payload(): object {
    return {
      ...this.source.payload(),
      target: this.target,
    };
  }

  override toJSON() {
    const serialized = this.source.toJSON();
    return {
      ...serialized,
      payload: {
        ...serialized.payload,
        target: this.target,
      },
    };
  }
}

type LocalActionFactory = (...args: unknown[]) => unknown;

export type InstanceLocalActions<LocalActions> = {
  [Key in keyof LocalActions]: LocalActions[Key] extends (
    ...args: infer Arguments
  ) => infer Result
    ? Result extends LocalAction
      ? (...args: Arguments) => Result
      : LocalActions[Key]
    : LocalActions[Key];
};

export function createInstanceLocalActions<LocalActions extends object>(
  local: LocalActions | undefined,
  target: string,
): InstanceLocalActions<LocalActions> {
  return new Proxy(local ?? {}, {
    get(source, property, receiver) {
      const value = Reflect.get(source, property, receiver) as unknown;
      if (typeof value !== "function") {
        return value;
      }

      return (...args: Parameters<LocalActionFactory>) => {
        const action = Reflect.apply(value as LocalActionFactory, source, args);
        return action instanceof LocalAction
          ? new TargetedLocalAction(action, target)
          : action;
      };
    },
  }) as InstanceLocalActions<LocalActions>;
}
