import type { PageConfig } from "@matreshka/shared/types/page-config";
import { Componentable } from "./componentable";
import StatusCode from "./status-code";

/**
 * Интерфейс страницы, отображаемой в приложении.
 *
 *
 * @method statusCode Возвращает HTTP-статус страницы.
 * @method serialize Сериализует страницу, включая контент и заголовок.
 */
export type Pageable = {
  statusCode(): StatusCode;
  boot(): Promise<unknown>;
  serialize(): PageConfig;
} & Omit<Componentable, "serialize">;
