import { ComponentInteractionMessage } from "./component-interaction-message";

/**
 * Скролл по главной оси `Stack`: для колонки — вертикаль (`scrollTop` / `clientHeight` / `scrollHeight`),
 * для строки — горизонталь (`scrollLeft` / `clientWidth` / `scrollWidth`).
 * Расстояние до конца: `contentSize - offset - viewportSize`.
 *
 * Кроме события `scroll`, клиент шлёт тот же snapshot после изменения DOM внутри
 * контейнера (контент вырос, а border box — нет). Смена размера самого контейнера —
 * отдельное событие `resize`.
 * Проверка на BFF: {@link needsMore} из `@matreshka/shared`.
 */
export type ComponentScrollPayload = {
  /** Текущее смещение по оси скролла. */
  offset: number;
  /** Размер видимой области по этой оси. */
  viewportSize: number;
  /** Полный размер контента по этой оси. */
  contentSize: number;
};

/**
 * Событие от клиента к BFF: изменилось положение скролла у прокручиваемого `Stack`.
 */
export class ComponentScrollMessage extends ComponentInteractionMessage<ComponentScrollPayload> {
  static readonly type = "component-scroll";
  readonly eventType = "scroll";

  constructor(target: string, payload: ComponentScrollPayload) {
    super(target, payload);
  }
}
