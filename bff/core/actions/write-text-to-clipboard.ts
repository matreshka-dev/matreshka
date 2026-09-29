import { ActionConfig } from "./action";
import { LocalAction } from "./local-action";

/**
 * Действие для записи текста в буфер обмена на клиенте.
 */
export class WriteTextToClipboard extends LocalAction {
  /**
   * Создаёт экземпляр действия записи текста в буфер обмена.
   *
   * @param text Текст, который необходимо скопировать в буфер обмена.
   */
  constructor(
    private text: string,
    config: ActionConfig = {},
  ) {
    super(config.conditions);
  }

  /**
   * Возвращает уникальный идентификатор класса действия.
   *
   * @returns Строка `"write-text-to-clipboard"`.
   */
  class(): string {
    return "write-text-to-clipboard";
  }

  /**
   * Возвращает полезную нагрузку действия, содержащую текст.
   *
   * @returns Объект с полем `text`.
   */
  payload(): object {
    return {
      text: this.text,
    };
  }
}

/**
 * Функциональная форма {@link WriteTextToClipboard}.
 */
export function writeTextToClipboard(
  text: string,
  config: ActionConfig = {},
): WriteTextToClipboard {
  return new WriteTextToClipboard(text, config);
}
