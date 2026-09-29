import { conditionAll, conditionAny } from "./condition-group";
import {
  contextArrayIncludes,
  contextArrayNotIncludes,
} from "./context-array-includes";
import {
  contextArrayLengthEqual,
  contextArrayLengthGreaterOrEqual,
  contextArrayLengthGreaterThan,
  contextArrayLengthLessOrEqual,
  contextArrayLengthLessThan,
  contextValueEmpty,
  contextValueNotEmpty,
} from "./context-array-length";
import { contextValueDefined } from "./context-value-defined";
import { contextValueEqual } from "./context-value-equal";
import { contextValueIn } from "./context-value-in";
import { contextValueNotEqual } from "./context-value-not-equal";
import { contextValueUndefined } from "./context-value-undefined";
import { desktopDevice } from "./desktop-device";
import { mobileDevice } from "./mobile-device";
import { notDesktopDevice } from "./not-desktop-device";
import { notMobileDevice } from "./not-mobile-device";
import { notTabletDevice } from "./not-tablet-device";
import { tabletDevice } from "./tablet-device";

/**
 * Условия по значению/массиву в контексте.
 *
 * Первый аргумент каждого условия — строго типизированный `ContextRef`, поэтому
 * контекст ясен из вызова, а имя несёт только предикат: `when.equals(ref, value)`.
 */
export const when = {
  /** Значение по `ref` строго равно операнду. */
  equals: contextValueEqual,
  /** Значение по `ref` не равно операнду. */
  notEquals: contextValueNotEqual,
  /** Значение по `ref` входит в список операндов. */
  oneOf: contextValueIn,
  /** Значение по `ref` определено (`!== undefined`). */
  defined: contextValueDefined,
  /** Значение по `ref` не определено (`=== undefined`). */
  notDefined: contextValueUndefined,
  /** Массив по `ref` пуст (длина `=== 0`). */
  isEmpty: contextValueEmpty,
  /** Массив по `ref` непуст (длина `> 0`). */
  notEmpty: contextValueNotEmpty,
  /** Длина массива по `ref` равна операнду (`===`). */
  lengthEquals: contextArrayLengthEqual,
  /** Длина массива по `ref` строго меньше операнда (`<`). */
  lengthLessThan: contextArrayLengthLessThan,
  /** Длина массива по `ref` меньше или равна операнду (`<=`). */
  lengthAtMost: contextArrayLengthLessOrEqual,
  /** Длина массива по `ref` строго больше операнда (`>`). */
  lengthGreaterThan: contextArrayLengthGreaterThan,
  /** Длина массива по `ref` больше или равна операнду (`>=`). */
  lengthAtLeast: contextArrayLengthGreaterOrEqual,
  /** В массиве по `ref` есть элемент со значением по `itemPath`, равным операнду. */
  includes: contextArrayIncludes,
  /** В массиве по `ref` нет элемента со значением по `itemPath`, равным операнду. */
  excludes: contextArrayNotIncludes,
  /** Хотя бы одно из условий (OR). */
  any: conditionAny,
  /** Все условия (AND) — явная группа, удобна внутри {@link conditionAny}. */
  all: conditionAll,
} as const;

/**
 * Условия по типу устройства клиента. Операндов нет — зависят только от устройства.
 */
export const device = {
  /** Устройство — мобильный телефон. */
  mobile: mobileDevice,
  /** Устройство — планшет. */
  tablet: tabletDevice,
  /** Устройство — десктоп. */
  desktop: desktopDevice,
  /** Устройство не мобильный телефон. */
  notMobile: notMobileDevice,
  /** Устройство не планшет. */
  notTablet: notTabletDevice,
  /** Устройство не десктоп. */
  notDesktop: notDesktopDevice,
} as const;
