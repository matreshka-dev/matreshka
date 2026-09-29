import { Action } from "./action";

/**
 * Абстрактный класс локального действия, выполняемого на клиенте.
 *
 * Наследники должны реализовать методы `class` и `payload` для сериализации.
 */
export abstract class LocalAction extends Action {}
