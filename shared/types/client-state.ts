import { PlatformId } from "../enums/platform-id";

/**
 * Схема состояния клиента, определяющая структуру и типы данных, передаваемых от клиента.
 *
 * @property route Информация о маршруте.
 * @property route.visitedAt Временная метка последнего посещения.
 * @property route.path Путь текущего маршрута.
 * @property route.query Параметры запроса в виде пар ключ-значение.
 * @property storage Клиентское хранилище в виде словаря строк.
 * @property language Текущий язык интерфейса.
 * @property userAgent Строка User-Agent в исходном виде, как ее отдает браузер.
 * @property prefersColorScheme Предпочтительная цветовая схема клиента: "light" или "dark".
 * @property platform Информация о платформе клиента.
 * @property platform.id Идентификатор платформы (значения из {@link PlatformId}).
 * @property platform.payload Дополнительные данные о платформе.
 */
export type ClientState = {
  route: {
    visitedAt: number;
    path: string;
    query: { [key: string]: string };
  };
  storage: Record<string, string>;
  language: string;
  userAgent: string;
  prefersColorScheme: "light" | "dark" | "system";
  platform: {
    id: PlatformId;
    payload: unknown;
  };
};
