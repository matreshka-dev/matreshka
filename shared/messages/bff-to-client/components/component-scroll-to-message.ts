import { ScrollToPosition } from "../../../enums/scroll-to-position";
import { PingableComponentCommandMessage } from "../pingable-component-command-message";

/**
 * Команда от BFF к клиенту: прокрутить компонент к указанной позиции.
 *
 * {@link ScrollToPosition.Start} / `value >= 0` — offset от начала.
 * {@link ScrollToPosition.End} — в конец оси.
 * Иное `value < 0` — отступ от конца: `maxScroll + value`.
 */
export type ComponentScrollToPayload = {
  value: number;
  smooth?: boolean;
};

export class ComponentScrollToMessage extends PingableComponentCommandMessage<ComponentScrollToPayload> {
  static readonly type = "component-scroll-to";
  constructor(
    public override readonly target: string,
    public override readonly payload: ComponentScrollToPayload,
  ) {
    super(target, payload);
  }
}
