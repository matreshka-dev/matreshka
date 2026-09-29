import { Componentable } from "./componentable";

/**
 * Интерфейс самостоятельного компонента, не зависящего от внешнего окружения.
 *
 * @method standalone Возвращает флаг, указывающий, что компонент является самостоятельным.
 */
export type StandaloneComponent = {
  standalone(): true;
} & Componentable;
