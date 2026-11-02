import { ComponentInteractionMessage } from "./component-interaction-message";

/**
 * Скролл по главной оси `Stack`: для колонки — вертикаль (`scrollTop` / `clientHeight` / `scrollHeight`),
 * для строки — горизонталь (`scrollLeft` / `clientWidth` / `scrollWidth`).
 * Расстояние до конца: `contentSize - offset - viewportSize`.
 *
 * Клиент отправляет snapshot также при изменении размеров/DOM контейнера (не только при `scroll`),
 * чтобы BFF мог догрузить данные, если `contentSize <= viewportSize`.
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
