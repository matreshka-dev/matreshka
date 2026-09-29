import { Client } from "./client";
import { Pageable } from "./types/pageable";

/**
 * Отвечает за маршрутизацию и авторизацию клиентов по заданным маскам маршрутов.
 */
export class Router {
  private routes: Map<
    string,
    {
      route_mask: string;
      callback: (
        client: Client,
        params: Record<string, string>,
      ) => Promise<Pageable | undefined>;
    }[]
  > = new Map();

  /**
   * Регистрирует страницу и маску маршрута с функцией авторизации.
   *
   * @param route_mask Маска маршрута, например: "user/{id}".
   * @param callback Функция, возвращающая класс страницы, реализующий интерфейс Pageable.
   * @returns Текущий экземпляр Router.
   */
  addPage(
    route_mask: string,
    callback: (
      client: Client,
      params: Record<string, string>,
    ) => Promise<Pageable | undefined>,
  ) {
    route_mask = route_mask.replace(/^\/|\/$/g, "");
    this.registerRouteMask(route_mask, callback);
    return this;
  }

  /**
   * Регистрирует маску маршрута и связанную с ней страницу.
   *
   * @param route_mask Маска маршрута.
   * @param callback Функция, возвращающая класс страницы, реализующий интерфейс Pageable.
   */
  private registerRouteMask(
    route_mask: string,
    callback: (
      client: Client,
      params: Record<string, string>,
    ) => Promise<Pageable | undefined>,
  ) {
    route_mask = route_mask.replace(/\/{2,}/, "/");
    const route_mask_regex = this.generateRouteMaskRegex(route_mask);
    if (!this.routes.has(route_mask_regex)) {
      this.routes.set(route_mask_regex, []);
    }
    const route_entities = this.routes.get(route_mask_regex) || [];
    route_entities.push({
      route_mask,
      callback,
    });
    this.routes.set(route_mask_regex, route_entities);
  }

  /**
   * Преобразует маску маршрута в строку регулярного выражения.
   *
   * @param route_mask Маска маршрута.
   * @returns Строка с регулярным выражением.
   */
  private generateRouteMaskRegex(route_mask: string) {
    // Спец-маска "всё" (используется как fallback / 404)
    if (route_mask === "**") {
      return ".*";
    }

    const escapeRegExp = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const parts = route_mask.split("/");
    const regexParts = parts.map((part) => {
      if (part === "**") {
        return ".*";
      }
      if (part === "*") {
        return "[^/]+";
      }

      // Поддержка параметров в сегменте: "cards/{id}" или "foo-{id}"
      const paramTokens: string[] = [];
      let tokenIdx = 0;
      const withTokens = part.replace(/{(.*?)}/g, () => {
        const token = `___PARAM_${tokenIdx++}___`;
        paramTokens.push(token);
        return token;
      });

      let escaped = escapeRegExp(withTokens);
      for (const token of paramTokens) {
        // Токен тоже нужно заменить в экранированной строке
        escaped = escaped.replace(escapeRegExp(token), "([^/]+)");
      }
      return escaped;
    });

    return regexParts.join("/");
  }

  /**
   * Выполняет поиск страницы по маршруту, проверяя авторизацию клиента.
   *
   * @param client Клиент, для которого выполняется поиск.
   * @param route Запрашиваемый маршрут.
   * @returns Pageable | undefined Объект страницы.
   */
  async findByRoute(
    client: Client,
    route: string,
  ): Promise<Pageable | undefined> {
    // С какой страницей ассоциируется маршрут
    route = route.replace(/^\/|\/$/g, "");
    for (const route_mask_regex of this.routes.keys()) {
      const regex = new RegExp(`^${route_mask_regex}$`, "g");
      if (route.match(regex)) {
        const route_regex_data = [...route.matchAll(regex)];
        const params: { [key: string]: string } = {};
        const matches = this.routes.get(route_mask_regex) || [];
        for (const config of matches) {
          const params_names = config.route_mask.matchAll(/{(.*?)}/g);
          [...params_names].forEach((regex_match, index) => {
            params[regex_match[1]] = route_regex_data[0][index + 1];
          });
          const page = await config.callback(client, params);
          if (page) {
            return page;
          }
        }
      }
    }
    // Защита от бесконечной рекурсии, если fallback-страница не зарегистрирована
    if (route !== "**") {
      const notFoundPage = await this.findByRoute(client, "**");
      if (notFoundPage) {
        return notFoundPage;
      }
    }
  }
}
