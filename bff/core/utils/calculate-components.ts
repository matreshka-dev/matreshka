import type { ComponentTreeNode } from "../types/component-tree-node";
import { MixedWithCallbacksArray } from "../types/mixed-with-callbacks-array";

const CACHE = new WeakMap<MixedWithCallbacksArray<unknown>, unknown>();

/**
 * Вычисляет итоговый список компонентов, разворачивая функции и массивы.
 *
 * Если элемент является функцией — вызывает её и разворачивает результат, если он определён.
 * Кэширует результат, чтобы избежать повторных вычислений при повторном вызове с тем же массивом.
 *
 * @template T Тип элемента.
 * @param components Массив компонентов или функций, возвращающих компонент(ы).
 * @returns Развёрнутый и плоский массив элементов типа T.
 */
export function calculateComponents<
  T extends ComponentTreeNode = ComponentTreeNode,
>(components: MixedWithCallbacksArray<T>) {
  if (!CACHE.has(components)) {
    CACHE.set(
      components,
      components
        .map((component) => {
          if (typeof component === "function") {
            const res = component();
            if (typeof res !== "undefined") {
              return res;
            }
          } else {
            return component;
          }
        })
        .filter((x) => typeof x !== "undefined")
        .reduce((accum: T[], cur) => {
          if (Array.isArray(cur)) {
            return [...accum, ...cur];
          } else {
            return [...accum, cur];
          }
        }, []),
    );
  }
  return CACHE.get(components) as T[];
}
