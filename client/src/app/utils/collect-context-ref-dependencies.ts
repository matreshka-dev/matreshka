import { findContextKeys } from './find-context-keys';
import { parseContextPath } from './parse-context-path';

export type ContextRefDependency = {
  contextId: string;
  key: string;
};

export type ContextChangePayload = {
  contextId: string;
  values: { key: string; value: unknown }[];
};

/**
 * Разбирает context-ref на список зависимостей: основной путь и каждый `@{…}`-плейсхолдер.
 *
 * Нужен для `ready$` (какие контексты загрузить) и для подписки на `change$`
 * (когда пересчитывать conditions / rerender).
 *
 * @example
 * // strictRef: ключ корзины зависит от id оффера в другом контексте
 * collectContextRefDependencies(
 *   'user-ctx.cart.items.@{shop-ctx.offers.0.id}'
 * )
 * // → [
 * //   { contextId: 'user-ctx', key: 'cart.items.@{shop-ctx.offers.0.id}' },
 * //   { contextId: 'shop-ctx', key: 'offers.0.id' },
 * // ]
 */
export function collectContextRefDependencies(
  ref: string,
): ContextRefDependency[] {
  const seen = new Set<string>();
  const deps: ContextRefDependency[] = [];

  const add = (contextId: string, key: string) => {
    if (!contextId) {
      return;
    }
    const identity = `${contextId}\0${key}`;
    if (seen.has(identity)) {
      return;
    }
    seen.add(identity);
    deps.push({ contextId, key });
  };

  const primary = parseContextPath(ref);
  add(primary.contextId, primary.key);

  for (const placeholderKey of findContextKeys(ref)) {
    const parts = parseContextPath(placeholderKey);
    add(parts.contextId, parts.key);
  }

  return deps;
}

/**
 * Проверяет, затрагивает ли изменённый ключ зависимость (точное совпадение или вложенность).
 *
 * @example
 * contextKeysOverlap('cart.items.42', 'cart.items')      // true — изменился элемент массива
 * contextKeysOverlap('cart.items', 'cart.items.42')      // true — родительский ключ
 * contextKeysOverlap('cart.total', 'cart.items')         // false — другая ветка
 */
export function contextKeysOverlap(
  changedKey: string,
  dependencyKey: string,
): boolean {
  return (
    changedKey === dependencyKey ||
    changedKey.startsWith(`${dependencyKey}.`) ||
    dependencyKey.startsWith(`${changedKey}.`)
  );
}

/**
 * Отвечает на вопрос: «этот `change$` затрагивает одну конкретную зависимость ref?»
 *
 * Используется в `dependencyChanged` (rerender по rules/properties)
 * и как строительный блок для `contextChangeAffectsRef`.
 *
 * - `payload.values.length === 0` — ContextInit / полный refresh → всегда true.
 * - Если в `dep.key` есть `@{…}`, сначала пробует `resolvePlaceholders` (обычно
 *   `contextHub.replacePlaceholders`).
 * - Если плейсхолдер ещё не резолвится (контекст не loaded), сравнивает по
 *   статическому префиксу до `@{` — например `cart.items.` для `cart.items.@{shop-ctx.offers.0.id}`.
 *
 * @example
 * // shop-ctx загрузился
 * contextChangeAffectsRefDependency(
 *   { contextId: 'shop-ctx', values: [] },
 *   { contextId: 'shop-ctx', key: 'offers.0.id' },
 * ) // → true
 *
 * @example
 * // cart изменился, но shop-ctx ещё не loaded — резолв упадёт, сработает префикс
 * contextChangeAffectsRefDependency(
 *   { contextId: 'user-ctx', values: [{ key: 'cart.items.42', value: {} }] },
 *   { contextId: 'user-ctx', key: 'cart.items.@{shop-ctx.offers.0.id}' },
 *   () => { throw new Error('not loaded'); },
 * ) // → true
 */
export function contextChangeAffectsRefDependency(
  payload: ContextChangePayload,
  dep: ContextRefDependency,
  resolvePlaceholders?: (key: string) => string,
): boolean {
  if (payload.contextId !== dep.contextId) {
    return false;
  }

  if (payload.values.length === 0) {
    return true;
  }

  let key = dep.key;
  if (key.includes('@{') && resolvePlaceholders) {
    try {
      key = resolvePlaceholders(key);
    } catch {
      const staticPrefix = key.slice(0, key.indexOf('@{'));
      if (staticPrefix) {
        return payload.values.some((value) =>
          value.key.startsWith(staticPrefix),
        );
      }
      return payload.values.some((value) =>
        contextKeysOverlap(value.key, dep.key),
      );
    }
  }

  return payload.values.some((value) => contextKeysOverlap(value.key, key));
}

/**
 * Отвечает на вопрос: «этот `change$` затрагивает ref целиком?»
 *
 * Объединяет {@link collectContextRefDependencies} и {@link contextChangeAffectsRefDependency}:
 * достаточно совпадения с любой зависимостью ref (основной путь или плейсхолдер).
 *
 * Используется в `prepareConditions` для пересчёта `display$`.
 *
 * @example
 * const ref = 'user-ctx.cart.items.@{shop-ctx.offers.0.id}';
 *
 * // Изменился id оффера → пересчитать condition
 * contextChangeAffectsRef(
 *   { contextId: 'shop-ctx', values: [{ key: 'offers.0.id', value: 7 }] },
 *   ref,
 * ) // → true
 *
 * // Изменилась корзина → тоже пересчитать
 * contextChangeAffectsRef(
 *   { contextId: 'user-ctx', values: [{ key: 'cart.items.7', value: {} }] },
 *   ref,
 *   (key) => contextHub.replacePlaceholders(key),
 * ) // → true (после резолва плейсхолдера)
 */
export function contextChangeAffectsRef(
  payload: ContextChangePayload,
  ref: string,
  resolvePlaceholders?: (key: string) => string,
): boolean {
  return collectContextRefDependencies(ref).some((dep) =>
    contextChangeAffectsRefDependency(payload, dep, resolvePlaceholders),
  );
}
