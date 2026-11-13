import { ComponentInteractionMessage } from "./component-interaction-message";
import type { ComponentScrollPayload } from "./component-scroll-message";

/**
 * Снимок главной оси после изменения размера контейнера.
 * Поля те же, что у {@link ComponentScrollPayload}: `ResizeObserver` не сообщает
 * `scrollHeight`, клиент перечитывает геометрию сам.
 */
export type ComponentResizePayload = ComponentScrollPayload;

/**
 * Событие от клиента к BFF: изменился размер прокручиваемого контейнера или корня страницы.
 * Не путать со `scroll`: рост DOM без изменения border box сюда не попадает.
 */
export class ComponentResizeMessage extends ComponentInteractionMessage<ComponentResizePayload> {
  static readonly type = "component-resize";
  readonly eventType = "resize";

  constructor(target: string, payload: ComponentResizePayload) {
    super(target, payload);
  }
}
